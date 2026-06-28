<?php

namespace Tests\Feature;

use App\Models\CustomerProfile;
use App\Models\NotificationLog;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationAutomationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_checkout_queues_order_placed_notifications(): void
    {
        $tenant = Tenant::create(['name' => 'Notify Store', 'slug' => 'notify-store', 'plan' => 'Standard']);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Notify Store',
            'slug' => 'notify-store',
            'settings' => [
                'storefront' => ['status' => 'live'],
                'notifications' => [
                    'seller_alert_email' => 'ops@notify.test',
                    'seller_alert_whatsapp' => '+60111111111',
                    'providers' => [
                        'whatsapp' => ['enabled' => true, 'connected' => true],
                    ],
                ],
            ],
        ]);
        $product = Product::create([
            'tenant_id' => $tenant->id,
            'title' => 'Notify Product',
            'slug' => 'notify-product',
            'sku' => 'NTF-001',
            'price' => 12900,
            'stock' => 8,
            'status' => 'active',
        ]);

        $this->postJson('/api/storefront/notify-store/checkout', [
            'customer' => ['name' => 'Buyer', 'email' => 'buyer@example.test'],
            'shipping_address' => ['address_line_1' => 'Demo', 'city' => 'Kuala Lumpur', 'country' => 'Malaysia'],
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated();

        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'order_placed',
            'channel' => 'email',
            'recipient' => 'buyer@example.test',
            'status' => 'queued',
        ]);
        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'order_placed',
            'channel' => 'seller_email',
            'recipient' => 'ops@notify.test',
            'status' => 'queued',
        ]);
        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'order_placed',
            'channel' => 'seller_whatsapp',
            'recipient' => '+60111111111',
            'status' => 'queued',
        ]);
    }

    public function test_public_checkout_skips_seller_whatsapp_when_channel_gate_blocks_it(): void
    {
        $tenant = Tenant::create(['name' => 'Notify Store', 'slug' => 'notify-store', 'plan' => 'Basic']);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Notify Store',
            'slug' => 'notify-store',
            'settings' => [
                'storefront' => ['status' => 'live'],
                'notifications' => [
                    'seller_alert_email' => 'ops@notify.test',
                    'seller_alert_whatsapp' => '+60111111111',
                    'providers' => [
                        'whatsapp' => ['enabled' => true, 'connected' => true],
                    ],
                ],
            ],
        ]);
        $product = Product::create([
            'tenant_id' => $tenant->id,
            'title' => 'Notify Product',
            'slug' => 'notify-product',
            'sku' => 'NTF-001',
            'price' => 12900,
            'stock' => 8,
            'status' => 'active',
        ]);

        $this->postJson('/api/storefront/notify-store/checkout', [
            'customer' => ['name' => 'Buyer', 'email' => 'buyer@example.test'],
            'shipping_address' => ['address_line_1' => 'Demo', 'city' => 'Kuala Lumpur', 'country' => 'Malaysia'],
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated();

        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'order_placed',
            'channel' => 'seller_email',
            'recipient' => 'ops@notify.test',
            'status' => 'queued',
        ]);
        $this->assertDatabaseMissing('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'order_placed',
            'channel' => 'seller_whatsapp',
            'recipient' => '+60111111111',
        ]);
    }

    public function test_admin_payment_and_shipping_updates_queue_customer_notifications(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Notify Store',
            'slug' => 'notify-store',
            'settings' => ['storefront' => ['status' => 'live']],
        ]);
        $customer = CustomerProfile::create([
            'tenant_id' => $tenant->id,
            'name' => 'Buyer',
            'email' => 'buyer@example.test',
        ]);
        $order = Order::create([
            'tenant_id' => $tenant->id,
            'customer_profile_id' => $customer->id,
            'number' => 'ORD-NOTIFY-1',
            'total' => 12900,
            'payment_status' => 'pending',
            'fulfillment_status' => 'unfulfilled',
            'items' => [],
            'shipping_address' => [],
            'shipment' => [],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson("/api/orders/{$order->id}/status", [
                'payment_status' => 'paid',
                'settlement_status' => 'processing',
            ])
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson("/api/orders/{$order->id}/status", [
                'fulfillment_status' => 'shipped',
                'courier' => 'DHL',
                'tracking_number' => 'DHL-123',
            ])
            ->assertOk();

        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'payment_confirmed',
            'channel' => 'email',
            'recipient' => 'buyer@example.test',
            'status' => 'queued',
        ]);
        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'order_shipped',
            'channel' => 'email',
            'recipient' => 'buyer@example.test',
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
