<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\CustomerProfile;
use App\Models\Order;
use App\Models\Store;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicStorefrontApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_view_live_storefront_by_slug_with_active_products(): void
    {
        $tenant = Tenant::create(['name' => 'Live Store', 'slug' => 'live-store']);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Live Store',
            'slug' => 'live-store',
            'managed_domain' => 'live-store.bisora.app',
            'custom_domain' => 'shop.live.test',
            'currency' => 'MYR',
            'settings' => [
                'branding' => [
                    'brandName' => 'Live Store',
                    'tagline' => 'Ready for customers',
                    'primaryColor' => '#4f46e5',
                ],
                'storefront' => [
                    'status' => 'live',
                    'published_url' => 'https://shop.live.test',
                ],
                'website_pages' => [
                    [
                        'id' => 'about',
                        'title' => 'About Us',
                        'slug' => '/pages/about-us',
                        'status' => 'Published',
                    ],
                    [
                        'id' => 'draft-page',
                        'title' => 'Draft Page',
                        'slug' => '/pages/draft',
                        'status' => 'Draft',
                    ],
                ],
                'blog_posts' => [
                    [
                        'id' => 'blog-1',
                        'title' => 'Published Blog',
                        'slug' => '/blog/published-blog',
                        'status' => 'Published',
                    ],
                    [
                        'id' => 'blog-2',
                        'title' => 'Draft Blog',
                        'slug' => '/blog/draft-blog',
                        'status' => 'Draft',
                    ],
                ],
            ],
        ]);
        Product::create([
            'tenant_id' => $tenant->id,
            'title' => 'Published Product',
            'slug' => 'published-product',
            'sku' => 'PUB-001',
            'price' => 12900,
            'stock' => 8,
            'status' => 'active',
            'thumbnail_url' => 'https://example.test/product.jpg',
        ]);
        Product::create([
            'tenant_id' => $tenant->id,
            'title' => 'Draft Product',
            'slug' => 'draft-product',
            'sku' => 'DRAFT-001',
            'price' => 9900,
            'stock' => 4,
            'status' => 'draft',
        ]);

        $this->getJson('/api/storefront/live-store')
            ->assertOk()
            ->assertJsonPath('data.store.name', 'Live Store')
            ->assertJsonPath('data.store.status', 'live')
            ->assertJsonPath('data.store.published_url', 'https://shop.live.test')
            ->assertJsonPath('data.products.0.title', 'Published Product')
            ->assertJsonPath('data.pages.0.title', 'About Us')
            ->assertJsonPath('data.blog_posts.0.title', 'Published Blog')
            ->assertJsonCount(1, 'data.pages')
            ->assertJsonCount(1, 'data.blog_posts')
            ->assertJsonCount(1, 'data.products');
    }

    public function test_public_can_view_live_storefront_by_domain(): void
    {
        $tenant = Tenant::create(['name' => 'Domain Store', 'slug' => 'domain-store']);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Domain Store',
            'slug' => 'domain-store',
            'managed_domain' => 'domain-store.bisora.app',
            'custom_domain' => 'shop.domain.test',
            'settings' => ['storefront' => ['status' => 'live']],
        ]);

        $this->getJson('/api/storefront/shop.domain.test')
            ->assertOk()
            ->assertJsonPath('data.store.slug', 'domain-store');
    }

    public function test_public_storefront_blocks_draft_store(): void
    {
        $tenant = Tenant::create(['name' => 'Draft Store', 'slug' => 'draft-store']);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Draft Store',
            'slug' => 'draft-store',
            'managed_domain' => 'draft-store.bisora.app',
            'settings' => ['storefront' => ['status' => 'draft']],
        ]);

        $this->getJson('/api/storefront/draft-store')
            ->assertNotFound();
    }

    public function test_public_checkout_creates_pending_order_and_customer_profile(): void
    {
        $tenant = Tenant::create(['name' => 'Checkout Store', 'slug' => 'checkout-store']);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Checkout Store',
            'slug' => 'checkout-store',
            'managed_domain' => 'checkout-store.bisora.app',
            'currency' => 'MYR',
            'settings' => ['storefront' => ['status' => 'live']],
        ]);
        $product = Product::create([
            'tenant_id' => $tenant->id,
            'title' => 'Checkout Product',
            'slug' => 'checkout-product',
            'sku' => 'CHK-001',
            'price' => 12900,
            'stock' => 8,
            'status' => 'active',
        ]);

        $this->postJson('/api/storefront/checkout-store/checkout', [
            'customer' => [
                'name' => 'Nur Aisyah',
                'email' => 'nur@example.test',
                'phone' => '+60123456789',
            ],
            'shipping_address' => [
                'address_line_1' => 'No 12 Jalan Demo',
                'city' => 'Kuala Lumpur',
                'postcode' => '50000',
                'country' => 'Malaysia',
            ],
            'payment_method' => 'manual_bank_transfer',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('data.payment_status', 'pending')
            ->assertJsonPath('data.fulfillment_status', 'unfulfilled')
            ->assertJsonPath('data.total', 25800)
            ->assertJsonPath('data.customer.email', 'nur@example.test');

        $this->assertDatabaseHas('customer_profiles', [
            'tenant_id' => $tenant->id,
            'email' => 'nur@example.test',
            'orders_count' => 1,
            'total_spent' => 25800,
        ]);

        $this->assertDatabaseHas('orders', [
            'tenant_id' => $tenant->id,
            'customer_profile_id' => CustomerProfile::where('email', 'nur@example.test')->value('id'),
            'total' => 25800,
            'payment_method' => 'manual_bank_transfer',
        ]);
    }

    public function test_public_checkout_rejects_draft_store(): void
    {
        $tenant = Tenant::create(['name' => 'Draft Checkout', 'slug' => 'draft-checkout']);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Draft Checkout',
            'slug' => 'draft-checkout',
            'settings' => ['storefront' => ['status' => 'draft']],
        ]);

        $this->postJson('/api/storefront/draft-checkout/checkout', [
            'customer' => ['name' => 'Nur', 'email' => 'nur@example.test'],
            'shipping_address' => ['address_line_1' => 'Demo', 'city' => 'KL', 'country' => 'Malaysia'],
            'items' => [['product_id' => 999, 'quantity' => 1]],
        ])->assertNotFound();
    }

    public function test_public_can_track_order_by_number_and_email(): void
    {
        $tenant = Tenant::create(['name' => 'Tracking Store', 'slug' => 'tracking-store']);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Tracking Store',
            'slug' => 'tracking-store',
            'settings' => ['storefront' => ['status' => 'live']],
        ]);
        $customer = CustomerProfile::create([
            'tenant_id' => $tenant->id,
            'name' => 'Trial Buyer',
            'email' => 'trial@example.test',
        ]);
        Order::create([
            'tenant_id' => $tenant->id,
            'customer_profile_id' => $customer->id,
            'number' => 'ORD-TRACK-1',
            'total' => 12900,
            'payment_status' => 'paid',
            'settlement_status' => 'processing',
            'fulfillment_status' => 'shipped',
            'ordered_at' => '2026-05-24',
            'payment_method' => 'manual_bank_transfer',
            'items' => [['name' => 'Premium Modal Hijab', 'sku' => 'HIJAB-001', 'quantity' => 1, 'price' => 12900]],
            'shipping_address' => ['recipient' => 'Trial Buyer', 'city' => 'Kuala Lumpur', 'country' => 'Malaysia'],
            'shipment' => ['courier' => 'DHL', 'tracking_number' => 'DHL-TRACK-1', 'tracking_location' => 'In transit'],
        ]);

        $this->getJson('/api/storefront/tracking-store/orders/ORD-TRACK-1?email=trial@example.test')
            ->assertOk()
            ->assertJsonPath('data.number', 'ORD-TRACK-1')
            ->assertJsonPath('data.customer.email', 'trial@example.test')
            ->assertJsonPath('data.shipment.tracking_number', 'DHL-TRACK-1');
    }

    public function test_public_order_tracking_requires_matching_email(): void
    {
        $tenant = Tenant::create(['name' => 'Private Store', 'slug' => 'private-store']);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Private Store',
            'slug' => 'private-store',
            'settings' => ['storefront' => ['status' => 'live']],
        ]);
        $customer = CustomerProfile::create([
            'tenant_id' => $tenant->id,
            'name' => 'Trial Buyer',
            'email' => 'trial@example.test',
        ]);
        Order::create([
            'tenant_id' => $tenant->id,
            'customer_profile_id' => $customer->id,
            'number' => 'ORD-PRIVATE-1',
            'total' => 12900,
            'payment_status' => 'paid',
            'fulfillment_status' => 'processing',
            'items' => [],
            'shipping_address' => [],
            'shipment' => [],
        ]);

        $this->getJson('/api/storefront/private-store/orders/ORD-PRIVATE-1?email=wrong@example.test')
            ->assertNotFound();
    }
}
