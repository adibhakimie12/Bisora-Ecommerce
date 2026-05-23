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
                ->orderBy('name')
                ->get(),
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

        return response()->json(['data' => $category], 201);
    }
}
