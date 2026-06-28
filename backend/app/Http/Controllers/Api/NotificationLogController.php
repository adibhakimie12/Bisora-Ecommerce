<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationLog;
use App\Models\Store;
use App\Services\ChannelGateService;
use App\Services\NotificationQueueProcessor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NotificationLogController extends Controller
{
    public function __construct(private readonly ChannelGateService $channelGate)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $logs = NotificationLog::query()
            ->where('tenant_id', $tenant->id)
            ->with('order:id,number,total,payment_status,fulfillment_status')
            ->latest()
            ->limit(100)
            ->get();

        return response()->json([
            'data' => $logs,
            'summary' => [
                'queued' => $logs->where('status', 'queued')->count(),
                'sent' => $logs->where('status', 'sent')->count(),
                'failed' => $logs->where('status', 'failed')->count(),
            ],
        ]);
    }

    public function update(Request $request, NotificationLog $log): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        abort_unless($log->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'status' => ['required', Rule::in(['queued', 'sent', 'failed'])],
        ]);

        $log->update([
            'status' => $data['status'],
            'sent_at' => $data['status'] === 'sent' ? now() : $log->sent_at,
        ]);

        return response()->json(['data' => $log->fresh()->load('order:id,number,total,payment_status,fulfillment_status')]);
    }

    public function retry(Request $request, NotificationLog $log): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        abort_unless($log->tenant_id === $tenant->id, 404);

        $log->update([
            'status' => 'queued',
            'last_error' => null,
            'sent_at' => null,
            'queued_at' => now(),
        ]);

        return response()->json(['data' => $log->fresh()->load('order:id,number,total,payment_status,fulfillment_status')]);
    }

    public function process(Request $request, NotificationQueueProcessor $processor): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $data = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return response()->json([
            'summary' => $processor->process((int) ($data['limit'] ?? 25), $tenant->id),
        ]);
    }

    public function testSend(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $data = $request->validate([
            'channel' => ['required', 'string', Rule::in(['email', 'Email', 'sms', 'SMS', 'whatsapp', 'WhatsApp'])],
        ]);
        $channel = $this->channelGate->normalizeChannel($data['channel']);
        $store = $this->store($request);

        $this->channelGate->assertAllowed($tenant->plan, $store, $channel, 'notification');

        $log = NotificationLog::create([
            'tenant_id' => $tenant->id,
            'event' => 'test_notification',
            'channel' => $channel,
            'recipient' => 'test@bisora.local',
            'subject' => "Bisora {$channel} test",
            'message' => "Test {$channel} notification queued from Bisora settings.",
            'status' => 'queued',
            'payload' => [
                'source' => 'settings.notifications.test_send',
                'channel' => $channel,
            ],
            'queued_at' => now(),
        ]);

        return response()->json(['data' => $log->load('order:id,number,total,payment_status,fulfillment_status')], 201);
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

}
