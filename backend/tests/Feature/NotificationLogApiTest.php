<?php

namespace Tests\Feature;

use App\Models\NotificationLog;
use App\Models\Order;
use App\Models\Store;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class NotificationLogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_user_can_list_notification_logs_for_active_tenant(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $order = Order::create([
            'tenant_id' => $tenant->id,
            'number' => 'ORD-NOTIFY-1',
            'total' => 12900,
            'payment_status' => 'pending',
            'fulfillment_status' => 'unfulfilled',
            'items' => [],
            'shipping_address' => [],
            'shipment' => [],
        ]);
        NotificationLog::create([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'event' => 'order_placed',
            'channel' => 'email',
            'recipient' => 'buyer@example.test',
            'subject' => 'Order received',
            'message' => 'Order received.',
            'status' => 'queued',
            'queued_at' => now(),
        ]);
        $otherTenant = Tenant::create(['name' => 'Other', 'slug' => 'other']);
        NotificationLog::create([
            'tenant_id' => $otherTenant->id,
            'event' => 'order_placed',
            'channel' => 'email',
            'recipient' => 'other@example.test',
            'subject' => 'Other',
            'message' => 'Other',
            'status' => 'queued',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/notifications/logs')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.event', 'order_placed')
            ->assertJsonPath('data.0.order.number', 'ORD-NOTIFY-1')
            ->assertJsonPath('summary.queued', 1);
    }

    public function test_tenant_user_can_mark_notification_log_sent_or_failed(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $log = NotificationLog::create([
            'tenant_id' => $tenant->id,
            'event' => 'order_shipped',
            'channel' => 'email',
            'recipient' => 'buyer@example.test',
            'subject' => 'Order shipped',
            'message' => 'Order shipped.',
            'status' => 'queued',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson("/api/notifications/logs/{$log->id}", [
                'status' => 'sent',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'sent')
            ->assertJsonPath('data.sent_at', fn ($value) => is_string($value));

        $this->assertDatabaseHas('notification_logs', [
            'id' => $log->id,
            'status' => 'sent',
        ]);
    }

    public function test_tenant_user_can_retry_failed_notification_log(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $log = NotificationLog::create([
            'tenant_id' => $tenant->id,
            'event' => 'order_shipped',
            'channel' => 'email',
            'recipient' => 'buyer@example.test',
            'subject' => 'Order shipped',
            'message' => 'Order shipped.',
            'status' => 'failed',
            'attempts' => 2,
            'last_error' => 'SMTP timeout',
            'queued_at' => now()->subMinutes(10),
            'sent_at' => now()->subMinutes(5),
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson("/api/notifications/logs/{$log->id}/retry")
            ->assertOk()
            ->assertJsonPath('data.status', 'queued')
            ->assertJsonPath('data.last_error', null)
            ->assertJsonPath('data.sent_at', null);

        $this->assertDatabaseHas('notification_logs', [
            'id' => $log->id,
            'status' => 'queued',
            'attempts' => 2,
            'last_error' => null,
            'sent_at' => null,
        ]);
    }

    public function test_tenant_user_can_process_their_queued_notifications_now(): void
    {
        Mail::fake();

        [$user, $tenant] = $this->createTenantUser();
        NotificationLog::create([
            'tenant_id' => $tenant->id,
            'event' => 'order_placed',
            'channel' => 'email',
            'recipient' => 'buyer@example.test',
            'subject' => 'Order received',
            'message' => 'Order received.',
            'status' => 'queued',
            'queued_at' => now(),
        ]);
        $otherTenant = Tenant::create(['name' => 'Other', 'slug' => 'other']);
        NotificationLog::create([
            'tenant_id' => $otherTenant->id,
            'event' => 'order_placed',
            'channel' => 'email',
            'recipient' => 'other@example.test',
            'subject' => 'Other',
            'message' => 'Other',
            'status' => 'queued',
            'queued_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/notifications/process', ['limit' => 10])
            ->assertOk()
            ->assertJsonPath('summary.processed', 1)
            ->assertJsonPath('summary.sent', 1)
            ->assertJsonPath('summary.failed', 0);

        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'recipient' => 'buyer@example.test',
            'status' => 'sent',
        ]);
        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $otherTenant->id,
            'recipient' => 'other@example.test',
            'status' => 'queued',
        ]);
    }

    public function test_tenant_user_cannot_retry_other_tenant_notification_log(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $otherTenant = Tenant::create(['name' => 'Other', 'slug' => 'other']);
        $log = NotificationLog::create([
            'tenant_id' => $otherTenant->id,
            'event' => 'order_shipped',
            'channel' => 'email',
            'recipient' => 'buyer@example.test',
            'subject' => 'Order shipped',
            'message' => 'Order shipped.',
            'status' => 'failed',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson("/api/notifications/logs/{$log->id}/retry")
            ->assertNotFound();
    }

    public function test_tenant_user_can_queue_test_notification_log(): void
    {
        [$user, $tenant] = $this->createTenantUser();

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/notifications/test-send', [
                'channel' => 'Email',
            ])
            ->assertCreated()
            ->assertJsonPath('data.event', 'test_notification')
            ->assertJsonPath('data.channel', 'email')
            ->assertJsonPath('data.status', 'queued')
            ->assertJsonPath('data.recipient', 'test@bisora.local');

        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'test_notification',
            'channel' => 'email',
            'status' => 'queued',
        ]);
    }

    public function test_basic_plan_cannot_queue_whatsapp_test_notification(): void
    {
        [$user, $tenant] = $this->createTenantUser(plan: 'Basic');
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'notifications' => ['providers' => ['whatsapp' => ['enabled' => true, 'connected' => true]]],
            ],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/notifications/test-send', ['channel' => 'WhatsApp'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'WhatsApp notification is not included in Basic package.');
    }

    public function test_standard_plan_needs_connected_whatsapp_provider_before_test_send(): void
    {
        [$user, $tenant] = $this->createTenantUser(plan: 'Standard');
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'notifications' => ['providers' => ['whatsapp' => ['enabled' => false, 'connected' => false]]],
            ],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/notifications/test-send', ['channel' => 'WhatsApp'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'WhatsApp provider is not connected.');
    }

    public function test_standard_plan_can_queue_whatsapp_test_when_provider_is_connected(): void
    {
        [$user, $tenant] = $this->createTenantUser(plan: 'Standard');
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'notifications' => ['providers' => ['whatsapp' => ['enabled' => true, 'connected' => true]]],
            ],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/notifications/test-send', ['channel' => 'WhatsApp'])
            ->assertCreated()
            ->assertJsonPath('data.channel', 'whatsapp');

        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'test_notification',
            'channel' => 'whatsapp',
        ]);
    }

    public function test_tenant_user_cannot_access_other_tenant_notification_log(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $otherTenant = Tenant::create(['name' => 'Other', 'slug' => 'other']);
        $log = NotificationLog::create([
            'tenant_id' => $otherTenant->id,
            'event' => 'order_shipped',
            'channel' => 'email',
            'recipient' => 'buyer@example.test',
            'subject' => 'Order shipped',
            'message' => 'Order shipped.',
            'status' => 'queued',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson("/api/notifications/logs/{$log->id}", ['status' => 'sent'])
            ->assertNotFound();
    }

    private function createTenantUser(string $plan = 'Free Trial'): array
    {
        $user = User::factory()->create();
        $tenant = Tenant::create(['name' => 'Demo Store', 'slug' => 'demo-store', 'plan' => $plan]);
        $tenant->users()->attach($user, ['role' => 'owner']);

        return [$user, $tenant];
    }
}
