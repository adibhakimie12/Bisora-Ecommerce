<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_reports_runtime_dependencies(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('checks.database.status', 'ok')
            ->assertJsonPath('checks.queue.connection', config('queue.default'))
            ->assertJsonPath('checks.storage.disk', config('filesystems.default'))
            ->assertJsonStructure([
                'status',
                'app' => ['name', 'env', 'debug'],
                'checks' => [
                    'database' => ['status'],
                    'queue' => ['status', 'connection'],
                    'storage' => ['status', 'disk'],
                ],
            ]);
    }

    public function test_local_dashboard_origin_is_allowed_by_cors(): void
    {
        $this->withHeader('Origin', 'http://127.0.0.1:3000')
            ->getJson('/api/health')
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
    }
}
