<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use App\Models\NotificationLog;
use App\Models\Store;
use App\Services\ChannelGateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function __construct(private readonly ChannelGateService $channelGate)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');

        return response()->json([
            'data' => CustomerProfile::query()
                ->where('tenant_id', $tenant->id)
                ->with('orders:id,customer_profile_id,number,total,payment_status,fulfillment_status,ordered_at')
                ->latest()
                ->get(),
        ]);
    }

    public function show(Request $request, CustomerProfile $customer): JsonResponse
    {
        $this->abortIfWrongTenant($request, $customer);

        return response()->json(['data' => $customer->load('orders:id,customer_profile_id,number,total,payment_status,fulfillment_status,ordered_at')]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $data = $this->validatedCustomer($request, $tenant->id);

        $customer = CustomerProfile::create([
            'tenant_id' => $tenant->id,
            ...$data,
            'status' => $this->normalizeStatus($data['status'] ?? 'new'),
            'member_since' => now()->toDateString(),
            'shipping_address' => [],
            'notes' => [],
        ]);

        return response()->json(['data' => $customer->load('orders:id,customer_profile_id,number,total,payment_status,fulfillment_status,ordered_at')], 201);
    }

    public function update(Request $request, CustomerProfile $customer): JsonResponse
    {
        $this->abortIfWrongTenant($request, $customer);
        $data = $this->validatedCustomer($request, $customer->tenant_id, $customer->id, partial: true);

        if (isset($data['status'])) {
            $data['status'] = $this->normalizeStatus($data['status']);
        }

        $customer->update($data);

        return response()->json(['data' => $customer->fresh()->load('orders:id,customer_profile_id,number,total,payment_status,fulfillment_status,ordered_at')]);
    }

    public function addNote(Request $request, CustomerProfile $customer): JsonResponse
    {
        $this->abortIfWrongTenant($request, $customer);
        $data = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $customer->update([
            'notes' => [trim($data['message']), ...($customer->notes ?? [])],
        ]);

        return response()->json(['data' => $customer->fresh()->load('orders:id,customer_profile_id,number,total,payment_status,fulfillment_status,ordered_at')]);
    }

    public function destroy(Request $request, CustomerProfile $customer): JsonResponse
    {
        $this->abortIfWrongTenant($request, $customer);
        $customer->delete();

        return response()->json(null, 204);
    }

    public function contact(Request $request, CustomerProfile $customer): JsonResponse
    {
        $this->abortIfWrongTenant($request, $customer);
        $tenant = $request->attributes->get('tenant');
        $data = $request->validate([
            'channel' => ['required', 'string', Rule::in(['email', 'Email', 'whatsapp', 'WhatsApp'])],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);
        $channel = $this->channelGate->normalizeChannel($data['channel']);
        $store = $this->tenantStore($request);

        $this->channelGate->assertAllowed($tenant->plan, $store, $channel, 'customer contact');

        $log = NotificationLog::create([
            'tenant_id' => $tenant->id,
            'event' => 'customer_contact',
            'channel' => $channel,
            'recipient' => $customer->email,
            'subject' => $channel === 'email' ? 'A message from your store' : null,
            'message' => trim($data['message'] ?? '') ?: "Hi {$customer->name}, your store has an update for you.",
            'status' => 'queued',
            'payload' => [
                'source' => 'customers.quick_action',
                'customer_id' => $customer->id,
            ],
            'queued_at' => now(),
        ]);

        return response()->json(['data' => $log], 201);
    }

    public function deactivate(Request $request, CustomerProfile $customer): JsonResponse
    {
        $this->abortIfWrongTenant($request, $customer);
        $customer->update(['status' => 'inactive']);

        return response()->json(['data' => $customer->fresh()->load('orders:id,customer_profile_id,number,total,payment_status,fulfillment_status,ordered_at')]);
    }

    private function abortIfWrongTenant(Request $request, CustomerProfile $customer): void
    {
        $tenant = $request->attributes->get('tenant');
        abort_unless($customer->tenant_id === $tenant->id, 404);
    }

    private function validatedCustomer(Request $request, int $tenantId, ?int $ignoreId = null, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:160'],
            'email' => [
                $required,
                'email',
                'max:160',
                Rule::unique('customer_profiles', 'email')
                    ->where('tenant_id', $tenantId)
                    ->ignore($ignoreId),
            ],
            'status' => [$partial ? 'sometimes' : 'nullable', 'string', Rule::in(['VIP', 'Returning', 'New', 'Inactive', 'vip', 'returning', 'new', 'inactive'])],
            'shipping_address' => ['sometimes', 'array'],
        ]);
    }

    private function normalizeStatus(string $status): string
    {
        return match (strtolower($status)) {
            'vip' => 'vip',
            'returning' => 'returning',
            'inactive' => 'inactive',
            default => 'new',
        };
    }

    private function tenantStore(Request $request): Store
    {
        $tenant = $request->attributes->get('tenant');

        return Store::firstOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'managed_domain' => "{$tenant->slug}.bisora.app",
                'currency' => 'MYR',
                'timezone' => 'Asia/Kuala_Lumpur',
                'settings' => [],
            ],
        );
    }
}
