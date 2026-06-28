<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenant = $this->attributes->get('tenant');
        $categoryId = $this->route('category')?->id;

        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => [
                'required',
                'string',
                'max:160',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('categories', 'slug')->where('tenant_id', $tenant->id)->ignore($categoryId),
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['nullable', Rule::in(['published', 'hidden'])],
            'seo_title' => ['nullable', 'string', 'max:160'],
            'seo_description' => ['nullable', 'string', 'max:320'],
            'cover_url' => ['nullable', 'url', 'max:2048'],
        ];
    }
}
