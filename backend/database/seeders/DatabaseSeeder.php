<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\CustomerProfile;
use App\Models\Order;
use App\Models\PlatformGatewayConfig;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\SubscriptionPackage;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $owner = User::updateOrCreate(
            ['email' => 'owner@bisora.my'],
            ['name' => 'Bisora Owner', 'password' => Hash::make('password')]
        );
        $seller = User::updateOrCreate(
            ['email' => 'seller@bisora.my'],
            ['name' => 'Sarah Admin', 'password' => Hash::make('password')]
        );

        $tenant = Tenant::updateOrCreate(
            ['slug' => 'bisora-demo'],
            [
                'name' => 'Bisora Demo Store',
                'owner_name' => 'Sarah Admin',
                'owner_email' => 'seller@bisora.my',
                'plan' => 'Growth',
                'billing_status' => 'paid',
                'access_status' => 'active',
                'monthly_fee' => 29900,
                'days_overdue' => 0,
                'free_access' => false,
            ]
        );

        $tenant->users()->syncWithoutDetaching([
            $owner->id => ['role' => 'platform_owner'],
            $seller->id => ['role' => 'owner'],
        ]);

        $category = Category::updateOrCreate(
            ['tenant_id' => $tenant->id, 'slug' => 'premium-hijab'],
            ['name' => 'Premium Hijab']
        );

        collect([
            ['title' => 'Premium Modal Hijab', 'sku' => 'HIJAB-001', 'price' => 12900, 'stock' => 24],
            ['title' => 'Satin Square Scarf', 'sku' => 'SCARF-002', 'price' => 8900, 'stock' => 18],
            ['title' => 'Daily Inner Snowcap', 'sku' => 'INNER-003', 'price' => 3900, 'stock' => 52],
        ])->each(function (array $product) use ($tenant, $category): void {
            Product::updateOrCreate(
                ['tenant_id' => $tenant->id, 'sku' => $product['sku']],
                [
                    ...$product,
                    'category_id' => $category->id,
                    'slug' => str($product['title'])->slug()->toString(),
                    'status' => 'active',
                    'thumbnail_url' => null,
                    'description' => 'Demo product seeded for Bisora admin testing.',
                    'vendor' => 'Bisora',
                    'product_type' => 'Apparel',
                    'tags' => ['demo', 'premium'],
                    'variants' => [],
                ]
            );
        });

        collect([
            ['name' => 'Starter', 'monthly_fee' => 9900, 'discount_percent' => 0, 'features' => ['Basic store', 'Products up to 30']],
            ['name' => 'Growth', 'monthly_fee' => 29900, 'discount_percent' => 0, 'features' => ['Automation queue', 'Campaigns', 'Advanced builder']],
            ['name' => 'Pro', 'monthly_fee' => 49900, 'discount_percent' => 0, 'features' => ['Team access', 'Custom gateway support', 'Higher limits']],
        ])->each(fn (array $package): SubscriptionPackage => SubscriptionPackage::updateOrCreate(
            ['name' => $package['name']],
            $package
        ));

        collect(['Billplz', 'SecurePay', 'ToyyibPay', 'Stripe'])->each(fn (string $provider): PlatformGatewayConfig => PlatformGatewayConfig::updateOrCreate(
            ['provider' => $provider],
            [
                'mode' => 'Test',
                'enabled' => $provider === 'Billplz',
                'merchant_id' => null,
                'webhook_url' => "https://admin.bisora.app/webhooks/platform/".strtolower($provider),
            ]
        ));

        $customers = collect([
            ['name' => 'Amina Al-Farsi', 'email' => 'amina@example.com', 'status' => 'vip', 'total_spent' => 45000],
            ['name' => 'Laila Bin-Khalid', 'email' => 'laila@example.com', 'status' => 'returning', 'total_spent' => 122000],
            ['name' => 'Zahra Mansour', 'email' => 'zahra@example.com', 'status' => 'new', 'total_spent' => 89000],
        ])->mapWithKeys(fn (array $customer): array => [
            $customer['email'] => CustomerProfile::updateOrCreate(
                ['tenant_id' => $tenant->id, 'email' => $customer['email']],
                [
                    ...$customer,
                    'orders_count' => 1,
                    'last_order_at' => '2026-04-21',
                    'member_since' => '2026-01-10',
                    'shipping_address' => ['Kuala Lumpur', 'Malaysia'],
                    'notes' => ['Seed customer for Bisora admin demo.'],
                ]
            ),
        ]);

        collect([
            ['number' => 'ORD-9021', 'email' => 'amina@example.com', 'total' => 45000, 'payment_status' => 'paid', 'settlement_status' => 'unsettled', 'fulfillment_status' => 'processing', 'payment_method' => 'Visa ending 4242'],
            ['number' => 'ORD-9019', 'email' => 'laila@example.com', 'total' => 122000, 'payment_status' => 'pending', 'settlement_status' => null, 'fulfillment_status' => 'unfulfilled', 'payment_method' => 'Bank transfer'],
            ['number' => 'ORD-9015', 'email' => 'zahra@example.com', 'total' => 89000, 'payment_status' => 'paid', 'settlement_status' => 'processing', 'fulfillment_status' => 'shipped', 'payment_method' => 'Mastercard ending 1188'],
        ])->each(function (array $order) use ($tenant, $customers): void {
            Order::updateOrCreate(
                ['tenant_id' => $tenant->id, 'number' => $order['number']],
                [
                    'customer_profile_id' => $customers[$order['email']]->id,
                    'total' => $order['total'],
                    'payment_status' => $order['payment_status'],
                    'settlement_status' => $order['settlement_status'],
                    'fulfillment_status' => $order['fulfillment_status'],
                    'ordered_at' => '2026-04-21',
                    'payment_method' => $order['payment_method'],
                    'items' => [['name' => 'Premium Modal Hijab', 'sku' => 'HIJAB-001', 'quantity' => 1, 'price' => 12900]],
                    'shipping_address' => ['recipient' => $customers[$order['email']]->name, 'city' => 'Kuala Lumpur', 'country' => 'Malaysia'],
                    'shipment' => ['courier' => 'DHL', 'tracking_location' => 'Preparing shipment'],
                ]
            );
        });

        ProductReview::updateOrCreate(
            ['tenant_id' => $tenant->id, 'customer_email' => 'amina@example.com', 'product_name' => 'Premium Modal Hijab'],
            [
                'customer_profile_id' => $customers['amina@example.com']->id,
                'customer_name' => 'Amina Al-Farsi',
                'rating' => 5,
                'excerpt' => 'Excellent quality',
                'full_review' => 'Excellent quality and fast shipping.',
                'status' => 'pending',
                'verified_purchase' => true,
                'reviewed_at' => '2026-04-21',
            ]
        );
    }
}
