<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Models\Product;
use App\Services\PlanLimitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(private readonly PlanLimitService $planLimitService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');

        return response()->json([
            'data' => Product::query()
                ->where('tenant_id', $tenant->id)
                ->with('category:id,name,slug')
                ->latest()
                ->get(),
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $usedProducts = Product::query()->where('tenant_id', $tenant->id)->count();
        $productLimit = $this->planLimitService->limit($tenant, 'products');

        if (! $request->user()?->isPlatformOwner() && $usedProducts >= $productLimit) {
            return response()->json([
                'message' => "{$tenant->plan} product limit reached. Upgrade package to add more products.",
                'limit' => $this->planLimitService->limitPayload($tenant, 'products', $usedProducts),
            ], 422);
        }

        $product = Product::create([
            ...$request->validated(),
            'tenant_id' => $tenant->id,
            'stock' => $request->validated('stock', 0),
            'status' => $request->validated('status', 'draft'),
        ]);

        return response()->json(['data' => $product->load('category:id,name,slug')], 201);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $this->abortIfWrongTenant($request, $product);

        return response()->json(['data' => $product->load('category:id,name,slug')]);
    }

    public function update(StoreProductRequest $request, Product $product): JsonResponse
    {
        $this->abortIfWrongTenant($request, $product);
        $product->update($request->validated());

        return response()->json(['data' => $product->fresh()->load('category:id,name,slug')]);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $this->abortIfWrongTenant($request, $product);
        $product->delete();

        return response()->json(status: 204);
    }

    private function abortIfWrongTenant(Request $request, Product $product): void
    {
        $tenant = $request->attributes->get('tenant');
        abort_unless($product->tenant_id === $tenant->id, 404);
    }
}
