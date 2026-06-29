<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_routes_require_tenant_header(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/products')
            ->assertStatus(400)
            ->assertJsonPath('message', 'Missing X-Tenant-Id header.');
    }

    public function test_catalog_routes_reject_tenants_the_user_cannot_access(): void
    {
        $user = User::factory()->create();
        $tenant = Tenant::create([
            'name' => 'Other Store',
            'slug' => 'other-store',
            'plan' => 'premium',
            'billing_status' => 'trial',
            'access_status' => 'active',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/products')
            ->assertForbidden();
    }

    public function test_platform_owner_can_access_any_tenant_for_support(): void
    {
        $owner = User::factory()->create([
            'email' => config('bisora.owner_email'),
        ]);
        $tenant = Tenant::create([
            'name' => 'Support Store',
            'slug' => 'support-store',
            'plan' => 'Free Trial',
            'billing_status' => 'trial',
            'access_status' => 'suspended',
            'trial_ends_at' => now()->subDay(),
            'free_access' => false,
        ]);

        $this->actingAs($owner, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/products')
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    public function test_tenant_routes_reject_suspended_tenants(): void
    {
        $user = User::factory()->create();
        $tenant = Tenant::create([
            'name' => 'Suspended Store',
            'slug' => 'suspended-store',
            'access_status' => 'suspended',
        ]);
        $tenant->users()->attach($user, ['role' => 'owner']);

        $this->actingAs($user)
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/categories')
            ->assertForbidden()
            ->assertJsonPath('message', 'Tenant access is suspended.');
    }

    public function test_tenant_routes_reject_expired_trials_without_free_access(): void
    {
        $user = User::factory()->create();
        $tenant = Tenant::create([
            'name' => 'Expired Trial',
            'slug' => 'expired-trial',
            'billing_status' => 'trial',
            'access_status' => 'active',
            'trial_ends_at' => now()->subDay(),
            'free_access' => false,
        ]);
        $tenant->users()->attach($user, ['role' => 'owner']);

        $this->actingAs($user)
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/categories')
            ->assertStatus(402)
            ->assertJsonPath('message', 'Trial has expired.');
    }

    public function test_it_creates_and_lists_categories_for_the_active_tenant(): void
    {
        [$user, $tenant] = $this->createTenantUser();

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/categories', [
                'name' => 'Abaya',
                'slug' => 'abaya',
                'status' => 'published',
                'seo_title' => 'Premium Abaya',
            ])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'abaya');

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson('/api/categories')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Abaya')
            ->assertJsonPath('data.0.product_ids', []);
    }

    public function test_tenant_user_can_update_and_delete_category_inside_active_tenant(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $category = Category::create([
            'tenant_id' => $tenant->id,
            'name' => 'Old Collection',
            'slug' => 'old-collection',
            'status' => 'published',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson("/api/categories/{$category->id}", [
                'name' => 'Updated Collection',
                'slug' => 'updated-collection',
                'description' => 'Updated merchandising collection.',
                'status' => 'hidden',
                'seo_title' => 'Updated Collection SEO',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Collection')
            ->assertJsonPath('data.slug', 'updated-collection')
            ->assertJsonPath('data.status', 'hidden');

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->deleteJson("/api/categories/{$category->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_tenant_user_cannot_mutate_another_tenants_category(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $otherTenant = Tenant::create([
            'name' => 'Other Catalog',
            'slug' => 'other-catalog',
            'plan' => 'premium',
            'billing_status' => 'trial',
            'access_status' => 'active',
        ]);
        $category = Category::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Hidden Collection',
            'slug' => 'hidden-collection',
            'status' => 'published',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson("/api/categories/{$category->id}", [
                'name' => 'Blocked Collection',
                'slug' => 'blocked-collection',
                'status' => 'hidden',
            ])
            ->assertNotFound();
    }

    public function test_it_creates_updates_and_deletes_products_inside_the_active_tenant(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $category = Category::create([
            'tenant_id' => $tenant->id,
            'name' => 'Hijab',
            'slug' => 'hijab',
            'status' => 'published',
        ]);

        $createResponse = $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/products', [
                'category_id' => $category->id,
                'title' => 'Premium Modal Hijab',
                'slug' => 'premium-modal-hijab',
                'sku' => 'HIJAB-MODAL-001',
                'price' => 12900,
                'stock' => 14,
                'status' => 'active',
                'thumbnail_url' => 'https://example.test/main.jpg',
                'image_urls' => ['https://example.test/main.jpg', 'https://example.test/side.jpg'],
                'tags' => ['modal', 'premium'],
                'variants' => [['name' => 'Rose', 'stock' => 4]],
                'seo_title' => 'Premium Modal Hijab',
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Premium Modal Hijab')
            ->assertJsonPath('data.image_urls.1', 'https://example.test/side.jpg')
            ->assertJsonPath('data.category.slug', 'hijab');

        $productId = $createResponse->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->patchJson("/api/products/{$productId}", [
                'category_id' => $category->id,
                'title' => 'Premium Modal Hijab Updated',
                'slug' => 'premium-modal-hijab',
                'sku' => 'HIJAB-MODAL-001',
                'price' => 13900,
                'stock' => 10,
                'status' => 'active',
                'image_urls' => ['https://example.test/updated.jpg'],
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Premium Modal Hijab Updated')
            ->assertJsonPath('data.image_urls.0', 'https://example.test/updated.jpg')
            ->assertJsonPath('data.price', 13900);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->deleteJson("/api/products/{$productId}")
            ->assertNoContent();

        $this->assertDatabaseMissing('products', ['id' => $productId]);
    }

    public function test_product_create_respects_tenant_plan_product_limit(): void
    {
        $user = User::factory()->create();
        $tenant = Tenant::create([
            'name' => 'Trial Store',
            'slug' => 'trial-store',
            'plan' => 'Free Trial',
            'billing_status' => 'trial',
            'access_status' => 'active',
        ]);
        $tenant->users()->attach($user, ['role' => 'owner']);

        foreach (range(1, 15) as $index) {
            Product::create([
                'tenant_id' => $tenant->id,
                'title' => "Trial Product {$index}",
                'slug' => "trial-product-{$index}",
                'sku' => "TRIAL-{$index}",
                'price' => 1000,
                'status' => 'active',
            ]);
        }

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/products', [
                'title' => 'Blocked Trial Product',
                'slug' => 'blocked-trial-product',
                'sku' => 'TRIAL-16',
                'price' => 1000,
                'status' => 'active',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Free Trial product limit reached. Upgrade package to add more products.')
            ->assertJsonPath('limit.plan', 'Free Trial')
            ->assertJsonPath('limit.resource', 'products')
            ->assertJsonPath('limit.max', 15)
            ->assertJsonPath('limit.used', 15);
    }

    public function test_platform_owner_can_bypass_tenant_product_limit(): void
    {
        $owner = User::factory()->create([
            'email' => config('bisora.owner_email'),
        ]);
        $tenant = Tenant::create([
            'name' => 'Owner Support Store',
            'slug' => 'owner-support-store',
            'plan' => 'Free Trial',
            'billing_status' => 'trial',
            'access_status' => 'active',
        ]);

        foreach (range(1, 15) as $index) {
            Product::create([
                'tenant_id' => $tenant->id,
                'title' => "Owner Trial Product {$index}",
                'slug' => "owner-trial-product-{$index}",
                'sku' => "OWNER-TRIAL-{$index}",
                'price' => 1000,
                'status' => 'active',
            ]);
        }

        $this->actingAs($owner, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/products', [
                'title' => 'Owner Allowed Product',
                'slug' => 'owner-allowed-product',
                'sku' => 'OWNER-TRIAL-16',
                'price' => 1000,
                'status' => 'active',
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Owner Allowed Product');
    }

    public function test_unknown_or_custom_plan_uses_premium_product_limit(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $tenant->update(['plan' => 'Growth']);

        foreach (range(1, 15) as $index) {
            Product::create([
                'tenant_id' => $tenant->id,
                'title' => "Growth Product {$index}",
                'slug' => "growth-product-{$index}",
                'sku' => "GROWTH-{$index}",
                'price' => 1000,
                'status' => 'active',
            ]);
        }

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/products', [
                'title' => 'Allowed Growth Product',
                'slug' => 'allowed-growth-product',
                'sku' => 'GROWTH-16',
                'price' => 1000,
                'status' => 'active',
            ])
            ->assertCreated();
    }

    public function test_it_does_not_expose_products_from_another_tenant(): void
    {
        [$user, $tenant] = $this->createTenantUser();
        $otherTenant = Tenant::create([
            'name' => 'Hidden Store',
            'slug' => 'hidden-store',
            'plan' => 'premium',
            'billing_status' => 'trial',
            'access_status' => 'active',
        ]);
        $otherProduct = Product::create([
            'tenant_id' => $otherTenant->id,
            'title' => 'Hidden Product',
            'slug' => 'hidden-product',
            'sku' => 'HIDDEN-001',
            'price' => 1000,
            'status' => 'active',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->getJson("/api/products/{$otherProduct->id}")
            ->assertNotFound();
    }

    private function createTenantUser(): array
    {
        $user = User::factory()->create();
        $tenant = Tenant::create([
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'plan' => 'premium',
            'billing_status' => 'trial',
            'access_status' => 'active',
        ]);
        $tenant->users()->attach($user, ['role' => 'owner']);

        return [$user, $tenant];
    }
}
