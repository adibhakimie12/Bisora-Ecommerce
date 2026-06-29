<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tenant_id',
    'category_id',
    'title',
    'slug',
    'sku',
    'price',
    'compare_at_price',
    'stock',
    'status',
    'thumbnail_url',
    'image_urls',
    'description',
    'vendor',
    'product_type',
    'tags',
    'variants',
    'seo_title',
    'seo_description',
])]
class Product extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'compare_at_price' => 'integer',
            'stock' => 'integer',
            'image_urls' => 'array',
            'tags' => 'array',
            'variants' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
