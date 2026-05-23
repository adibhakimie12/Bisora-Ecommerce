<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tenant_id',
    'bucket',
    'object_key',
    'filename',
    'mime_type',
    'size_bytes',
    'visibility',
    'owner_type',
    'owner_id',
    'status',
    'checksum',
    'width',
    'height',
])]
class MediaAsset extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'owner_id' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
