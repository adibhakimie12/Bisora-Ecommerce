<?php

namespace Tests\Feature;

use App\Models\CustomerProfile;
use App\Models\NotificationLog;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\ProductReview;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommerceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_user_can_list_customers_and_orders_for_active_tenant(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $customer = CustomerProfile::create([
            'tenant_id' => $tenant->id,
            'name' => 'Amina Al-Farsi',
            'email' => 'amina@example.test',
            'status' => 'vip',
            'orders_count' => 2,
            'total_spent' => 45000,
            'last_order_at' => '2026-04-21',
            'member_since' => '2026-01-10',
            'shipping_address' => ['Villa 14', 'Kuala Lumpur', 'Malaysia'],
            'notes' => ['VIP support priority'],
        ]);
        Order::create([
            'tenant_id' => $tenant->id,
            'customer_profile_id' => $customer->id,
            'number' => 'ORD-9021',
            'total' => 45000,
            'payment_status' => 'paid',
            'settlement_status' => 'unsettled',
            'fulfillment_status' => 'processing',
            'ordered_at' => '2026-04-21',
            'payment_method' => 'Visa ending 4242',
            'items' => [['name' => 'Premium Modal Hijab', 'sku' => 'HIJAB-001', 'quantity' => 1, 'price' => 12900]],
            'shipping_address' => ['recipient' => 'Amina Al-Farsi', 'city' => 'Kuala Lumpur', 'country' => 'Malaysia'],
            'shipment' => ['courier' => 'DHL', 'tracking_location' => 'Preparing shipment'],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/customers')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Amina Al-Farsi')
            ->assertJsonPath('data.0.total_spent', 45000);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/orders')
            ->assertOk()
            ->assertJsonPath('data.0.number', 'ORD-9021')
            ->assertJsonPath('data.0.customer.email', 'amina@example.test');
    }

    public function test_tenant_user_can_update_order_fulfillment_status(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $order = Order::create([
            'tenant_id' => $tenant->id,
            'number' => 'ORD-9019',
            'total' => 122000,
            'payment_status' => 'pending',
            'fulfillment_status' => 'unfulfilled',
            'ordered_at' => '2026-04-21',
            'items' => [],
            'shipping_address' => [],
            'shipment' => [],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson("/api/orders/{$order->id}/status", [
                'fulfillment_status' => 'shipped',
                'tracking_number' => 'DHL-9019',
                'courier' => 'DHL',
            ])
            ->assertOk()
            ->assertJsonPath('data.fulfillment_status', 'shipped')
            ->assertJsonPath('data.shipment.tracking_number', 'DHL-9019');
    }

    public function test_tenant_user_can_create_manual_order_from_catalog_products(): void
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
        $product = Product::create([
            'tenant_id' => $tenant->id,
            'title' => 'Premium Modal Hijab',
            'slug' => 'premium-modal-hijab',
            'sku' => 'HJB-MDL-018',
            'price' => 9000,
            'stock' => 8,
            'status' => 'active',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/orders', [
                'customer' => [
                    'name' => 'Nur Amirah',
                    'email' => 'nur.amirah@example.test',
                    'phone' => '+60 12-888 3391',
                ],
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 2],
                ],
                'payment_method' => 'Manual transfer',
                'payment_status' => 'pending',
                'shipping_address' => [
                    'address_line_1' => 'No 12 Jalan Demo',
                    'city' => 'Kuala Lumpur',
                    'country' => 'Malaysia',
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.customer.email', 'nur.amirah@example.test')
            ->assertJsonPath('data.total', 18000)
            ->assertJsonPath('data.items.0.name', 'Premium Modal Hijab')
            ->assertJsonPath('data.shipment.tracking_location', 'Manual order received');

        $orderId = $response->json('data.id');

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'tenant_id' => $tenant->id,
            'total' => 18000,
            'payment_method' => 'Manual transfer',
        ]);
        $this->assertDatabaseHas('customer_profiles', [
            'tenant_id' => $tenant->id,
            'email' => 'nur.amirah@example.test',
            'orders_count' => 1,
            'total_spent' => 18000,
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 6,
        ]);
        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'order_id' => $orderId,
            'event' => 'order_placed',
            'channel' => 'email',
            'recipient' => 'nur.amirah@example.test',
            'status' => 'queued',
        ]);
    }

    public function test_manual_order_rejects_products_from_another_tenant(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $otherTenant = Tenant::create(['name' => 'Other', 'slug' => 'other']);
        $product = Product::create([
            'tenant_id' => $otherTenant->id,
            'title' => 'Other Product',
            'slug' => 'other-product',
            'sku' => 'OTHER-001',
            'price' => 9000,
            'stock' => 8,
            'status' => 'active',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/orders', [
                'customer' => [
                    'name' => 'Nur Amirah',
                    'email' => 'nur.amirah@example.test',
                ],
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Manual order contains unavailable products.');
    }

    public function test_tenant_user_can_delete_order_restore_stock_and_recalculate_customer_totals(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $product = Product::create([
            'tenant_id' => $tenant->id,
            'title' => 'Premium Modal Hijab',
            'slug' => 'premium-modal-hijab',
            'sku' => 'HJB-MDL-018',
            'price' => 9000,
            'stock' => 6,
            'status' => 'active',
        ]);
        $customer = CustomerProfile::create([
            'tenant_id' => $tenant->id,
            'name' => 'Nur Amirah',
            'email' => 'nur.amirah@example.test',
            'status' => 'new',
            'orders_count' => 2,
            'total_spent' => 27000,
            'last_order_at' => '2026-05-25',
        ]);
        $order = Order::create([
            'tenant_id' => $tenant->id,
            'customer_profile_id' => $customer->id,
            'number' => 'ORD-260525-0001',
            'total' => 18000,
            'payment_status' => 'pending',
            'settlement_status' => 'unsettled',
            'fulfillment_status' => 'unfulfilled',
            'ordered_at' => '2026-05-25',
            'items' => [
                ['product_id' => (string) $product->id, 'name' => $product->title, 'sku' => $product->sku, 'quantity' => 2, 'price' => 9000],
            ],
            'shipping_address' => [],
            'shipment' => [],
        ]);
        Order::create([
            'tenant_id' => $tenant->id,
            'customer_profile_id' => $customer->id,
            'number' => 'ORD-260525-0002',
            'total' => 9000,
            'payment_status' => 'paid',
            'settlement_status' => 'settled',
            'fulfillment_status' => 'delivered',
            'ordered_at' => '2026-05-24',
            'items' => [],
            'shipping_address' => [],
            'shipment' => [],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->deleteJson("/api/orders/{$order->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 8,
        ]);
        $this->assertDatabaseHas('customer_profiles', [
            'id' => $customer->id,
            'orders_count' => 1,
            'total_spent' => 9000,
            'last_order_at' => '2026-05-24 00:00:00',
        ]);
    }

    public function test_tenant_user_cannot_delete_another_tenants_order(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $otherTenant = Tenant::create(['name' => 'Other', 'slug' => 'other']);
        $order = Order::create([
            'tenant_id' => $otherTenant->id,
            'number' => 'ORD-OTHER',
            'total' => 1000,
            'payment_status' => 'paid',
            'fulfillment_status' => 'processing',
            'ordered_at' => '2026-04-21',
            'items' => [],
            'shipping_address' => [],
            'shipment' => [],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->deleteJson("/api/orders/{$order->id}")
            ->assertNotFound();
    }

    public function test_tenant_user_can_create_update_note_and_delete_customer(): void
    {
        [$user, $tenant] = $this->createTenantUser();

        $createResponse = $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/customers', [
                'name' => 'Nur Aisyah',
                'email' => 'nur@example.test',
                'status' => 'VIP',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Nur Aisyah')
            ->assertJsonPath('data.status', 'vip');

        $customerId = $createResponse->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson("/api/customers/{$customerId}", [
                'name' => 'Nur Aisyah Updated',
                'email' => 'nur.updated@example.test',
                'status' => 'Returning',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Nur Aisyah Updated')
            ->assertJsonPath('data.status', 'returning');

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson("/api/customers/{$customerId}/notes", [
                'message' => 'Prefers WhatsApp after 6pm.',
            ])
            ->assertOk()
            ->assertJsonPath('data.notes.0', 'Prefers WhatsApp after 6pm.');

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->deleteJson("/api/customers/{$customerId}")
            ->assertNoContent();

        $this->assertDatabaseMissing('customer_profiles', [
            'tenant_id' => $tenant->id,
            'email' => 'nur.updated@example.test',
        ]);
    }

    public function test_tenant_user_can_queue_customer_email_contact_and_deactivate_customer(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $customer = CustomerProfile::create([
            'tenant_id' => $tenant->id,
            'name' => 'Amina',
            'email' => 'amina@example.test',
            'status' => 'vip',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson("/api/customers/{$customer->id}/contact", [
                'channel' => 'Email',
                'message' => 'Thanks for shopping with us.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.channel', 'email')
            ->assertJsonPath('data.recipient', 'amina@example.test')
            ->assertJsonPath('data.status', 'queued');

        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'customer_contact',
            'channel' => 'email',
            'recipient' => 'amina@example.test',
            'status' => 'queued',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson("/api/customers/{$customer->id}/deactivate")
            ->assertOk()
            ->assertJsonPath('data.status', 'inactive');

        $this->assertDatabaseHas('customer_profiles', [
            'id' => $customer->id,
            'status' => 'inactive',
        ]);
    }

    public function test_customer_whatsapp_contact_requires_allowed_connected_provider(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $tenant->update(['plan' => 'Standard']);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'notifications' => [
                    'providers' => [
                        'whatsapp' => ['enabled' => true, 'connected' => true],
                    ],
                ],
            ],
        ]);
        $customer = CustomerProfile::create([
            'tenant_id' => $tenant->id,
            'name' => 'Amina',
            'email' => 'amina@example.test',
            'status' => 'vip',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson("/api/customers/{$customer->id}/contact", [
                'channel' => 'WhatsApp',
                'message' => 'Your order is ready.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.channel', 'whatsapp');

        NotificationLog::query()->delete();
        $tenant->update(['plan' => 'Basic']);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson("/api/customers/{$customer->id}/contact", [
                'channel' => 'WhatsApp',
                'message' => 'Your order is ready.',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'WhatsApp customer contact is not included in Basic package.');
    }

    public function test_tenant_user_cannot_mutate_another_tenants_customer(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $otherTenant = Tenant::create(['name' => 'Other', 'slug' => 'other']);
        $customer = CustomerProfile::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Other Customer',
            'email' => 'other@example.test',
            'status' => 'new',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson("/api/customers/{$customer->id}", ['name' => 'Leaked'])
            ->assertNotFound();

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson("/api/customers/{$customer->id}/notes", ['message' => 'Nope'])
            ->assertNotFound();

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->deleteJson("/api/customers/{$customer->id}")
            ->assertNotFound();
    }

    public function test_tenant_user_cannot_access_another_tenants_order(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $otherTenant = Tenant::create(['name' => 'Other', 'slug' => 'other']);
        $order = Order::create([
            'tenant_id' => $otherTenant->id,
            'number' => 'ORD-OTHER',
            'total' => 1000,
            'payment_status' => 'paid',
            'fulfillment_status' => 'processing',
            'ordered_at' => '2026-04-21',
            'items' => [],
            'shipping_address' => [],
            'shipment' => [],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson("/api/orders/{$order->id}")
            ->assertNotFound();
    }

    public function test_tenant_user_can_moderate_reviews(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $review = ProductReview::create([
            'tenant_id' => $tenant->id,
            'customer_name' => 'Amina',
            'customer_email' => 'amina@example.test',
            'product_name' => 'Premium Modal Hijab',
            'rating' => 5,
            'excerpt' => 'Excellent quality',
            'full_review' => 'Excellent quality and fast shipping.',
            'status' => 'pending',
            'verified_purchase' => true,
            'reviewed_at' => '2026-04-21',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson("/api/reviews/{$review->id}", ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_tenant_user_can_delete_review_and_export_review_report(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $review = ProductReview::create([
            'tenant_id' => $tenant->id,
            'customer_name' => 'Amina',
            'customer_email' => 'amina@example.test',
            'product_name' => 'Premium Modal Hijab',
            'rating' => 5,
            'excerpt' => 'Excellent quality',
            'full_review' => 'Excellent quality and fast shipping.',
            'status' => 'approved',
            'verified_purchase' => true,
            'reviewed_at' => '2026-04-21',
        ]);
        ProductReview::create([
            'tenant_id' => Tenant::create(['name' => 'Other', 'slug' => 'other'])->id,
            'customer_name' => 'Other',
            'customer_email' => 'other@example.test',
            'product_name' => 'Other Product',
            'rating' => 1,
            'excerpt' => 'Nope',
            'full_review' => 'Nope',
            'status' => 'pending',
            'verified_purchase' => false,
            'reviewed_at' => '2026-04-22',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/reviews/export')
            ->assertOk()
            ->assertJsonPath('data.0.customer_name', 'Amina')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('summary.total', 1)
            ->assertJsonPath('summary.average_rating', 5);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->deleteJson("/api/reviews/{$review->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('product_reviews', [
            'id' => $review->id,
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
