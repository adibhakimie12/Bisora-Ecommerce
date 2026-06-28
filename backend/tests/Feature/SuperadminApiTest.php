<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperadminApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_owner_can_view_overview_and_tenants(): void
    {
        $owner = User::factory()->create(['email' => 'adib.hakimi19@gmail.com']);
        Tenant::create([
            'name' => 'Sarah Beauty',
            'slug' => 'sarah-beauty',
            'plan' => 'pro',
            'billing_status' => 'paid',
            'access_status' => 'active',
            'owner_name' => 'Sarah Admin',
            'owner_email' => 'sarah@example.test',
            'monthly_fee' => 12900,
        ]);

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/superadmin/overview')
            ->assertOk()
            ->assertJsonPath('data.total_tenants', 1)
            ->assertJsonPath('data.active_tenants', 1)
            ->assertJsonPath('data.monthly_recurring_revenue', 12900);

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/superadmin/tenants')
            ->assertOk()
            ->assertJsonPath('data.0.brand_name', 'Sarah Beauty')
            ->assertJsonPath('data.0.owner_email', 'sarah@example.test')
            ->assertJsonPath('data.0.package_name', 'pro');
    }

    public function test_non_platform_owner_cannot_use_superadmin_api(): void
    {
        $seller = User::factory()->create(['email' => 'seller@bisora.my']);

        $this->actingAs($seller, 'sanctum')
            ->getJson('/api/superadmin/tenants')
            ->assertForbidden();
    }

    public function test_platform_owner_can_update_tenant_access_and_grant_free_access(): void
    {
        $owner = User::factory()->create(['email' => 'adib.hakimi19@gmail.com']);
        $tenant = Tenant::create([
            'name' => 'Bisora Demo',
            'slug' => 'bisora-demo',
            'plan' => 'starter',
            'billing_status' => 'overdue',
            'access_status' => 'suspended',
        ]);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/superadmin/tenants/{$tenant->id}/access", [
                'access_status' => 'active',
                'billing_status' => 'paid',
            ])
            ->assertOk()
            ->assertJsonPath('data.access_status', 'active')
            ->assertJsonPath('data.billing_status', 'paid');

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/superadmin/tenants/{$tenant->id}/free-access", [
                'owner_email' => 'founder@example.test',
                'package_name' => 'enterprise',
                'monthly_fee' => 0,
            ])
            ->assertOk()
            ->assertJsonPath('data.free_access', true)
            ->assertJsonPath('data.owner_email', 'founder@example.test')
            ->assertJsonPath('data.package_name', 'enterprise');
    }

    public function test_platform_owner_can_manage_subscription_packages(): void
    {
        $owner = User::factory()->create(['email' => 'adib.hakimi19@gmail.com']);

        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/superadmin/packages', [
                'name' => 'Growth',
                'monthly_fee' => 9900,
                'discount_percent' => 10,
                'features' => ['Custom domain', 'Automation queue'],
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Growth')
            ->assertJsonPath('data.features.1', 'Automation queue');

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/superadmin/packages')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Growth');
    }

    public function test_platform_owner_can_update_gateway_without_exposing_secrets(): void
    {
        $owner = User::factory()->create(['email' => 'adib.hakimi19@gmail.com']);

        $this->actingAs($owner, 'sanctum')
            ->patchJson('/api/superadmin/gateways/billplz', [
                'mode' => 'Live',
                'enabled' => true,
                'merchant_id' => 'BISORA-MERCHANT',
                'api_key' => 'secret-api-key',
                'secret_key' => 'secret-webhook-key',
                'webhook_url' => 'https://bisora.test/webhooks/billplz',
            ])
            ->assertOk()
            ->assertJsonPath('data.provider', 'Billplz')
            ->assertJsonPath('data.mode', 'Live')
            ->assertJsonPath('data.enabled', true)
            ->assertJsonPath('data.api_key', 'configured')
            ->assertJsonPath('data.secret_key', 'configured');
    }
}
