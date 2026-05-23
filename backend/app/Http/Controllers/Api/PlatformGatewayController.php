<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlatformGatewayConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlatformGatewayController extends Controller
{
    private const PROVIDERS = [
        'billplz' => 'Billplz',
        'securepay' => 'SecurePay',
        'toyyibpay' => 'ToyyibPay',
        'stripe' => 'Stripe',
    ];

    public function index(): JsonResponse
    {
        $configs = PlatformGatewayConfig::query()->get()->keyBy(
            fn (PlatformGatewayConfig $config): string => strtolower($config->provider)
        );

        return response()->json([
            'data' => collect(self::PROVIDERS)
                ->map(fn (string $label, string $slug): array => $this->payload(
                    $configs->get(strtolower($label)) ?? new PlatformGatewayConfig([
                        'provider' => $label,
                        'mode' => 'Test',
                        'enabled' => false,
                    ]),
                    $slug
                ))
                ->values(),
        ]);
    }

    public function update(Request $request, string $provider): JsonResponse
    {
        abort_unless(array_key_exists(strtolower($provider), self::PROVIDERS), 404);

        $data = $request->validate([
            'mode' => ['sometimes', Rule::in(['Test', 'Live'])],
            'enabled' => ['sometimes', 'boolean'],
            'merchant_id' => ['nullable', 'string', 'max:180'],
            'api_key' => ['nullable', 'string', 'max:500'],
            'secret_key' => ['nullable', 'string', 'max:500'],
            'webhook_url' => ['nullable', 'url', 'max:500'],
        ]);
        $label = self::PROVIDERS[strtolower($provider)];
        $config = PlatformGatewayConfig::firstOrNew(['provider' => $label]);
        $config->fill($data);
        $config->provider = $label;
        $config->save();

        return response()->json(['data' => $this->payload($config, strtolower($provider))]);
    }

    private function payload(PlatformGatewayConfig $config, string $slug): array
    {
        return [
            'id' => $slug,
            'provider' => $config->provider,
            'mode' => $config->mode,
            'enabled' => $config->enabled,
            'merchant_id' => $config->merchant_id,
            'api_key' => $config->api_key ? 'configured' : null,
            'secret_key' => $config->secret_key ? 'configured' : null,
            'webhook_url' => $config->webhook_url,
        ];
    }
}
