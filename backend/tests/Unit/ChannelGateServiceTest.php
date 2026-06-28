<?php

namespace Tests\Unit;

use App\Models\Store;
use App\Services\ChannelGateService;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class ChannelGateServiceTest extends TestCase
{
    public function test_basic_plan_allows_email_only(): void
    {
        $service = new ChannelGateService();
        $store = new Store(['settings' => []]);

        $service->assertAllowed('Basic', $store, 'email', 'notification');

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('WhatsApp notification is not included in Basic package.');
        $service->assertAllowed('Basic', $store, 'whatsapp', 'notification');
    }

    public function test_standard_plan_requires_connected_whatsapp_provider(): void
    {
        $service = new ChannelGateService();
        $store = new Store([
            'settings' => [
                'notifications' => [
                    'providers' => [
                        'whatsapp' => ['enabled' => false, 'connected' => false],
                    ],
                ],
            ],
        ]);

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('WhatsApp provider is not connected.');
        $service->assertAllowed('Standard', $store, 'whatsapp', 'marketing');
    }

    public function test_standard_plan_allows_connected_whatsapp_provider(): void
    {
        $service = new ChannelGateService();
        $store = new Store([
            'settings' => [
                'notifications' => [
                    'providers' => [
                        'whatsapp' => ['enabled' => true, 'connected' => true],
                    ],
                ],
            ],
        ]);

        $service->assertAllowed('Standard', $store, 'whatsapp', 'marketing');

        $this->assertTrue(true);
    }
}
