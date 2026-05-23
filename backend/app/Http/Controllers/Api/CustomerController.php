<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');

        return response()->json([
            'data' => CustomerProfile::query()
                ->where('tenant_id', $tenant->id)
                ->with('orders:id,customer_profile_id,number,total,payment_status,fulfillment_status,ordered_at')
                ->latest()
                ->get(),
        ]);
    }

    public function show(Request $request, CustomerProfile $customer): JsonResponse
    {
        $this->abortIfWrongTenant($request, $customer);

        return response()->json(['data' => $customer->load('orders:id,customer_profile_id,number,total,payment_status,fulfillment_status,ordered_at')]);
    }

    private function abortIfWrongTenant(Request $request, CustomerProfile $customer): void
    {
        $tenant = $request->attributes->get('tenant');
        abort_unless($customer->tenant_id === $tenant->id, 404);
    }
}
