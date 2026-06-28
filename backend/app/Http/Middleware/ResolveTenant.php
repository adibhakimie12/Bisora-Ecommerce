<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $request->header('X-Tenant-Id');

        if (! $tenantId) {
            return response()->json(['message' => 'Missing X-Tenant-Id header.'], 400);
        }

        $user = $request->user();
        $tenant = $user->isPlatformOwner()
            ? Tenant::query()->whereKey($tenantId)->first()
            : $user->tenants()->whereKey($tenantId)->first();

        if (! $tenant) {
            return response()->json(['message' => 'Tenant access denied.'], 403);
        }

        if ($user->isPlatformOwner()) {
            $request->attributes->set('tenant', $tenant);

            return $next($request);
        }

        if ($tenant->access_status !== 'active') {
            return response()->json(['message' => 'Tenant access is suspended.'], 403);
        }

        if (
            $tenant->billing_status === 'trial'
            && ! $tenant->free_access
            && $tenant->trial_ends_at
            && $tenant->trial_ends_at->isPast()
        ) {
            return response()->json(['message' => 'Trial has expired.'], 402);
        }

        $request->attributes->set('tenant', $tenant);

        return $next($request);
    }
}
