<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use App\Models\DraftOrder;
use App\Models\NotificationLog;
use App\Models\Order;
use App\Models\Store;
use App\Services\OrderNotificationAutomation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DraftOrderController extends Controller
{
    public function __construct(private readonly OrderNotificationAutomation $notifications)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');

        return response()->json([
            'data' => DraftOrder::query()
                ->where('tenant_id', $tenant->id)
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $data = $this->validated($request);
        $items = collect($data['items'] ?? [])->map(fn (array $item): array => $this->draftItem($item))->values();

        $draft = DraftOrder::query()->create([
            'tenant_id' => $tenant->id,
            'number' => $this->nextDraftNumber($tenant->id),
            'customer_name' => $data['customer_name'],
            'customer_email' => $data['customer_email'],
            'source' => $data['source'] ?? 'Manual',
            'items' => $items->all(),
            'total' => $items->sum('line_total'),
            'status' => $data['status'] ?? 'draft',
            'note' => $data['note'] ?? null,
        ]);

        return response()->json(['data' => $draft], 201);
    }

    public function update(Request $request, DraftOrder $draftOrder): JsonResponse
    {
        $this->abortIfWrongTenant($request, $draftOrder);
        $data = $this->validated($request, false);

        if (array_key_exists('items', $data)) {
            $items = collect($data['items'] ?? [])->map(fn (array $item): array => $this->draftItem($item))->values();
            $data['items'] = $items->all();
            $data['total'] = $items->sum('line_total');
        }

        $draftOrder->update($data);

        return response()->json(['data' => $draftOrder->fresh()]);
    }

    public function destroy(Request $request, DraftOrder $draftOrder): JsonResponse
    {
        $this->abortIfWrongTenant($request, $draftOrder);
        $draftOrder->delete();

        return response()->json(null, 204);
    }

    public function convert(Request $request, DraftOrder $draftOrder): JsonResponse
    {
        $this->abortIfWrongTenant($request, $draftOrder);
        $tenant = $request->attributes->get('tenant');
        $data = $request->validate([
            'payment_status' => ['nullable', Rule::in(['paid', 'pending'])],
            'payment_method' => ['nullable', 'string', 'max:80'],
        ]);

        $store = Store::query()->where('tenant_id', $tenant->id)->first();

        $order = DB::transaction(function () use ($data, $draftOrder, $store, $tenant): Order {
            $customer = CustomerProfile::query()->updateOrCreate(
                ['tenant_id' => $tenant->id, 'email' => $draftOrder->customer_email],
                [
                    'name' => $draftOrder->customer_name,
                    'status' => 'new',
                    'member_since' => now()->toDateString(),
                ],
            );

            $order = Order::query()->create([
                'tenant_id' => $tenant->id,
                'customer_profile_id' => $customer->id,
                'number' => $this->nextOrderNumber($tenant->id),
                'total' => $draftOrder->total,
                'payment_status' => $data['payment_status'] ?? 'pending',
                'settlement_status' => 'unsettled',
                'fulfillment_status' => 'unfulfilled',
                'ordered_at' => now()->toDateString(),
                'payment_method' => $data['payment_method'] ?? 'manual_invoice',
                'items' => $draftOrder->items ?? [],
                'shipping_address' => [
                    'recipient' => $draftOrder->customer_name,
                    'email' => $draftOrder->customer_email,
                ],
                'shipment' => ['tracking_location' => 'Draft converted to order'],
            ]);

            $draftOrder->update(['status' => 'converted']);

            $customer->update([
                'orders_count' => $customer->orders()->count(),
                'total_spent' => $customer->orders()->sum('total'),
                'last_order_at' => $order->ordered_at,
            ]);

            if ($store) {
                $this->notifications->orderPlaced($order->fresh()->load('customer:id,name,email,status'), $store);
            }

            return $order;
        });

        return response()->json([
            'data' => [
                'order' => $order->fresh()->load('customer:id,name,email,status'),
                'draft' => $draftOrder->fresh(),
            ],
        ], 201);
    }

    public function sendInvoice(Request $request, DraftOrder $draftOrder): JsonResponse
    {
        $this->abortIfWrongTenant($request, $draftOrder);

        $log = DB::transaction(function () use ($draftOrder): NotificationLog {
            $draftOrder->update(['status' => 'invoice_sent']);

            return NotificationLog::query()->create([
                'tenant_id' => $draftOrder->tenant_id,
                'event' => 'draft_invoice',
                'channel' => 'email',
                'recipient' => $draftOrder->customer_email,
                'subject' => "Invoice for {$draftOrder->number}",
                'message' => "Hi {$draftOrder->customer_name}, your draft invoice {$draftOrder->number} total is {$draftOrder->total}.",
                'status' => 'queued',
                'payload' => [
                    'draft_order_id' => $draftOrder->id,
                    'draft_number' => $draftOrder->number,
                    'customer_name' => $draftOrder->customer_name,
                    'total' => $draftOrder->total,
                    'items' => $draftOrder->items ?? [],
                ],
                'queued_at' => now(),
            ]);
        });

        return response()->json([
            'data' => [
                'draft' => $draftOrder->fresh(),
                'notification' => $log,
            ],
        ], 201);
    }

    private function validated(Request $request, bool $creating = true): array
    {
        $required = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'customer_name' => [$required, 'string', 'max:120'],
            'customer_email' => [$required, 'email', 'max:160'],
            'source' => ['nullable', 'string', 'max:80'],
            'status' => ['nullable', Rule::in(['draft', 'invoice_sent', 'converted'])],
            'note' => ['nullable', 'string', 'max:1000'],
            'items' => [$required, 'array', 'min:1', 'max:50'],
            'items.*.name' => ['required_with:items', 'string', 'max:160'],
            'items.*.sku' => ['nullable', 'string', 'max:120'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1', 'max:99'],
            'items.*.price' => ['required_with:items', 'integer', 'min:0'],
        ]);
    }

    private function draftItem(array $item): array
    {
        $quantity = (int) $item['quantity'];
        $price = (int) $item['price'];

        return [
            'name' => $item['name'],
            'sku' => $item['sku'] ?? '',
            'quantity' => $quantity,
            'price' => $price,
            'line_total' => $price * $quantity,
        ];
    }

    private function abortIfWrongTenant(Request $request, DraftOrder $draftOrder): void
    {
        $tenant = $request->attributes->get('tenant');
        abort_unless($draftOrder->tenant_id === $tenant->id, 404);
    }

    private function nextDraftNumber(int $tenantId): string
    {
        $count = DraftOrder::query()
            ->where('tenant_id', $tenantId)
            ->whereDate('created_at', Carbon::today())
            ->count() + 1;

        return 'DRAFT-' . now()->format('ymd') . '-' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }

    private function nextOrderNumber(int $tenantId): string
    {
        $count = Order::query()
            ->where('tenant_id', $tenantId)
            ->whereDate('created_at', Carbon::today())
            ->count() + 1;

        return 'ORD-' . now()->format('ymd') . '-' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }
}
