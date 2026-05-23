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

        $owner = User::where('email', 'owner@bisora.my')->first();
        $seller = User::where('email', 'seller@bisora.my')->first();
        $tenant = Tenant::where('slug', 'bisora-demo')->first();

        $this->assertNotNull($owner);
        $this->assertNotNull($seller);
        $this->assertNotNull($tenant);
        $this->assertTrue(Hash::check('password', $owner->password));
        $this->assertTrue($owner->isPlatformOwner());
        $this->assertTrue($seller->tenants()->where('tenants.id', $tenant->id)->exists());
        $this->assertGreaterThanOrEqual(3, Product::where('tenant_id', $tenant->id)->count());
        $this->assertGreaterThanOrEqual(3, SubscriptionPackage::count());
    }
}
