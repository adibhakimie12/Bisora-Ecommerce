<?php

namespace App\Http\Middleware;

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

        $tenant = $request->user()
            ->tenants()
            ->whereKey($tenantId)
            ->first();

        if (! $tenant) {
            return response()->json(['message' => 'Tenant access denied.'], 403);
        }

        $request->attributes->set('tenant', $tenant);

        return $next($request);
    }
}
