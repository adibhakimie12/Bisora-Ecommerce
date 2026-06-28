<?php

namespace App\Services;

use App\Mail\NotificationLogMail;
use App\Models\NotificationLog;
use App\Models\Store;
use Illuminate\Support\Facades\Mail;
use InvalidArgumentException;

class NotificationDeliveryService
{
    private const SUPPORTED_CHANNELS = ['email', 'whatsapp', 'sms'];

    public function deliver(NotificationLog $log): array
    {
        $channel = strtolower(trim($log->channel));

        if (!in_array($channel, self::SUPPORTED_CHANNELS, true)) {
            throw new InvalidArgumentException("Unsupported notification channel [{$log->channel}].");
        }

        if (trim($log->recipient) === '') {
            throw new InvalidArgumentException('Notification recipient is required.');
        }

        if ($channel === 'email') {
            Mail::to($log->recipient)->send(new NotificationLogMail($log));

            return [
                'mode' => 'mail',
                'channel' => $channel,
                'recipient' => $log->recipient,
                'processed_at' => now()->toISOString(),
            ];
        }

        return $this->deliverViaConnectedProvider($log, $channel);
    }

    private function deliverViaConnectedProvider(NotificationLog $log, string $channel): array
    {
        $store = Store::query()->where('tenant_id', $log->tenant_id)->first();
        $provider = data_get($store?->settings ?? [], "notifications.providers.{$channel}", []);

        if (!data_get($provider, 'enabled') || !data_get($provider, 'connected')) {
            throw new InvalidArgumentException($this->channelLabel($channel).' provider is not connected.');
        }

        $missing = $this->missingCredentialKeys($channel, (array) data_get($provider, 'credentials', []));

        if ($missing !== []) {
            throw new InvalidArgumentException($this->channelLabel($channel).' provider credentials are incomplete.');
        }

        return [
            'mode' => 'provider',
            'channel' => $channel,
            'provider_id' => data_get($provider, 'provider_id'),
            'provider_name' => data_get($provider, 'provider_name'),
            'recipient' => $log->recipient,
            'processed_at' => now()->toISOString(),
            'transport' => config('bisora.notification_delivery_mode', 'log'),
        ];
    }

    private function missingCredentialKeys(string $channel, array $credentials): array
    {
        $required = match ($channel) {
            'whatsapp' => ['access_token', 'phone_number_id'],
            'sms' => ['account_sid', 'auth_token', 'from_number'],
            default => [],
        };

        return array_values(array_filter($required, fn (string $key) => trim((string) ($credentials[$key] ?? '')) === ''));
    }

    private function channelLabel(string $channel): string
    {
        return match ($channel) {
            'sms' => 'SMS',
            'whatsapp' => 'WhatsApp',
            default => ucfirst($channel),
        };
    }
}
