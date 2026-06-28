<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\SubscriptionPackage;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_creates_login_ready_owner_and_demo_store(): void
    {
        $this->seed(DatabaseSeeder::class);

        $owner = User::where('email', 'adib.hakimi19@gmail.com')->first();
        $seller = User::where('email', 'seller@bisora.my')->first();
        $tenant = Tenant::where('slug', 'bisora-demo')->first();

        $this->assertNotNull($owner);
        $this->assertNotNull($seller);
        $this->assertNotNull($tenant);
        $this->assertTrue(Hash::check('Kimiey12.', $owner->password));
        $this->assertTrue($owner->isPlatformOwner());
        $this->assertTrue($seller->tenants()->where('tenants.id', $tenant->id)->exists());
        $this->assertGreaterThanOrEqual(3, Product::where('tenant_id', $tenant->id)->count());
        $this->assertGreaterThanOrEqual(3, SubscriptionPackage::count());
    }

    public function test_database_seeder_creates_trial_and_paid_subscription_packages(): void
    {
        $this->seed(DatabaseSeeder::class);

        $packages = SubscriptionPackage::query()
            ->orderBy('monthly_fee')
            ->get(['name', 'monthly_fee', 'features'])
            ->map(fn (SubscriptionPackage $package): array => [
                'name' => $package->name,
                'monthly_fee' => $package->monthly_fee,
                'features' => $package->features,
            ])
            ->values()
            ->all();

        $this->assertSame('Free Trial', $packages[0]['name']);
        $this->assertSame(0, $packages[0]['monthly_fee']);
        $this->assertContains('Basic access', $packages[0]['features']);
        $this->assertSame(['Free Trial', 'Basic', 'Standard', 'Premium'], array_column($packages, 'name'));
    }
}
