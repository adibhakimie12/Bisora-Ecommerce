<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\Tenant;
use App\Models\User;
use App\Models\CustomerProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarketingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_user_can_read_marketing_workspace_from_store_settings(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'marketing' => [
                    'discounts' => [
                        ['id' => 'disc-1', 'code' => 'FIRST20', 'status' => 'Active'],
                    ],
                    'broadcasts' => [
                        ['id' => 'bc-1', 'name' => 'Launch Campaign', 'status' => 'Draft'],
                    ],
                ],
            ],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/marketing')
            ->assertOk()
            ->assertJsonPath('data.discounts.0.code', 'FIRST20')
            ->assertJsonPath('data.broadcasts.0.name', 'Launch Campaign')
            ->assertJsonPath('data.upsells', [])
            ->assertJsonPath('data.recovery', [])
            ->assertJsonPath('data.automation_rules', []);
    }

    public function test_tenant_user_can_persist_marketing_collections(): void
    {
        [$user, $tenant] = $this->createTenantUser();

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson('/api/marketing/discounts', [
                'items' => [
                    ['id' => 'disc-new', 'code' => 'RAYA25', 'status' => 'Scheduled'],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.discounts.0.code', 'RAYA25');

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson('/api/marketing/automation-rules', [
                'items' => [
                    ['id' => 'rule-1', 'name' => 'VIP Upsell', 'status' => 'Active'],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.automation_rules.0.name', 'VIP Upsell');

        $this->assertDatabaseHas('stores', [
            'tenant_id' => $tenant->id,
            'slug' => 'demo-store',
        ]);

        $settings = Store::query()->where('tenant_id', $tenant->id)->firstOrFail()->settings;
        $this->assertSame('RAYA25', $settings['marketing']['discounts'][0]['code']);
        $this->assertSame('VIP Upsell', $settings['marketing']['automation_rules'][0]['name']);
    }

    public function test_marketing_workspace_is_tenant_isolated(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $otherTenant = Tenant::create(['name' => 'Other Store', 'slug' => 'other-store']);
        Store::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Other Store',
            'slug' => 'other-store',
            'settings' => [
                'marketing' => [
                    'discounts' => [
                        ['id' => 'hidden', 'code' => 'HIDDEN'],
                    ],
                ],
            ],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/marketing')
            ->assertOk()
            ->assertJsonPath('data.discounts', []);
    }

    public function test_tenant_user_can_queue_broadcast_notifications_to_customers(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        CustomerProfile::create([
            'tenant_id' => $tenant->id,
            'name' => 'VIP Buyer',
            'email' => 'vip@example.test',
            'status' => 'active',
        ]);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'marketing' => [
                    'broadcasts' => [
                        [
                            'id' => 'bc-1',
                            'name' => 'VIP Launch',
                            'channel' => 'Email',
                            'audience' => 'All Customers',
                            'status' => 'Draft',
                        ],
                    ],
                ],
            ],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/marketing/broadcasts/bc-1/queue')
            ->assertOk()
            ->assertJsonPath('queued', 1);

        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'marketing_broadcast',
            'channel' => 'email',
            'recipient' => 'vip@example.test',
            'subject' => 'VIP Launch',
            'status' => 'queued',
        ]);
    }

    public function test_basic_plan_cannot_queue_whatsapp_broadcast(): void
    {
        [$user, $tenant] = $this->createTenantUser(plan: 'Basic');
        CustomerProfile::create([
            'tenant_id' => $tenant->id,
            'name' => 'VIP Buyer',
            'email' => 'vip@example.test',
            'status' => 'active',
        ]);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'notifications' => ['providers' => ['whatsapp' => ['enabled' => true, 'connected' => true]]],
                'marketing' => [
                    'broadcasts' => [
                        ['id' => 'bc-wa', 'name' => 'WhatsApp Blast', 'channel' => 'WhatsApp', 'status' => 'Draft'],
                    ],
                ],
            ],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/marketing/broadcasts/bc-wa/queue')
            ->assertStatus(422)
            ->assertJsonPath('message', 'WhatsApp marketing is not included in Basic package.');
    }

    public function test_standard_plan_needs_connected_whatsapp_provider_before_queueing(): void
    {
        [$user, $tenant] = $this->createTenantUser(plan: 'Standard');
        CustomerProfile::create([
            'tenant_id' => $tenant->id,
            'name' => 'VIP Buyer',
            'email' => 'vip@example.test',
            'status' => 'active',
        ]);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'notifications' => ['providers' => ['whatsapp' => ['enabled' => false, 'connected' => false]]],
                'marketing' => [
                    'broadcasts' => [
                        ['id' => 'bc-wa', 'name' => 'WhatsApp Blast', 'channel' => 'WhatsApp', 'status' => 'Draft'],
                    ],
                ],
            ],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/marketing/broadcasts/bc-wa/queue')
            ->assertStatus(422)
            ->assertJsonPath('message', 'WhatsApp provider is not connected.');
    }

    public function test_standard_plan_can_queue_whatsapp_when_provider_is_connected(): void
    {
        [$user, $tenant] = $this->createTenantUser(plan: 'Standard');
        CustomerProfile::create([
            'tenant_id' => $tenant->id,
            'name' => 'VIP Buyer',
            'email' => 'vip@example.test',
            'status' => 'active',
        ]);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'notifications' => ['providers' => ['whatsapp' => ['enabled' => true, 'connected' => true]]],
                'marketing' => [
                    'broadcasts' => [
                        ['id' => 'bc-wa', 'name' => 'WhatsApp Blast', 'channel' => 'WhatsApp', 'status' => 'Draft'],
                    ],
                ],
            ],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/marketing/broadcasts/bc-wa/queue')
            ->assertOk()
            ->assertJsonPath('queued', 1);

        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'marketing_broadcast',
            'channel' => 'whatsapp',
            'recipient' => 'vip@example.test',
        ]);
    }

    public function test_tenant_user_can_queue_recovery_reminder(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'marketing' => [
                    'recovery' => [
                        [
                            'id' => 'CHK-100',
                            'customer' => 'Cart Buyer',
                            'email' => 'cart@example.test',
                            'cartValue' => 250,
                            'status' => 'Pending',
                        ],
                    ],
                ],
            ],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/marketing/recovery/CHK-100/remind')
            ->assertOk()
            ->assertJsonPath('data.recovery.0.status', 'Contacted');

        $this->assertDatabaseHas('notification_logs', [
            'tenant_id' => $tenant->id,
            'event' => 'cart_recovery',
            'channel' => 'email',
            'recipient' => 'cart@example.test',
            'subject' => 'Complete your checkout',
            'status' => 'queued',
        ]);
    }

    private function createTenantUser(string $plan = 'premium'): array
    {
        $user = User::factory()->create();
        $tenant = Tenant::create(['name' => 'Demo Store', 'slug' => 'demo-store', 'plan' => $plan]);
        $tenant->users()->attach($user, ['role' => 'owner']);

        return [$user, $tenant];
    }
}
