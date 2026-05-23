<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');

        return response()->json([
            'data' => ProductReview::query()
                ->where('tenant_id', $tenant->id)
                ->latest()
                ->get(),
        ]);
    }

    public function update(Request $request, ProductReview $review): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        abort_unless($review->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'approved', 'hidden', 'featured'])],
        ]);
        $review->update($data);

        return response()->json(['data' => $review->fresh()]);
    }
}
