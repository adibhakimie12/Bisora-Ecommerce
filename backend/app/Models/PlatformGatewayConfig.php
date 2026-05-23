<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['provider', 'mode', 'enabled', 'merchant_id', 'api_key', 'secret_key', 'webhook_url'])]
class PlatformGatewayConfig extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'api_key' => 'encrypted',
            'secret_key' => 'encrypted',
        ];
    }
}
