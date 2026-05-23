<?php

namespace Tests\Feature;

use App\Models\CustomerProfile;
use App\Models\Order;
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

    private function createTenantUser(): array
    {
        $user = User::factory()->create();
        $tenant = Tenant::create(['name' => 'Demo Store', 'slug' => 'demo-store']);
        $tenant->users()->attach($user, ['role' => 'owner']);

        return [$user, $tenant];
    }
}
