<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenant = $this->attributes->get('tenant');
        $productId = $this->route('product')?->id;

        return [
            'category_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where('tenant_id', $tenant->id),
            ],
            'title' => ['required', 'string', 'max:160'],
            'slug' => [
                'required',
                'string',
                'max:180',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('products', 'slug')->where('tenant_id', $tenant->id)->ignore($productId),
            ],
            'sku' => [
                'required',
                'string',
                'max:80',
                Rule::unique('products', 'sku')->where('tenant_id', $tenant->id)->ignore($productId),
            ],
            'price' => ['required', 'integer', 'min:0'],
            'compare_at_price' => ['nullable', 'integer', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', Rule::in(['active', 'draft', 'hidden', 'unpublished'])],
            'thumbnail_url' => ['nullable', 'url', 'max:2048'],
            'image_urls' => ['nullable', 'array'],
            'image_urls.*' => ['url', 'max:2048'],
            'description' => ['nullable', 'string', 'max:20000'],
            'vendor' => ['nullable', 'string', 'max:120'],
            'product_type' => ['nullable', 'string', 'max:120'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'variants' => ['nullable', 'array'],
            'seo_title' => ['nullable', 'string', 'max:160'],
            'seo_description' => ['nullable', 'string', 'max:320'],
        ];
    }
}
