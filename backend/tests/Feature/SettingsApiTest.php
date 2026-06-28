<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_user_can_read_store_settings(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Bisora Demo Store',
            'slug' => 'bisora-demo',
            'managed_domain' => 'bisora-demo.bisora.app',
            'custom_domain' => 'shop.example.test',
            'currency' => 'MYR',
            'timezone' => 'Asia/Kuala_Lumpur',
            'settings' => [
                'contact_email' => 'hello@example.test',
                'payments' => ['gateways' => [['slug' => 'stripe', 'enabled' => true]]],
                'shipping' => ['zones' => [['name' => 'Semenanjung']]],
            ],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/settings/store')
            ->assertOk()
            ->assertJsonPath('data.name', 'Bisora Demo Store')
            ->assertJsonPath('data.custom_domain', 'shop.example.test')
            ->assertJsonPath('data.settings.contact_email', 'hello@example.test');
    }

    public function test_tenant_user_can_update_store_profile_domains_and_settings_payloads(): void
    {
        [$user, $tenant] = $this->createTenantUser();

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson('/api/settings/store', [
                'name' => 'Updated Store',
                'slug' => 'updated-store',
                'managed_domain' => 'updated-store.bisora.app',
                'custom_domain' => 'shop.updated.test',
                'currency' => 'MYR',
                'timezone' => 'Asia/Kuala_Lumpur',
                'settings' => [
                    'contact_email' => 'support@updated.test',
                    'payments' => [
                        'manual_methods' => [
                            ['slug' => 'cod', 'enabled' => true],
                        ],
                    ],
                    'shipping' => [
                        'providers' => [
                            ['slug' => 'easyparcel', 'enabled' => true],
                        ],
                    ],
                    'storage' => [
                        'public_bucket' => 'public-storefront-media',
                        'max_upload_mb' => 20,
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Store')
            ->assertJsonPath('data.settings.payments.manual_methods.0.slug', 'cod')
            ->assertJsonPath('data.settings.shipping.providers.0.enabled', true)
            ->assertJsonPath('data.settings.storage.max_upload_mb', 20);

        $this->assertDatabaseHas('stores', [
            'tenant_id' => $tenant->id,
            'slug' => 'updated-store',
            'custom_domain' => 'shop.updated.test',
        ]);
    }

    public function test_settings_update_deep_merges_nested_payloads(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'notifications' => [
                    'providers' => [
                        'email' => ['enabled' => true, 'connected' => true, 'sender' => 'seller@example.test'],
                    ],
                    'channel_defaults' => [
                        'email' => ['enabled' => true, 'sender_label' => 'Demo Store'],
                    ],
                ],
                'payments' => [
                    'gateways' => [
                        ['slug' => 'stripe', 'enabled' => true],
                    ],
                ],
            ],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson('/api/settings/store', [
                'settings' => [
                    'notifications' => [
                        'providers' => [
                            'whatsapp' => ['enabled' => true, 'connected' => true, 'sender' => 'Bisora WA'],
                        ],
                        'channel_defaults' => [
                            'whatsapp' => ['enabled' => true, 'sender_label' => 'Bisora WA'],
                        ],
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.settings.notifications.providers.email.connected', true)
            ->assertJsonPath('data.settings.notifications.providers.whatsapp.connected', true)
            ->assertJsonPath('data.settings.notifications.channel_defaults.email.sender_label', 'Demo Store')
            ->assertJsonPath('data.settings.notifications.channel_defaults.whatsapp.sender_label', 'Bisora WA')
            ->assertJsonPath('data.settings.payments.gateways.0.slug', 'stripe');
    }

    public function test_tenant_settings_are_isolated(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $otherTenant = Tenant::create(['name' => 'Other Store', 'slug' => 'other-store']);
        Store::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Other Store',
            'slug' => 'other-store',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/settings/store')
            ->assertOk()
            ->assertJsonPath('data.tenant_id', $tenant->id);
    }

    public function test_tenant_user_can_publish_and_unpublish_storefront(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'managed_domain' => 'demo-store.bisora.app',
            'settings' => ['storefront' => ['status' => 'draft']],
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/settings/store/publish')
            ->assertOk()
            ->assertJsonPath('data.settings.storefront.status', 'live')
            ->assertJsonPath('data.settings.storefront.published_url', 'https://demo-store.bisora.app');

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/settings/store/unpublish')
            ->assertOk()
            ->assertJsonPath('data.settings.storefront.status', 'draft');
    }

    private function createTenantUser(): array
    {
        $user = User::factory()->create();
        $tenant = Tenant::create(['name' => 'Demo Store', 'slug' => 'demo-store']);
        $tenant->users()->attach($user, ['role' => 'owner']);

        return [$user, $tenant];
    }
}
