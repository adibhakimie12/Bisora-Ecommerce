<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tenant_id',
    'order_id',
    'event',
    'channel',
    'recipient',
    'subject',
    'message',
    'status',
    'attempts',
    'last_error',
    'payload',
    'queued_at',
    'sent_at',
])]
class NotificationLog extends Model
{
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'attempts' => 'integer',
            'queued_at' => 'datetime',
            'sent_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
