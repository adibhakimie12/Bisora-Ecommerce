<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tenant_id',
    'customer_profile_id',
    'number',
    'total',
    'payment_status',
    'settlement_status',
    'fulfillment_status',
    'ordered_at',
    'payment_method',
    'items',
    'shipping_address',
    'shipment',
])]
class Order extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'total' => 'integer',
            'ordered_at' => 'date',
            'items' => 'array',
            'shipping_address' => 'array',
            'shipment' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(CustomerProfile::class, 'customer_profile_id');
    }
}
