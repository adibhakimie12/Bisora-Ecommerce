<?php

namespace App\Services;

use App\Models\NotificationLog;
use Illuminate\Database\Eloquent\Builder;

class NotificationQueueProcessor
{
    public function __construct(private readonly NotificationDeliveryService $delivery)
    {
    }

    public function process(int $limit = 50, ?int $tenantId = null): array
    {
        $summary = [
            'processed' => 0,
            'sent' => 0,
            'failed' => 0,
        ];

        NotificationLog::query()
            ->where('status', 'queued')
            ->when($tenantId, fn (Builder $query) => $query->where('tenant_id', $tenantId))
            ->oldest('queued_at')
            ->oldest('id')
            ->limit(max(1, min(500, $limit)))
            ->get()
            ->each(function (NotificationLog $log) use (&$summary): void {
                $summary['processed']++;

                try {
                    $deliveryResult = $this->delivery->deliver($log);
                    $payload = $log->payload ?? [];
                    $payload['delivery'] = $deliveryResult;

                    $log->update([
                        'status' => 'sent',
                        'attempts' => $log->attempts + 1,
                        'last_error' => null,
                        'payload' => $payload,
                        'sent_at' => now(),
                    ]);

                    $summary['sent']++;
                } catch (\Throwable $exception) {
                    $log->update([
                        'status' => 'failed',
                        'attempts' => $log->attempts + 1,
                        'last_error' => $exception->getMessage(),
                    ]);

                    $summary['failed']++;
                }
            });

        return $summary;
    }
}
