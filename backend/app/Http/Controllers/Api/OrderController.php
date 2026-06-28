<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Services\OrderNotificationAutomation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function __construct(private readonly OrderNotificationAutomation $notifications)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');

        return response()->json([
            'data' => Order::query()
                ->where('tenant_id', $tenant->id)
                ->with('customer:id,name,email,status')
                ->latest()
                ->get(),
        ]);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $this->abortIfWrongTenant($request, $order);

        return response()->json(['data' => $order->load('customer:id,name,email,status')]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $data = $request->validate([
            'customer.name' => ['required', 'string', 'max:120'],
            'customer.email' => ['required', 'email', 'max:160'],
            'customer.phone' => ['nullable', 'string', 'max:40'],
            'shipping_address' => ['nullable', 'array'],
            'shipping_address.address_line_1' => ['nullable', 'string', 'max:180'],
            'shipping_address.address_line_2' => ['nullable', 'string', 'max:180'],
            'shipping_address.line1' => ['nullable', 'string', 'max:180'],
            'shipping_address.line2' => ['nullable', 'string', 'max:180'],
            'shipping_address.city' => ['nullable', 'string', 'max:120'],
            'shipping_address.state' => ['nullable', 'string', 'max:120'],
            'shipping_address.postcode' => ['nullable', 'string', 'max:40'],
            'shipping_address.country' => ['nullable', 'string', 'max:120'],
            'payment_method' => ['nullable', 'string', 'max:80'],
            'payment_status' => ['nullable', Rule::in(['paid', 'pending'])],
            'settlement_status' => ['nullable', Rule::in(['unsettled', 'processing', 'settled'])],
            'fulfillment_status' => ['nullable', Rule::in(['processing', 'shipped', 'unfulfilled', 'delivered'])],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $productIds = collect($data['items'])->pluck('product_id')->unique()->values();
        $products = Product::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        abort_if($products->count() !== $productIds->count(), 422, 'Manual order contains unavailable products.');

        $items = collect($data['items'])->map(function (array $item) use ($products): array {
            /** @var Product $product */
            $product = $products->get($item['product_id']);
            $quantity = (int) $item['quantity'];

            abort_if($product->stock < $quantity, 422, "Not enough stock for {$product->title}.");

            return [
                'product_id' => (string) $product->id,
                'name' => $product->title,
                'sku' => $product->sku,
                'quantity' => $quantity,
                'price' => $product->price,
                'line_total' => $product->price * $quantity,
                'image_url' => $product->thumbnail_url,
            ];
        })->values();

        $total = $items->sum('line_total');
        $shippingAddress = $data['shipping_address'] ?? [];
        $store = Store::query()->where('tenant_id', $tenant->id)->first();

        $order = DB::transaction(function () use ($data, $items, $shippingAddress, $store, $tenant, $total): Order {
            $customer = CustomerProfile::query()->updateOrCreate(
                ['tenant_id' => $tenant->id, 'email' => $data['customer']['email']],
                [
                    'name' => $data['customer']['name'],
                    'status' => 'new',
                    'shipping_address' => $shippingAddress,
                    'member_since' => now()->toDateString(),
                ],
            );

            $order = Order::query()->create([
                'tenant_id' => $tenant->id,
                'customer_profile_id' => $customer->id,
                'number' => $this->nextOrderNumber($tenant->id),
                'total' => $total,
                'payment_status' => $data['payment_status'] ?? 'pending',
                'settlement_status' => $data['settlement_status'] ?? 'unsettled',
                'fulfillment_status' => $data['fulfillment_status'] ?? 'unfulfilled',
                'ordered_at' => now()->toDateString(),
                'payment_method' => $data['payment_method'] ?? 'manual_order',
                'items' => $items->all(),
                'shipping_address' => [
                    ...$shippingAddress,
                    'recipient' => $data['customer']['name'],
                    'email' => $data['customer']['email'],
                    'phone' => $data['customer']['phone'] ?? null,
                    'line1' => $shippingAddress['line1'] ?? $shippingAddress['address_line_1'] ?? '',
                    'line2' => $shippingAddress['line2'] ?? $shippingAddress['address_line_2'] ?? '',
                ],
                'shipment' => ['tracking_location' => 'Manual order received'],
            ]);

            $customer->update([
                'orders_count' => $customer->orders()->count(),
                'total_spent' => $customer->orders()->sum('total'),
                'last_order_at' => $order->ordered_at,
            ]);

            foreach ($items as $item) {
                Product::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('id', $item['product_id'])
                    ->decrement('stock', $item['quantity']);
            }

            if ($store) {
                $this->notifications->orderPlaced($order->fresh()->load('customer:id,name,email,status'), $store);
            }

            return $order;
        });

        return response()->json(['data' => $order->fresh()->load('customer:id,name,email,status')], 201);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $this->abortIfWrongTenant($request, $order);
        $data = $request->validate([
            'payment_status' => ['sometimes', Rule::in(['paid', 'pending'])],
            'settlement_status' => ['sometimes', 'nullable', Rule::in(['unsettled', 'processing', 'settled'])],
            'fulfillment_status' => ['sometimes', Rule::in(['processing', 'shipped', 'unfulfilled', 'delivered'])],
            'tracking_number' => ['sometimes', 'nullable', 'string', 'max:120'],
            'courier' => ['sometimes', 'nullable', 'string', 'max:120'],
        ]);

        $previousPaymentStatus = $order->payment_status;
        $previousFulfillmentStatus = $order->fulfillment_status;
        $shipment = $order->shipment ?? [];
        foreach (['tracking_number', 'courier'] as $key) {
            if (array_key_exists($key, $data)) {
                $shipment[$key] = $data[$key];
                unset($data[$key]);
            }
        }

        $order->update([...$data, 'shipment' => $shipment]);
        $order = $order->fresh();

        if ($previousPaymentStatus !== 'paid' && $order->payment_status === 'paid') {
            $this->notifications->paymentConfirmed($order);
        }

        if ($previousFulfillmentStatus !== 'shipped' && $order->fulfillment_status === 'shipped') {
            $this->notifications->orderShipped($order);
        }

        return response()->json(['data' => $order->load('customer:id,name,email,status')]);
    }

    public function destroy(Request $request, Order $order): JsonResponse
    {
        $this->abortIfWrongTenant($request, $order);
        $customer = $order->customer()->first();

        DB::transaction(function () use ($customer, $order): void {
            foreach ($order->items ?? [] as $item) {
                $productId = (int) ($item['product_id'] ?? 0);
                $quantity = (int) ($item['quantity'] ?? 0);

                if ($productId > 0 && $quantity > 0) {
                    Product::query()
                        ->where('tenant_id', $order->tenant_id)
                        ->where('id', $productId)
                        ->increment('stock', $quantity);
                }
            }

            $order->delete();

            if ($customer) {
                $remainingOrders = $customer->orders();
                $customer->update([
                    'orders_count' => $remainingOrders->count(),
                    'total_spent' => $remainingOrders->sum('total'),
                    'last_order_at' => $remainingOrders->max('ordered_at'),
                ]);
            }
        });

        return response()->json(null, 204);
    }

    private function abortIfWrongTenant(Request $request, Order $order): void
    {
        $tenant = $request->attributes->get('tenant');
        abort_unless($order->tenant_id === $tenant->id, 404);
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
