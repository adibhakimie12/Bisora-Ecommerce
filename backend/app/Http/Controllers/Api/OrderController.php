<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');

        return response()->json([
            'data' => Order::query()
                ->where('tenant_id', $tenant->id)
                ->with('customer:id,name,email,status')
                ->latest()
                ->get(),
        ]);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $this->abortIfWrongTenant($request, $order);

        return response()->json(['data' => $order->load('customer:id,name,email,status')]);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $this->abortIfWrongTenant($request, $order);
        $data = $request->validate([
            'payment_status' => ['sometimes', Rule::in(['paid', 'pending'])],
            'settlement_status' => ['sometimes', 'nullable', Rule::in(['unsettled', 'processing', 'settled'])],
            'fulfillment_status' => ['sometimes', Rule::in(['processing', 'shipped', 'unfulfilled', 'delivered'])],
            'tracking_number' => ['sometimes', 'nullable', 'string', 'max:120'],
            'courier' => ['sometimes', 'nullable', 'string', 'max:120'],
        ]);

        $shipment = $order->shipment ?? [];
        foreach (['tracking_number', 'courier'] as $key) {
            if (array_key_exists($key, $data)) {
                $shipment[$key] = $data[$key];
                unset($data[$key]);
            }
        }

        $order->update([...$data, 'shipment' => $shipment]);

        return response()->json(['data' => $order->fresh()->load('customer:id,name,email,status')]);
    }

    private function abortIfWrongTenant(Request $request, Order $order): void
    {
        $tenant = $request->attributes->get('tenant');
        abort_unless($order->tenant_id === $tenant->id, 404);
    }
}
