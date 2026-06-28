<?php

namespace App\Services;

use App\Models\Tenant;

class PlanLimitService
{
    private const LIMITS = [
        'free trial' => ['products' => 15, 'storage_mb' => 250, 'pages' => 3, 'forms' => 1],
        'basic' => ['products' => 30, 'storage_mb' => 500, 'pages' => 10, 'forms' => 3],
        'standard' => ['products' => 200, 'storage_mb' => 2000, 'pages' => 100, 'forms' => 25],
        'premium' => ['products' => 1000, 'storage_mb' => 10000, 'pages' => 999, 'forms' => 999],
    ];

    public function limit(Tenant $tenant, string $resource): int
    {
        $planKey = str($tenant->plan)->lower()->trim()->toString();
        $limits = self::LIMITS[$planKey] ?? self::LIMITS['premium'];

        return $limits[$resource] ?? PHP_INT_MAX;
    }

    public function limitPayload(Tenant $tenant, string $resource, int $used): array
    {
        return [
            'plan' => $tenant->plan,
            'resource' => $resource,
            'max' => $this->limit($tenant, $resource),
            'used' => $used,
        ];
    }
}
