<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_create_free_trial_workspace_and_receive_session(): void
    {
        $this->postJson('/api/auth/trial', [
            'name' => 'Aina Merchant',
            'email' => 'aina@example.test',
            'password' => 'secure-pass-123',
            'store_name' => 'Aina Raya Store',
        ])
            ->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'email'], 'tenants' => [['id', 'name', 'slug', 'role']]])
            ->assertJsonPath('user.email', 'aina@example.test')
            ->assertJsonPath('tenants.0.name', 'Aina Raya Store')
            ->assertJsonPath('tenants.0.role', 'owner')
            ->assertJsonPath('tenants.0.plan', 'Free Trial')
            ->assertJsonPath('tenants.0.billing_status', 'trial')
            ->assertJsonPath('tenants.0.access_status', 'active');

        $this->assertDatabaseHas('users', ['email' => 'aina@example.test']);
        $tenant = Tenant::query()->where('owner_email', 'aina@example.test')->firstOrFail();
        $this->assertSame('Free Trial', $tenant->plan);
        $this->assertDatabaseHas('tenant_user', [
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);
        $this->assertDatabaseHas('stores', [
            'tenant_id' => $tenant->id,
            'name' => 'Aina Raya Store',
            'managed_domain' => $tenant->slug . '.bisora.app',
        ]);
        $this->assertNotNull($tenant->trial_ends_at);
    }

    public function test_trial_signup_rejects_existing_email(): void
    {
        User::factory()->create(['email' => 'seller@bisora.my']);

        $this->postJson('/api/auth/trial', [
            'name' => 'Existing Seller',
            'email' => 'seller@bisora.my',
            'password' => 'secure-pass-123',
            'store_name' => 'Duplicate Store',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_user_can_login_and_receive_api_token_with_tenant_context(): void
    {
        $user = User::factory()->create([
            'email' => 'seller@bisora.my',
            'password' => Hash::make('secret-pass'),
        ]);
        $tenant = Tenant::create([
            'name' => 'Seller Store',
            'slug' => 'seller-store',
            'plan' => 'premium',
            'billing_status' => 'trial',
            'access_status' => 'active',
        ]);
        $tenant->users()->attach($user, ['role' => 'owner']);

        $this->postJson('/api/auth/login', [
            'email' => 'seller@bisora.my',
            'password' => 'secret-pass',
        ])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'email'], 'tenants' => [['id', 'slug', 'role']]])
            ->assertJsonPath('user.email', 'seller@bisora.my')
            ->assertJsonPath('tenants.0.slug', 'seller-store')
            ->assertJsonPath('tenants.0.role', 'owner');
    }

    public function test_platform_owner_login_receives_every_tenant_context(): void
    {
        $owner = User::factory()->create([
            'email' => config('bisora.owner_email'),
            'password' => Hash::make('Kimiey12.'),
        ]);
        $attachedTenant = Tenant::create([
            'name' => 'Owner Store',
            'slug' => 'owner-store',
            'plan' => 'premium',
            'billing_status' => 'paid',
            'access_status' => 'active',
        ]);
        $unattachedTenant = Tenant::create([
            'name' => 'Customer Store',
            'slug' => 'customer-store',
            'plan' => 'Free Trial',
            'billing_status' => 'trial',
            'access_status' => 'suspended',
        ]);
        $attachedTenant->users()->attach($owner, ['role' => 'owner']);

        $this->postJson('/api/auth/login', [
            'email' => config('bisora.owner_email'),
            'password' => 'Kimiey12.',
        ])
            ->assertOk()
            ->assertJsonPath('user.is_platform_owner', true)
            ->assertJsonPath('tenants.0.slug', 'customer-store')
            ->assertJsonPath('tenants.0.role', 'platform_owner')
            ->assertJsonPath('tenants.1.slug', 'owner-store')
            ->assertJsonPath('tenants.1.role', 'platform_owner');
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'seller@bisora.my',
            'password' => Hash::make('secret-pass'),
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'seller@bisora.my',
            'password' => 'wrong-pass',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_user_can_logout_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/auth/logout')
            ->assertNoContent();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
