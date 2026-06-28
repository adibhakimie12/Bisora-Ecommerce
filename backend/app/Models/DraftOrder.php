<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tenant_id',
    'number',
    'customer_name',
    'customer_email',
    'source',
    'items',
    'total',
    'status',
    'note',
])]
class DraftOrder extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'total' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
