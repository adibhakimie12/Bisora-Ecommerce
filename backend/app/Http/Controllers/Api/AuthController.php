<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function trial(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'store_name' => ['required', 'string', 'max:120'],
        ]);

        [$user, $tenant] = DB::transaction(function () use ($payload): array {
            $user = User::create([
                'name' => $payload['name'],
                'email' => Str::lower($payload['email']),
                'password' => $payload['password'],
            ]);

            $slug = $this->uniqueTenantSlug($payload['store_name']);
            $tenant = Tenant::create([
                'name' => $payload['store_name'],
                'slug' => $slug,
                'plan' => config('bisora.default_plan'),
                'billing_status' => 'trial',
                'access_status' => 'active',
                'trial_ends_at' => now()->addDays((int) config('bisora.trial_days', 14)),
                'owner_name' => $payload['name'],
                'owner_email' => Str::lower($payload['email']),
                'monthly_fee' => 0,
                'days_overdue' => 0,
                'free_access' => false,
            ]);

            $tenant->users()->attach($user, ['role' => 'owner']);

            Store::create([
                'tenant_id' => $tenant->id,
                'name' => $payload['store_name'],
                'slug' => $slug,
                'managed_domain' => $slug . '.bisora.app',
                'currency' => 'MYR',
                'timezone' => 'Asia/Kuala_Lumpur',
                'settings' => [
                    'contact_email' => Str::lower($payload['email']),
                    'onboarding' => [
                        'trial_started_at' => now()->toISOString(),
                        'checklist' => [
                            'add_first_product' => false,
                            'connect_payment' => false,
                            'configure_shipping' => false,
                            'publish_storefront' => false,
                        ],
                    ],
                    'storage' => [
                        'public_bucket' => config('bisora.storage.public_bucket'),
                        'private_bucket' => config('bisora.storage.private_bucket'),
                        'max_upload_mb' => config('bisora.storage.max_upload_mb'),
                    ],
                ],
            ]);

            return [$user, $tenant];
        });

        $token = $user->createToken('bisora-admin')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_platform_owner' => false,
            ],
            'tenants' => [[
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'plan' => $tenant->plan,
                'billing_status' => $tenant->billing_status,
                'access_status' => $tenant->access_status,
                'role' => 'owner',
            ]],
        ], Response::HTTP_CREATED);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('email', $credentials['email'])
            ->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('bisora-admin')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_platform_owner' => $user->isPlatformOwner(),
            ],
            'tenants' => $user->sessionTenants(),
        ]);
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->noContent();
    }

    private function uniqueTenantSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'store';
        $slug = $base;
        $counter = 2;

        while (Tenant::query()->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}
