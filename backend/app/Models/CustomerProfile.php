<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'tenant_id',
    'name',
    'email',
    'avatar_url',
    'status',
    'orders_count',
    'total_spent',
    'last_order_at',
    'member_since',
    'shipping_address',
    'notes',
])]
class CustomerProfile extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'orders_count' => 'integer',
            'total_spent' => 'integer',
            'last_order_at' => 'date',
            'member_since' => 'date',
            'shipping_address' => 'array',
            'notes' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
