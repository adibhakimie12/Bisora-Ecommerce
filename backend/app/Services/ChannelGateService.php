<?php

namespace App\Services;

use App\Models\Store;

class ChannelGateService
{
    public function normalizeChannel(string $channel): string
    {
        return match (strtolower(trim($channel))) {
            'whatsapp', 'whats app' => 'whatsapp',
            'sms' => 'sms',
            default => 'email',
        };
    }

    public function assertAllowed(?string $plan, Store $store, string $channel, string $context): void
    {
        $channel = $this->normalizeChannel($channel);
        $this->abortUnlessChannelAllowed($plan, $channel, $context);
        $this->abortUnlessProviderConnected($store, $channel);
    }

    private function abortUnlessChannelAllowed(?string $plan, string $channel, string $context): void
    {
        $planKey = strtolower(trim((string) $plan));
        $allowed = match ($planKey) {
            'free trial', 'basic' => ['email'],
            'standard' => ['email', 'whatsapp'],
            default => ['email', 'whatsapp', 'sms'],
        };

        if (! in_array($channel, $allowed, true)) {
            abort(422, $this->channelLabel($channel) . " {$context} is not included in " . ($plan ?: 'this') . ' package.');
        }
    }

    private function abortUnlessProviderConnected(Store $store, string $channel): void
    {
        if ($channel === 'email') {
            return;
        }

        $provider = data_get($store->settings ?? [], "notifications.providers.{$channel}", []);
        $enabled = (bool) data_get($provider, 'enabled', false);
        $connected = (bool) data_get($provider, 'connected', false);

        if (! $enabled || ! $connected) {
            abort(422, $this->channelLabel($channel) . ' provider is not connected.');
        }
    }

    private function channelLabel(string $channel): string
    {
        return $channel === 'whatsapp' ? 'WhatsApp' : strtoupper($channel);
    }
}
