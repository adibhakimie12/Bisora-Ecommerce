<?php

namespace Tests\Feature;

use App\Mail\NotificationLogMail;
use App\Models\NotificationLog;
use App\Models\Store;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class NotificationDeliveryCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_worker_marks_queued_log_sent(): void
    {
        Mail::fake();

        $tenant = Tenant::create(['name' => 'Demo Store', 'slug' => 'demo-store']);
        $log = NotificationLog::create([
            'tenant_id' => $tenant->id,
            'event' => 'test_notification',
            'channel' => 'email',
            'recipient' => 'buyer@example.test',
            'subject' => 'Order received',
            'message' => 'Thanks for your order.',
            'status' => 'queued',
            'queued_at' => now(),
        ]);

        $this->artisan('bisora:notifications:send', ['--limit' => 10])
            ->assertExitCode(0);

        $log->refresh();

        $this->assertSame('sent', $log->status);
        $this->assertSame(1, $log->attempts);
        $this->assertNotNull($log->sent_at);
        $this->assertSame('mail', $log->payload['delivery']['mode']);

        Mail::assertSent(NotificationLogMail::class, function (NotificationLogMail $mail) use ($log) {
            return $mail->hasTo($log->recipient)
                && $mail->log->is($log);
        });
    }

    public function test_notification_worker_marks_delivery_errors_failed(): void
    {
        $tenant = Tenant::create(['name' => 'Demo Store', 'slug' => 'demo-store']);
        $log = NotificationLog::create([
            'tenant_id' => $tenant->id,
            'event' => 'test_notification',
            'channel' => 'fax',
            'recipient' => 'buyer@example.test',
            'subject' => 'Order received',
            'message' => 'Thanks for your order.',
            'status' => 'queued',
            'queued_at' => now(),
        ]);

        $this->artisan('bisora:notifications:send', ['--limit' => 10])
            ->assertExitCode(1);

        $log->refresh();

        $this->assertSame('failed', $log->status);
        $this->assertSame(1, $log->attempts);
        $this->assertSame('Unsupported notification channel [fax].', $log->last_error);
        $this->assertNull($log->sent_at);
    }

    public function test_notification_worker_processes_connected_whatsapp_provider(): void
    {
        $tenant = Tenant::create(['name' => 'Demo Store', 'slug' => 'demo-store']);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'notifications' => [
                    'providers' => [
                        'whatsapp' => [
                            'enabled' => true,
                            'connected' => true,
                            'provider_id' => 'wa-meta',
                            'provider_name' => 'Meta Cloud API',
                            'credentials' => [
                                'access_token' => 'token-123',
                                'phone_number_id' => 'phone-123',
                            ],
                        ],
                    ],
                ],
            ],
        ]);
        $log = NotificationLog::create([
            'tenant_id' => $tenant->id,
            'event' => 'seller_whatsapp',
            'channel' => 'whatsapp',
            'recipient' => '+60123456789',
            'subject' => 'New order',
            'message' => 'New order needs review.',
            'status' => 'queued',
            'queued_at' => now(),
        ]);

        $this->artisan('bisora:notifications:send', ['--limit' => 10])
            ->assertExitCode(0);

        $log->refresh();

        $this->assertSame('sent', $log->status);
        $this->assertSame('provider', $log->payload['delivery']['mode']);
        $this->assertSame('wa-meta', $log->payload['delivery']['provider_id']);
        $this->assertSame('Meta Cloud API', $log->payload['delivery']['provider_name']);
    }

    public function test_notification_worker_fails_whatsapp_when_provider_credentials_are_missing(): void
    {
        $tenant = Tenant::create(['name' => 'Demo Store', 'slug' => 'demo-store']);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'notifications' => [
                    'providers' => [
                        'whatsapp' => [
                            'enabled' => true,
                            'connected' => true,
                            'provider_id' => 'wa-meta',
                            'provider_name' => 'Meta Cloud API',
                            'credentials' => [],
                        ],
                    ],
                ],
            ],
        ]);
        $log = NotificationLog::create([
            'tenant_id' => $tenant->id,
            'event' => 'seller_whatsapp',
            'channel' => 'whatsapp',
            'recipient' => '+60123456789',
            'subject' => 'New order',
            'message' => 'New order needs review.',
            'status' => 'queued',
            'queued_at' => now(),
        ]);

        $this->artisan('bisora:notifications:send', ['--limit' => 10])
            ->assertExitCode(1);

        $log->refresh();

        $this->assertSame('failed', $log->status);
        $this->assertSame('WhatsApp provider credentials are incomplete.', $log->last_error);
        $this->assertNull($log->sent_at);
    }

    public function test_notification_worker_processes_connected_sms_provider(): void
    {
        $tenant = Tenant::create(['name' => 'Demo Store', 'slug' => 'demo-store']);
        Store::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'settings' => [
                'notifications' => [
                    'providers' => [
                        'sms' => [
                            'enabled' => true,
                            'connected' => true,
                            'provider_id' => 'sms-twilio',
                            'provider_name' => 'Twilio',
                            'credentials' => [
                                'account_sid' => 'sid-123',
                                'auth_token' => 'token-123',
                                'from_number' => '+60110000000',
                            ],
                        ],
                    ],
                ],
            ],
        ]);
        $log = NotificationLog::create([
            'tenant_id' => $tenant->id,
            'event' => 'campaign',
            'channel' => 'sms',
            'recipient' => '+60123456789',
            'subject' => 'Sale',
            'message' => 'Flash sale starts now.',
            'status' => 'queued',
            'queued_at' => now(),
        ]);

        $this->artisan('bisora:notifications:send', ['--limit' => 10])
            ->assertExitCode(0);

        $log->refresh();

        $this->assertSame('sent', $log->status);
        $this->assertSame('provider', $log->payload['delivery']['mode']);
        $this->assertSame('sms-twilio', $log->payload['delivery']['provider_id']);
        $this->assertSame('Twilio', $log->payload['delivery']['provider_name']);
    }
}
