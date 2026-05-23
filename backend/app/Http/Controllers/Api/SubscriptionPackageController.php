<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPackage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionPackageController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => SubscriptionPackage::query()->orderBy('monthly_fee')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $package = SubscriptionPackage::create($this->validated($request));

        return response()->json(['data' => $package], 201);
    }

    public function update(Request $request, SubscriptionPackage $package): JsonResponse
    {
        $package->update($this->validated($request, partial: true));

        return response()->json(['data' => $package->fresh()]);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:120'],
            'monthly_fee' => [$required, 'integer', 'min:0'],
            'discount_percent' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'features' => ['sometimes', 'array'],
            'features.*' => ['string', 'max:160'],
            'active' => ['sometimes', 'boolean'],
        ]);
    }
}
