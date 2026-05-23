<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
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
            'tenants' => $user->tenants()
                ->select('tenants.id', 'tenants.name', 'tenants.slug', 'tenants.plan', 'tenants.access_status')
                ->orderBy('tenants.name')
                ->get()
                ->map(fn ($tenant): array => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'plan' => $tenant->plan,
                    'access_status' => $tenant->access_status,
                    'role' => $tenant->pivot->role,
                ]),
        ]);
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->noContent();
    }
}
