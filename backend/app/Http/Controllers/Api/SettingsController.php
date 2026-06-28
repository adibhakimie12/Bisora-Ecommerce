<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->payload($this->store($request))]);
    }

    public function update(Request $request): JsonResponse
    {
        $store = $this->store($request);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:160'],
            'slug' => ['sometimes', 'string', 'max:160', 'alpha_dash:ascii'],
            'managed_domain' => ['nullable', 'string', 'max:255'],
            'custom_domain' => ['nullable', 'string', 'max:255'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'timezone' => ['sometimes', 'string', 'max:80'],
            'settings' => ['sometimes', 'array'],
        ]);

        if (array_key_exists('settings', $data)) {
            $data['settings'] = $this->mergeSettings($store->settings ?? [], $data['settings']);
        }

        $store->update($data);

        return response()->json(['data' => $this->payload($store->fresh())]);
    }

    public function publish(Request $request): JsonResponse
    {
        $store = $this->store($request);
        $settings = $store->settings ?? [];
        $domain = $store->custom_domain ?: $store->managed_domain ?: "{$store->slug}.bisora.app";
        $settings['storefront'] = [
            ...($settings['storefront'] ?? []),
            'status' => 'live',
            'published_at' => now()->toISOString(),
            'published_url' => str_starts_with($domain, 'http') ? $domain : "https://{$domain}",
        ];

        $store->update(['settings' => $settings]);

        return response()->json(['data' => $this->payload($store->fresh())]);
    }

    public function unpublish(Request $request): JsonResponse
    {
        $store = $this->store($request);
        $settings = $store->settings ?? [];
        $settings['storefront'] = [
            ...($settings['storefront'] ?? []),
            'status' => 'draft',
            'unpublished_at' => now()->toISOString(),
        ];

        $store->update(['settings' => $settings]);

        return response()->json(['data' => $this->payload($store->fresh())]);
    }

    private function store(Request $request): Store
    {
        $tenant = $request->attributes->get('tenant');

        return Store::firstOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'managed_domain' => "{$tenant->slug}.bisora.app",
                'currency' => 'MYR',
                'timezone' => 'Asia/Kuala_Lumpur',
                'settings' => [
                    'contact_email' => $tenant->owner_email,
                    'payments' => ['gateways' => [], 'manual_methods' => []],
                    'shipping' => ['zones' => [], 'providers' => []],
                    'storefront' => ['status' => 'draft'],
                    'storage' => [
                        'public_bucket' => config('bisora.storage.public_bucket'),
                        'private_bucket' => config('bisora.storage.private_bucket'),
                        'max_upload_mb' => config('bisora.storage.max_upload_mb'),
                    ],
                ],
            ]
        );
    }

    private function payload(Store $store): array
    {
        return [
            'id' => $store->id,
            'tenant_id' => $store->tenant_id,
            'name' => $store->name,
            'slug' => $store->slug,
            'managed_domain' => $store->managed_domain,
            'custom_domain' => $store->custom_domain,
            'currency' => $store->currency,
            'timezone' => $store->timezone,
            'settings' => $store->settings ?? [],
        ];
    }

    private function mergeSettings(array $existing, array $patch): array
    {
        foreach ($patch as $key => $value) {
            if (
                is_array($value)
                && array_key_exists($key, $existing)
                && is_array($existing[$key])
                && !array_is_list($value)
                && !array_is_list($existing[$key])
            ) {
                $existing[$key] = $this->mergeSettings($existing[$key], $value);
                continue;
            }

            $existing[$key] = $value;
        }

        return $existing;
    }
}
