<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $database = ['status' => 'ok'];
        $status = 'ok';

        try {
            DB::select('select 1');
        } catch (Throwable $exception) {
            $status = 'degraded';
            $database = [
                'status' => 'error',
                'message' => $exception->getMessage(),
            ];
        }

        return response()->json([
            'status' => $status,
            'app' => [
                'name' => config('app.name'),
                'env' => app()->environment(),
                'debug' => (bool) config('app.debug'),
            ],
            'checks' => [
                'database' => $database,
                'queue' => [
                    'status' => 'configured',
                    'connection' => config('queue.default'),
                ],
                'storage' => [
                    'status' => 'configured',
                    'disk' => config('filesystems.default'),
                ],
            ],
        ], $status === 'ok' ? 200 : 503);
    }
}
