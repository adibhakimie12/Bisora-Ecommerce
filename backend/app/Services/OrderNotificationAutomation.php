<?php

namespace App\Services;

use App\Models\NotificationLog;
use App\Models\Order;
use App\Models\Store;

class OrderNotificationAutomation
{
    public function __construct(private readonly ChannelGateService $channelGate)
    {
    }

    public function orderPlaced(Order $order, Store $store): void
    {
        $order->loadMissing('customer:id,name,email,status');

        if ($order->customer?->email) {
            $this->queue($order, 'order_placed', 'email', $order->customer->email, 'Order received', "We received order {$order->number}.");
        }

        $settings = $store->settings ?? [];
        $sellerEmail = data_get($settings, 'notifications.seller_alert_email')
            ?: data_get($settings, 'general.sellerAlertEmail')
            ?: data_get($settings, 'contact_email');
        $sellerWhatsApp = data_get($settings, 'notifications.seller_alert_whatsapp')
            ?: data_get($settings, 'general.sellerAlertWhatsApp');

        if ($sellerEmail) {
            $this->queue($order, 'order_placed', 'seller_email', $sellerEmail, 'New storefront order', "New order {$order->number} needs review.");
        }

        if ($sellerWhatsApp && $this->sellerWhatsAppAllowed($order, $store)) {
            $this->queue($order, 'order_placed', 'seller_whatsapp', $sellerWhatsApp, 'New storefront order', "New order {$order->number} needs review.");
        }
    }

    public function paymentConfirmed(Order $order): void
    {
        $order->loadMissing('customer:id,name,email,status');

        if (!$order->customer?->email) {
            return;
        }

        $this->queue(
            $order,
            'payment_confirmed',
            'email',
            $order->customer->email,
            'Payment confirmed',
            "Payment for order {$order->number} has been confirmed.",
        );
    }

    public function orderShipped(Order $order): void
    {
        $order->loadMissing('customer:id,name,email,status');

        if (!$order->customer?->email) {
            return;
        }

        $trackingNumber = data_get($order->shipment ?? [], 'tracking_number');
        $courier = data_get($order->shipment ?? [], 'courier');
        $trackingCopy = $trackingNumber ? " Tracking: {$trackingNumber}" : '';
        $courierCopy = $courier ? " via {$courier}" : '';

        $this->queue(
            $order,
            'order_shipped',
            'email',
            $order->customer->email,
            'Order shipped',
            "Order {$order->number} has shipped{$courierCopy}.{$trackingCopy}",
        );
    }

    private function queue(Order $order, string $event, string $channel, string $recipient, string $subject, string $message): void
    {
        NotificationLog::query()->create([
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'event' => $event,
            'channel' => $channel,
            'recipient' => $recipient,
            'subject' => $subject,
            'message' => $message,
            'status' => 'queued',
            'payload' => [
                'order_number' => $order->number,
                'total' => $order->total,
                'payment_status' => $order->payment_status,
                'fulfillment_status' => $order->fulfillment_status,
                'tracking_number' => data_get($order->shipment ?? [], 'tracking_number'),
                'courier' => data_get($order->shipment ?? [], 'courier'),
            ],
            'queued_at' => now(),
        ]);
    }

    private function sellerWhatsAppAllowed(Order $order, Store $store): bool
    {
        $tenant = $order->tenant()->first();

        if (!$tenant) {
            return false;
        }

        try {
            $this->channelGate->assertAllowed($tenant->plan, $store, 'whatsapp', 'notification');
            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
