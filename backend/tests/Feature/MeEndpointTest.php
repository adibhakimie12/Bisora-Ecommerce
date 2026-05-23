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
        $user = User::factory()->create(['email' => 'owner@bisora.my']);
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
            ->assertJsonPath('user.email', 'owner@bisora.my')
            ->assertJsonPath('user.is_platform_owner', true)
            ->assertJsonPath('tenants.0.slug', 'demo-store');
    }
}
