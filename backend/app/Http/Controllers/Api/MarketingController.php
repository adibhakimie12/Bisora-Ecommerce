<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use App\Models\NotificationLog;
use App\Models\Store;
use App\Services\ChannelGateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarketingController extends Controller
{
    private const COLLECTION_KEYS = [
        'discounts' => 'discounts',
        'upsells' => 'upsells',
        'recovery' => 'recovery',
        'broadcasts' => 'broadcasts',
        'automation-rules' => 'automation_rules',
    ];

    public function __construct(private readonly ChannelGateService $channelGate)
    {
    }

    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->workspace($this->store($request))]);
    }

    public function updateCollection(Request $request, string $collection): JsonResponse
    {
        abort_unless(array_key_exists($collection, self::COLLECTION_KEYS), 404);

        $data = $request->validate([
            'items' => ['required', 'array'],
            'items.*' => ['array'],
        ]);

        $store = $this->store($request);
        $settings = $store->settings ?? [];
        $marketing = $this->workspace($store);
        $marketing[self::COLLECTION_KEYS[$collection]] = array_values($data['items']);
        $settings['marketing'] = $marketing;
        $store->update(['settings' => $settings]);

        return response()->json(['data' => $this->workspace($store->fresh())]);
    }

    public function queueBroadcast(Request $request, string $broadcastId): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $store = $this->store($request);
        $broadcast = collect($this->workspace($store)['broadcasts'])->firstWhere('id', $broadcastId);
        abort_unless($broadcast, 404);

        $channel = $this->channelGate->normalizeChannel((string) ($broadcast['channel'] ?? 'email'));
        $this->channelGate->assertAllowed($tenant->plan, $store, $channel, 'marketing');
        $customers = CustomerProfile::query()
            ->where('tenant_id', $tenant->id)
            ->whereNotNull('email')
            ->get();

        foreach ($customers as $customer) {
            $this->queueNotification(
                $tenant->id,
                'marketing_broadcast',
                $channel,
                $customer->email,
                (string) ($broadcast['name'] ?? 'Store update'),
                "New campaign from {$store->name}.",
                ['broadcast_id' => $broadcastId, 'customer_id' => $customer->id],
            );
        }

        return response()->json(['queued' => $customers->count()]);
    }

    public function remindRecovery(Request $request, string $checkoutId): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $store = $this->store($request);
        $settings = $store->settings ?? [];
        $marketing = $this->workspace($store);
        $row = collect($marketing['recovery'])->firstWhere('id', $checkoutId);
        abort_unless($row && ! empty($row['email']), 404);

        $this->queueNotification(
            $tenant->id,
            'cart_recovery',
            'email',
            (string) $row['email'],
            'Complete your checkout',
            "You left items in your cart at {$store->name}.",
            ['checkout_id' => $checkoutId, 'cart_value' => $row['cartValue'] ?? null],
        );

        $marketing['recovery'] = collect($marketing['recovery'])
            ->map(fn (array $item): array => $item['id'] === $checkoutId ? [...$item, 'status' => 'Contacted'] : $item)
            ->values()
            ->all();
        $settings['marketing'] = $marketing;
        $store->update(['settings' => $settings]);

        return response()->json(['data' => $this->workspace($store->fresh())]);
    }

    private function store(Request $request): Store
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

    private function workspace(Store $store): array
    {
        $marketing = data_get($store->settings ?? [], 'marketing', []);

        return [
            'initialized' => array_key_exists('marketing', $store->settings ?? []),
            'discounts' => array_values($marketing['discounts'] ?? []),
            'upsells' => array_values($marketing['upsells'] ?? []),
            'recovery' => array_values($marketing['recovery'] ?? []),
            'broadcasts' => array_values($marketing['broadcasts'] ?? []),
            'automation_rules' => array_values($marketing['automation_rules'] ?? []),
        ];
    }

    private function queueNotification(
        int $tenantId,
        string $event,
        string $channel,
        string $recipient,
        string $subject,
        string $message,
        array $payload = [],
    ): void {
        NotificationLog::query()->create([
            'tenant_id' => $tenantId,
            'event' => $event,
            'channel' => $channel,
            'recipient' => $recipient,
            'subject' => $subject,
            'message' => $message,
            'status' => 'queued',
            'payload' => $payload,
            'queued_at' => now(),
        ]);
    }

}
