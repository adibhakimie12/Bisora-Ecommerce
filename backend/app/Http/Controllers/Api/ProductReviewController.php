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

    public function export(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $reviews = ProductReview::query()
            ->where('tenant_id', $tenant->id)
            ->latest()
            ->get();

        return response()->json([
            'data' => $reviews,
            'summary' => [
                'total' => $reviews->count(),
                'average_rating' => $reviews->count() === 0 ? 0 : round($reviews->avg('rating'), 2),
                'pending' => $reviews->where('status', 'pending')->count(),
                'approved' => $reviews->where('status', 'approved')->count(),
                'featured' => $reviews->where('status', 'featured')->count(),
                'hidden' => $reviews->where('status', 'hidden')->count(),
            ],
        ]);
    }

    public function destroy(Request $request, ProductReview $review): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        abort_unless($review->tenant_id === $tenant->id, 404);

        $review->delete();

        return response()->json(null, 204);
    }
}
