import assert from 'node:assert/strict';
import {
  applyMessagingProviderConnectionStatus,
  buildMessagingProviderDisconnectSettings,
  buildMessagingProviderNotificationSettings,
  buildNotificationChannelSettings,
  buildNotificationProviderSettings,
  mergeNotificationSettings,
} from './SettingsModule';

function testBuildsProviderFlagsFromSellerAlertSettings() {
  const providers = buildNotificationProviderSettings({
    sellerOrderAlertEmailEnabled: true,
    sellerAlertEmail: 'seller@example.com',
    sellerOrderAlertWhatsAppEnabled: true,
    sellerAlertWhatsApp: '+60123456789',
  });

  assert.equal(providers.email.enabled, true);
  assert.equal(providers.email.connected, true);
  assert.equal(providers.email.sender, 'seller@example.com');
  assert.equal(providers.whatsapp.enabled, true);
  assert.equal(providers.whatsapp.connected, true);
  assert.equal(providers.whatsapp.sender, '+60123456789');
  assert.equal(providers.sms.enabled, false);
  assert.equal(providers.sms.connected, false);
}

function testKeepsWhatsappDisconnectedWhenSellerAlertIsOff() {
  const providers = buildNotificationProviderSettings({
    sellerOrderAlertEmailEnabled: true,
    sellerAlertEmail: 'seller@example.com',
    sellerOrderAlertWhatsAppEnabled: false,
    sellerAlertWhatsApp: '+60123456789',
  });

  assert.equal(providers.email.connected, true);
  assert.equal(providers.whatsapp.enabled, false);
  assert.equal(providers.whatsapp.connected, false);
}

function testBuildsChannelDefaultsAndProviderFlag() {
  const settings = buildNotificationChannelSettings('WhatsApp', {
    senderLabel: 'Bisora Ops',
    subject: 'Order update',
    body: 'Hi {{customer_name}}',
    enabled: true,
    sendTiming: 'Immediately after shipment status update',
    trigger: 'Shipment marked as shipped',
  });

  assert.equal(settings.channel_defaults.whatsapp.sender_label, 'Bisora Ops');
  assert.equal(settings.channel_defaults.whatsapp.enabled, true);
  assert.equal(settings.providers.whatsapp.enabled, true);
  assert.equal(settings.providers.whatsapp.connected, true);
}

function testMergesNotificationSettingsWithoutDroppingOtherProviders() {
  const merged = mergeNotificationSettings(
    {
      providers: {
        email: { enabled: true, connected: true, sender: 'seller@example.com' },
        whatsapp: { enabled: false, connected: false },
      },
      channel_defaults: {
        email: { enabled: true, sender_label: 'Store' },
      },
    },
    {
      providers: {
        whatsapp: { enabled: true, connected: true, sender: 'Bisora WA' },
      },
      channel_defaults: {
        whatsapp: { enabled: true, sender_label: 'Bisora WA' },
      },
    },
  );

  assert.equal(merged.providers.email.connected, true);
  assert.equal(merged.providers.whatsapp.connected, true);
  assert.equal(merged.channel_defaults.email.sender_label, 'Store');
  assert.equal(merged.channel_defaults.whatsapp.sender_label, 'Bisora WA');
}

function testBuildsMessagingProviderSettingsFromIntegrationProvider() {
  const settings = buildMessagingProviderNotificationSettings('in-6', {
    id: 'wa-meta',
    name: 'Meta Cloud API',
    fields: [
      { label: 'Access Token', value: 'token-123' },
      { label: 'Phone Number ID', value: 'phone-123' },
    ],
  });

  assert.equal(settings.providers.whatsapp.enabled, true);
  assert.equal(settings.providers.whatsapp.connected, true);
  assert.equal(settings.providers.whatsapp.provider_id, 'wa-meta');
  assert.equal(settings.providers.whatsapp.provider_name, 'Meta Cloud API');
  assert.equal(settings.providers.whatsapp.credentials.access_token, 'token-123');
  assert.equal(settings.providers.whatsapp.credentials.phone_number_id, 'phone-123');
}

function testAppliesConnectedMessagingProviderStatusFromSettings() {
  const providers = applyMessagingProviderConnectionStatus(
    'in-6',
    [
      {
        id: 'wa-meta',
        name: 'Meta Cloud API',
        status: 'Recommended',
        fields: [
          { label: 'Access Token', value: 'old-token' },
          { label: 'Phone Number ID', value: 'old-phone' },
        ],
      },
      {
        id: 'wa-onesend',
        name: 'Onesend',
        status: 'Available',
        fields: [{ label: 'API Token', value: 'old-api' }],
      },
    ],
    {
      providers: {
        whatsapp: {
          connected: true,
          provider_id: 'wa-meta',
          provider_name: 'Meta Cloud API',
          credentials: {
            access_token: 'live-token',
            phone_number_id: 'live-phone',
          },
        },
      },
    },
  );

  assert.equal(providers[0].status, 'Connected');
  assert.equal(providers[0].fields[0].value, 'live-token');
  assert.equal(providers[0].fields[1].value, 'live-phone');
  assert.equal(providers[1].status, 'Available');
}

function testBuildsMessagingProviderDisconnectSettings() {
  const settings = buildMessagingProviderDisconnectSettings('in-8', {
    id: 'sms-twilio',
    name: 'Twilio',
    fields: [{ label: 'Auth Token', value: 'secret' }],
  });

  assert.equal(settings.providers.sms.enabled, false);
  assert.equal(settings.providers.sms.connected, false);
  assert.equal(settings.providers.sms.provider_id, 'sms-twilio');
  assert.equal(settings.providers.sms.provider_name, 'Twilio');
}

testBuildsProviderFlagsFromSellerAlertSettings();
testKeepsWhatsappDisconnectedWhenSellerAlertIsOff();
testBuildsChannelDefaultsAndProviderFlag();
testMergesNotificationSettingsWithoutDroppingOtherProviders();
testBuildsMessagingProviderSettingsFromIntegrationProvider();
testAppliesConnectedMessagingProviderStatusFromSettings();
testBuildsMessagingProviderDisconnectSettings();

console.log('notification provider settings tests passed');
