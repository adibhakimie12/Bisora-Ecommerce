<?php

namespace App\Console\Commands;

use App\Services\NotificationQueueProcessor;
use Illuminate\Console\Command;

class SendQueuedNotifications extends Command
{
    protected $signature = 'bisora:notifications:send {--limit=50 : Maximum queued notifications to process}';

    protected $description = 'Process queued Bisora notification logs.';

    public function handle(NotificationQueueProcessor $processor): int
    {
        $summary = $processor->process((int) $this->option('limit'));

        $this->info("Processed {$summary['processed']} queued notification(s).");

        if ($summary['failed'] > 0) {
            $this->error("Failed {$summary['failed']} notification(s).");

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
