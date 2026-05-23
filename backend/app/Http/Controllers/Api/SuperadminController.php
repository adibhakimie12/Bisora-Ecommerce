<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SuperadminController extends Controller
{
    public function overview(): JsonResponse
    {
        return response()->json([
            'data' => [
                'total_tenants' => Tenant::count(),
                'active_tenants' => Tenant::where('access_status', 'active')->count(),
                'overdue_tenants' => Tenant::where('billing_status', 'overdue')->count(),
                'monthly_recurring_revenue' => Tenant::where('free_access', false)->sum('monthly_fee'),
            ],
        ]);
    }

    public function tenants(): JsonResponse
    {
        return response()->json([
            'data' => Tenant::query()
                ->latest()
                ->get()
                ->map(fn (Tenant $tenant): array => $this->tenantPayload($tenant))
                ->values(),
        ]);
    }

    public function updateTenantAccess(Request $request, Tenant $tenant): JsonResponse
    {
        $data = $request->validate([
            'access_status' => ['required', Rule::in(['active', 'suspended', 'terminated'])],
            'billing_status' => ['sometimes', Rule::in(['paid', 'trial', 'overdue', 'failed'])],
            'days_overdue' => ['sometimes', 'integer', 'min:0'],
        ]);

        $tenant->update($data);

        return response()->json(['data' => $this->tenantPayload($tenant->fresh())]);
    }

    public function grantFreeAccess(Request $request, Tenant $tenant): JsonResponse
    {
        $data = $request->validate([
            'owner_email' => ['nullable', 'email'],
            'package_name' => ['nullable', 'string', 'max:120'],
            'monthly_fee' => ['nullable', 'integer', 'min:0'],
        ]);

        $tenant->update([
            'owner_email' => $data['owner_email'] ?? $tenant->owner_email,
            'plan' => $data['package_name'] ?? $tenant->plan,
            'monthly_fee' => $data['monthly_fee'] ?? 0,
            'billing_status' => 'trial',
            'access_status' => 'active',
            'days_overdue' => 0,
            'free_access' => true,
        ]);

        return response()->json(['data' => $this->tenantPayload($tenant->fresh())]);
    }

    private function tenantPayload(Tenant $tenant): array
    {
        return [
            'id' => (string) $tenant->id,
            'brand_name' => $tenant->name,
            'owner_name' => $tenant->owner_name,
            'owner_email' => $tenant->owner_email,
            'package_name' => $tenant->plan,
            'monthly_fee' => $tenant->monthly_fee,
            'billing_status' => $tenant->billing_status,
            'access_status' => $tenant->access_status,
            'days_overdue' => $tenant->days_overdue,
            'free_access' => $tenant->free_access,
        ];
    }
}
