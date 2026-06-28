<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MeEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_requires_authentication(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_it_returns_the_authenticated_user_and_tenant_list(): void
    {
        $user = User::factory()->create(['email' => 'adib.hakimi19@gmail.com']);
        $tenant = Tenant::create([
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'plan' => 'premium',
            'billing_status' => 'trial',
            'access_status' => 'active',
        ]);

        $tenant->users()->attach($user, ['role' => 'owner']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'adib.hakimi19@gmail.com')
            ->assertJsonPath('user.is_platform_owner', true)
            ->assertJsonPath('tenants.0.slug', 'demo-store');
    }

    public function test_platform_owner_me_endpoint_returns_every_tenant(): void
    {
        $owner = User::factory()->create(['email' => config('bisora.owner_email')]);
        Tenant::create([
            'name' => 'Alpha Store',
            'slug' => 'alpha-store',
            'plan' => 'premium',
            'billing_status' => 'paid',
            'access_status' => 'active',
        ]);
        Tenant::create([
            'name' => 'Beta Store',
            'slug' => 'beta-store',
            'plan' => 'Free Trial',
            'billing_status' => 'trial',
            'access_status' => 'suspended',
        ]);

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.is_platform_owner', true)
            ->assertJsonPath('tenants.0.slug', 'alpha-store')
            ->assertJsonPath('tenants.0.role', 'platform_owner')
            ->assertJsonPath('tenants.1.slug', 'beta-store')
            ->assertJsonPath('tenants.1.role', 'platform_owner');
    }
}
