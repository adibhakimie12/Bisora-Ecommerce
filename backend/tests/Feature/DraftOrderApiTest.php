<?php

namespace Tests\Feature;

use App\Models\DraftOrder;
use App\Models\Store;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DraftOrderApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_user_can_create_list_update_and_delete_draft_order(): void
    {
        [$user, $tenant] = $this->createTenantUser();

        $createResponse = $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/draft-orders', [
                'customer_name' => 'Nur Amirah',
                'customer_email' => 'nur.amirah@example.test',
                'source' => 'WhatsApp',
                'items' => [
                    ['name' => 'Silk Midnight Abaya', 'sku' => 'ABY-LGC-097', 'quantity' => 1, 'price' => 42000],
                    ['name' => 'Premium Chiffon Hijab', 'sku' => 'HJB-NJR-097', 'quantity' => 2, 'price' => 11000],
                ],
                'note' => 'Send invoice after customer confirms size.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.customer_name', 'Nur Amirah')
            ->assertJsonPath('data.total', 64000)
            ->assertJsonPath('data.status', 'draft');

        $draftId = $createResponse->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/draft-orders')
            ->assertOk()
            ->assertJsonPath('data.0.id', $draftId)
            ->assertJsonPath('data.0.customer_email', 'nur.amirah@example.test');

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson("/api/draft-orders/{$draftId}", [
                'customer_name' => 'Nur Amirah Updated',
                'status' => 'invoice_sent',
                'items' => [
                    ['name' => 'Silk Midnight Abaya', 'sku' => 'ABY-LGC-097', 'quantity' => 1, 'price' => 42000],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.customer_name', 'Nur Amirah Updated')
            ->assertJsonPath('data.total', 42000)
            ->assertJsonPath('data.status', 'invoice_sent');

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->deleteJson("/api/draft-orders/{$draftId}")
            ->assertNoContent();

        $this->assertDatabaseMissing('draft_orders', ['id' => $draftId]);
    }

    public function test_tenant_user_cannot_mutate_another_tenants_draft_order(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $otherTenant = Tenant::create(['name' => 'Other', 'slug' => 'other']);
        $draftId = \DB::table('draft_orders')->insertGetId([
            'tenant_id' => $otherTenant->id,
            'number' => 'DRAFT-0001',
            'customer_name' => 'Other Customer',
            'customer_email' => 'other@example.test',
            'source' => 'WhatsApp',
            'items' => json_encode([]),
            'total' => 0,
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson("/api/draft-orders/{$draftId}", ['customer_name' => 'Leaked'])
            ->assertNotFound();

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->deleteJson("/api/draft-orders/{$draftId}")
            ->assertNotFound();
    }

    public function test_tenant_user_can_convert_draft_order_to_real_order(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'notifications' => ['seller_alert_email' => 'seller@example.test'],
            ],
        ]);
        $draft = DraftOrder::create([
            'tenant_id' => $tenant->id,
            'number' => 'DRAFT-260525-0001',
            'customer_name' => 'Nur Amirah',
            'customer_email' => 'nur.amirah@example.test',
            'source' => 'WhatsApp',
            'items' => [
                ['name' => 'Silk Midnight Abaya', 'sku' => 'ABY-LGC-097', 'quantity' => 1, 'price' => 42000, 'line_total' => 42000],
            ],
            'total' => 42000,
            'status' => 'invoice_sent',
            'note' => 'Paid manually.',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson("/api/draft-orders/{$draft->id}/convert", [
                'payment_status' => 'pending',
                'payment_method' => 'Manual transfer',
            ])
            ->assertCreated()
            ->assertJsonPath('data.order.customer.email', 'nur.amirah@example.test')
            ->assertJsonPath('data.order.total', 42000)
            ->assertJsonPath('data.draft.status', 'converted');

        $orderId = $response->json('data.order.id');

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'tenant_id' => $tenant->id,
            'total' => 42000,
            'payment_method' => 'Manual transfer',
        ]);
        $this->assertDatabaseHas('customer_profiles', [
            'tenant_id' => $tenant->id,
            'email' => 'nur.amirah@example.test',
            'orders_count' => 1,
            'total_spent' => 42000,
        ]);
        $this->assertDatabaseHas('draft_orders', [
            'id' => $draft->id,
            'status' => 'converted',
        ]);
        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'order_id' => $orderId,
            'event' => 'order_placed',
            'recipient' => 'nur.amirah@example.test',
        ]);
    }

    public function test_tenant_user_can_queue_draft_invoice_notification(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $draft = DraftOrder::create([
            'tenant_id' => $tenant->id,
            'number' => 'DRAFT-260525-0001',
            'customer_name' => 'Nur Amirah',
            'customer_email' => 'nur.amirah@example.test',
            'source' => 'WhatsApp',
            'items' => [
                ['name' => 'Silk Midnight Abaya', 'sku' => 'ABY-LGC-097', 'quantity' => 1, 'price' => 42000, 'line_total' => 42000],
            ],
            'total' => 42000,
            'status' => 'draft',
            'note' => 'Send invoice.',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson("/api/draft-orders/{$draft->id}/send-invoice")
            ->assertCreated()
            ->assertJsonPath('data.draft.status', 'invoice_sent')
            ->assertJsonPath('data.notification.event', 'draft_invoice')
            ->assertJsonPath('data.notification.recipient', 'nur.amirah@example.test')
            ->assertJsonPath('data.notification.status', 'queued');

        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'draft_invoice',
            'channel' => 'email',
            'recipient' => 'nur.amirah@example.test',
            'status' => 'queued',
        ]);
    }

    private function createTenantUser(): array
    {
        $user = User::factory()->create();
        $tenant = Tenant::create(['name' => 'Demo Store', 'slug' => 'demo-store']);
        $tenant->users()->attach($user, ['role' => 'owner']);

        return [$user, $tenant];
    }
}
