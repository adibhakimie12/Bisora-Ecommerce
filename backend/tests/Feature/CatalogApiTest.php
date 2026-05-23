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
            ->assertJsonPath('data.0.name', 'Abaya');
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
                'tags' => ['modal', 'premium'],
                'variants' => [['name' => 'Rose', 'stock' => 4]],
                'seo_title' => 'Premium Modal Hijab',
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Premium Modal Hijab')
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
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Premium Modal Hijab Updated')
            ->assertJsonPath('data.price', 13900);

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->deleteJson("/api/products/{$productId}")
            ->assertNoContent();

        $this->assertDatabaseMissing('products', ['id' => $productId]);
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
