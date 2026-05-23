<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MediaApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_media_presign_validates_file_rules_and_returns_upload_intent(): void
    {
        [$user, $tenant] = $this->createTenantUser();

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/media/presign', [
                'filename' => 'hero.jpg',
                'mime_type' => 'image/jpeg',
                'size_bytes' => 512000,
                'owner_type' => 'product',
                'owner_id' => 123,
                'visibility' => 'public',
            ])
            ->assertCreated()
            ->assertJsonPath('data.bucket', 'public-storefront-media')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonStructure(['data' => ['id', 'object_key', 'upload_url', 'headers']]);
    }

    public function test_media_presign_rejects_oversized_uploads(): void
    {
        [$user, $tenant] = $this->createTenantUser();

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/media/presign', [
                'filename' => 'huge.png',
                'mime_type' => 'image/png',
                'size_bytes' => 25 * 1024 * 1024,
                'owner_type' => 'product',
                'owner_id' => 123,
                'visibility' => 'public',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('size_bytes');
    }

    public function test_media_complete_marks_asset_ready_and_returns_public_url(): void
    {
        [$user, $tenant] = $this->createTenantUser();

        $presign = $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/media/presign', [
                'filename' => 'hero.jpg',
                'mime_type' => 'image/jpeg',
                'size_bytes' => 512000,
                'owner_type' => 'product',
                'owner_id' => 123,
                'visibility' => 'public',
            ]);

        $assetId = $presign->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->withHeader('X-Tenant-Id', (string) $tenant->id)
            ->postJson('/api/media/complete', [
                'media_asset_id' => $assetId,
                'checksum' => 'sha256-demo',
                'width' => 1200,
                'height' => 800,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonPath('data.public_url', fn (?string $url) => str_contains($url ?? '', 'hero.jpg'));
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
