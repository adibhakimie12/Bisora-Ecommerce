<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'monthly_fee', 'discount_percent', 'features', 'active'])]
class SubscriptionPackage extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'monthly_fee' => 'integer',
            'discount_percent' => 'integer',
            'features' => 'array',
            'active' => 'boolean',
        ];
    }
}
