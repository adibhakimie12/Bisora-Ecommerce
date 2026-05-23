<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\PlatformGatewayConfig;
use App\Models\Product;
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
    }
}
