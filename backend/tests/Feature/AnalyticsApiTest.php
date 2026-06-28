<?php

namespace Tests\Feature;

use App\Models\CustomerProfile;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalyticsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_user_can_view_dashboard_metrics_from_real_store_data(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        CustomerProfile::create([
            'tenant_id' => $tenant->id,
            'name' => 'Amina',
            'email' => 'amina@example.test',
            'status' => 'vip',
            'total_spent' => 45000,
        ]);
        Product::create([
            'tenant_id' => $tenant->id,
            'title' => 'Premium Modal Hijab',
            'slug' => 'premium-modal-hijab',
            'sku' => 'HIJAB-001',
            'price' => 12900,
            'stock' => 10,
            'status' => 'active',
        ]);
        Order::create([
            'tenant_id' => $tenant->id,
            'number' => 'ORD-9021',
            'total' => 45000,
            'payment_status' => 'paid',
            'settlement_status' => 'unsettled',
            'fulfillment_status' => 'processing',
            'ordered_at' => '2026-04-21',
            'items' => [['name' => 'Premium Modal Hijab', 'sku' => 'HIJAB-001', 'quantity' => 2, 'price' => 12900]],
            'shipping_address' => [],
            'shipment' => [],
        ]);
        Order::create([
            'tenant_id' => $tenant->id,
            'number' => 'ORD-9019',
            'total' => 122000,
            'payment_status' => 'pending',
            'fulfillment_status' => 'unfulfilled',
            'ordered_at' => '2026-04-22',
            'items' => [],
            'shipping_address' => [],
            'shipment' => [],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.metrics.revenue', 45000)
            ->assertJsonPath('data.metrics.orders', 2)
            ->assertJsonPath('data.metrics.customers', 1)
            ->assertJsonPath('data.metrics.products', 1)
            ->assertJsonPath('data.recent_orders.0.number', 'ORD-9019');
    }

    public function test_dashboard_includes_trial_onboarding_progress(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'managed_domain' => 'demo-store.bisora.app',
            'settings' => [
                'payments' => [
                    'gateways' => [['slug' => 'stripe', 'enabled_at_checkout' => true]],
                ],
                'shipping' => [
                    'providers' => [['slug' => 'easyparcel', 'enabled' => false]],
                ],
                'branding' => [
                    'domain' => 'demo-store.bisora.app',
                ],
                'storefront' => [
                    'status' => 'live',
                ],
            ],
        ]);
        Product::create([
            'tenant_id' => $tenant->id,
            'title' => 'First Product',
            'slug' => 'first-product',
            'sku' => 'FIRST-001',
            'price' => 9900,
            'stock' => 5,
            'status' => 'active',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.onboarding.progress.completed', 3)
            ->assertJsonPath('data.onboarding.progress.total', 4)
            ->assertJsonPath('data.onboarding.items.0.key', 'add_first_product')
            ->assertJsonPath('data.onboarding.items.0.completed', true)
            ->assertJsonPath('data.onboarding.items.2.key', 'configure_shipping')
            ->assertJsonPath('data.onboarding.items.2.completed', false);
    }

    public function test_dashboard_requires_live_storefront_for_publish_step(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'managed_domain' => 'demo-store.bisora.app',
            'settings' => ['storefront' => ['status' => 'draft']],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.onboarding.items.3.key', 'publish_storefront')
            ->assertJsonPath('data.onboarding.items.3.completed', false);
    }

    public function test_tenant_user_can_view_reports_overview_and_finance_summary(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        Order::create([
            'tenant_id' => $tenant->id,
            'number' => 'ORD-9021',
            'total' => 45000,
            'payment_status' => 'paid',
            'settlement_status' => 'unsettled',
            'fulfillment_status' => 'processing',
            'ordered_at' => '2026-04-21',
            'items' => [['name' => 'Premium Modal Hijab', 'sku' => 'HIJAB-001', 'quantity' => 2, 'price' => 12900]],
            'shipping_address' => [],
            'shipment' => [],
        ]);
        Order::create([
            'tenant_id' => $tenant->id,
            'number' => 'ORD-9015',
            'total' => 89000,
            'payment_status' => 'paid',
            'settlement_status' => 'processing',
            'fulfillment_status' => 'shipped',
            'ordered_at' => '2026-04-20',
            'items' => [['name' => 'Satin Square Scarf', 'sku' => 'SCARF-002', 'quantity' => 1, 'price' => 8900]],
            'shipping_address' => [],
            'shipment' => [],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/reports/overview')
            ->assertOk()
            ->assertJsonPath('data.overview.total_revenue', 134000)
            ->assertJsonPath('data.overview.total_orders', 2)
            ->assertJsonPath('data.overview.average_order_value', 67000)
            ->assertJsonPath('data.finance.cash_collected', 134000)
            ->assertJsonPath('data.finance.in_settlement', 134000)
            ->assertJsonPath('data.top_products.0.name', 'Premium Modal Hijab');
    }

    private function createTenantUser(): array
    {
        $user = User::factory()->create();
        $tenant = Tenant::create(['name' => 'Demo Store', 'slug' => 'demo-store']);
        $tenant->users()->attach($user, ['role' => 'owner']);

        return [$user, $tenant];
    }
}
