<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

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
