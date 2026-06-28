<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');

        return response()->json([
            'data' => Category::query()
                ->where('tenant_id', $tenant->id)
                ->with('products:id,category_id')
                ->orderBy('name')
                ->get()
                ->map(fn (Category $category) => $this->categoryPayload($category)),
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $category = Category::create([
            ...$request->validated(),
            'tenant_id' => $tenant->id,
            'status' => $request->validated('status', 'published'),
        ]);

        return response()->json(['data' => $this->categoryPayload($category->load('products:id,category_id'))], 201);
    }

    public function update(StoreCategoryRequest $request, Category $category): JsonResponse
    {
        $this->abortIfWrongTenant($request, $category);
        $category->update($request->validated());

        return response()->json(['data' => $this->categoryPayload($category->fresh()->load('products:id,category_id'))]);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $this->abortIfWrongTenant($request, $category);
        $category->delete();

        return response()->json(status: 204);
    }

    private function abortIfWrongTenant(Request $request, Category $category): void
    {
        $tenant = $request->attributes->get('tenant');
        abort_unless($category->tenant_id === $tenant->id, 404);
    }

    private function categoryPayload(Category $category): array
    {
        return [
            ...$category->only([
                'id',
                'tenant_id',
                'name',
                'slug',
                'description',
                'status',
                'seo_title',
                'seo_description',
                'cover_url',
                'created_at',
                'updated_at',
            ]),
            'product_ids' => $category->products->pluck('id')->values(),
        ];
    }
}
