import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, Download, Plus, Search, X } from 'lucide-react';
import { ApiError, API_STORAGE_KEYS } from '../../api/http';
import { fetchNotificationLogs, processNotificationQueue, queueTestNotification, retryNotificationLog, updateNotificationLogStatus, type NotificationLogRecord } from '../../api/notifications';
import { fetchStoreSettings, publishStorefront, saveStoreSettings, unpublishStorefront, type StoreSettings, type StoreSettingsPatch } from '../../api/settings';
import {
  apiKeysSeed,
  courierProvidersSeed,
  integrationsSeed,
  manualMethodsSeed,
  paymentGatewaysSeed,
  paymentRulesSeed,
  roleCards,
  settingsHubCards,
  shippingProviderIntegrationsSeed,
  shippingRoutingRulesSeed,
  shippingZonesSeed,
  teamMembersSeed,
  webhooksSeed,
} from './data';
import { resolveSeoSitemapUrl } from './seoIndexing';
import type {
  ApiKeyItem,
  CourierProvider,
  IntegrationItem,
  ManualMethod,
  PaymentGateway,
  PaymentRule,
  SettingsSection,
  ShippingProviderIntegration,
  ShippingRoutingRule,
  ShippingZone,
  TeamMember,
  WebhookItem,
} from './types';

interface SettingsModuleProps {
  section?: string;
  subSection?: string;
}

interface BannerState {
  title: string;
  description: string;
}

interface GeneralSettingsForm {
  storeName: string;
  tagline: string;
  legalName: string;
  supportName: string;
  email: string;
  phone: string;
  supportHours: string;
  address: string;
  country: string;
  currency: string;
  language: string;
  timezone: string;
  sellerAlertEmail: string;
  sellerAlertWhatsApp: string;
  sellerOrderAlertEmailEnabled: boolean;
  sellerOrderAlertWhatsAppEnabled: boolean;
  sellerOrderAlertOnlyAfterPayment: boolean;
  sellerAlertRoles: string[];
  orderPrefix: string;
  autoConfirm: boolean;
  autoCancel: boolean;
  autoCancelHours: string;
  lowStockThreshold: string;
  dateFormat: string;
  timeFormat: string;
  dataRefresh: string;
  compactMode: boolean;
  internalAlerts: boolean;
}

interface DomainBrandingForm {
  domain: string;
  subdomain: string;
  connectionStatus: string;
  brandName: string;
  tagline: string;
  logoLabel: string;
  logoStyle: string;
  primaryColor: string;
  accentColor: string;
  neutralColor: string;
  buttonShape: string;
  themePreset: string;
  showAnnouncementBar: boolean;
  showFloatingHelp: boolean;
}

interface CheckoutSettingsForm {
  fields: {
    phoneRequired: boolean;
    companyField: boolean;
    addressLine2: boolean;
    marketingOptIn: boolean;
  };
  shippingMethods: {
    standard: boolean;
    express: boolean;
    sameDay: boolean;
  };
  payments: {
    card: boolean;
    onlineBanking: boolean;
    cod: boolean;
  };
  summary: {
    showCouponField: boolean;
    showDeliveryEstimate: boolean;
    showTrustBadges: boolean;
  };
  protection: {
    enabled: boolean;
    title: string;
    fee: string;
  };
  preferredShipping: string;
  preferredPayment: string;
}

interface PaymentGatewaySavePayload {
  environment: 'Live' | 'Test';
  setupStage: PaymentSetupStage;
  enabledAtCheckout: boolean;
  checkoutLabel: string;
}

interface CourierSavePayload {
  environment: 'Live' | 'Test';
  setupStage: CourierSetupStage;
  enabledForRouting: boolean;
}

interface ShippingProviderSavePayload {
  environment: 'Live' | 'Test';
  enabled: boolean;
  autoTracking: boolean;
}

interface InviteMemberPayload {
  name: string;
  email: string;
  role: string;
}

interface GenerateApiKeyPayload {
  name: string;
  scope: string;
}

interface ShippingRoutingRuleDraft {
  name: string;
  condition: string;
  action: string;
}

interface ShippingMethodDraft {
  name: string;
  note: string;
  active: boolean;
  sla: string;
  preferredCourier: string;
}

interface ShippingSimulationDraft {
  zone: string;
  method: string;
  scenario: string;
}

interface NotificationChannelDraft {
  senderLabel: string;
  subject: string;
  body: string;
  enabled: boolean;
  sendTiming: string;
  trigger: string;
}

interface NotificationEventTemplate {
  id: string;
  name: string;
  description: string;
  status: 'Enabled' | 'Disabled';
  channels: {
    Email: NotificationChannelDraft;
    SMS: NotificationChannelDraft;
    WhatsApp: NotificationChannelDraft;
  };
  variables: string[];
}

type NotificationProviderForm = Pick<
  GeneralSettingsForm,
  'sellerOrderAlertEmailEnabled' | 'sellerAlertEmail' | 'sellerOrderAlertWhatsAppEnabled' | 'sellerAlertWhatsApp'
>;

interface MessagingProviderDraft {
  id: string;
  name: string;
  status?: string;
  fields: Array<{ label: string; value: string }>;
}

export function buildNotificationProviderSettings(form: NotificationProviderForm) {
  return {
    email: {
      enabled: form.sellerOrderAlertEmailEnabled,
      connected: form.sellerOrderAlertEmailEnabled,
      sender: form.sellerAlertEmail,
    },
    whatsapp: {
      enabled: form.sellerOrderAlertWhatsAppEnabled,
      connected: form.sellerOrderAlertWhatsAppEnabled,
      sender: form.sellerAlertWhatsApp,
    },
    sms: {
      enabled: false,
      connected: false,
    },
  };
}

function normalizeCredentialKey(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function resolveMessagingChannel(integrationId: string) {
  if (integrationId === 'in-6') {
    return 'whatsapp';
  }

  if (integrationId === 'in-7') {
    return 'email';
  }

  if (integrationId === 'in-8') {
    return 'sms';
  }

  return 'unknown';
}

export function buildMessagingProviderNotificationSettings(integrationId: string, provider: MessagingProviderDraft) {
  const channel = resolveMessagingChannel(integrationId);
  const credentials = provider.fields.reduce<Record<string, string>>((carry, field) => {
    carry[normalizeCredentialKey(field.label)] = field.value;
    return carry;
  }, {});

  return {
    providers: {
      [channel]: {
        enabled: true,
        connected: true,
        provider_id: provider.id,
        provider_name: provider.name,
        credentials,
      },
    },
  };
}

export function buildMessagingProviderDisconnectSettings(integrationId: string, provider: MessagingProviderDraft) {
  const channel = resolveMessagingChannel(integrationId);

  return {
    providers: {
      [channel]: {
        enabled: false,
        connected: false,
        provider_id: provider.id,
        provider_name: provider.name,
      },
    },
  };
}

export function applyMessagingProviderConnectionStatus<T extends MessagingProviderDraft>(
  integrationId: string,
  providers: T[],
  notificationSettings: Record<string, any> | undefined,
) {
  const channel = resolveMessagingChannel(integrationId);
  const connectedProvider = notificationSettings?.providers?.[channel];

  if (!connectedProvider?.connected) {
    return providers;
  }

  return providers.map((provider) => {
    const isConnectedProvider =
      connectedProvider.provider_id === provider.id
      || (!connectedProvider.provider_id && connectedProvider.provider_name === provider.name);

    if (!isConnectedProvider) {
      return provider;
    }

    return {
      ...provider,
      status: 'Connected',
      fields: provider.fields.map((field) => {
        const credentialValue = connectedProvider.credentials?.[normalizeCredentialKey(field.label)];

        return {
          ...field,
          value: typeof credentialValue === 'string' ? credentialValue : field.value,
        };
      }),
    };
  });
}

export function buildNotificationChannelSettings(name: string, draft: NotificationChannelDraft) {
  const channelKey = name.toLowerCase();

  return {
    channel_defaults: {
      [channelKey]: {
        sender_label: draft.senderLabel,
        subject: draft.subject,
        body: draft.body,
        enabled: draft.enabled,
        send_timing: draft.sendTiming,
        trigger: draft.trigger,
      },
    },
    providers: {
      [channelKey]: {
        enabled: draft.enabled,
        connected: draft.enabled,
        sender: draft.senderLabel,
      },
    },
  };
}

export function mergeNotificationSettings(existing: Record<string, any> | undefined, patch: Record<string, any>) {
  return {
    ...(existing ?? {}),
    ...patch,
    providers: {
      ...((existing?.providers as Record<string, any> | undefined) ?? {}),
      ...((patch.providers as Record<string, any> | undefined) ?? {}),
    },
    channel_defaults: {
      ...((existing?.channel_defaults as Record<string, any> | undefined) ?? {}),
      ...((patch.channel_defaults as Record<string, any> | undefined) ?? {}),
    },
  };
}

const defaultShippingMethodNames = ['Standard Delivery', 'Express Delivery', 'Same-Day Delivery'];

interface PaymentRuleDraft {
  name: string;
  condition: string;
  action: string;
}

interface RuleOption {
  value: string;
  hint: string;
}

interface PaymentRuleTemplateCard {
  name: string;
  condition: string;
  action: string;
  description: string;
}

interface ShippingRoutingTemplateCard {
  name: string;
  condition: string;
  action: string;
  description: string;
}

type PaymentsTab = 'overview' | 'gateway' | 'manual' | 'rules';
type ShippingTab = 'overview' | 'zones' | 'methods' | 'courier' | 'api' | 'routing';
type NotificationsTab = 'shipment' | 'defaults' | 'ai';
type IntegrationsTab = 'overview' | 'tracking' | 'messaging' | 'developer';
type PaymentSetupStage = 'Not Started' | 'Applied' | 'Awaiting Approval' | 'Ready to Connect' | 'Live';
type CourierSetupStage = 'Not Started' | 'Applied' | 'Ready to Connect' | 'Live';

const paymentRuleConditionOptions: RuleOption[] = [
  { value: 'Cart > RM 1,000', hint: 'Use this when high-value orders should follow a safer payment path.' },
  { value: 'Customer tag = VIP', hint: 'Use this when tagged premium customers should see a preferred route.' },
  { value: '22:00 - 06:00', hint: 'Use this when availability changes based on checkout time.' },
  { value: 'Shipping zone = East Malaysia', hint: 'Use this when payment options depend on delivery area.' },
  { value: 'Risk level = High', hint: 'Use this when risky orders should hide certain manual methods.' },
  { value: 'Order requires manual payment review', hint: 'Use this when finance or ops needs to review payment before approval.' },
];

const paymentRuleActionOptions: RuleOption[] = [
  { value: 'Force Card / Online Banking', hint: 'Push customers toward more secure digital payment methods.' },
  { value: 'Prioritize Stripe', hint: 'Highlight Stripe as the preferred method in checkout.' },
  { value: 'Disable COD', hint: 'Hide Cash on Delivery for orders matching this rule.' },
  { value: 'Show Bank Transfer only', hint: 'Allow only manual transfer flow for matching orders.' },
  { value: 'Hide manual methods', hint: 'Keep checkout digital-only for this scenario.' },
  { value: 'Show preferred gateway first', hint: 'Reorder checkout so the recommended gateway appears first.' },
];

const recommendedPaymentRuleTemplates: PaymentRuleTemplateCard[] = [
  {
    name: 'High Value Secure',
    condition: 'Cart > RM 1,000',
    action: 'Force Card / Online Banking',
    description: 'Reduce risk by guiding large orders to stronger digital payment methods.',
  },
  {
    name: 'VIP Premium Route',
    condition: 'Customer tag = VIP',
    action: 'Prioritize Stripe',
    description: 'Give premium customers a cleaner, preferred gateway experience.',
  },
  {
    name: 'Night COD Block',
    condition: '22:00 - 06:00',
    action: 'Disable COD',
    description: 'Avoid late-night manual collection risk and keep checkout more controlled.',
  },
];

const shippingRoutingConditionOptions: RuleOption[] = [
  { value: 'Zone = Semenanjung', hint: 'Use this when routing depends on domestic Peninsular Malaysia zone coverage.' },
  { value: 'Zone = Sabah & Sarawak', hint: 'Use this when East Malaysia needs a different courier path.' },
  { value: 'Express order + primary courier unavailable', hint: 'Use this when service level and courier fallback both matter.' },
  { value: 'International order', hint: 'Use this when cross-border shipments need separate courier logic.' },
  { value: 'Courier API timeout > 25s', hint: 'Use this when routing should switch to fallback after system delay.' },
  { value: 'Order weight > 5kg', hint: 'Use this when heavier parcels need a different courier or method.' },
];

const shippingRoutingActionOptions: RuleOption[] = [
  { value: 'Use Ninja Van first', hint: 'Set Ninja Van as the default first-choice courier.' },
  { value: 'Fallback to DHL Express', hint: 'Send the order to DHL Express if the main path is unavailable.' },
  { value: 'Prefer POS Malaysia or J&T EXPRESS (3-5 working days)', hint: 'Keep East Malaysia routing inside the intended slower but supported carrier set.' },
  { value: 'Hide same-day delivery', hint: 'Remove unsupported fast-delivery promises for this scenario.' },
  { value: 'Use cheapest available courier', hint: 'Prioritize cost-optimized routing for matching orders.' },
  { value: 'Force manual review before assignment', hint: 'Hold assignment until ops reviews unusual shipment conditions.' },
];

const recommendedShippingRoutingTemplates: ShippingRoutingTemplateCard[] = [
  {
    name: 'Semenanjung Priority',
    condition: 'Zone = Semenanjung',
    action: 'Use Ninja Van first',
    description: 'Keep local Peninsular Malaysia orders on the main preferred courier path.',
  },
  {
    name: 'Express Fallback',
    condition: 'Express order + primary courier unavailable',
    action: 'Fallback to DHL Express',
    description: 'Protect express promises by switching to a stronger express courier when needed.',
  },
  {
    name: 'East Malaysia Control',
    condition: 'Zone = Sabah & Sarawak',
    action: 'Prefer POS Malaysia or J&T EXPRESS (3-5 working days)',
    description: 'Keep East Malaysia routing inside carriers that match supported lane expectations.',
  },
];

function hasApiSession() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.localStorage.getItem(API_STORAGE_KEYS.token));
}

function mergePaymentGatewaysFromSettings(current: PaymentGateway[], settings: Record<string, any>): PaymentGateway[] {
  const gateways = settings.payments?.gateways;
  if (!Array.isArray(gateways)) {
    return current;
  }

  return current.map((gateway) => {
    const saved = gateways.find((item: { slug?: string }) => item.slug === gateway.slug);
    if (!saved) {
      return gateway;
    }

    return {
      ...gateway,
      checkoutLabel: typeof saved.checkout_label === 'string' ? saved.checkout_label : gateway.checkoutLabel,
      enabledAtCheckout: typeof saved.enabled_at_checkout === 'boolean' ? saved.enabled_at_checkout : gateway.enabledAtCheckout,
      mode: saved.mode === 'Live' || saved.mode === 'Test' ? saved.mode : gateway.mode,
      setupStage: isPaymentSetupStage(saved.setup_stage) ? saved.setup_stage : gateway.setupStage,
      status: saved.status === 'Connected' || saved.status === 'Disconnected' || saved.status === 'Pending' ? saved.status : gateway.status,
    };
  });
}

function mergeManualMethodsFromSettings(current: ManualMethod[], settings: Record<string, any>): ManualMethod[] {
  const methods = settings.payments?.manual_methods;
  if (!Array.isArray(methods)) {
    return current;
  }

  return current.map((method) => {
    const saved = methods.find((item: { slug?: string }) => item.slug === method.slug);
    return saved && typeof saved.enabled === 'boolean' ? { ...method, enabled: saved.enabled } : method;
  });
}

function mergePaymentRulesFromSettings(current: PaymentRule[], settings: Record<string, any>): PaymentRule[] {
  const rules = settings.payments?.rules;
  if (!Array.isArray(rules)) {
    return current;
  }

  return rules
    .filter((rule: Partial<PaymentRule>) => rule.id && rule.name && rule.condition && rule.action)
    .map((rule: Partial<PaymentRule>): PaymentRule => ({
      id: String(rule.id),
      name: String(rule.name),
      condition: String(rule.condition),
      action: String(rule.action),
      status: rule.status === 'Active' ? 'Active' : 'Draft',
    }));
}

function mergeShippingProvidersFromSettings(current: ShippingProviderIntegration[], settings: Record<string, any>): ShippingProviderIntegration[] {
  const providers = settings.shipping?.providers;
  if (!Array.isArray(providers)) {
    return current;
  }

  return current.map((provider) => {
    const saved = providers.find((item: { slug?: string }) => item.slug === provider.slug);
    if (!saved) {
      return provider;
    }

    return {
      ...provider,
      autoTracking: typeof saved.auto_tracking === 'boolean' ? saved.auto_tracking : provider.autoTracking,
      enabled: typeof saved.enabled === 'boolean' ? saved.enabled : provider.enabled,
      mode: saved.mode === 'Live' || saved.mode === 'Test' ? saved.mode : provider.mode,
      status: saved.status === 'Connected' || saved.status === 'Disabled' || saved.status === 'Sandbox' ? saved.status : provider.status,
    };
  });
}

function mergeShippingZonesFromSettings(current: ShippingZone[], settings: Record<string, any>): ShippingZone[] {
  const zones = settings.shipping?.zones;
  return Array.isArray(zones) && zones.length > 0 ? zones : current;
}

function mergeShippingRoutingRulesFromSettings(current: ShippingRoutingRule[], settings: Record<string, any>): ShippingRoutingRule[] {
  const rules = settings.shipping?.routing_rules;
  if (!Array.isArray(rules)) {
    return current;
  }

  return rules
    .filter((rule: Partial<ShippingRoutingRule>) => rule.id && rule.name && rule.condition && rule.action)
    .map((rule: Partial<ShippingRoutingRule>): ShippingRoutingRule => ({
      id: String(rule.id),
      name: String(rule.name),
      condition: String(rule.condition),
      action: String(rule.action),
      status: rule.status === 'Active' ? 'Active' : 'Draft',
    }));
}

function isCourierMode(value: unknown): value is CourierProvider['mode'] {
  return value === 'Live' || value === 'Test';
}

function isCourierSetupStage(value: unknown): value is CourierProvider['setupStage'] {
  return value === 'Not Started' || value === 'Applied' || value === 'Ready to Connect' || value === 'Live';
}

function isCourierStatus(value: unknown): value is CourierProvider['status'] {
  return value === 'Connected' || value === 'Disconnected' || value === 'Sandbox';
}

function mergeCouriersFromSettings(current: CourierProvider[], settings: Record<string, any>): CourierProvider[] {
  const savedCouriers = settings.couriers;
  if (!Array.isArray(savedCouriers)) {
    return current;
  }

  return current.map((courier) => {
    const saved = savedCouriers.find((item: Partial<CourierProvider>) => item.id === courier.id || item.slug === courier.slug);
    if (!saved) {
      return courier;
    }

    return {
      ...courier,
      enabledForRouting: typeof saved.enabledForRouting === 'boolean' ? saved.enabledForRouting : courier.enabledForRouting,
      mode: isCourierMode(saved.mode) ? saved.mode : courier.mode,
      setupStage: isCourierSetupStage(saved.setupStage) ? saved.setupStage : courier.setupStage,
      status: isCourierStatus(saved.status) ? saved.status : courier.status,
    };
  });
}

function isPaymentSetupStage(value: unknown): value is PaymentSetupStage {
  return value === 'Not Started' || value === 'Applied' || value === 'Awaiting Approval' || value === 'Ready to Connect' || value === 'Live';
}

function buildPaymentsPayload(gateways: PaymentGateway[], manualMethods: ManualMethod[], rules: PaymentRule[]) {
  return {
    gateways: gateways.map((gateway) => ({
      slug: gateway.slug,
      status: gateway.status,
      mode: gateway.mode,
      setup_stage: gateway.setupStage,
      enabled_at_checkout: gateway.enabledAtCheckout,
      checkout_label: gateway.checkoutLabel,
    })),
    manual_methods: manualMethods.map((method) => ({
      slug: method.slug,
      enabled: method.enabled,
    })),
    rules,
  };
}

function buildShippingPayload(providers: ShippingProviderIntegration[], zones: ShippingZone[], routingRules: ShippingRoutingRule[]) {
  return {
    providers: providers.map((provider) => ({
      slug: provider.slug,
      status: provider.status,
      mode: provider.mode,
      enabled: provider.enabled,
      auto_tracking: provider.autoTracking,
    })),
    zones,
    routing_rules: routingRules,
  };
}

const shippingSimulationScenarios = [
  'Standard local order',
  'Express order + primary courier unavailable',
  'East Malaysia order',
  'International order',
  'Heavy parcel > 5kg',
];

const notificationChannelDefaults: Record<string, NotificationChannelDraft> = {
  Email: {
    senderLabel: 'Bisora Orders',
    subject: 'Your order is on its way',
    body: 'Hi {{customer_name}}, your parcel has been shipped and is now in transit. You can review the latest tracking update from your order page.',
    enabled: true,
    sendTiming: 'Immediately after shipment status update',
    trigger: 'Shipment marked as shipped',
  },
  SMS: {
    senderLabel: 'BISORA',
    subject: 'Shipment update',
    body: 'Hi {{customer_name}}, your order {{order_number}} is now on the way. Tracking updates are available in your order history.',
    enabled: true,
    sendTiming: 'Only for important milestones',
    trigger: 'Out for delivery / delivered',
  },
  WhatsApp: {
    senderLabel: 'Bisora Support',
    subject: 'WhatsApp shipment update',
    body: 'Hi {{customer_name}}, your order {{order_number}} has a new shipment update. Reply here if you need help.',
    enabled: true,
    sendTiming: 'For conversational support moments',
    trigger: 'Delivery exception / customer follow-up',
  },
};

const notificationEventTemplatesSeed: NotificationEventTemplate[] = [
  {
    id: 'nt-1',
    name: 'Order Confirmation',
    description: 'Send after successful order placement to acknowledge receipt and summarize the order.',
    status: 'Enabled',
    channels: {
      Email: {
        senderLabel: 'Bisora Orders',
        subject: 'Order {{order_number}} confirmed',
        body: 'Hi {{customer_name}}, your order {{order_number}} has been confirmed. We will notify you again when fulfillment moves forward.',
        enabled: true,
        sendTiming: 'Immediately after order placement',
        trigger: 'Order created',
      },
      SMS: {
        senderLabel: 'BISORA',
        subject: 'Order confirmation SMS',
        body: 'Your order {{order_number}} is confirmed. We will update you again when it ships.',
        enabled: false,
        sendTiming: 'Only if seller wants short confirmation',
        trigger: 'Order created',
      },
      WhatsApp: {
        senderLabel: 'Bisora Support',
        subject: 'Order confirmation WhatsApp',
        body: 'Hi {{customer_name}}, your order {{order_number}} is confirmed. Reply here if you need help.',
        enabled: false,
        sendTiming: 'Only for support-led stores',
        trigger: 'Order created',
      },
    },
    variables: ['{{customer_name}}', '{{order_number}}', '{{store_name}}', '{{store_url}}'],
  },
  {
    id: 'nt-2',
    name: 'Payment Confirmed / Invoice Ready',
    description: 'Send once payment is verified so customer can receive invoice or receipt details.',
    status: 'Enabled',
    channels: {
      Email: {
        senderLabel: 'Bisora Billing',
        subject: 'Payment received for {{order_number}}',
        body: 'Hi {{customer_name}}, payment for {{order_number}} has been received. Your invoice or receipt is now ready.',
        enabled: true,
        sendTiming: 'Immediately after payment confirmation',
        trigger: 'Payment confirmed',
      },
      SMS: {
        senderLabel: 'BISORA',
        subject: 'Payment confirmed SMS',
        body: 'Payment received for {{order_number}}. Check your email for invoice details.',
        enabled: false,
        sendTiming: 'Only for short confirmation',
        trigger: 'Payment confirmed',
      },
      WhatsApp: {
        senderLabel: 'Bisora Support',
        subject: 'Payment confirmed WhatsApp',
        body: 'Payment for {{order_number}} is confirmed. Your invoice details are ready.',
        enabled: false,
        sendTiming: 'Only for special support flow',
        trigger: 'Payment confirmed',
      },
    },
    variables: ['{{customer_name}}', '{{order_number}}', '{{invoice_url}}', '{{store_name}}'],
  },
  {
    id: 'nt-3',
    name: 'Order Packed',
    description: 'Send when packing is complete so customer knows the order is preparing to leave.',
    status: 'Enabled',
    channels: {
      Email: {
        senderLabel: 'Bisora Orders',
        subject: 'Your order {{order_number}} has been packed',
        body: 'Hi {{customer_name}}, your order {{order_number}} has been packed and is almost ready to ship.',
        enabled: true,
        sendTiming: 'After packing complete',
        trigger: 'Order packed',
      },
      SMS: {
        senderLabel: 'BISORA',
        subject: 'Packed SMS',
        body: 'Your order {{order_number}} has been packed and is preparing to ship.',
        enabled: false,
        sendTiming: 'Only if seller wants milestone SMS',
        trigger: 'Order packed',
      },
      WhatsApp: {
        senderLabel: 'Bisora Support',
        subject: 'Packed WhatsApp',
        body: 'Your order {{order_number}} is packed and moving to the next step.',
        enabled: false,
        sendTiming: 'Only for guided support flow',
        trigger: 'Order packed',
      },
    },
    variables: ['{{customer_name}}', '{{order_number}}', '{{store_name}}'],
  },
  {
    id: 'nt-4',
    name: 'Order Shipped',
    description: 'Send when a tracking number is assigned so customer can follow shipment progress.',
    status: 'Enabled',
    channels: {
      Email: {
        senderLabel: 'Bisora Shipping',
        subject: 'Your order {{order_number}} has shipped',
        body: 'Hi {{customer_name}}, your order {{order_number}} is now on the way. Tracking: {{tracking_number}}.',
        enabled: true,
        sendTiming: 'Immediately after shipment creation',
        trigger: 'Tracking assigned / shipped',
      },
      SMS: {
        senderLabel: 'BISORA',
        subject: 'Shipped SMS',
        body: 'Your order {{order_number}} has shipped. Tracking: {{tracking_number}}.',
        enabled: false,
        sendTiming: 'Only for important shipping updates',
        trigger: 'Tracking assigned / shipped',
      },
      WhatsApp: {
        senderLabel: 'Bisora Support',
        subject: 'Shipped WhatsApp',
        body: 'Your order {{order_number}} is on the way. Tracking: {{tracking_number}}.',
        enabled: false,
        sendTiming: 'Only if seller uses conversational delivery support',
        trigger: 'Tracking assigned / shipped',
      },
    },
    variables: ['{{customer_name}}', '{{order_number}}', '{{tracking_number}}', '{{tracking_url}}'],
  },
  {
    id: 'nt-5',
    name: 'Out for Delivery',
    description: 'Send when the parcel is on the final delivery leg and customer may need a quick heads-up.',
    status: 'Enabled',
    channels: {
      Email: {
        senderLabel: 'Bisora Shipping',
        subject: 'Your order {{order_number}} is out for delivery',
        body: 'Hi {{customer_name}}, your order {{order_number}} is out for delivery today.',
        enabled: false,
        sendTiming: 'Only if seller wants fuller written record',
        trigger: 'Out for delivery',
      },
      SMS: {
        senderLabel: 'BISORA',
        subject: 'Out for delivery SMS',
        body: 'Your order {{order_number}} is out for delivery today.',
        enabled: true,
        sendTiming: 'Immediately for urgent final-mile update',
        trigger: 'Out for delivery',
      },
      WhatsApp: {
        senderLabel: 'Bisora Support',
        subject: 'Out for delivery WhatsApp',
        body: 'Your order {{order_number}} is out for delivery. Reply here if you need help.',
        enabled: false,
        sendTiming: 'Only if seller wants reply-based final-mile support',
        trigger: 'Out for delivery',
      },
    },
    variables: ['{{customer_name}}', '{{order_number}}', '{{tracking_url}}'],
  },
  {
    id: 'nt-6',
    name: 'Delivery Exception',
    description: 'Send when delivery hits an issue so customer can react or contact support.',
    status: 'Disabled',
    channels: {
      Email: {
        senderLabel: 'Bisora Support',
        subject: 'There is an update on {{order_number}}',
        body: 'Hi {{customer_name}}, there is a delivery exception affecting {{order_number}}. We will help you resolve it.',
        enabled: false,
        sendTiming: 'Only when issue occurs',
        trigger: 'Delivery exception',
      },
      SMS: {
        senderLabel: 'BISORA',
        subject: 'Delivery exception SMS',
        body: 'There is a delivery update for {{order_number}}. Please review the latest shipment status.',
        enabled: false,
        sendTiming: 'Only for urgent exception alerts',
        trigger: 'Delivery exception',
      },
      WhatsApp: {
        senderLabel: 'Bisora Support',
        subject: 'Delivery exception WhatsApp',
        body: 'Hi {{customer_name}}, there is a delivery issue for {{order_number}}. Reply here if you need assistance.',
        enabled: true,
        sendTiming: 'Best when seller wants a support conversation',
        trigger: 'Delivery exception',
      },
    },
    variables: ['{{customer_name}}', '{{order_number}}', '{{tracking_number}}', '{{support_url}}'],
  },
];

function getGatewayStatusFromStage(stage: PaymentSetupStage): PaymentGateway['status'] {
  if (stage === 'Live') {
    return 'Connected';
  }
  if (stage === 'Applied' || stage === 'Awaiting Approval' || stage === 'Ready to Connect') {
    return 'Pending';
  }
  return 'Disconnected';
}

function getCourierStatusFromSetup(stage: CourierSetupStage, environment: 'Live' | 'Test'): CourierProvider['status'] {
  if (stage === 'Live' && environment === 'Live') {
    return 'Connected';
  }
  if (stage === 'Applied' || stage === 'Ready to Connect' || environment === 'Test') {
    return 'Sandbox';
  }
  return 'Disconnected';
}

function buildPaymentRuleTemplate(ruleName: string): PaymentRule {
  const normalized = ruleName.trim().toLowerCase();

  let condition = 'Define when this rule should apply';
  let action = 'Define what checkout should do';

  if (normalized.includes('vip')) {
    condition = 'Customer tag = VIP';
    action = 'Prioritize premium gateway';
  } else if (normalized.includes('cod')) {
    condition = 'Checkout timing / risk condition';
    action = 'Disable COD';
  } else if (normalized.includes('bank')) {
    condition = 'Order requires manual payment review';
    action = 'Show Bank Transfer only';
  } else if (normalized.includes('high') || normalized.includes('value')) {
    condition = 'Cart > RM 1,000';
    action = 'Force Card / Online Banking';
  }

  return {
    id: `pr-${Date.now()}`,
    name: ruleName,
    condition,
    action,
    status: 'Draft',
  };
}

function createPaymentRuleFromTemplate(template: PaymentRuleTemplateCard): PaymentRule {
  return {
    id: `pr-${Date.now()}`,
    name: template.name,
    condition: template.condition,
    action: template.action,
    status: 'Draft',
  };
}

function buildShippingRoutingRuleTemplate(ruleName: string): ShippingRoutingRule {
  const normalized = ruleName.trim().toLowerCase();

  let condition = 'Define when this routing rule should apply';
  let action = 'Define what routing should do';

  if (normalized.includes('semenanjung') || normalized.includes('malaysia')) {
    condition = 'Zone = Semenanjung';
    action = 'Use Ninja Van first';
  } else if (normalized.includes('east') || normalized.includes('sabah') || normalized.includes('sarawak')) {
    condition = 'Zone = Sabah & Sarawak';
    action = 'Prefer POS Malaysia or J&T EXPRESS (3-5 working days)';
  } else if (normalized.includes('express') || normalized.includes('fallback')) {
    condition = 'Express order + primary courier unavailable';
    action = 'Fallback to DHL Express';
  }

  return {
    id: `srr-${Date.now()}`,
    name: ruleName,
    condition,
    action,
    status: 'Draft',
  };
}

function createShippingRoutingRuleFromTemplate(template: ShippingRoutingTemplateCard): ShippingRoutingRule {
  return {
    id: `srr-${Date.now()}`,
    name: template.name,
    condition: template.condition,
    action: template.action,
    status: 'Draft',
  };
}

function getManualMethodToggleCopy(method: ManualMethod, enabled: boolean) {
  if (enabled) {
    return {
      title: `${method.name} enabled`,
      description:
        method.slug === 'cod'
          ? 'Customers can now choose COD at checkout, but the order must remain unpaid until delivery collection is confirmed.'
          : 'Customers can now choose Bank Transfer at checkout, but ops still needs transfer proof or reconciliation before marking the order paid.',
    };
  }

  return {
    title: `${method.name} disabled`,
    description:
      method.slug === 'cod'
        ? 'COD is now hidden from checkout, so new orders must use another payment path.'
        : 'Bank Transfer is now hidden from checkout, so new orders can no longer choose manual transfer approval.',
  };
}

export function SettingsModule({ section, subSection }: SettingsModuleProps) {
  const activeSection = normalizeSection(section);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  const [paymentGateways, setPaymentGateways] = useState(paymentGatewaysSeed);
  const [manualMethods, setManualMethods] = useState(manualMethodsSeed);
  const [paymentRules, setPaymentRules] = useState(paymentRulesSeed);

  const [shippingZones, setShippingZones] = useState(shippingZonesSeed);
  const [couriers, setCouriers] = useState(courierProvidersSeed);
  const [shippingProviders, setShippingProviders] = useState(shippingProviderIntegrationsSeed);
  const [shippingRoutingRules, setShippingRoutingRules] = useState(shippingRoutingRulesSeed);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<CourierProvider | null>(null);
  const [showShippingProviderModal, setShowShippingProviderModal] = useState(false);
  const [selectedShippingProvider, setSelectedShippingProvider] = useState<ShippingProviderIntegration | null>(null);

  const [integrations, setIntegrations] = useState(integrationsSeed);
  const [teamMembers, setTeamMembers] = useState(teamMembersSeed);
  const [apiKeys, setApiKeys] = useState(apiKeysSeed);
  const [webhooks, setWebhooks] = useState(webhooksSeed);

  useEffect(() => {
    if (!banner) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setBanner(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  const notify = (title: string, description: string) => setBanner({ title, description });

  useEffect(() => {
    if (!hasApiSession()) {
      return;
    }

    let cancelled = false;

    fetchStoreSettings()
      .then((settings) => {
        if (cancelled) {
          return;
        }

        setStoreSettings(settings);
        setPaymentGateways((current) => mergePaymentGatewaysFromSettings(current, settings.settings));
        setManualMethods((current) => mergeManualMethodsFromSettings(current, settings.settings));
        setPaymentRules((current) => mergePaymentRulesFromSettings(current, settings.settings));
        setCouriers((current) => mergeCouriersFromSettings(current, settings.settings));
        setShippingProviders((current) => mergeShippingProvidersFromSettings(current, settings.settings));
        setShippingZones((current) => mergeShippingZonesFromSettings(current, settings.settings));
        setShippingRoutingRules((current) => mergeShippingRoutingRulesFromSettings(current, settings.settings));
      })
      .catch(() => {
        if (!cancelled) {
          notify('Settings API unavailable', 'Using local defaults until the backend session is ready.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const persistSettingsPatch = async (patch: StoreSettingsPatch, successTitle: string, successDescription: string) => {
    if (!hasApiSession()) {
      notify(successTitle, `${successDescription} Local preview only until login is active.`);
      return;
    }

    try {
      const saved = await saveStoreSettings(patch);
      setStoreSettings(saved);
      notify(successTitle, successDescription);
    } catch {
      notify('Settings save failed', 'Backend could not save this change. Please try again after checking the API session.');
    }
  };

  const persistPayments = (
    nextGateways = paymentGateways,
    nextManualMethods = manualMethods,
    nextRules = paymentRules,
    successTitle = 'Payment settings saved',
    successDescription = 'Payment configuration has been synced to the backend.',
  ) =>
    persistSettingsPatch(
      { settings: { payments: buildPaymentsPayload(nextGateways, nextManualMethods, nextRules) } },
      successTitle,
      successDescription,
    );

  const persistShipping = (
    nextProviders = shippingProviders,
    nextZones = shippingZones,
    nextRoutingRules = shippingRoutingRules,
    successTitle = 'Shipping settings saved',
    successDescription = 'Shipping configuration has been synced to the backend.',
  ) =>
    persistSettingsPatch(
      { settings: { shipping: buildShippingPayload(nextProviders, nextZones, nextRoutingRules) } },
      successTitle,
      successDescription,
    );

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-on-surface-variant">Settings Module</p>
        <h1 className="text-4xl font-semibold tracking-tight text-on-surface">Settings</h1>
        <p className="max-w-3xl text-sm text-on-surface-variant">
          Manage core infrastructure, integrations, and operational controls from one central hub.
        </p>
      </header>

      <SectionNav activeSection={activeSection} />

      {banner ? <Banner title={banner.title} description={banner.description} /> : null}

      {activeSection === 'hub' ? (
        <SettingsHub />
      ) : null}

      {activeSection === 'general' ? (
        <GeneralSettingsPage
          storeSettings={storeSettings}
          onNotify={notify}
          onSave={(form) =>
            persistSettingsPatch(
              {
                name: form.storeName,
                currency: form.currency,
                timezone: form.timezone,
                settings: {
                  general: form,
                  contact_email: form.email,
                  notifications: mergeNotificationSettings(storeSettings?.settings?.notifications, {
                    seller_alert_email: form.sellerOrderAlertEmailEnabled ? form.sellerAlertEmail : null,
                    seller_alert_whatsapp: form.sellerOrderAlertWhatsAppEnabled ? form.sellerAlertWhatsApp : null,
                    seller_alert_only_after_payment: form.sellerOrderAlertOnlyAfterPayment,
                    seller_alert_roles: form.sellerAlertRoles,
                    providers: buildNotificationProviderSettings(form),
                  }),
                },
              },
              'General settings saved',
              'Store identity and default preferences updated.',
            )
          }
        />
      ) : null}

      {activeSection === 'checkout' ? (
        <CheckoutSettingsPage
          storeSettings={storeSettings}
          onNotify={notify}
          onSave={(form) =>
            persistSettingsPatch(
              { settings: { checkout: form } },
              'Checkout settings saved',
              'Checkout form and method preferences updated.',
            )
          }
        />
      ) : null}

      {activeSection === 'domain-branding' ? (
        <DomainBrandingPage
          storeSettings={storeSettings}
          onPublish={async () => {
            if (!hasApiSession()) {
              notify('Storefront publish needs login', 'Login first so Bisora can publish this storefront.');
              return;
            }
            try {
              const saved = await publishStorefront();
              setStoreSettings(saved);
              notify('Storefront published', 'Your storefront is live and the launch checklist has been updated.');
            } catch {
              notify('Publish failed', 'Backend could not publish the storefront. Please check the API session.');
            }
          }}
          onSave={(form) =>
            persistSettingsPatch(
              {
                managedDomain: form.subdomain,
                customDomain: form.domain,
                settings: { branding: form },
              },
              'Domain & branding saved',
              'Storefront branding configuration updated.',
            )
          }
          onUnpublish={async () => {
            if (!hasApiSession()) {
              notify('Storefront unpublish needs login', 'Login first so Bisora can update storefront status.');
              return;
            }
            try {
              const saved = await unpublishStorefront();
              setStoreSettings(saved);
              notify('Storefront moved to draft', 'The storefront is no longer marked as live.');
            } catch {
              notify('Unpublish failed', 'Backend could not update storefront status. Please check the API session.');
            }
          }}
        />
      ) : null}

      {activeSection === 'payments' ? (
        <PaymentsSettingsPage
          gateways={paymentGateways}
          manualMethods={manualMethods}
          rules={paymentRules}
          subSection={subSection}
          onOpenGateway={(gatewaySlug) => (window.location.hash = `/settings/payments/${gatewaySlug}`)}
          onConnectGateway={(gatewayId) =>
            setPaymentGateways((current) => {
              const next: PaymentGateway[] = current.map((gateway) =>
                gateway.id === gatewayId
                  ? { ...gateway, status: 'Pending' as const, mode: 'Test' as const, enabledAtCheckout: false, setupStage: 'Applied' as const }
                  : gateway,
              );
              void persistPayments(next, manualMethods, paymentRules, 'Gateway setup started', 'Gateway setup state has been synced.');
              return next;
            })
          }
          onToggleManual={(id) =>
            setManualMethods((current) => {
              const target = current.find((method) => method.id === id);
              const next = current.map((method) => (method.id === id ? { ...method, enabled: !method.enabled } : method));
              if (target) {
                const nextEnabled = !target.enabled;
                const copy = getManualMethodToggleCopy(target, nextEnabled);
                void persistPayments(paymentGateways, next, paymentRules, copy.title, copy.description);
              }

              return next;
            })
          }
          onToggleRule={(id) =>
            setPaymentRules((current) => {
              const next: PaymentRule[] = current.map((rule) => (rule.id === id ? { ...rule, status: rule.status === 'Active' ? 'Draft' : 'Active' } : rule));
              void persistPayments(paymentGateways, manualMethods, next, 'Payment rule updated', 'Rule status has been synced to the backend.');
              return next;
            })
          }
          onDeleteRule={(id) =>
            setPaymentRules((current) => {
              const next = current.filter((rule) => rule.id !== id);
              void persistPayments(paymentGateways, manualMethods, next, 'Payment rule deleted', 'Rule stack has been synced to the backend.');
              return next;
            })
          }
          onDuplicateRule={(id) => {
            const target = paymentRules.find((rule) => rule.id === id);
            if (!target) {
              return null;
            }

            const duplicatedRule: PaymentRule = {
              ...target,
              id: `pr-${Date.now()}`,
              name: `${target.name} Copy`,
              status: 'Draft',
            };

            setPaymentRules((current) => {
              const next = [...current, duplicatedRule];
              void persistPayments(paymentGateways, manualMethods, next, 'Payment rule duplicated', `${duplicatedRule.name} added as a draft copy.`);
              return next;
            });
            return duplicatedRule;
          }}
          onCreateRuleFromTemplate={(template) => {
            const createdRule = createPaymentRuleFromTemplate(template);
            setPaymentRules((current) => {
              const next = [...current, createdRule];
              void persistPayments(paymentGateways, manualMethods, next, 'Recommended rule added', `${createdRule.name} was added as a draft template.`);
              return next;
            });
            return createdRule;
          }}
          onUpdateRule={(id, payload) => {
            setPaymentRules((current) => {
              const next = current.map((rule) =>
                rule.id === id
                  ? {
                      ...rule,
                      name: payload.name,
                      condition: payload.condition,
                      action: payload.action,
                    }
                  : rule,
              );
              void persistPayments(paymentGateways, manualMethods, next, 'Payment rule updated', `${payload.name} has been saved.`);
              return next;
            });
          }}
          onSaveGateway={(gatewaySlug, payload) => {
            const target = paymentGateways.find((gateway) => gateway.slug === gatewaySlug);
            setPaymentGateways((current) => {
              const next: PaymentGateway[] = current.map((gateway) =>
                gateway.slug === gatewaySlug
                  ? {
                      ...gateway,
                      checkoutLabel: payload.checkoutLabel,
                      mode: payload.environment,
                      setupStage: payload.setupStage,
                      status: getGatewayStatusFromStage(payload.setupStage),
                      enabledAtCheckout:
                        payload.setupStage === 'Live' || payload.setupStage === 'Ready to Connect'
                          ? payload.enabledAtCheckout
                          : false,
                    }
                  : gateway,
              );
              void persistPayments(
                next,
                manualMethods,
                paymentRules,
                `${target?.name ?? 'Gateway'} updated`,
                payload.setupStage === 'Live' || payload.setupStage === 'Ready to Connect'
                  ? `Environment saved and checkout availability ${payload.enabledAtCheckout ? 'enabled' : 'disabled'}.`
                  : 'Progress and environment saved. Enable at checkout will stay off until setup is ready.',
              );
              return next;
            });
          }}
          onCreateRule={(ruleName) => {
            const newRule = buildPaymentRuleTemplate(ruleName);
            setPaymentRules((current) => {
              const next = [...current, newRule];
              void persistPayments(paymentGateways, manualMethods, next, 'Payment rule created', `${ruleName} added to rule stack.`);
              return next;
            });
            return newRule;
          }}
        />
      ) : null}

      {activeSection === 'shipping-logistics' ? (
        <ShippingSettingsPage
          couriers={couriers}
          providers={shippingProviders}
          routingRules={shippingRoutingRules}
          zones={shippingZones}
          subSection={subSection}
          onAddZone={() => {
            const newZone: ShippingZone = {
              id: `sz-${Date.now()}`,
              name: 'New Zone',
              regions: ['Malaysia'],
              methods: ['Standard Delivery'],
              weightRates: [{ id: `wr-${Date.now()}`, name: 'Standard Delivery', range: '0.10kg - 1.00kg', rate: 'MYR5.00' }],
              priceRates: [{ id: `pr-${Date.now()}`, name: 'Standard Delivery', range: 'MYR0.00 - MYR99.00', rate: 'MYR5.00' }],
            };
            setShippingZones((current) => {
              const next = [...current, newZone];
              void persistShipping(shippingProviders, next, shippingRoutingRules, 'Zone created', 'New shipping zone was added.');
              return next;
            });
            return newZone;
          }}
          onConfigureCourier={(id) => {
            const found = couriers.find((courier) => courier.id === id) ?? null;
            setSelectedCourier(found);
            setShowCourierModal(true);
          }}
          onRunSimulation={() => notify('Simulation executed', 'Shipping route test completed with no fatal errors.')}
          onOpenShippingProvider={(id) => {
            const found = shippingProviders.find((provider) => provider.id === id) ?? null;
            setSelectedShippingProvider(found);
            setShowShippingProviderModal(true);
          }}
          onQuickActivateShippingProvider={(id) => {
            const target = shippingProviders.find((provider) => provider.id === id);
            if (!target) {
              return;
            }

            setShippingProviders((current) => {
              const next: ShippingProviderIntegration[] = current.map((provider) =>
                provider.id === id
                  ? {
                      ...provider,
                      enabled: true,
                      status: 'Sandbox' as const,
                      mode: 'Test' as const,
                    }
                  : provider,
              );
              void persistShipping(next, shippingZones, shippingRoutingRules, `${target.name} activated`, 'Provider moved into test setup so seller can continue configuration.');
              return next;
            });
          }}
          onSaveZone={(zoneId, payload) => {
            setShippingZones((current) => {
              const exists = current.some((zone) => zone.id === zoneId);
              const next = !exists
                ? [...current, payload]
                : current.map((zone) =>
                zone.id === zoneId
                  ? {
                      ...zone,
                      ...payload,
                    }
                  : zone,
              );
              void persistShipping(shippingProviders, next, shippingRoutingRules, 'Shipping zone updated', `${payload.name} has been saved.`);
              return next;
            });
          }}
          onToggleRoutingRule={(id) =>
            setShippingRoutingRules((current) => {
              const next: ShippingRoutingRule[] = current.map((rule) => (rule.id === id ? { ...rule, status: rule.status === 'Active' ? 'Draft' : 'Active' } : rule));
              void persistShipping(shippingProviders, shippingZones, next, 'Routing rule updated', 'Routing status has been synced to the backend.');
              return next;
            })
          }
          onDeleteRoutingRule={(id) =>
            setShippingRoutingRules((current) => {
              const next = current.filter((rule) => rule.id !== id);
              void persistShipping(shippingProviders, shippingZones, next, 'Routing rule deleted', 'Routing stack has been synced to the backend.');
              return next;
            })
          }
          onUpdateRoutingRule={(id, payload) => {
            setShippingRoutingRules((current) => {
              const next = current.map((rule) =>
                rule.id === id
                  ? {
                      ...rule,
                      name: payload.name,
                      condition: payload.condition,
                      action: payload.action,
                    }
                  : rule,
              );
              void persistShipping(shippingProviders, shippingZones, next, 'Routing rule updated', `${payload.name} has been saved.`);
              return next;
            });
          }}
          onCreateRoutingRule={(ruleName) => {
            const newRule = buildShippingRoutingRuleTemplate(ruleName);
            setShippingRoutingRules((current) => {
              const next = [...current, newRule];
              void persistShipping(shippingProviders, shippingZones, next, 'Routing rule created', `${ruleName} added to routing stack.`);
              return next;
            });
            return newRule;
          }}
          onDuplicateRoutingRule={(id) => {
            const target = shippingRoutingRules.find((rule) => rule.id === id);
            if (!target) {
              return null;
            }

            const duplicatedRule: ShippingRoutingRule = {
              ...target,
              id: `srr-${Date.now()}`,
              name: `${target.name} Copy`,
              status: 'Draft',
            };

            setShippingRoutingRules((current) => {
              const next = [...current, duplicatedRule];
              void persistShipping(shippingProviders, shippingZones, next, 'Routing rule duplicated', `${duplicatedRule.name} added as a draft copy.`);
              return next;
            });
            return duplicatedRule;
          }}
          onCreateRoutingRuleFromTemplate={(template) => {
            const createdRule = createShippingRoutingRuleFromTemplate(template);
            setShippingRoutingRules((current) => {
              const next = [...current, createdRule];
              void persistShipping(shippingProviders, shippingZones, next, 'Recommended routing rule added', `${createdRule.name} was added as a draft template.`);
              return next;
            });
            return createdRule;
          }}
        />
      ) : null}

      {activeSection === 'notifications' ? (
        <NotificationsSettingsPage
          subSection={subSection}
          notify={notify}
          onSave={(name, patch) => {
            if (patch) {
              void persistSettingsPatch(
                { settings: { notifications: mergeNotificationSettings(storeSettings?.settings?.notifications, patch) } },
                `${name} saved`,
                'Notification configuration has been synced to the backend.',
              );
              return;
            }

            notify(`${name} saved`, 'Notification configuration has been updated.');
          }}
          onSendTest={async (channel) => {
            if (!hasApiSession()) {
              notify('Test queued locally', `${channel} test notification will sync after login is active.`);
              return;
            }

            try {
              await queueTestNotification(channel);
              notify('Test queued', `${channel} test notification was added to the automation queue.`);
            } catch (error) {
              const message = error instanceof ApiError ? error.message : 'Backend could not queue the test notification. Check provider settings and API session.';
              notify('Test send failed', message);
            }
          }}
        />
      ) : null}

      {activeSection === 'integrations' ? (
        <IntegrationsSettingsPage
          items={integrations}
          storeSettings={storeSettings}
          subSection={subSection}
          onOpenIntegration={(id) => (window.location.hash = `/settings/integrations/${id}`)}
          onToggleConnection={(id) =>
            setIntegrations((current) =>
              current.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status: item.status === 'Connected' ? 'Not Connected' : 'Connected',
                    }
                  : item,
              ),
            )
          }
          onSave={(name, patch) => {
            if (patch) {
              void persistSettingsPatch(
                { settings: { notifications: mergeNotificationSettings(storeSettings?.settings?.notifications, patch) } },
                `${name} saved`,
                'Messaging provider setup has been synced to the backend.',
              );
              return;
            }

            notify(`${name} saved`, 'Integration settings have been updated.');
          }}
        />
      ) : null}

      {activeSection === 'staff-roles' ? (
        <StaffRolesPage
          members={teamMembers}
          onResendInvite={(member) => notify('Invite resent', `A fresh invite email was sent to ${member.name}.`)}
          onInviteMember={(payload) =>
            setTeamMembers((current) => [
              ...current,
              {
                id: `tm-${Date.now()}`,
                name: payload.name,
                email: payload.email,
                role: payload.role,
                status: 'Invited',
                avatarUrl: 'https://picsum.photos/seed/staff-new/72/72',
                },
              ])
          }
          onUpdateMemberRole={(memberId, role) => {
            setTeamMembers((current) =>
              current.map((member) =>
                member.id === memberId
                  ? {
                      ...member,
                      role,
                    }
                  : member,
              ),
            );
            const updatedMember = teamMembers.find((member) => member.id === memberId);
            notify('Role updated', `${updatedMember?.name ?? 'Team member'} is now assigned to ${role}.`);
          }}
        />
      ) : null}

      {activeSection === 'developer' ? (
        <DeveloperPage
          apiKeys={apiKeys}
          webhooks={webhooks}
          onGenerateApiKey={(payload) =>
            setApiKeys((current) => [
              ...current,
              {
                id: `ak-${Date.now()}`,
                name: payload.name,
                keyMasked: `sk_live_xxx...${Math.floor(Math.random() * 899 + 100)}`,
                scope: payload.scope,
                createdAt: new Date().toLocaleDateString('en-US'),
                status: 'Active',
              },
            ])
          }
          onToggleWebhook={(id) =>
            setWebhooks((current) =>
              current.map((hook) => (hook.id === id ? { ...hook, status: hook.status === 'Active' ? 'Paused' : 'Active' } : hook)),
            )
          }
          onSendTestEvent={() => notify('Test event sent', 'Webhook test payload delivered to selected endpoint.')}
        />
      ) : null}

      {showCourierModal && selectedCourier ? (
        <CourierConfigModal
          courier={selectedCourier}
          onClose={() => {
            setSelectedCourier(null);
            setShowCourierModal(false);
          }}
          onSave={(payload) => {
            setCouriers((current) => {
              const next = current.map((courier) =>
                courier.id === selectedCourier.id
                  ? {
                      ...courier,
                      mode: payload.environment,
                      setupStage: payload.setupStage,
                      status: getCourierStatusFromSetup(payload.setupStage, payload.environment),
                      enabledForRouting:
                        payload.setupStage === 'Ready to Connect' || payload.setupStage === 'Live'
                          ? payload.enabledForRouting
                          : false,
                    }
                  : courier,
              );
              void persistSettingsPatch(
                { settings: { couriers: next } },
                `${selectedCourier.name} updated`,
                payload.setupStage === 'Ready to Connect' || payload.setupStage === 'Live'
                  ? `Courier environment saved and routing availability ${payload.enabledForRouting ? 'enabled' : 'kept off'}.`
                  : 'Courier progress saved. Routing stays off until setup is ready.',
              );
              return next;
            });
            setShowCourierModal(false);
          }}
        />
      ) : null}

      {showShippingProviderModal && selectedShippingProvider ? (
        <ShippingProviderConfigModal
          provider={selectedShippingProvider}
          onClose={() => {
            setSelectedShippingProvider(null);
            setShowShippingProviderModal(false);
          }}
          onSave={(payload) => {
            setShippingProviders((current) => {
              const next: ShippingProviderIntegration[] = current.map((provider) =>
                provider.id === selectedShippingProvider.id
                  ? {
                      ...provider,
                      mode: payload.environment,
                      enabled: payload.enabled,
                      autoTracking: payload.autoTracking,
                      status: payload.enabled ? (payload.environment === 'Live' ? 'Connected' : 'Sandbox') : 'Disabled',
                    }
                  : provider,
              );
              void persistShipping(
                next,
                shippingZones,
                shippingRoutingRules,
                `${selectedShippingProvider.name} updated`,
                payload.enabled
                  ? `${selectedShippingProvider.name} is saved in ${payload.environment} mode with provider sync enabled.`
                  : `${selectedShippingProvider.name} settings saved but provider remains disabled.`,
              );
              return next;
            });
            setShowShippingProviderModal(false);
          }}
        />
      ) : null}
    </section>
  );
}

function SectionNav({ activeSection }: { activeSection: SettingsSection }) {
  const links: Array<{ key: SettingsSection; label: string }> = [
    { key: 'hub', label: 'Hub' },
    { key: 'general', label: 'General' },
    { key: 'checkout', label: 'Checkout' },
    { key: 'domain-branding', label: 'Domain & Branding' },
    { key: 'payments', label: 'Payments' },
    { key: 'shipping-logistics', label: 'Shipping & Logistics' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'staff-roles', label: 'Staff & Roles' },
    { key: 'developer', label: 'Developer' },
  ];

  return (
    <nav className="rounded-2xl border border-outline-variant/20 bg-surface-lowest/90 p-2 shadow-sm">
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.key}>
            <a
              className={`inline-flex rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                activeSection === link.key
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
              }`}
              href={link.key === 'hub' ? '#/settings' : `#/settings/${link.key}`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SettingsHub() {
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof settingsHubCards>();
    settingsHubCards.forEach((card) => {
      const list = groups.get(card.group) ?? [];
      list.push(card);
      groups.set(card.group, list);
    });
    return groups;
  }, []);

  const sectionMeta: Record<
    Exclude<SettingsSection, 'hub'>,
    { status: string; summary: string; metric: string }
  > = {
    general: {
      status: 'Configured',
      summary: 'Store identity and regional defaults are aligned.',
      metric: '5 blocks ready',
    },
    checkout: {
      status: 'Optimized',
      summary: 'Form, methods, summary logic, and add-on flow are active.',
      metric: '3 payment routes',
    },
    'domain-branding': {
      status: 'Synced',
      summary: 'Domain, logo system, and theme tokens are in sync.',
      metric: 'Preview live',
    },
    payments: {
      status: 'Healthy',
      summary: 'Gateways and rules engine are ready for live wiring.',
      metric: '2 gateways live',
    },
    'shipping-logistics': {
      status: 'Stable',
      summary: 'Zones, courier routing, and API hooks are prepared.',
      metric: '3 courier states',
    },
    notifications: {
      status: 'Ready',
      summary: 'Email, SMS, WhatsApp, and AI timing controls are set.',
      metric: '4 channels',
    },
    integrations: {
      status: 'Connected',
      summary: 'Tracking and messaging integrations are organized centrally.',
      metric: '8 connectors',
    },
    'staff-roles': {
      status: 'Managed',
      summary: 'Roles, permissions, and activity controls are structured.',
      metric: '2 active roles',
    },
    developer: {
      status: 'Secured',
      summary: 'API keys, webhooks, and test console are prepared for backend.',
      metric: '2 active keys',
    },
  };

  const prioritySections = settingsHubCards.filter((card) =>
    ['payments', 'shipping-logistics', 'integrations'].includes(card.key),
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_300px]">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-outline-variant/20 bg-[linear-gradient(135deg,rgba(79,70,229,0.10),rgba(255,255,255,0.96)_42%,rgba(15,23,42,0.05))] p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">Operational Backbone</p>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-on-surface">One settings workspace, clear system control.</h2>
                <p className="max-w-xl text-sm leading-6 text-on-surface-variant">
                  Hub ni sekarang fokus pada readiness dan quick actions. Navigation atas kekal sebagai jalan masuk utama,
                  jadi bawah ni kita guna untuk ringkasan operasi, bukan ulang menu sekali lagi.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-sm hover:bg-primary-dim"
                  href="#/settings/payments"
                >
                  Review Payments
                </a>
                <a
                  className="rounded-full border border-outline-variant/30 bg-surface-lowest px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-low"
                  href="#/settings/shipping-logistics"
                >
                  Open Shipping Setup
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="min-w-[150px] rounded-2xl border border-white/50 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">Readiness</p>
                <p className="mt-2 text-2xl font-semibold text-on-surface">91%</p>
                <p className="mt-1 text-xs text-on-surface-variant">Core settings blocks configured</p>
              </div>
              <div className="min-w-[150px] rounded-2xl border border-white/50 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">Live Systems</p>
                <p className="mt-2 text-2xl font-semibold text-on-surface">6</p>
                <p className="mt-1 text-xs text-on-surface-variant">Payments, messaging, and ops links active</p>
              </div>
              <div className="min-w-[150px] rounded-2xl border border-white/50 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">Needs Review</p>
                <p className="mt-2 text-2xl font-semibold text-on-surface">2</p>
                <p className="mt-1 text-xs text-on-surface-variant">Final backend connection and production checks</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Panel title="Priority Workspaces">
            <div className="space-y-3">
              {prioritySections.map((card) => (
                <a
                  className="flex items-start justify-between gap-4 rounded-2xl border border-outline-variant/20 bg-surface-lowest px-4 py-4 transition hover:border-primary/25 hover:bg-surface-low"
                  href={`#/settings/${card.key}`}
                  key={card.key}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-on-surface">{card.title}</p>
                      <StatusBadge tone="success">{sectionMeta[card.key].status}</StatusBadge>
                    </div>
                    <p className="text-sm text-on-surface-variant">{sectionMeta[card.key].summary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant">Focus</p>
                    <p className="text-sm font-medium text-on-surface">{sectionMeta[card.key].metric}</p>
                  </div>
                </a>
              ))}
            </div>
          </Panel>

          <Panel title="Quick Control">
            <div className="grid gap-3 sm:grid-cols-2">
              <a className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 hover:bg-surface-low" href="#/settings/general">
                <p className="text-sm font-medium">Store Identity</p>
                <p className="mt-1 text-xs text-on-surface-variant">Name, support email, timezone, and defaults.</p>
              </a>
              <a className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 hover:bg-surface-low" href="#/settings/notifications">
                <p className="text-sm font-medium">Notifications</p>
                <p className="mt-1 text-xs text-on-surface-variant">Shipment updates across email, SMS, and WhatsApp.</p>
              </a>
              <a className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 hover:bg-surface-low" href="#/settings/staff-roles">
                <p className="text-sm font-medium">Team Access</p>
                <p className="mt-1 text-xs text-on-surface-variant">Roles, invites, and permission structure.</p>
              </a>
              <a className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 hover:bg-surface-low" href="#/settings/developer">
                <p className="text-sm font-medium">Developer Tools</p>
                <p className="mt-1 text-xs text-on-surface-variant">API keys, webhooks, and test console.</p>
              </a>
            </div>
          </Panel>
        </section>

        {[...grouped.entries()].map(([group, cards]) => (
          <section className="space-y-3" key={group}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">{group}</p>
                <p className="mt-1 text-sm text-on-surface-variant">Core settings grouped by operational responsibility.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <a
                  className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  href={`#/settings/${card.key}`}
                  key={card.key}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-on-surface">{card.title}</p>
                      <p className="mt-1 text-sm leading-6 text-on-surface-variant">{card.description}</p>
                    </div>
                    <StatusBadge tone={card.key === 'payments' || card.key === 'integrations' ? 'success' : 'neutral'}>
                      {sectionMeta[card.key].status}
                    </StatusBadge>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-outline-variant/15 pt-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Snapshot</p>
                      <p className="text-sm font-medium text-on-surface">{sectionMeta[card.key].metric}</p>
                    </div>
                    <span className="text-xs font-medium text-primary">Open section</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>

      <aside className="space-y-4">
        <Panel title="System Health">
          <div className="space-y-2 text-sm">
            <StatRow label="Infrastructure" value="Healthy" />
            <StatRow label="Payment Sync" value="Connected" />
            <StatRow label="Courier APIs" value="Stable" />
            <StatRow label="Notification Queue" value="Ready" />
          </div>
        </Panel>

        <Panel title="Recommended Next">
          <div className="space-y-3">
            <div className="rounded-2xl border border-warning/20 bg-warning/5 p-3">
              <p className="text-sm font-medium text-on-surface">Finalize production credentials</p>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">SecurePay, Stripe, and courier API connections should be reviewed before live launch.</p>
            </div>
            <a className="block rounded-xl border border-outline-variant/20 px-3 py-2 text-sm font-medium hover:bg-surface-low" href="#/settings/payments/securepay">
              Review SecurePay
            </a>
            <a className="block rounded-xl border border-outline-variant/20 px-3 py-2 text-sm font-medium hover:bg-surface-low" href="#/settings/shipping-logistics/api">
              Open Courier APIs
            </a>
          </div>
        </Panel>

        <Panel title="Gateway Support">
          <p className="text-sm leading-6 text-on-surface-variant">Need help connecting external systems to your store operations?</p>
          <button className="mt-3 w-full rounded-xl bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => setShowAssistantModal(true)} type="button">
            Contact Assistant
          </button>
        </Panel>

        <div className="rounded-3xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm">
          <p className="text-sm font-medium text-on-surface">Settings Concierge</p>
          <p className="mt-1 text-xs leading-5 text-on-surface-variant">
            Keep operations clean, premium, and launch-ready by treating settings as one connected control layer.
          </p>
          <div className="mt-4 space-y-2">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
              <p className="text-xs uppercase tracking-wide text-on-surface-variant">Launch path</p>
              <p className="mt-1 text-sm text-on-surface">General &gt; Payments &gt; Shipping &gt; Notifications &gt; Integrations</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
              <p className="text-xs uppercase tracking-wide text-on-surface-variant">Operator reminder</p>
              <p className="mt-1 text-sm text-on-surface-variant">Finish customer-facing setup first, then move into staff and developer controls only when needed.</p>
            </div>
          </div>
        </div>
      </aside>
      {showAssistantModal ? <SettingsAssistantModal onClose={() => setShowAssistantModal(false)} /> : null}
    </div>
  );
}

function SettingsAssistantModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-outline-variant/20 bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-on-surface">Settings Assistant</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Pick the setup path you need help with. This is a guided launcher, not a fake live chat.
            </p>
          </div>
          <button className="rounded border border-outline-variant/20 px-3 py-1.5 text-sm hover:bg-surface-low" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <a className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4 transition hover:border-primary/25 hover:bg-surface" href="#/settings/payments" onClick={onClose}>
            <p className="text-sm font-medium text-on-surface">Payments setup help</p>
            <p className="mt-2 text-sm text-on-surface-variant">Gateway setup, checkout payment paths, or manual payment guidance.</p>
          </a>
          <a className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4 transition hover:border-primary/25 hover:bg-surface" href="#/settings/shipping-logistics" onClick={onClose}>
            <p className="text-sm font-medium text-on-surface">Shipping and courier help</p>
            <p className="mt-2 text-sm text-on-surface-variant">Zones, delivery methods, courier routing, and shipping connection steps.</p>
          </a>
          <a className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4 transition hover:border-primary/25 hover:bg-surface" href="#/settings/integrations" onClick={onClose}>
            <p className="text-sm font-medium text-on-surface">Integrations and technical help</p>
            <p className="mt-2 text-sm text-on-surface-variant">Email, WhatsApp, tracking, analytics, API, and webhook setup paths.</p>
          </a>
        </div>

        <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-medium">Best starting order</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Most stores should finish payments first, then shipping, then notifications and integrations. This keeps checkout and fulfillment flow stable before advanced setup starts.
          </p>
        </div>
      </div>
    </div>
  );
}

function GeneralSettingsPage({
  storeSettings,
  onSave,
  onNotify,
}: {
  storeSettings: StoreSettings | null;
  onSave: (form: GeneralSettingsForm) => void;
  onNotify: (title: string, description: string) => void;
}) {
  const initialState = useMemo<GeneralSettingsForm>(() => {
    const savedGeneral = (storeSettings?.settings.general ?? {}) as Partial<GeneralSettingsForm>;

    return {
    storeName: savedGeneral.storeName ?? storeSettings?.name ?? 'Atelier Admin',
    tagline: savedGeneral.tagline ?? 'Luxury Muslimah Fashion',
    legalName: 'Atelier Commerce Sdn. Bhd.',
    supportName: 'Sarah Admin',
    email: savedGeneral.email ?? (storeSettings?.settings.contact_email as string | undefined) ?? 'concierge@lumiere.noor',
    phone: '+60 12 345 6789',
    supportHours: 'Mon-Sat, 9:00 AM - 7:00 PM',
    address: 'Bukit Tinggi, Kuala Lumpur',
    country: 'Malaysia',
    currency: storeSettings?.currency ?? 'MYR',
    language: 'English',
    timezone: storeSettings?.timezone ?? 'Asia/Kuala_Lumpur',
    sellerAlertEmail: 'ops@atelier.noor',
    sellerAlertWhatsApp: '+60 12 345 6789',
    sellerOrderAlertEmailEnabled: true,
    sellerOrderAlertWhatsAppEnabled: false,
    sellerOrderAlertOnlyAfterPayment: true,
    sellerAlertRoles: ['Store Manager', 'Fulfillment'],
    orderPrefix: 'AT',
    autoConfirm: true,
    autoCancel: false,
    autoCancelHours: '72',
    lowStockThreshold: '5',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    dataRefresh: 'Every 5 mins',
    compactMode: false,
    internalAlerts: true,
    ...savedGeneral,
    };
  }, [storeSettings]);

  const [form, setForm] = useState(initialState);
  const [savedState, setSavedState] = useState(initialState);
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedState);

  useEffect(() => {
    setForm(initialState);
    setSavedState(initialState);
  }, [initialState]);

  const updateField = <K extends keyof typeof initialState>(key: K, value: (typeof initialState)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const discardChanges = () => {
    setForm(savedState);
    onNotify('Changes discarded', 'General settings were reverted to the latest saved version.');
  };

  const restoreRecommended = () => {
    const recommendedState = {
      ...savedState,
      autoCancel: true,
      autoCancelHours: '48',
      lowStockThreshold: '3',
      compactMode: true,
    };
    setForm(recommendedState);
    setSavedState(recommendedState);
    onNotify('Recommended profile applied', 'Suggested defaults were applied and saved for this general setup.');
  };

  const handleSave = () => {
    setSavedState(form);
    onSave(form);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        {isDirty ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface">You have unsaved changes</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Review this section, then save or discard before moving on.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low"
                onClick={discardChanges}
                type="button"
              >
                Discard Changes
              </button>
              <button
                className="rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low"
                onClick={restoreRecommended}
                type="button"
              >
                Apply Recommended
              </button>
              <button
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
                onClick={handleSave}
                type="button"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant/20 bg-surface-lowest px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface">General operations control</p>
              <p className="text-sm text-on-surface-variant">Store identity and defaults are currently up to date.</p>
            </div>
            <button
              className="w-fit rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low"
              onClick={restoreRecommended}
              type="button"
            >
              Apply Recommended
            </button>
          </div>
        )}

        <Panel title="Store Identity">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Store Name">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('storeName', event.target.value)}
                value={form.storeName}
              />
            </Field>
            <Field label="Display Tagline">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('tagline', event.target.value)}
                value={form.tagline}
              />
            </Field>
            <Field label="Legal Business Name">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('legalName', event.target.value)}
                value={form.legalName}
              />
            </Field>
            <Field label="Primary Operator">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('supportName', event.target.value)}
                value={form.supportName}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Contact Information">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Support Email">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('email', event.target.value)}
                value={form.email}
              />
            </Field>
            <Field label="Phone Number">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('phone', event.target.value)}
                value={form.phone}
              />
            </Field>
            <Field label="Support Hours">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('supportHours', event.target.value)}
                value={form.supportHours}
              />
            </Field>
            <Field label="Business Address">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('address', event.target.value)}
                value={form.address}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Seller Order Alerts">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">What this is for</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              These alerts are for the seller or ops team, not for customers. Use them so the merchant knows a new storefront order is ready to review, fulfill, or ship.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-xs text-on-surface-variant">
                To send real email or WhatsApp alerts, connect the delivery provider first in Integrations &gt; Messaging.
              </p>
              <button
                className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface"
                onClick={() => (window.location.hash = '/settings/integrations/messaging')}
                type="button"
              >
                Open Messaging Integrations
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Seller Alert Email">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('sellerAlertEmail', event.target.value)}
                value={form.sellerAlertEmail}
              />
            </Field>
            <Field label="Seller Alert WhatsApp">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('sellerAlertWhatsApp', event.target.value)}
                value={form.sellerAlertWhatsApp}
              />
            </Field>
          </div>
          <div className="mt-4 space-y-3">
            <ToggleRow checked={form.sellerOrderAlertEmailEnabled} label="Send seller alert by email" onChange={(checked) => updateField('sellerOrderAlertEmailEnabled', checked)} />
            <ToggleRow checked={form.sellerOrderAlertWhatsAppEnabled} label="Send seller alert by WhatsApp" onChange={(checked) => updateField('sellerOrderAlertWhatsAppEnabled', checked)} />
            <ToggleRow
              checked={form.sellerOrderAlertOnlyAfterPayment}
              label="Only alert seller after payment is verified"
              onChange={(checked) => updateField('sellerOrderAlertOnlyAfterPayment', checked)}
            />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-medium">Email alert note</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Email is usually the easiest and lower-cost default for seller order alerts, especially for stores that only need ops notification and order review flow.
              </p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-medium">WhatsApp alert note</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                WhatsApp usually needs a connected provider and may create messaging cost. Use it when seller wants faster ops alerts, not as a free-by-default path.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-surface p-4">
            <p className="text-sm font-medium">Who should receive this alert</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Select the role presets that should receive internal order alerts. Backend delivery can later map these roles to the real staff email or WhatsApp destination.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {roleCards.map((role) => {
                const checked = form.sellerAlertRoles.includes(role.name);
                return (
                  <label className="flex items-start gap-3 rounded-2xl border border-outline-variant/20 bg-surface-low px-3 py-3 text-sm" key={role.id}>
                    <input
                      checked={checked}
                      className="mt-1 h-4 w-4 rounded border-outline-variant/30"
                      onChange={(event) =>
                        updateField(
                          'sellerAlertRoles',
                          event.target.checked
                            ? [...form.sellerAlertRoles, role.name]
                            : form.sellerAlertRoles.filter((item) => item !== role.name),
                        )
                      }
                      type="checkbox"
                    />
                    <span>
                      <span className="block font-medium text-on-surface">{role.name}</span>
                      <span className="mt-1 block text-xs text-on-surface-variant">{role.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">Recommended flow</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Most stores should alert seller after payment is confirmed. That way ops starts packing and shipping only when the order is truly ready for fulfillment.
            </p>
          </div>
        </Panel>

        <Panel title="Regional Settings">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Country">
              <select
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('country', event.target.value)}
                value={form.country}
              >
                <option>Malaysia</option>
                <option>Singapore</option>
                <option>United Arab Emirates</option>
              </select>
            </Field>
            <Field label="Currency">
              <select
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('currency', event.target.value)}
                value={form.currency}
              >
                <option>MYR</option>
                <option>SGD</option>
                <option>USD</option>
              </select>
            </Field>
            <Field label="Language">
              <select
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('language', event.target.value)}
                value={form.language}
              >
                <option>English</option>
                <option>Bahasa Melayu</option>
                <option>Arabic</option>
              </select>
            </Field>
            <Field label="Timezone">
              <select
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('timezone', event.target.value)}
                value={form.timezone}
              >
                <option>Asia/Kuala_Lumpur</option>
                <option>Asia/Singapore</option>
                <option>Asia/Dubai</option>
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title="Order Defaults">
          <div className="space-y-4">
            <ToggleRow checked={form.autoConfirm} label="Auto-confirm orders" onChange={(checked) => updateField('autoConfirm', checked)} />
            <ToggleRow checked={form.autoCancel} label="Auto-cancel unpaid orders" onChange={(checked) => updateField('autoCancel', checked)} />
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Order Prefix">
                <input
                  className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                  onChange={(event) => updateField('orderPrefix', event.target.value)}
                  value={form.orderPrefix}
                />
              </Field>
              <Field label="Low Stock Threshold">
                <input
                  className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                  onChange={(event) => updateField('lowStockThreshold', event.target.value)}
                  value={form.lowStockThreshold}
                />
              </Field>
              {form.autoCancel ? (
                <Field label="Cancel After (Hours)">
                  <input
                    className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                    onChange={(event) => updateField('autoCancelHours', event.target.value)}
                    value={form.autoCancelHours}
                  />
                </Field>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel title="System Preferences">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Date Format">
              <select
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('dateFormat', event.target.value)}
                value={form.dateFormat}
              >
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
              </select>
            </Field>
            <Field label="Time Format">
              <select
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('timeFormat', event.target.value)}
                value={form.timeFormat}
              >
                <option>24h</option>
                <option>12h</option>
              </select>
            </Field>
            <Field label="Data Refresh">
              <select
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateField('dataRefresh', event.target.value)}
                value={form.dataRefresh}
              >
                <option>Every 5 mins</option>
                <option>Every 15 mins</option>
                <option>Every 30 mins</option>
              </select>
            </Field>
          </div>
          <div className="mt-4 space-y-3">
            <ToggleRow checked={form.compactMode} label="Compact admin density" onChange={(checked) => updateField('compactMode', checked)} />
            <ToggleRow checked={form.internalAlerts} label="Internal ops alerts" onChange={(checked) => updateField('internalAlerts', checked)} />
          </div>
        </Panel>
      </div>

      <aside className="space-y-4">
        <Panel title="Configuration Status">
          <div className="space-y-2">
            <StatRow label="Store Identity" value={form.storeName ? 'Configured' : 'Pending'} />
            <StatRow label="Regional Config" value={form.country && form.currency ? 'Configured' : 'Pending'} />
            <StatRow label="Order Defaults" value={form.orderPrefix ? 'Ready' : 'Needs review'} />
            <StatRow
              label="Seller Alerts"
              value={
                form.sellerOrderAlertEmailEnabled || form.sellerOrderAlertWhatsAppEnabled
                  ? form.sellerOrderAlertOnlyAfterPayment
                    ? 'Paid orders only'
                    : 'All new orders'
                  : 'Off'
              }
            />
            <StatRow label="Unsaved Changes" value={isDirty ? 'Yes' : 'No'} />
          </div>
        </Panel>
        <Panel title="Quick Actions">
          <div className="space-y-2">
            <button
              className="w-full rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low"
              onClick={() => onNotify('Test contact sent', `A confirmation note was sent to ${form.email}.`)}
              type="button"
            >
              Send Test Contact
            </button>
            <button
              className="w-full rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low"
              onClick={() =>
                onNotify(
                  'Seller alert test sent',
                  form.sellerOrderAlertWhatsAppEnabled
                    ? `Ops alert preview was sent to ${form.sellerAlertEmail} and ${form.sellerAlertWhatsApp} for ${form.sellerAlertRoles.join(', ')}.`
                    : `Ops alert preview was sent to ${form.sellerAlertEmail} for ${form.sellerAlertRoles.join(', ')}.`,
                )
              }
              type="button"
            >
              Send Test Seller Alert
            </button>
            <button
              className="w-full rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low"
              onClick={() => (window.location.hash = '/settings/domain-branding')}
              type="button"
            >
              Open Brand Center
            </button>
            <button
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isDirty}
              onClick={handleSave}
              type="button"
            >
              Save Configuration
            </button>
          </div>
        </Panel>
        <Panel title="Live Snapshot">
          <div className="space-y-3">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
              <p className="text-xs uppercase tracking-wide text-on-surface-variant">Storefront identity</p>
              <p className="mt-1 text-base font-semibold">{form.storeName}</p>
              <p className="text-sm text-on-surface-variant">{form.tagline}</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
              <p className="text-xs uppercase tracking-wide text-on-surface-variant">Support channel</p>
              <p className="mt-1 text-sm font-medium">{form.email}</p>
              <p className="text-sm text-on-surface-variant">{form.phone}</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
              <p className="text-xs uppercase tracking-wide text-on-surface-variant">Seller order alerts</p>
              <p className="mt-1 text-sm font-medium">
                {form.sellerOrderAlertEmailEnabled ? `Email: ${form.sellerAlertEmail}` : 'Email alert off'}
              </p>
              <p className="text-sm text-on-surface-variant">
                {form.sellerOrderAlertWhatsAppEnabled ? `WhatsApp: ${form.sellerAlertWhatsApp}` : 'WhatsApp alert off'}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">Roles: {form.sellerAlertRoles.join(', ') || 'No role selected'}</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {form.sellerOrderAlertOnlyAfterPayment ? 'Alert runs after payment verification.' : 'Alert runs on every new order.'}
              </p>
            </div>
          </div>
        </Panel>
        <Panel title="Ops Reminder">
          <div className="space-y-3 text-sm text-on-surface-variant">
            <p>General settings should answer three things clearly before the store goes live:</p>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
              <p className="font-medium text-on-surface">Who runs the store</p>
              <p className="mt-1">Support contact, seller alert route, and primary operator should already be correct.</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
              <p className="font-medium text-on-surface">How orders are handled</p>
              <p className="mt-1">Order prefix, auto-confirm, and unpaid-order logic should match the actual ops workflow.</p>
            </div>
          </div>
        </Panel>
      </aside>
    </div>
  );
}

function CheckoutSettingsPage({
  storeSettings,
  onSave,
  onNotify,
}: {
  storeSettings: StoreSettings | null;
  onSave: (form: CheckoutSettingsForm) => void;
  onNotify: (title: string, description: string) => void;
}) {
  const initialState = useMemo<CheckoutSettingsForm>(() => {
    const savedCheckout = (storeSettings?.settings.checkout ?? {}) as Partial<CheckoutSettingsForm>;

    return {
    fields: {
      phoneRequired: true,
      companyField: false,
      addressLine2: true,
      marketingOptIn: false,
      ...savedCheckout.fields,
    },
    shippingMethods: {
      standard: true,
      express: true,
      sameDay: false,
      ...savedCheckout.shippingMethods,
    },
    payments: {
      card: true,
      onlineBanking: true,
      cod: true,
      ...savedCheckout.payments,
    },
    summary: {
      showCouponField: true,
      showDeliveryEstimate: true,
      showTrustBadges: true,
      ...savedCheckout.summary,
    },
    protection: {
      enabled: true,
      title: 'Premium parcel protection',
      fee: '15.00',
      ...savedCheckout.protection,
    },
    preferredShipping: savedCheckout.preferredShipping ?? 'standard',
    preferredPayment: savedCheckout.preferredPayment ?? 'card',
    };
  }, [storeSettings]);

  const [form, setForm] = useState(initialState);
  const [savedState, setSavedState] = useState(initialState);
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedState);

  useEffect(() => {
    setForm(initialState);
    setSavedState(initialState);
  }, [initialState]);

  const updateNested = <T extends keyof typeof initialState, K extends keyof (typeof initialState)[T]>(
    section: T,
    key: K,
    value: (typeof initialState)[T][K],
  ) => {
    setForm((current) => ({
      ...current,
      [section]: {
        ...(current[section] as object),
        [key]: value,
      },
    }));
  };

  const updateFlat = <K extends keyof typeof initialState>(key: K, value: (typeof initialState)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const discardChanges = () => {
    setForm(savedState);
    onNotify('Changes discarded', 'Checkout settings were reverted to the latest saved version.');
  };

  const applyRecommended = () => {
    const recommendedState = {
      ...savedState,
      fields: {
        ...savedState.fields,
        phoneRequired: true,
        addressLine2: false,
        marketingOptIn: true,
      },
      shippingMethods: {
        standard: true,
        express: true,
        sameDay: false,
      },
      payments: {
        card: true,
        onlineBanking: true,
        cod: false,
      },
      summary: {
        showCouponField: true,
        showDeliveryEstimate: true,
        showTrustBadges: true,
      },
      protection: {
        ...savedState.protection,
        enabled: true,
        fee: '15.00',
      },
      preferredShipping: 'standard',
      preferredPayment: 'card',
    };
    setForm(recommendedState);
    setSavedState(recommendedState);
    onNotify('Recommended checkout profile applied', 'Suggested conversion-focused defaults were applied and saved.');
  };

  const handleSave = () => {
    setSavedState(form);
    onSave(form);
  };

  const fields = form.fields;
  const shippingMethods = form.shippingMethods;
  const payments = form.payments;
  const showProtection = form.protection.enabled;
  const enabledShippingMethods = [
    shippingMethods.standard ? { id: 'standard', name: 'Standard Delivery', eta: '3-5 working days', price: 'MYR 0.00' } : null,
    shippingMethods.express ? { id: 'express', name: 'Express Delivery', eta: 'Next day delivery', price: 'MYR 25.00' } : null,
    shippingMethods.sameDay ? { id: 'sameDay', name: 'Same-Day Delivery', eta: 'Available in Klang Valley', price: 'MYR 39.00' } : null,
  ].filter(Boolean) as Array<{ id: string; name: string; eta: string; price: string }>;

  const enabledPaymentMethods = [
    payments.card ? { id: 'card', label: 'Credit/Debit Card (Stripe)' } : null,
    payments.onlineBanking ? { id: 'onlineBanking', label: 'Online Banking (SecurePay)' } : null,
    payments.cod ? { id: 'cod', label: 'Cash on Delivery' } : null,
  ].filter(Boolean) as Array<{ id: string; label: string }>;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        {isDirty ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface">You have unsaved checkout changes</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Review the structure, then save or discard before moving to another settings section.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={discardChanges} type="button">
                Discard
              </button>
              <button className="rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={applyRecommended} type="button">
                Apply Recommended
              </button>
              <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={handleSave} type="button">
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm">
            <p className="text-sm font-medium text-on-surface">Checkout structure controls</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Adjust what the customer sees during checkout. Preview sebelah kanan berubah ikut setting yang kau tukar.
            </p>
          </div>
        )}

        <Panel title="Customer Information Form">
          <div className="space-y-3">
            <ToggleRow checked={fields.phoneRequired} label="Phone Number Required" onChange={(checked) => updateNested('fields', 'phoneRequired', checked)} />
            <ToggleRow checked={fields.companyField} label="Company Field" onChange={(checked) => updateNested('fields', 'companyField', checked)} />
            <ToggleRow checked={fields.addressLine2} label="Address Line 2 Field" onChange={(checked) => updateNested('fields', 'addressLine2', checked)} />
            <ToggleRow checked={fields.marketingOptIn} label="Marketing Opt-In Checkbox" onChange={(checked) => updateNested('fields', 'marketingOptIn', checked)} />
          </div>
        </Panel>

        <Panel title="Shipping Method Selection">
          <div className="space-y-4">
            <div className="space-y-3">
              <ToggleRow checked={shippingMethods.standard} label="Standard Delivery" onChange={(checked) => updateNested('shippingMethods', 'standard', checked)} />
              <ToggleRow checked={shippingMethods.express} label="Express Delivery" onChange={(checked) => updateNested('shippingMethods', 'express', checked)} />
              <ToggleRow checked={shippingMethods.sameDay} label="Same-Day Delivery" onChange={(checked) => updateNested('shippingMethods', 'sameDay', checked)} />
            </div>
            <Field label="Preferred Shipping Default">
              <select
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateFlat('preferredShipping', event.target.value)}
                value={form.preferredShipping}
              >
                <option value="standard">Standard Delivery</option>
                <option value="express">Express Delivery</option>
                <option value="sameDay">Same-Day Delivery</option>
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title="Payment Method Selection">
          <div className="space-y-4">
            <div className="space-y-3">
              <ToggleRow checked={payments.card} label="Card Payment" onChange={(checked) => updateNested('payments', 'card', checked)} />
              <ToggleRow checked={payments.onlineBanking} label="Online Banking" onChange={(checked) => updateNested('payments', 'onlineBanking', checked)} />
              <ToggleRow checked={payments.cod} label="Cash on Delivery" onChange={(checked) => updateNested('payments', 'cod', checked)} />
            </div>
            <Field label="Preferred Payment Default">
              <select
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateFlat('preferredPayment', event.target.value)}
                value={form.preferredPayment}
              >
                <option value="card">Card Payment</option>
                <option value="onlineBanking">Online Banking</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title="Order Summary Behavior">
          <div className="space-y-3">
            <ToggleRow checked={form.summary.showCouponField} label="Show coupon field" onChange={(checked) => updateNested('summary', 'showCouponField', checked)} />
            <ToggleRow checked={form.summary.showDeliveryEstimate} label="Show delivery estimate in summary" onChange={(checked) => updateNested('summary', 'showDeliveryEstimate', checked)} />
            <ToggleRow checked={form.summary.showTrustBadges} label="Show trust badges under CTA" onChange={(checked) => updateNested('summary', 'showTrustBadges', checked)} />
          </div>
        </Panel>

        <Panel title="Optional Add-on / Protection">
          <div className="space-y-4">
            <ToggleRow checked={showProtection} label="Enable premium protection add-on at checkout" onChange={(checked) => updateNested('protection', 'enabled', checked)} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Add-On Title">
                <input
                  className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                  onChange={(event) => updateNested('protection', 'title', event.target.value)}
                  value={form.protection.title}
                />
              </Field>
              <Field label="Add-On Fee (MYR)">
                <input
                  className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                  onChange={(event) => updateNested('protection', 'fee', event.target.value)}
                  value={form.protection.fee}
                />
              </Field>
            </div>
          </div>
        </Panel>

        <div className="flex flex-wrap gap-2">
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={applyRecommended} type="button">
            Apply Recommended
          </button>
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={() => onNotify('Frontstore preview synced', 'Checkout preview rules were synced for review.')} type="button">
            Sync Preview
          </button>
          <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={handleSave} type="button">
            Save Checkout Settings
          </button>
        </div>

        <Panel title="Checkout Status">
          <div className="grid gap-3 md:grid-cols-4">
            <StatTile label="Form Fields" value={`${2 + Number(fields.phoneRequired) + Number(fields.companyField) + Number(fields.addressLine2) + Number(fields.marketingOptIn)}`} />
            <StatTile label="Shipping Methods" value={String(enabledShippingMethods.length)} />
            <StatTile label="Payments" value={String(enabledPaymentMethods.length)} />
            <StatTile label="Add-On" value={showProtection ? 'Enabled' : 'Hidden'} />
          </div>
        </Panel>
      </div>

      <Panel title="Live Checkout Preview">
        <div className="space-y-4 rounded-3xl border border-outline-variant/20 bg-[#fbf8f4] p-5 text-[#473f37] shadow-inner">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#9a8f86]">Seller Preview</p>
              <h3 className="text-lg font-semibold leading-tight">Checkout experience structure</h3>
              <p className="max-w-xs text-sm leading-6 text-[#7f756d]">
                Ringkasan ni tunjuk apa yang customer akan nampak, tanpa render full frontstore checkout.
              </p>
            </div>
            <StatusBadge tone="success">Preview Ready</StatusBadge>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Customer Form</p>
                  <p className="text-xs text-[#8e857d]">Visible fields inside checkout information step</p>
                </div>
                <span className="text-xs font-medium text-[#6b5b4d]">
                  {2 + Number(fields.phoneRequired) + Number(fields.companyField) + Number(fields.addressLine2)} fields
                </span>
              </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <PreviewChip label="Email" />
                {fields.phoneRequired ? <PreviewChip label="Phone" /> : null}
                <PreviewChip label="Full Name" />
                <PreviewChip label="Address Line 1" />
                {fields.addressLine2 ? <PreviewChip label="Address Line 2" /> : null}
                {fields.companyField ? <PreviewChip label="Company" /> : null}
                <PreviewChip label="City" />
                <PreviewChip label="Postcode" />
                {fields.marketingOptIn ? <PreviewChip label="Marketing Opt-In" /> : null}
              </div>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Shipping Methods</p>
                  <p className="text-xs text-[#8e857d]">Methods customer can choose during delivery step</p>
                </div>
                <span className="text-xs font-medium text-[#6b5b4d]">{enabledShippingMethods.length} enabled</span>
              </div>
                <div className="mt-3 space-y-2">
                {enabledShippingMethods.length > 0 ? (
                  enabledShippingMethods.map((method, index) => (
                    <div
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                        method.id === form.preferredShipping || (index === 0 && !enabledShippingMethods.some((item) => item.id === form.preferredShipping))
                          ? 'border-[#d9c8b1] bg-[#fffaf3]'
                          : 'border-outline-variant/20 bg-[#fcfbf8]'
                      }`}
                      key={method.name}
                    >
                      <div>
                        <p className="text-sm font-medium">{method.name}</p>
                        <p className="text-xs text-[#8e857d]">{method.eta}</p>
                      </div>
                      <span className="text-xs font-medium text-[#6b5b4d]">{method.price}</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-outline-variant/30 px-3 py-3 text-xs text-[#8e857d]">
                    No shipping method enabled.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Payment Methods</p>
                    <p className="text-xs text-[#8e857d]">Available payment choices at checkout</p>
                  </div>
                  <span className="text-xs font-medium text-[#6b5b4d]">{enabledPaymentMethods.length} enabled</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {enabledPaymentMethods.length > 0 ? (
                    enabledPaymentMethods.map((method) => (
                      <PreviewChip
                        key={method.id}
                        label={
                          method.id === form.preferredPayment ? `${method.label} • Default` : method.label
                        }
                      />
                    ))
                  ) : (
                    <span className="text-xs text-[#8e857d]">No payment method enabled.</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Optional Add-on</p>
                  <StatusBadge tone={showProtection ? 'success' : 'neutral'}>
                    {showProtection ? 'Shown' : 'Hidden'}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#8e857d]">
                  {showProtection
                    ? `${form.protection.title} will appear before final order submission at MYR ${form.protection.fee}.`
                    : 'No extra protection offer will be shown in checkout.'}
                </p>
              </div>

              <div className="rounded-2xl border border-[#d9c8b1] bg-[#fffaf3] p-4 shadow-sm">
                <p className="text-sm font-semibold">Order Summary</p>
                <div className="mt-3 space-y-3">
                  <PreviewLineItem imageSeed="checkout-item-1" name="Noor Silk Abaya" price="MYR 420.00" compact />
                  <PreviewLineItem imageSeed="checkout-item-2" name="Essentials Chiffon Hijab" price="MYR 89.00" compact />
                </div>
                <div className="mt-4 space-y-2 border-t border-[#eadcc9] pt-3 text-xs text-[#7f756d]">
                  {form.summary.showCouponField ? (
                    <div className="rounded-lg border border-[#eadcc9] bg-white/70 px-3 py-2 text-[11px] text-[#8e857d]">
                      Coupon field visible in summary
                    </div>
                  ) : null}
                  {form.summary.showDeliveryEstimate ? (
                    <div className="flex items-center justify-between">
                      <span>Delivery estimate</span>
                      <span>3-5 working days</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span>{enabledShippingMethods[0]?.price ?? 'Unavailable'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold text-[#473f37]">
                    <span>Total</span>
                    <span>MYR 535.00</span>
                  </div>
                </div>
                {form.summary.showTrustBadges ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <PreviewChip label="Secure Checkout" />
                    <PreviewChip label="Trusted Payment" />
                    <PreviewChip label="Fast Fulfilment" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function DomainBrandingPage({
  storeSettings,
  onPublish,
  onSave,
  onUnpublish,
}: {
  storeSettings: StoreSettings | null;
  onPublish: () => void;
  onSave: (form: DomainBrandingForm) => void;
  onUnpublish: () => void;
}) {
  const initialState = useMemo<DomainBrandingForm>(() => {
    const savedBranding = (storeSettings?.settings.branding ?? {}) as Partial<DomainBrandingForm>;

    return {
    domain: storeSettings?.customDomain || savedBranding.domain || 'store.lumiere-noor.com',
    subdomain: storeSettings?.managedDomain || savedBranding.subdomain || 'lumiere-noor.shop',
    connectionStatus: 'Connected',
    brandName: storeSettings?.name || savedBranding.brandName || 'Lumiere Noor',
    tagline: savedBranding.tagline || 'Modern modestwear for refined wardrobes.',
    logoLabel: 'Primary Wordmark',
    logoStyle: 'Editorial Serif',
    primaryColor: '#6b5b4d',
    accentColor: '#d6c4a8',
    neutralColor: '#f6f1ea',
    buttonShape: 'Soft Rounded',
    themePreset: 'Warm Editorial',
    showAnnouncementBar: true,
    showFloatingHelp: false,
    ...savedBranding,
    };
  }, [storeSettings]);

  const [form, setForm] = useState(initialState);
  const [savedState, setSavedState] = useState(initialState);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [domainModalMode, setDomainModalMode] = useState<'add' | 'edit'>('edit');
  const [dnsLastChecked, setDnsLastChecked] = useState('2 mins ago');
  const [sitemapCopied, setSitemapCopied] = useState(false);
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedState);
  const storefront = (storeSettings?.settings.storefront ?? {}) as { status?: string; published_url?: string; published_at?: string };
  const isLive = storefront.status === 'live';
  const sitemapUrl = resolveSeoSitemapUrl({
    domain: form.domain,
    subdomain: form.subdomain,
    connectionStatus: form.connectionStatus,
  });

  useEffect(() => {
    setForm(initialState);
    setSavedState(initialState);
  }, [initialState]);

  useEffect(() => {
    if (!sitemapCopied) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSitemapCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [sitemapCopied]);

  const updateField = <K extends keyof typeof initialState>(key: K, value: (typeof initialState)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const discardChanges = () => {
    setForm(savedState);
  };

  const applyRecommended = () => {
    const recommendedState = {
      ...savedState,
      themePreset: 'Warm Editorial',
      buttonShape: 'Soft Rounded',
      showAnnouncementBar: true,
      showFloatingHelp: true,
      primaryColor: '#6b5b4d',
      accentColor: '#d6c4a8',
      neutralColor: '#f6f1ea',
    };
    setForm(recommendedState);
    setSavedState(recommendedState);
  };

  const handleSave = () => {
    setSavedState(form);
    onSave(form);
  };

  const handleCopySitemap = async () => {
    try {
      await navigator.clipboard?.writeText(sitemapUrl);
      setSitemapCopied(true);
    } catch {
      setSitemapCopied(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        {isDirty ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface">Unsaved brand updates detected</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Review your storefront identity changes, then save or discard this brand profile.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={discardChanges} type="button">
                Discard
              </button>
              <button className="rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={applyRecommended} type="button">
                Apply Recommended
              </button>
              <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={handleSave} type="button">
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm">
            <p className="text-sm font-medium text-on-surface">Brand center</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Manage your domain connection, visual identity, and storefront tone from one brand workspace.
            </p>
          </div>
        )}

        <Panel
          title="Domains"
          action={
            <button
              className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-on-primary hover:bg-primary-dim"
              onClick={() => {
                setDomainModalMode('add');
                setShowDomainModal(true);
              }}
              type="button"
            >
              Add Existing Domain
            </button>
          }
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest shadow-sm">
              <div className="border-b border-outline-variant/20 px-4 py-3">
                <p className="font-medium">Subdomain</p>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm font-medium">{`https://${form.subdomain}`}</p>
                <p className="mt-2 text-sm text-on-surface-variant">Managed fallback address used while custom domain routing and SSL are being prepared.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-outline-variant/20 px-4 py-3">
                <p className="font-medium">Custom Domain</p>
                <button
                  className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                  onClick={() => {
                    setDomainModalMode('edit');
                    setShowDomainModal(true);
                  }}
                  type="button"
                >
                  Edit
                </button>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm font-medium">{`https://${form.domain}`}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge tone={form.connectionStatus === 'Connected' ? 'success' : 'warning'}>{form.connectionStatus}</StatusBadge>
                  <StatusBadge tone={form.connectionStatus === 'Connected' ? 'success' : 'neutral'}>
                    {form.connectionStatus === 'Connected' ? 'SSL activated' : 'SSL pending'}
                  </StatusBadge>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Brand Identity">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Brand Name">
              <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updateField('brandName', event.target.value)} value={form.brandName} />
              <FieldHint text="Main storefront name shown in headers, previews, and customer-facing brand areas." />
            </Field>
            <Field label="Tagline">
              <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updateField('tagline', event.target.value)} value={form.tagline} />
              <FieldHint text="Short supporting line that explains your brand tone or positioning." />
            </Field>
            <Field label="Logo Label">
              <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updateField('logoLabel', event.target.value)} value={form.logoLabel} />
              <FieldHint text="Internal label for the logo treatment or lockup being used in this brand profile." />
            </Field>
            <Field label={<InfoLabel label="Logo Style" info="This controls the visual style direction of your brand mark in the preview, not the uploaded logo file itself." />}>
              <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updateField('logoStyle', event.target.value)} value={form.logoStyle}>
                <option>Editorial Serif</option>
                <option>Modern Sans</option>
                <option>Luxury Script</option>
              </select>
              <FieldHint text="Use this to preview whether your brand should feel editorial, modern, or more decorative." />
            </Field>
            <Field label="Logo">
              <button className="w-full rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" type="button">
                Upload / Replace Logo
              </button>
              <FieldHint text="Upload the logo asset you want to use across storefront headers, checkout, and customer emails later." />
            </Field>
          </div>
        </Panel>

        <Panel title="Theme Settings">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label={<InfoLabel label="Primary Color" info="Main brand color used for key CTAs, important headings, and emphasis across storefront pages." />}>
              <input className="h-10 w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updateField('primaryColor', event.target.value)} type="color" value={form.primaryColor} />
              <FieldHint text="Think of this as your main signature color." />
            </Field>
            <Field label={<InfoLabel label="Accent Color" info="Support color used for highlight strips, promo bars, badges, and visual contrast." />}>
              <input className="h-10 w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updateField('accentColor', event.target.value)} type="color" value={form.accentColor} />
              <FieldHint text="Use a softer supporting color to complement the primary brand tone." />
            </Field>
            <Field label={<InfoLabel label="Neutral Background" info="Base background tone used behind content sections so the storefront feels cohesive and premium." />}>
              <input className="h-10 w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updateField('neutralColor', event.target.value)} type="color" value={form.neutralColor} />
              <FieldHint text="This sets the overall atmosphere, usually light and calm for premium stores." />
            </Field>
            <Field label={<InfoLabel label="Theme Preset" info="A starting visual direction that bundles tone, spacing, and styling choices into one simpler option." />}>
              <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updateField('themePreset', event.target.value)} value={form.themePreset}>
                <option>Warm Editorial</option>
                <option>Minimal Luxury</option>
                <option>Bold Commerce</option>
              </select>
              <FieldHint text="Best for sellers who want a fast style direction without tweaking every visual detail." />
            </Field>
            <Field label={<InfoLabel label="Button Shape" info="Controls how rounded or sharp your storefront buttons feel visually." />}>
              <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updateField('buttonShape', event.target.value)} value={form.buttonShape}>
                <option>Soft Rounded</option>
                <option>Squared Modern</option>
                <option>Full Pill</option>
              </select>
              <FieldHint text="Purely a visual branding choice; it changes the feel of call-to-action buttons." />
            </Field>
          </div>
          <div className="mt-4 space-y-3">
            <ToggleRow checked={form.showAnnouncementBar} label="Show announcement bar on storefront" onChange={(checked) => updateField('showAnnouncementBar', checked)} />
            <FieldHint text="Turns on a slim promo bar at the top of your storefront for shipping offers, launches, or campaigns." />
            <ToggleRow checked={form.showFloatingHelp} label="Show floating help / concierge trigger" onChange={(checked) => updateField('showFloatingHelp', checked)} />
            <FieldHint text="Shows a small floating help button so customers can quickly open support or concierge help." />
          </div>
        </Panel>

        <Panel title="Live Preview">
          <div className="space-y-4 rounded-3xl border border-outline-variant/20 p-5 shadow-inner" style={{ backgroundColor: form.neutralColor }}>
            {form.showAnnouncementBar ? (
              <div className="rounded-full px-4 py-2 text-center text-[11px] font-medium uppercase tracking-[0.24em]" style={{ backgroundColor: form.accentColor, color: '#2f2a26' }}>
                Complimentary shipping on premium orders this week
              </div>
            ) : null}

            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8e857d]">{form.logoLabel}</p>
                  <h3 className="mt-1 text-2xl font-semibold" style={{ color: form.primaryColor }}>
                    {form.brandName}
                  </h3>
                  <p className="mt-1 max-w-md text-sm leading-6 text-[#7f756d]">{form.tagline}</p>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-[#fcfbf8] px-4 py-3 text-right">
                  <p className="text-[11px] uppercase tracking-wide text-[#8e857d]">Domain</p>
                  <p className="mt-1 text-sm font-medium text-[#473f37]">{form.domain}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="overflow-hidden rounded-3xl border border-outline-variant/20 bg-[#f8f4ee]">
                  <img alt="Brand homepage preview" className="h-44 w-full object-cover" src="https://picsum.photos/seed/settings-brand-home/720/320" />
                  <div className="space-y-3 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#8e857d]">Homepage Hero</p>
                    <p className="text-lg font-semibold text-[#473f37]">A more editorial storefront, aligned to your premium positioning.</p>
                    <button
                      className={`px-4 py-2 text-sm font-medium text-white ${
                        form.buttonShape === 'Full Pill'
                          ? 'rounded-full'
                          : form.buttonShape === 'Squared Modern'
                            ? 'rounded-lg'
                            : 'rounded-xl'
                      }`}
                      style={{ backgroundColor: form.primaryColor }}
                      type="button"
                    >
                      Shop New Arrival
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-outline-variant/20 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-[#473f37]">Theme Snapshot</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <BrandSwatch label="Primary" value={form.primaryColor} />
                      <BrandSwatch label="Accent" value={form.accentColor} />
                      <BrandSwatch label="Neutral" value={form.neutralColor} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <PreviewChip label={form.themePreset} />
                      <PreviewChip label={form.buttonShape} />
                      <PreviewChip label={form.logoStyle} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-outline-variant/20 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#473f37]">Storefront Components</p>
                      <StatusBadge tone="success">Synced</StatusBadge>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-[#7f756d]">
                      <PreviewToggleRow label="Announcement Bar" enabled={form.showAnnouncementBar} />
                      <PreviewToggleRow label="Floating Help" enabled={form.showFloatingHelp} />
                      <PreviewToggleRow label="Domain Status" enabled={form.connectionStatus === 'Connected'} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Get Your Site Indexed">
          <div className="space-y-4 text-sm text-on-surface-variant">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="font-medium text-on-surface">Step 1: Connect domain</p>
              <p className="mt-1">Use your main store domain first so Google sees the final version of your website.</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="font-medium text-on-surface">Step 2: Submit sitemap to Google Search Console</p>
              <p className="mt-1">Copy this sitemap URL and submit it in Google Search Console so Google can discover your pages faster.</p>
              <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-outline-variant/20 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <code className="min-w-0 break-all text-xs text-on-surface">{sitemapUrl}</code>
                <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={handleCopySitemap} type="button">
                  {sitemapCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="font-medium text-on-surface">Step 3: Wait for indexing</p>
              <p className="mt-1">Google usually needs some time to crawl and index new or updated pages, so a short wait is normal.</p>
            </div>
          </div>
        </Panel>

        <div className="flex flex-wrap gap-2">
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={applyRecommended} type="button">
            Apply Recommended
          </button>
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={() => setForm((current) => ({ ...current, logoLabel: `${current.brandName} Signature` }))} type="button">
            Generate Brand Variant
          </button>
          <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={handleSave} type="button">
            Save All Changes
          </button>
        </div>
      </div>

      <aside className="space-y-4">
        <Panel title="Storefront Publish">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
              <div>
                <p className="text-sm font-medium text-on-surface">Live status</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {isLive ? storefront.published_url ?? `https://${form.subdomain}` : 'Draft until you publish'}
                </p>
              </div>
              <StatusBadge tone={isLive ? 'success' : 'neutral'}>{isLive ? 'Live' : 'Draft'}</StatusBadge>
            </div>
            {isLive ? (
              <div className="space-y-2">
                <a
                  className="block w-full rounded bg-primary px-4 py-2 text-center text-sm font-medium text-on-primary hover:bg-primary-dim"
                  href={`#/store/${storeSettings?.slug ?? form.subdomain}`}
                >
                  Open Live Storefront
                </a>
                <button
                  className="w-full rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low"
                  onClick={onUnpublish}
                  type="button"
                >
                  Move to Draft
                </button>
              </div>
            ) : (
              <button
                className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
                onClick={onPublish}
                type="button"
              >
                Publish Storefront
              </button>
            )}
          </div>
        </Panel>
        <Panel title="Readiness Score">
          <p className="text-3xl font-semibold text-primary">{isDirty ? '82%' : '91%'}</p>
          <p className="text-sm text-on-surface-variant">Domain and branding quality score</p>
        </Panel>
        <Panel title="Brand Status">
          <div className="space-y-2">
            <StatRow label="Domain Link" value={form.connectionStatus} />
            <StatRow label="Theme Preset" value={form.themePreset} />
            <StatRow label="Announcement Bar" value={form.showAnnouncementBar ? 'Enabled' : 'Hidden'} />
            <StatRow label="Unsaved Changes" value={isDirty ? 'Yes' : 'No'} />
          </div>
        </Panel>
        <Panel title="Brand Launch Note">
          <div className="space-y-3 text-sm text-on-surface-variant">
            <p>Domain and branding only feel complete when the storefront looks trustworthy and consistent.</p>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
              <p className="font-medium text-on-surface">Before launch</p>
              <p className="mt-1">Check domain connection, logo clarity, theme preset, and announcement wording before sending traffic to the store.</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
              <p className="font-medium text-on-surface">After domain goes live</p>
              <p className="mt-1">Recheck SSL, open graph preview, and mobile hero readability so ads and social links look polished.</p>
            </div>
          </div>
        </Panel>
      </aside>

      {showDomainModal ? (
        <DomainVerificationModal
          connectionStatus={form.connectionStatus}
          customDomain={form.domain}
          lastChecked={dnsLastChecked}
          mode={domainModalMode}
          onClose={() => setShowDomainModal(false)}
          onDomainChange={(value) => updateField('domain', value)}
          onRunCheck={() => {
            updateField('connectionStatus', 'Connected');
            setDnsLastChecked('Just now');
            setShowDomainModal(false);
          }}
          storeSubdomain={form.subdomain}
        />
      ) : null}
    </div>
  );
}

function PaymentsSettingsPage({
  gateways,
  manualMethods,
  rules,
  subSection,
  onConnectGateway,
  onOpenGateway,
  onToggleManual,
  onToggleRule,
  onDeleteRule,
  onDuplicateRule,
  onCreateRuleFromTemplate,
  onUpdateRule,
  onSaveGateway,
  onCreateRule,
}: {
  gateways: PaymentGateway[];
  manualMethods: ManualMethod[];
  rules: PaymentRule[];
  subSection?: string;
  onConnectGateway: (gatewayId: string) => void;
  onOpenGateway: (gatewaySlug: string) => void;
  onToggleManual: (id: string) => void;
  onToggleRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
  onDuplicateRule: (id: string) => PaymentRule | null;
  onCreateRuleFromTemplate: (template: PaymentRuleTemplateCard) => PaymentRule;
  onUpdateRule: (id: string, payload: PaymentRuleDraft) => void;
  onSaveGateway: (gatewaySlug: PaymentGateway['slug'], payload: PaymentGatewaySavePayload) => void;
  onCreateRule: (ruleName: string) => PaymentRule;
}) {
  const localTab = normalizePaymentsTab(subSection);
  const [newRuleName, setNewRuleName] = useState('High Value Secure 2.0');
  const [showGuide, setShowGuide] = useState(false);
  const [expandedManualMethodId, setExpandedManualMethodId] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleDraft, setRuleDraft] = useState<PaymentRuleDraft>({ name: '', condition: '', action: '' });
  const selectedGateway = subSection
    ? gateways.find((gateway) => gateway.slug === subSection)
    : null;

  if (selectedGateway) {
    return (
      <GatewayDetailPage
        gateway={selectedGateway}
        onBack={() => (window.location.hash = '/settings/payments')}
        onSave={(payload) => onSaveGateway(selectedGateway.slug, payload)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm">
        <p className="text-sm font-medium text-on-surface">Payments control center</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          Configure payment acceptance, fallback methods, and routing logic from one place.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={() => setShowGuide(true)} type="button">
            Open Payment Guide
          </button>
        </div>
      </div>

      <LocalTabs
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'gateway', label: 'Gateways' },
          { key: 'manual', label: 'Manual Methods' },
          { key: 'rules', label: 'Rules' },
        ]}
        activeTab={localTab}
        onTabChange={(tab) => (window.location.hash = `/settings/payments/${tab}`)}
      />

      {localTab === 'overview' ? (
        <Panel title="Payments Overview">
          <div className="grid gap-4 md:grid-cols-4">
            <StatTile label="Connected Gateways" value={String(gateways.filter((gateway) => gateway.status === 'Connected').length)} />
            <StatTile label="Manual Methods" value={String(manualMethods.filter((method) => method.enabled).length)} />
            <StatTile label="Success Rate" value="99.8%" />
            <StatTile label="Last Sync" value="2 mins ago" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">Gateway Setup</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Keep front setup simple. Connect one main gateway first, then manage the rest only if needed.
              </p>
              <button
                className="mt-4 rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface"
                onClick={() => (window.location.hash = '/settings/payments/gateway')}
                type="button"
              >
                Open Gateways
              </button>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">Manual Methods</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Turn on COD or bank transfer only when seller really needs a fallback or manual approval flow.
              </p>
              <button
                className="mt-4 rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface"
                onClick={() => (window.location.hash = '/settings/payments/manual')}
                type="button"
              >
                Open Manual Methods
              </button>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">Payment Rules</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Use rules only when seller wants more control over which methods appear or get prioritized.
              </p>
              <button
                className="mt-4 rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface"
                onClick={() => (window.location.hash = '/settings/payments/rules')}
                type="button"
              >
                Open Rules
              </button>
            </div>
          </div>
        </Panel>
      ) : null}

      {localTab === 'gateway' ? (
        <Panel title="Gateway List">
          <div className="grid gap-4 md:grid-cols-2">
            {gateways.map((gateway) => (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm" key={gateway.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{gateway.name}</p>
                      <StatusBadge tone={gateway.status === 'Connected' ? 'success' : gateway.status === 'Pending' ? 'warning' : 'neutral'}>
                        {gateway.status}
                      </StatusBadge>
                      <StatusBadge tone={gateway.enabledAtCheckout ? 'success' : 'neutral'}>
                        {gateway.enabledAtCheckout ? 'On at Checkout' : 'Off at Checkout'}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-on-surface-variant">{gateway.mode} mode</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-on-surface-variant">
                  {gateway.name === 'SecurePay'
                    ? 'Good for Malaysia-first checkout.'
                    : gateway.name === 'Stripe'
                      ? 'Good for cards and global checkout.'
                      : gateway.name === 'GrabPay'
                        ? 'Good for mobile wallet checkout.'
                        : gateway.name === 'Atome'
                          ? 'Good for BNPL checkout.'
                          : gateway.name === 'Touch n Go eWallet'
                            ? 'Good for local wallet customers.'
                            : gateway.name === 'FPX'
                              ? 'Good for online banking checkout.'
                              : gateway.name === 'DuitNow QR'
                                ? 'Good for QR-based payment flow.'
                                : 'Good for express wallet flow.'}
                </p>

                <div className="mt-4 flex gap-2">
                  <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onOpenGateway(gateway.slug)} type="button">
                    {gateway.status === 'Connected' ? 'Manage' : gateway.status === 'Pending' ? 'Continue Setup' : 'Configure'}
                  </button>
                  {gateway.status === 'Disconnected' ? (
                    <button className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-on-primary hover:bg-primary-dim" onClick={() => onConnectGateway(gateway.id)} type="button">
                      Start Setup
                    </button>
                  ) : null}
                  {gateway.status === 'Pending' ? (
                    <button className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-on-primary hover:bg-primary-dim" onClick={() => onOpenGateway(gateway.slug)} type="button">
                      Continue Setup
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {localTab === 'manual' ? (
        <Panel title="Manual Methods">
          <div className="space-y-4">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-medium">What turning this on actually means</p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Manual methods only control whether the payment option appears at checkout. They do not auto-confirm money received. Orders
                using these methods must stay in a waiting / review state until your operations team verifies collection or proof of payment.
              </p>
            </div>
            {manualMethods.map((method) => (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm" key={method.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{method.name}</p>
                      <StatusBadge tone={method.enabled ? 'success' : 'neutral'}>{method.enabled ? 'Enabled' : 'Disabled'}</StatusBadge>
                    </div>
                    <p className="text-sm text-on-surface-variant">{method.description}</p>
                  </div>
                  <div className="min-w-[220px] rounded-2xl border border-outline-variant/20 bg-surface p-3">
                    <ToggleRow checked={method.enabled} label={method.enabled ? 'Enabled for checkout' : 'Disabled for checkout'} onChange={() => onToggleManual(method.id)} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low"
                    onClick={() => setExpandedManualMethodId((current) => (current === method.id ? null : method.id))}
                    type="button"
                  >
                    {expandedManualMethodId === method.id ? 'Hide Details' : 'View Details'}
                  </button>
                  <button className="rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={() => setShowGuide(true)} type="button">
                    Open Payment Guide
                  </button>
                </div>

                {expandedManualMethodId === method.id ? (
                  <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-3 rounded-2xl border border-outline-variant/20 bg-surface p-4">
                      <div>
                        <p className="text-sm font-medium">When to use this</p>
                        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{method.operationalUse}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">What customer expects</p>
                        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{method.customerExpectation}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Operational flow</p>
                        <div className="mt-3 space-y-2">
                          {method.orderFlow.map((step, index) => (
                            <div className="flex items-start gap-3 rounded-xl border border-outline-variant/10 bg-surface-low px-3 py-2 text-sm" key={step}>
                              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {index + 1}
                              </span>
                              <span className="leading-6 text-on-surface-variant">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-outline-variant/20 bg-surface p-4">
                      <div>
                        <p className="text-sm font-medium">How Bisora should track it</p>
                        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{method.trackingMode}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Proof / verification checklist</p>
                        <div className="mt-3 space-y-2">
                          {method.proofChecklist.map((item) => (
                            <div className="flex items-start gap-2 text-sm text-on-surface-variant" key={item}>
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {localTab === 'rules' ? (
        <Panel title="Payment Rules Engine">
          <div className="mb-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">What this does</p>
            <p className="mt-1 text-sm leading-6 text-on-surface-variant">
              Payment Rules decide which payment methods should appear or be prioritized based on order value, customer type, risk conditions, or checkout timing.
            </p>
          </div>
          <div className="mb-4">
            <p className="text-sm font-medium">Recommended Templates</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {recommendedPaymentRuleTemplates.map((template) => (
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4" key={`${template.name}-${template.condition}`}>
                  <p className="text-sm font-semibold">{template.name}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{template.description}</p>
                  <p className="mt-3 text-xs text-on-surface-variant">{template.condition}</p>
                  <p className="text-xs text-on-surface-variant">{template.action}</p>
                  <button
                    className="mt-3 rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface"
                    onClick={() => {
                      const createdRule = onCreateRuleFromTemplate(template);
                      setEditingRuleId(createdRule.id);
                      setRuleDraft({
                        name: createdRule.name,
                        condition: createdRule.condition,
                        action: createdRule.action,
                      });
                    }}
                    type="button"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
              {rules.map((rule) => (
                <div className="rounded-2xl border border-outline-variant/20 p-3" key={rule.id}>
                  {editingRuleId === rule.id ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">Edit Payment Rule</p>
                          <p className="text-xs text-on-surface-variant">Adjust the rule name, trigger condition, and checkout action.</p>
                        </div>
                        <StatusBadge tone={rule.status === 'Active' ? 'success' : 'neutral'}>{rule.status}</StatusBadge>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <input
                          className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                          onChange={(event) => setRuleDraft((current) => ({ ...current, name: event.target.value }))}
                          placeholder="Rule name"
                          value={ruleDraft.name}
                        />
                        <div className="space-y-2">
                          <select
                            className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                            onChange={(event) => {
                              if (event.target.value) {
                                setRuleDraft((current) => ({ ...current, condition: event.target.value }));
                              }
                            }}
                            value={paymentRuleConditionOptions.some((option) => option.value === ruleDraft.condition) ? ruleDraft.condition : ''}
                          >
                            <option value="">Select condition template</option>
                            {paymentRuleConditionOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.value}
                              </option>
                            ))}
                          </select>
                          <input
                            className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                            onChange={(event) => setRuleDraft((current) => ({ ...current, condition: event.target.value }))}
                            placeholder="Condition"
                            value={ruleDraft.condition}
                          />
                          <p className="text-xs leading-5 text-on-surface-variant">
                            {paymentRuleConditionOptions.find((option) => option.value === ruleDraft.condition)?.hint ??
                              'Choose a template or write your own condition in seller-friendly wording.'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <select
                            className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                            onChange={(event) => {
                              if (event.target.value) {
                                setRuleDraft((current) => ({ ...current, action: event.target.value }));
                              }
                            }}
                            value={paymentRuleActionOptions.some((option) => option.value === ruleDraft.action) ? ruleDraft.action : ''}
                          >
                            <option value="">Select action template</option>
                            {paymentRuleActionOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.value}
                              </option>
                            ))}
                          </select>
                          <input
                            className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                            onChange={(event) => setRuleDraft((current) => ({ ...current, action: event.target.value }))}
                            placeholder="Action"
                            value={ruleDraft.action}
                          />
                          <p className="text-xs leading-5 text-on-surface-variant">
                            {paymentRuleActionOptions.find((option) => option.value === ruleDraft.action)?.hint ??
                              'Pick a ready-made checkout action or write a custom action manually.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!ruleDraft.name.trim() || !ruleDraft.condition.trim() || !ruleDraft.action.trim()}
                          onClick={() => {
                            onUpdateRule(rule.id, {
                              name: ruleDraft.name.trim(),
                              condition: ruleDraft.condition.trim(),
                              action: ruleDraft.action.trim(),
                            });
                            setEditingRuleId(null);
                          }}
                          type="button"
                        >
                          Save Changes
                        </button>
                        <button
                          className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low"
                          onClick={() => {
                            setEditingRuleId(null);
                            setRuleDraft({ name: '', condition: '', action: '' });
                          }}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-xs text-on-surface-variant">{rule.condition}</p>
                        <p className="text-xs text-on-surface-variant">{rule.action}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={rule.status === 'Active' ? 'success' : 'neutral'}>{rule.status}</StatusBadge>
                        <button
                          className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                          onClick={() => {
                            setEditingRuleId(rule.id);
                            setRuleDraft({
                              name: rule.name,
                              condition: rule.condition,
                              action: rule.action,
                            });
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                          onClick={() => {
                            const duplicatedRule = onDuplicateRule(rule.id);
                            if (!duplicatedRule) {
                              return;
                            }

                            setEditingRuleId(duplicatedRule.id);
                            setRuleDraft({
                              name: duplicatedRule.name,
                              condition: duplicatedRule.condition,
                              action: duplicatedRule.action,
                            });
                          }}
                          type="button"
                        >
                          Duplicate
                        </button>
                        <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onToggleRule(rule.id)} type="button">
                          {rule.status === 'Active' ? 'Move to Draft' : 'Activate'}
                        </button>
                        <button className="rounded border border-error/20 px-3 py-1.5 text-xs text-error hover:bg-error/5" onClick={() => onDeleteRule(rule.id)} type="button">
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="rounded-2xl border border-dashed border-outline-variant/30 p-4">
                <p className="text-sm font-medium">Create New Rule</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Add a new rule quickly. Bisora creates a draft suggestion automatically, and you can edit it right after.
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                  onChange={(event) => setNewRuleName(event.target.value)}
                  placeholder="Rule name"
                  value={newRuleName}
                />
                  <button
                    className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!newRuleName.trim()}
                    onClick={() => {
                      const createdRule = onCreateRule(newRuleName.trim());
                      setEditingRuleId(createdRule.id);
                      setRuleDraft({
                        name: createdRule.name,
                        condition: createdRule.condition,
                        action: createdRule.action,
                      });
                      setNewRuleName('New Payment Rule');
                    }}
                    type="button"
                  >
                  Create Rule
                </button>
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      {showGuide ? <PaymentGuideModal onClose={() => setShowGuide(false)} /> : null}
    </div>
  );
}

function GatewayDetailPage({
  gateway,
  onBack,
  onSave,
}: {
  gateway: PaymentGateway;
  onBack: () => void;
  onSave: (payload: PaymentGatewaySavePayload) => void;
}) {
  const placeholder = gateway.name === 'PayPal';
  const [environment, setEnvironment] = useState(gateway.mode);
  const [publicKey, setPublicKey] = useState('pk_live_xxxxxxxxxxxxx');
  const [secretKey, setSecretKey] = useState('sk_live_xxxxxxxxxxxxx');
  const [webhookUrl, setWebhookUrl] = useState(`https://api.atelier.com/webhooks/${gateway.name.toLowerCase()}`);
  const [qrMode, setQrMode] = useState<'Static QR' | 'Dynamic QR'>('Dynamic QR');
  const [settlementAccount, setSettlementAccount] = useState('Bisora Commerce Sdn Bhd - Maybank 5642');
  const [testOutcome, setTestOutcome] = useState<'idle' | 'success'>('idle');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [setupStage, setSetupStage] = useState<PaymentSetupStage>(gateway.setupStage);
  const [enabledAtCheckout, setEnabledAtCheckout] = useState(gateway.enabledAtCheckout);
  const [checkoutLabel, setCheckoutLabel] = useState(gateway.checkoutLabel);
  const providerLinks =
    gateway.name === 'SecurePay'
      ? {
          applyUrl: 'https://docs.securepay.my/',
          infoUrl: 'https://www.securepay.my/securepay-api/',
          applyLabel: 'Open SecurePay Setup',
          infoLabel: 'Read Official Info',
        }
      : gateway.name === 'Stripe'
        ? {
            applyUrl: 'https://dashboard.stripe.com/register',
            infoUrl: 'https://docs.stripe.com/payments',
            applyLabel: 'Create Stripe Account',
            infoLabel: 'Read Stripe Docs',
          }
        : gateway.name === 'GrabPay'
          ? {
              applyUrl: 'https://www.grab.com/my/merchant/checkout-solutions/',
              infoUrl: 'https://merchant.grab.com/',
              applyLabel: 'Apply as Grab Merchant',
              infoLabel: 'Read Grab Merchant Info',
            }
          : gateway.name === 'Atome'
            ? {
                applyUrl: 'https://www.atome.my/en-my/',
                infoUrl: 'https://help.atome.my/hc/en-gb/articles/4405623301145-How-much-will-it-cost-me-as-a-merchant',
                applyLabel: 'Contact Atome for Merchant Setup',
                infoLabel: 'Read Atome Merchant Info',
              }
            : gateway.name === 'Touch n Go eWallet'
              ? {
                  applyUrl: 'https://www.touchngo.com.my/merchant/be-a-merchant/',
                  infoUrl: 'https://www.touchngo.com.my/merchant/merchant-dashboard',
                  applyLabel: 'Register as TNG Merchant',
                  infoLabel: 'See Merchant Dashboard Info',
                }
              : gateway.name === 'DuitNow QR'
                ? {
                    applyUrl: 'https://knowledgebase.paynet.my/hc/en-us/articles/49583136924441-How-do-merchants-onboard-to-DuitNow-QR',
                    infoUrl: 'https://www.paynet.my/business-solutions/duitnow-qr.html',
                    applyLabel: 'Start DuitNow QR Onboarding',
                    infoLabel: 'Read DuitNow QR Info',
                  }
                : gateway.name === 'FPX'
                  ? {
                      applyUrl: 'https://www.paynet.my/business-solutions/fpx.html',
                      infoUrl: 'https://www.paynet.my/business-solutions/fpx.html',
                      applyLabel: 'Start FPX Setup Path',
                      infoLabel: 'Read FPX Info',
                    }
                  : {
                      applyUrl: '#',
                      infoUrl: '#',
                      applyLabel: 'Open Setup Path',
                      infoLabel: 'Read Official Info',
                    };
  const sellerFit =
    gateway.name === 'SecurePay'
      ? 'Best for Malaysia-first checkout with local banking familiarity.'
      : gateway.name === 'Stripe'
        ? 'Best for card-heavy or international-ready stores.'
        : gateway.name === 'GrabPay'
          ? 'Best for mobile-first customers who already use Grab ecosystem.'
          : gateway.name === 'Atome'
            ? 'Best when you want BNPL to lift average order value.'
            : gateway.name === 'Touch n Go eWallet'
              ? 'Best for local wallet adoption and merchant dashboard visibility.'
              : gateway.name === 'DuitNow QR'
                ? 'Best when you want one QR path tied to a real merchant/company settlement account.'
                : gateway.name === 'FPX'
                  ? 'Best for direct online banking trust and instant confirmation flow.'
                  : 'Use this when you need another supported payment path.';
  const requirements =
    gateway.name === 'SecurePay'
      ? ['Approved SecurePay merchant account', 'Public/app credential', 'Secret credential', 'Callback + webhook URL']
      : gateway.name === 'Stripe'
        ? ['Verified Stripe business account', 'Publishable key', 'Secret key', 'Webhook signing flow']
        : gateway.name === 'GrabPay'
          ? ['Grab merchant onboarding approval', 'Commercial/account verification', 'Integration support path', 'Settlement visibility']
          : gateway.name === 'Atome'
            ? ['Atome merchant partnership approval', 'BNPL commercial onboarding', 'Merchant credentials / support path', 'Callback confirmation flow']
            : gateway.name === 'Touch n Go eWallet'
              ? ['Merchant registration', 'Linked settlement account', 'Dashboard / QR or online acceptance path', 'Reconciliation visibility']
              : gateway.name === 'DuitNow QR'
                ? ['Participating bank / acquirer onboarding', 'Company or merchant settlement account', 'Static or dynamic QR decision', 'Reconciliation or callback-ready process']
                : gateway.name === 'FPX'
                  ? ['FPX-enabled acquirer / gateway', 'Bank redirect flow', 'Return / callback mapping', 'Settlement confirmation process']
                  : ['Provider account', 'Credentials', 'Webhook / callback mapping'];
  const onboardingItems =
    gateway.name === 'SecurePay'
      ? ['Register SecurePay merchant account', 'Generate API/app credentials', 'Add callback and webhook URL', 'Switch from sandbox to live after approval']
      : gateway.name === 'Stripe'
        ? ['Create Stripe account', 'Complete business verification', 'Copy publishable and secret keys', 'Enable webhook events for payment status']
        : gateway.name === 'GrabPay'
          ? ['Apply as GrabPay / PayLater merchant', 'Wait for Grab verification', 'Receive merchant onboarding support', 'Map callback and settlement events']
          : gateway.name === 'Atome'
            ? ['Register as Atome merchant partner', 'Complete merchant approval and commercial onboarding', 'Receive integration credentials / support', 'Enable BNPL callback and order status sync']
            : gateway.name === 'Touch n Go eWallet'
              ? ['Register as TNG merchant', 'Get merchant approval / dashboard access', 'Decide QR or online integration path', 'Enable payment notification / settlement review flow']
              : gateway.name === 'DuitNow QR'
                ? ['Onboard with participating bank / acquirer / merchant QR provider', 'Link QR settlement to company or merchant account', 'Decide static QR vs dynamic QR flow', 'Use settlement records or callback integration for reconciliation']
                : gateway.name === 'FPX'
                  ? ['Enable FPX via payment acquirer / gateway', 'Map bank redirect and return flow', 'Listen to payment callback confirmation', 'Reconcile successful bank payments in settlement report']
                  : ['Register merchant account', 'Receive provider credentials', 'Configure callbacks and webhook events'];
  const triggerFlow =
    gateway.name === 'GrabPay' || gateway.name === 'Touch n Go eWallet'
      ? 'Customer pays through wallet or QR flow. Provider returns success and webhook updates payment status.'
      : gateway.name === 'DuitNow QR'
        ? 'Customer scans merchant QR, payment settles to linked merchant/company account, and system should rely on provider callback or reconciliation record before marking paid.'
      : gateway.name === 'Atome'
        ? 'Customer completes BNPL approval. Provider sends payment authorization / success callback, then order can move to paid state.'
        : gateway.name === 'FPX'
          ? 'Customer is redirected to online banking, payment is completed at bank, and callback/webhook marks the order as paid.'
          : 'Customer submits payment, provider confirms authorization/capture, and webhook updates the order payment state.';

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <button className="text-sm font-medium text-primary hover:underline" onClick={onBack} type="button">
          Back to Payments
        </button>
        <Panel title={`${gateway.name} Configuration`}>
          {placeholder ? (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant">
                PayPal detail configuration is kept as placeholder for current phase. Structure is ready for backend integration.
              </p>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-medium">Planned Support</p>
                <ul className="mt-2 space-y-2 text-sm text-on-surface-variant">
                  <li>1. Client ID / Secret connection</li>
                  <li>2. Sandbox and live environment switching</li>
                  <li>3. Callback and webhook event mapping</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Who this is for</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{sellerFit}</p>
                  </div>
                  <StatusBadge tone={setupStage === 'Live' ? 'success' : setupStage === 'Awaiting Approval' ? 'warning' : 'neutral'}>
                    {setupStage}
                  </StatusBadge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div>
                    <Field label="Display name at checkout">
                      <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setCheckoutLabel(event.target.value)} value={checkoutLabel} />
                      <FieldHint text="Customers will see this label while choosing how to pay." />
                    </Field>
                    <div className="mt-4">
                    <p className="text-sm font-medium">What you need first</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {requirements.map((item) => (
                        <div className="rounded-xl border border-outline-variant/20 bg-surface px-3 py-2 text-sm text-on-surface-variant" key={item}>
                          {item}
                        </div>
                      ))}
                    </div>
                    </div>
                  </div>
                  <div className="space-y-3 rounded-xl border border-outline-variant/20 bg-surface p-3">
                    <Field label="Your setup progress tracker">
                      <select className="w-full rounded border border-outline-variant/30 bg-surface-low px-3 py-2 text-sm" onChange={(event) => setSetupStage(event.target.value as typeof setupStage)} value={setupStage}>
                        <option>Not Started</option>
                        <option>Applied</option>
                        <option>Awaiting Approval</option>
                        <option>Ready to Connect</option>
                        <option>Live</option>
                      </select>
                      <FieldHint text="This is a manual tracker for you and your team. Changing this does not connect the gateway automatically." />
                    </Field>
                    <div className="rounded-xl border border-outline-variant/20 bg-surface-low p-3">
                      <ToggleRow
                        checked={enabledAtCheckout}
                        disabled={setupStage !== 'Ready to Connect' && setupStage !== 'Live'}
                        label="Show this gateway to customers at checkout"
                        onChange={() => setEnabledAtCheckout((current) => !current)}
                      />
                      <FieldHint
                        text={
                          setupStage === 'Ready to Connect' || setupStage === 'Live'
                            ? 'Turn this on only when you want customers to see and use this method at checkout.'
                            : 'Finish merchant approval and reach at least "Ready to Connect" before enabling this gateway at checkout.'
                        }
                      />
                    </div>
                    <a
                      className="block rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-medium text-on-primary hover:bg-primary-dim"
                      href={providerLinks.applyUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {providerLinks.applyLabel}
                    </a>
                    <p className="text-xs leading-5 text-on-surface-variant">
                      This button opens the provider registration or onboarding path so you can start setup outside Bisora.
                    </p>
                    <a
                      className="block rounded-xl border border-outline-variant/30 px-4 py-2.5 text-center text-sm hover:bg-surface-low"
                      href={providerLinks.infoUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {providerLinks.infoLabel}
                    </a>
                    <p className="text-xs leading-5 text-on-surface-variant">
                      This opens official reading material or product info so seller can understand the provider before applying.
                    </p>
                  </div>
                </div>
              </div>
              {gateway.name === 'DuitNow QR' ? (
                <>
                  <Field label="QR Collection Mode">
                    <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setQrMode(event.target.value as 'Static QR' | 'Dynamic QR')} value={qrMode}>
                      <option>Dynamic QR</option>
                      <option>Static QR</option>
                    </select>
                    <FieldHint
                      text={
                        qrMode === 'Dynamic QR'
                          ? 'Recommended for e-commerce because each order can carry its own amount / reference for cleaner automation.'
                          : 'Useful for simpler merchant acceptance, but usually needs more manual matching or reconciliation.'
                      }
                    />
                  </Field>
                  <Field label="Settlement Account">
                    <input
                      className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                      onChange={(event) => setSettlementAccount(event.target.value)}
                      value={settlementAccount}
                    />
                    <FieldHint text="This represents the company / merchant account that ultimately receives QR settlement." />
                  </Field>
                </>
              ) : null}
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Test payment confirmation flow</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Simulate the moment a provider callback / webhook confirms payment so seller can understand how the order should move to `Paid`.
                    </p>
                  </div>
                  <button
                    className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface"
                    onClick={() => setTestOutcome('success')}
                    type="button"
                  >
                    Run Mock Payment Test
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-outline-variant/20 bg-surface px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Step 1</p>
                    <p className="mt-1 text-sm">Customer completes payment at provider</p>
                  </div>
                  <div className="rounded-xl border border-outline-variant/20 bg-surface px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Step 2</p>
                    <p className="mt-1 text-sm">Provider callback / webhook reaches Bisora</p>
                  </div>
                  <div className="rounded-xl border border-outline-variant/20 bg-surface px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Step 3</p>
                    <p className="mt-1 text-sm">Order marked `Paid`, reference saved, next workflow unlocked</p>
                  </div>
                </div>
                {testOutcome === 'success' ? (
                  <div className="mt-4 rounded-2xl border border-success/20 bg-success-soft p-4 text-sm">
                    <p className="font-medium text-success">Mock payment confirmation received</p>
                    <p className="mt-1 text-on-surface-variant">
                      Example result: provider returned success, transaction reference `TXN-2026-0421-8831` was recorded, and order payment state is now ready to move into fulfillment-safe flow.
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Advanced technical setup</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Only needed when your provider has already approved your merchant account and you are ready to connect Bisora.
                    </p>
                  </div>
                  <button
                    className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface"
                    onClick={() => setShowAdvanced((current) => !current)}
                    type="button"
                  >
                    {showAdvanced ? 'Hide Advanced Setup' : 'Show Advanced Setup'}
                  </button>
                </div>
                {showAdvanced ? (
                  <div className="mt-4 space-y-4">
                    <Field label="Environment">
                      <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setEnvironment(event.target.value as 'Live' | 'Test')} value={environment}>
                        <option>Live</option>
                        <option>Test</option>
                      </select>
                      <FieldHint text="Switch between sandbox and production credentials during setup and QA. This can be saved even if the gateway stays off at checkout." />
                    </Field>
                    <Field label="Public Key / Merchant ID">
                      <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setPublicKey(event.target.value)} value={publicKey} />
                    </Field>
                    <Field label="Secret Key / Signing Secret">
                      <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setSecretKey(event.target.value)} value={secretKey} type="password" />
                    </Field>
                    <Field label="Webhook URL">
                      <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setWebhookUrl(event.target.value)} value={webhookUrl} />
                      <FieldHint text="This is the Bisora endpoint your provider uses to tell us a payment has succeeded, failed, or changed status. Usually your developer or technical integrator copies this into the payment provider dashboard after merchant approval." />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={() => navigator.clipboard?.writeText(webhookUrl)} type="button">
                        Copy Webhook URL
                      </button>
                      <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={() => window.alert(`${gateway.name} test connection queued.`)} type="button">
                        Test Connection
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
                  onClick={() =>
                    onSave({
                      environment,
                      setupStage,
                      enabledAtCheckout,
                      checkoutLabel,
                    })
                  }
                  type="button"
                >
                  Save Changes
                </button>
                <a
                  className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low"
                  href={providerLinks.infoUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Need help understanding this?
                </a>
              </div>
            </div>
          )}
        </Panel>
      </div>
      <aside className="space-y-4">
        <Panel title="Gateway Status">
          <StatRow label="Connection" value={getGatewayStatusFromStage(setupStage)} />
          <StatRow label="Mode" value={environment} />
          <StatRow label="Checkout Label" value={checkoutLabel} />
          <StatRow label="Checkout" value={enabledAtCheckout ? 'Enabled' : 'Disabled'} />
          <StatRow label="Health" value={`${gateway.health}%`} />
        </Panel>
        <Panel title="Live Integration Logic">
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Merchant onboarding first</p>
              <ul className="mt-2 space-y-2 text-on-surface-variant">
                {onboardingItems.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
              <p className="font-medium">Payment confirmation flow</p>
              <p className="mt-2 text-on-surface-variant">{triggerFlow}</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
              <p className="font-medium">How seller knows payment masuk</p>
              <p className="mt-2 text-on-surface-variant">
                System checks provider callback / webhook, marks order as `Paid`, records transaction reference, then can trigger fulfillment and notifications.
              </p>
            </div>
            {gateway.name === 'DuitNow QR' ? (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
                <p className="font-medium">QR setup note</p>
                <p className="mt-2 text-on-surface-variant">
                  {qrMode === 'Dynamic QR'
                    ? `Dynamic QR is active. This is the cleaner route for automated order matching because each payment can carry an order-specific amount or reference into settlement logic.`
                    : `Static QR is active. Seller should expect stronger dependence on merchant dashboard reconciliation or manual matching unless provider tooling adds reference tracking.`}
                </p>
                <p className="mt-2 text-on-surface-variant">Settlement account: {settlementAccount}</p>
              </div>
            ) : null}
          </div>
        </Panel>
        <img alt={`${gateway.name} visual`} className="h-52 w-full rounded object-cover" src={`https://picsum.photos/seed/${gateway.name.toLowerCase()}-visual/360/300`} />
      </aside>
    </div>
  );
}

function ShippingSettingsPage({
  zones,
  couriers,
  providers,
  routingRules,
  subSection,
  onAddZone,
  onConfigureCourier,
  onRunSimulation,
  onOpenShippingProvider,
  onQuickActivateShippingProvider,
  onSaveZone,
  onToggleRoutingRule,
  onDeleteRoutingRule,
  onUpdateRoutingRule,
  onCreateRoutingRule,
  onDuplicateRoutingRule,
  onCreateRoutingRuleFromTemplate,
}: {
  zones: ShippingZone[];
  couriers: CourierProvider[];
  providers: ShippingProviderIntegration[];
  routingRules: ShippingRoutingRule[];
  subSection?: string;
  onAddZone: () => ShippingZone;
  onConfigureCourier: (id: string) => void;
  onRunSimulation: () => void;
  onOpenShippingProvider: (id: string) => void;
  onQuickActivateShippingProvider: (id: string) => void;
  onSaveZone: (zoneId: string, payload: ShippingZone) => void;
  onToggleRoutingRule: (id: string) => void;
  onDeleteRoutingRule: (id: string) => void;
  onUpdateRoutingRule: (id: string, payload: ShippingRoutingRuleDraft) => void;
  onCreateRoutingRule: (ruleName: string) => ShippingRoutingRule;
  onDuplicateRoutingRule: (id: string) => ShippingRoutingRule | null;
  onCreateRoutingRuleFromTemplate: (template: ShippingRoutingTemplateCard) => ShippingRoutingRule;
}) {
  const tab = normalizeShippingTab(subSection);
  const [showGuide, setShowGuide] = useState(false);
  const [editingRoutingRuleId, setEditingRoutingRuleId] = useState<string | null>(null);
  const [routingRuleDraft, setRoutingRuleDraft] = useState<ShippingRoutingRuleDraft>({ name: '', condition: '', action: '' });
  const [newRoutingRuleName, setNewRoutingRuleName] = useState('Semenanjung Backup Route');
  const [zoneEditorOpen, setZoneEditorOpen] = useState(false);
  const [zoneDraft, setZoneDraft] = useState<ShippingZone | null>(null);
  const [methodEditorOpen, setMethodEditorOpen] = useState(false);
  const [methodDraft, setMethodDraft] = useState<ShippingMethodDraft>({ name: '', note: '', active: true, sla: '', preferredCourier: '' });
  const [shippingMethods, setShippingMethods] = useState<Array<ShippingMethodDraft>>([
    { name: 'Standard Delivery', note: 'Base method for most local zones and general coverage.', active: true, sla: '2-5 working days', preferredCourier: 'J&T' },
    { name: 'Express Delivery', note: 'Use when seller supports faster SLA or premium shipping speed.', active: true, sla: '1-2 working days', preferredCourier: 'DHL Express' },
    { name: 'Same-Day Delivery', note: 'Only enable where seller ops and courier coverage can truly support it.', active: false, sla: 'Same day before cutoff', preferredCourier: 'Ninja Van' },
  ]);
  const [simulationDraft, setSimulationDraft] = useState<ShippingSimulationDraft>({
    zone: zones[0]?.name ?? '',
    method: 'Standard Delivery',
    scenario: shippingSimulationScenarios[0],
  });
  const [simulationResult, setSimulationResult] = useState<{
    ruleName: string;
    zone: string;
    method: string;
    courier: string;
    summary: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm">
        <p className="text-sm font-medium text-on-surface">Shipping control center</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          Organize zones, delivery methods, courier setup, and routing behavior from one logistics workspace.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={() => setShowGuide(true)} type="button">
            Open Shipping Guide
          </button>
        </div>
      </div>

      <LocalTabs
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'zones', label: 'Zones' },
          { key: 'methods', label: 'Methods' },
          { key: 'courier', label: 'Courier' },
          { key: 'api', label: 'API Integrations' },
          { key: 'routing', label: 'Routing Rules' },
        ]}
        activeTab={tab}
        onTabChange={(next) => (window.location.hash = `/settings/shipping-logistics/${next}`)}
      />

      {tab === 'overview' ? (
        <Panel title="Shipping Overview">
          <div className="grid gap-4 md:grid-cols-4">
            <StatTile label="Zones" value={String(zones.length)} />
            <StatTile label="Active Methods" value={String(shippingMethods.filter((method) => method.active).length)} />
            <StatTile label="Live Couriers" value={String(couriers.filter((courier) => courier.status === 'Connected').length)} />
            <StatTile label="Active Rules" value={String(routingRules.filter((rule) => rule.status === 'Active').length)} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">Zones</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">Manage coverage areas, regions, and shipping rate structure here.</p>
              <button className="mt-4 rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface" onClick={() => (window.location.hash = '/settings/shipping-logistics/zones')} type="button">
                Open Zones
              </button>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">Methods</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">Manage checkout-facing delivery methods and their default SLA or courier path.</p>
              <button className="mt-4 rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface" onClick={() => (window.location.hash = '/settings/shipping-logistics/methods')} type="button">
                Open Methods
              </button>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">Courier & API</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">Manage courier setup and provider integrations only when seller is ready to connect them.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface" onClick={() => (window.location.hash = '/settings/shipping-logistics/courier')} type="button">
                  Open Courier
                </button>
                <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface" onClick={() => (window.location.hash = '/settings/shipping-logistics/api')} type="button">
                  Open API
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">Routing Rules</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">Use rules and simulation only when seller wants more routing control.</p>
              <button className="mt-4 rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface" onClick={() => (window.location.hash = '/settings/shipping-logistics/routing')} type="button">
                Open Routing
              </button>
            </div>
          </div>
        </Panel>
      ) : null}

      {tab === 'zones' ? (
        <Panel
          title="Shipping Zones"
          action={
            <button
              className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
              onClick={() => {
                const createdZone = onAddZone();
                setZoneDraft(createdZone);
                setZoneEditorOpen(true);
              }}
              type="button"
            >
              Add New Zone
            </button>
          }
        >
          <div className="space-y-4">
            {zones.map((zone) => (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm" key={zone.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{zone.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {zone.regions.map((region) => (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary" key={region}>
                          {region}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {zone.methods.map((method) => (
                        <span className="rounded-full border border-outline-variant/20 bg-surface px-2.5 py-1 text-xs text-on-surface-variant" key={method}>
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                    onClick={() => {
                      setZoneDraft(zone);
                      setZoneEditorOpen(true);
                    }}
                    type="button"
                  >
                    Edit
                  </button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                    <p className="text-sm font-medium">Weight based rates</p>
                    <div className="mt-3 space-y-3">
                      {zone.weightRates.map((rate) => (
                        <div className="grid gap-2 rounded-xl border border-outline-variant/10 bg-surface-low px-3 py-3 text-sm md:grid-cols-[minmax(0,1.4fr)_1fr_auto] md:items-center" key={rate.id}>
                          <span className="font-medium">{rate.name}</span>
                          <span className="text-on-surface-variant">{rate.range}</span>
                          <span>{rate.rate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                    <p className="text-sm font-medium">Price based rates</p>
                    <div className="mt-3 space-y-3">
                      {zone.priceRates.map((rate) => (
                        <div className="grid gap-2 rounded-xl border border-outline-variant/10 bg-surface-low px-3 py-3 text-sm md:grid-cols-[minmax(0,1.4fr)_1fr_auto] md:items-center" key={rate.id}>
                          <span className="font-medium">{rate.name}</span>
                          <span className="text-on-surface-variant">{rate.range}</span>
                          <span>{rate.rate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === 'methods' ? (
        <Panel title="Delivery Methods">
          <div className="space-y-4">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-medium">How delivery methods should work</p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Delivery methods are checkout-facing shipping choices. Each method should later map to the right zone, courier, speed, and pricing rule.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {shippingMethods.map((method) => (
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm" key={method.name}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{method.name}</p>
                    <StatusBadge tone={method.active ? 'success' : 'neutral'}>{method.active ? 'Active' : 'Inactive'}</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{method.note}</p>
                  <div className="mt-3 grid gap-2 text-xs text-on-surface-variant">
                    <span>SLA: {method.sla}</span>
                    <span>Preferred courier: {method.preferredCourier || 'Not assigned yet'}</span>
                  </div>
                  <button
                    className="mt-4 rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                    onClick={() => {
                      setMethodDraft(method);
                      setMethodEditorOpen(true);
                    }}
                    type="button"
                  >
                    Edit Method
                  </button>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <p className="text-sm font-medium">Current rate examples</p>
              <div className="mt-3 space-y-3">
                {zones.flatMap((zone) => zone.weightRates.slice(0, 1).map((rate) => ({ zone: zone.name, ...rate }))).map((rate) => (
                  <div className="grid gap-2 rounded-xl border border-outline-variant/10 bg-surface-low px-3 py-3 text-sm md:grid-cols-[160px_minmax(0,1.4fr)_1fr_auto] md:items-center" key={`${rate.zone}-${rate.id}`}>
                    <span className="font-medium text-primary">{rate.zone}</span>
                    <span>{rate.name}</span>
                    <span className="text-on-surface-variant">{rate.range}</span>
                    <span>{rate.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      {tab === 'courier' ? (
        <Panel title="Courier Integrations">
          <div className="mb-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">Keep this area simple</p>
            <p className="mt-1 text-sm leading-6 text-on-surface-variant">
              Use this list to see which courier is not started, in setup, or already live. Open a courier only when you want to work on
              setup, test mode, tracking flow, or routing readiness.
            </p>
          </div>
          <div className="space-y-3">
            {couriers.map((courier) => (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 bg-surface-lowest px-4 py-4 shadow-sm" key={courier.id}>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{courier.name}</p>
                    <StatusBadge tone={courier.status === 'Connected' ? 'success' : courier.status === 'Sandbox' ? 'warning' : 'neutral'}>
                      {courier.status}
                    </StatusBadge>
                    <StatusBadge tone={courier.mode === 'Live' ? 'success' : 'neutral'}>{courier.mode} Mode</StatusBadge>
                    <StatusBadge tone={courier.enabledForRouting ? 'success' : 'neutral'}>
                      {courier.enabledForRouting ? 'Routing On' : 'Routing Off'}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-on-surface-variant">{courier.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onConfigureCourier(courier.id)} type="button">
                    {courier.status === 'Connected' ? 'Manage' : courier.status === 'Sandbox' ? 'Continue Setup' : 'Open Setup'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === 'api' ? (
        <Panel title="Shipping Providers">
          <div className="mb-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">For sellers who prefer aggregator workflows</p>
            <p className="mt-1 text-sm leading-6 text-on-surface-variant">
              Provider integrations are optional. Keep the surface clean here, then open one only when you want to connect provider
              credentials, sync settings, or default courier mapping.
            </p>
          </div>
          <div className="space-y-3">
            {providers.map((provider) => (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 bg-surface-lowest px-4 py-4 shadow-sm" key={provider.id}>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{provider.name}</p>
                    <StatusBadge tone={provider.status === 'Connected' ? 'success' : provider.status === 'Sandbox' ? 'warning' : 'neutral'}>
                      {provider.status}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-on-surface-variant">{provider.description}</p>
                  <p className="text-xs text-on-surface-variant">{provider.setupHint}</p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={() => onOpenShippingProvider(provider.id)} type="button">
                    {provider.status === 'Connected' || provider.status === 'Sandbox' ? 'Manage' : 'Open Setup'}
                  </button>
                  {provider.status === 'Disabled' ? (
                    <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => onQuickActivateShippingProvider(provider.id)} type="button">
                      Activate
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === 'routing' ? (
        <Panel title="Routing Rules & Simulation">
          <div className="space-y-4">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4 text-sm text-on-surface-variant">
              Routing decides which courier should be assigned after checkout based on zone, service level, courier readiness, and fallback logic.
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-medium">What test simulation actually does</p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                This is a safe mock check. It helps seller preview which routing rule would win for a sample order and which courier would be
                selected. It does not create a real shipment, call the courier, or affect live customer orders.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Recommended Templates</p>
              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                {recommendedShippingRoutingTemplates.map((template) => (
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4" key={`${template.name}-${template.condition}`}>
                    <p className="text-sm font-semibold">{template.name}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{template.description}</p>
                    <p className="mt-3 text-xs text-on-surface-variant">{template.condition}</p>
                    <p className="text-xs text-on-surface-variant">{template.action}</p>
                    <button
                      className="mt-3 rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface"
                      onClick={() => {
                        const createdRule = onCreateRoutingRuleFromTemplate(template);
                        setEditingRoutingRuleId(createdRule.id);
                        setRoutingRuleDraft({
                          name: createdRule.name,
                          condition: createdRule.condition,
                          action: createdRule.action,
                        });
                      }}
                      type="button"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {routingRules.map((rule) => (
                <div className="rounded-2xl border border-outline-variant/20 p-3" key={rule.id}>
                  {editingRoutingRuleId === rule.id ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">Edit Routing Rule</p>
                          <p className="text-xs text-on-surface-variant">Adjust routing name, trigger condition, and assignment action.</p>
                        </div>
                        <StatusBadge tone={rule.status === 'Active' ? 'success' : 'neutral'}>{rule.status}</StatusBadge>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <input
                          className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                          onChange={(event) => setRoutingRuleDraft((current) => ({ ...current, name: event.target.value }))}
                          placeholder="Rule name"
                          value={routingRuleDraft.name}
                        />
                        <div className="space-y-2">
                          <select
                            className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                            onChange={(event) => {
                              if (event.target.value) {
                                setRoutingRuleDraft((current) => ({ ...current, condition: event.target.value }));
                              }
                            }}
                            value={shippingRoutingConditionOptions.some((option) => option.value === routingRuleDraft.condition) ? routingRuleDraft.condition : ''}
                          >
                            <option value="">Select condition template</option>
                            {shippingRoutingConditionOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.value}
                              </option>
                            ))}
                          </select>
                          <input
                            className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                            onChange={(event) => setRoutingRuleDraft((current) => ({ ...current, condition: event.target.value }))}
                            placeholder="Condition"
                            value={routingRuleDraft.condition}
                          />
                          <p className="text-xs leading-5 text-on-surface-variant">
                            {shippingRoutingConditionOptions.find((option) => option.value === routingRuleDraft.condition)?.hint ??
                              'Choose a template or write your own routing trigger.'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <select
                            className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                            onChange={(event) => {
                              if (event.target.value) {
                                setRoutingRuleDraft((current) => ({ ...current, action: event.target.value }));
                              }
                            }}
                            value={shippingRoutingActionOptions.some((option) => option.value === routingRuleDraft.action) ? routingRuleDraft.action : ''}
                          >
                            <option value="">Select action template</option>
                            {shippingRoutingActionOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.value}
                              </option>
                            ))}
                          </select>
                          <input
                            className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                            onChange={(event) => setRoutingRuleDraft((current) => ({ ...current, action: event.target.value }))}
                            placeholder="Action"
                            value={routingRuleDraft.action}
                          />
                          <p className="text-xs leading-5 text-on-surface-variant">
                            {shippingRoutingActionOptions.find((option) => option.value === routingRuleDraft.action)?.hint ??
                              'Pick a routing action or write a custom assignment behavior manually.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!routingRuleDraft.name.trim() || !routingRuleDraft.condition.trim() || !routingRuleDraft.action.trim()}
                          onClick={() => {
                            onUpdateRoutingRule(rule.id, {
                              name: routingRuleDraft.name.trim(),
                              condition: routingRuleDraft.condition.trim(),
                              action: routingRuleDraft.action.trim(),
                            });
                            setEditingRoutingRuleId(null);
                          }}
                          type="button"
                        >
                          Save Changes
                        </button>
                        <button
                          className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low"
                          onClick={() => {
                            setEditingRoutingRuleId(null);
                            setRoutingRuleDraft({ name: '', condition: '', action: '' });
                          }}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-xs text-on-surface-variant">{rule.condition}</p>
                        <p className="text-xs text-on-surface-variant">{rule.action}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={rule.status === 'Active' ? 'success' : 'neutral'}>{rule.status}</StatusBadge>
                        <button
                          className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                          onClick={() => {
                            setEditingRoutingRuleId(rule.id);
                            setRoutingRuleDraft({
                              name: rule.name,
                              condition: rule.condition,
                              action: rule.action,
                            });
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                          onClick={() => {
                            const duplicatedRule = onDuplicateRoutingRule(rule.id);
                            if (!duplicatedRule) {
                              return;
                            }

                            setEditingRoutingRuleId(duplicatedRule.id);
                            setRoutingRuleDraft({
                              name: duplicatedRule.name,
                              condition: duplicatedRule.condition,
                              action: duplicatedRule.action,
                            });
                          }}
                          type="button"
                        >
                          Duplicate
                        </button>
                        <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onToggleRoutingRule(rule.id)} type="button">
                          {rule.status === 'Active' ? 'Move to Draft' : 'Activate'}
                        </button>
                        <button className="rounded border border-error/20 px-3 py-1.5 text-xs text-error hover:bg-error/5" onClick={() => onDeleteRoutingRule(rule.id)} type="button">
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-dashed border-outline-variant/30 p-4">
              <p className="text-sm font-medium">Create New Routing Rule</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Add a new routing rule quickly. Bisora creates a draft suggestion automatically, and you can edit it right after.
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                  onChange={(event) => setNewRoutingRuleName(event.target.value)}
                  placeholder="Routing rule name"
                  value={newRoutingRuleName}
                />
                <button
                  className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!newRoutingRuleName.trim()}
                  onClick={() => {
                    const createdRule = onCreateRoutingRule(newRoutingRuleName.trim());
                    setEditingRoutingRuleId(createdRule.id);
                    setRoutingRuleDraft({
                      name: createdRule.name,
                      condition: createdRule.condition,
                      action: createdRule.action,
                    });
                    setNewRoutingRuleName('Fallback Courier Rule');
                  }}
                  type="button"
                >
                  Create Rule
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Run routing test preview</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Pick a sample order shape first, then preview which rule and courier path would likely be chosen.
                  </p>
                </div>
                <button
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
                  onClick={() => {
                    onRunSimulation();
                    const selectedZone = zones.find((zone) => zone.name === simulationDraft.zone) ?? zones[0];
                    const selectedMethod = shippingMethods.find((method) => method.name === simulationDraft.method) ?? shippingMethods[0];
                    const scenario = simulationDraft.scenario;

                    const matchedRule =
                      routingRules.find((rule) => {
                        if (scenario === 'Express order + primary courier unavailable') {
                          return rule.condition.includes('Express order');
                        }
                        if (scenario === 'East Malaysia order') {
                          return rule.condition.includes('Sabah & Sarawak') || rule.condition.includes('East Malaysia');
                        }
                        if (scenario === 'International order') {
                          return rule.condition.includes('International');
                        }
                        if (scenario === 'Heavy parcel > 5kg') {
                          return rule.condition.includes('5kg');
                        }
                        return rule.condition.includes(selectedZone?.name ?? '');
                      }) ?? routingRules.find((rule) => rule.status === 'Active') ?? routingRules[0];

                    let selectedCourier =
                      couriers.find((courier) => courier.name === selectedMethod?.preferredCourier && courier.enabledForRouting) ??
                      couriers.find((courier) => courier.enabledForRouting) ??
                      couriers.find((courier) => courier.status !== 'Disconnected') ??
                      couriers[0];

                    if (matchedRule?.action.includes('DHL Express')) {
                      selectedCourier = couriers.find((courier) => courier.name === 'DHL Express') ?? selectedCourier;
                    } else if (matchedRule?.action.includes('POS Malaysia')) {
                      selectedCourier = couriers.find((courier) => courier.name === 'POS Malaysia') ?? selectedCourier;
                    } else if (matchedRule?.action.includes('Ninja Van')) {
                      selectedCourier = couriers.find((courier) => courier.name === 'Ninja Van') ?? selectedCourier;
                    }

                    setSimulationResult({
                      ruleName: matchedRule?.name ?? 'No active rule',
                      zone: selectedZone?.name ?? simulationDraft.zone,
                      method: selectedMethod?.name ?? simulationDraft.method,
                      courier: selectedCourier?.name ?? 'No courier',
                      summary: `For "${scenario}", Bisora would preview the route using the best matching rule first, then select an eligible courier based on readiness and preferred method path.`,
                    });
                  }}
                  type="button"
                >
                  Execute Test Simulation
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field label="Sample Zone">
                  <select
                    className="w-full rounded border border-outline-variant/30 bg-surface-low px-3 py-2 text-sm"
                    onChange={(event) => setSimulationDraft((current) => ({ ...current, zone: event.target.value }))}
                    value={simulationDraft.zone}
                  >
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.name}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Sample Delivery Method">
                  <select
                    className="w-full rounded border border-outline-variant/30 bg-surface-low px-3 py-2 text-sm"
                    onChange={(event) => setSimulationDraft((current) => ({ ...current, method: event.target.value }))}
                    value={simulationDraft.method}
                  >
                    {shippingMethods.map((method) => (
                      <option key={method.name} value={method.name}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Sample Scenario">
                  <select
                    className="w-full rounded border border-outline-variant/30 bg-surface-low px-3 py-2 text-sm"
                    onChange={(event) => setSimulationDraft((current) => ({ ...current, scenario: event.target.value }))}
                    value={simulationDraft.scenario}
                  >
                    {shippingSimulationScenarios.map((scenario) => (
                      <option key={scenario} value={scenario}>
                        {scenario}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            {simulationResult ? (
              <div className="rounded-2xl border border-success/20 bg-success-soft p-4 text-sm">
                <p className="font-medium text-success">Simulation preview result</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2 text-on-surface-variant">
                  <span>Winning rule: {simulationResult.ruleName}</span>
                  <span>Matched zone: {simulationResult.zone}</span>
                  <span>Delivery method: {simulationResult.method}</span>
                  <span>Selected courier: {simulationResult.courier}</span>
                </div>
                <p className="mt-3 text-on-surface-variant">{simulationResult.summary}</p>
              </div>
            ) : null}
          </div>
        </Panel>
      ) : null}

      {showGuide ? <ShippingGuideModal onClose={() => setShowGuide(false)} /> : null}
      {zoneEditorOpen && zoneDraft ? (
        <ShippingZoneEditorModal
          methodOptions={shippingMethods.map((method) => method.name)}
          zone={zoneDraft}
          onClose={() => {
            setZoneEditorOpen(false);
            setZoneDraft(null);
          }}
          onSave={(nextZone) => {
            onSaveZone(zoneDraft.id, nextZone);
            setZoneEditorOpen(false);
            setZoneDraft(null);
          }}
        />
      ) : null}
      {methodEditorOpen ? (
        <ShippingMethodEditorModal
          courierOptions={couriers.map((courier) => courier.name)}
          method={methodDraft}
          onClose={() => setMethodEditorOpen(false)}
          onSave={(nextMethod) => {
            setShippingMethods((current) => current.map((method) => (method.name === methodDraft.name ? nextMethod : method)));
            setMethodEditorOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function ShippingZoneEditorModal({
  methodOptions,
  zone,
  onClose,
  onSave,
}: {
  methodOptions: string[];
  zone: ShippingZone;
  onClose: () => void;
  onSave: (zone: ShippingZone) => void;
}) {
  const [draft, setDraft] = useState<ShippingZone>(zone);
  const [newRegion, setNewRegion] = useState('');

  const availableMethodOptions = methodOptions.length ? methodOptions : defaultShippingMethodNames;

  const updateWeightRate = (index: number, field: keyof ShippingZone['weightRates'][number], value: string) => {
    setDraft((current) => ({
      ...current,
      weightRates: current.weightRates.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  };

  const updatePriceRate = (index: number, field: keyof ShippingZone['priceRates'][number], value: string) => {
    setDraft((current) => ({
      ...current,
      priceRates: current.priceRates.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-start justify-center px-4 py-6">
        <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-lowest shadow-2xl">
          <div className="sticky top-0 border-b border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">Edit Shipping Zone</p>
                <p className="mt-1 text-sm text-on-surface-variant">{zone.name}</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-surface-low" onClick={onClose} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
            <Field label="Zone Name">
              <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} value={draft.name} />
              <FieldHint text="Customers will not see this internal zone name directly." />
            </Field>

            <Field label="Countries / States">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {draft.regions.map((region) => (
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary" key={region}>
                      {region}
                      <button
                        className="text-primary/70 hover:text-primary"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            regions: current.regions.filter((item) => item !== region),
                          }))
                        }
                        type="button"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                    onChange={(event) => setNewRegion(event.target.value)}
                    placeholder="Add country or state"
                    value={newRegion}
                  />
                  <button
                    className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!newRegion.trim()}
                    onClick={() => {
                      const nextRegion = newRegion.trim();
                      if (draft.regions.includes(nextRegion)) {
                        setNewRegion('');
                        return;
                      }
                      setDraft((current) => ({
                        ...current,
                        regions: [...current.regions, nextRegion],
                      }));
                      setNewRegion('');
                    }}
                    type="button"
                  >
                    Add Region
                  </button>
                </div>
              </div>
              <FieldHint text="Build this zone one region at a time so seller can control coverage more clearly." />
            </Field>

            <Field label="Delivery Methods In This Zone">
              <div className="grid gap-3 sm:grid-cols-2">
                {availableMethodOptions.map((methodName) => {
                  const checked = draft.methods.includes(methodName);
                  return (
                    <label className="flex items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface p-3 text-sm" key={methodName}>
                      <input
                        checked={checked}
                        className="h-4 w-4 accent-primary"
                        onChange={() =>
                          setDraft((current) => ({
                            ...current,
                            methods: checked ? current.methods.filter((item) => item !== methodName) : [...current.methods, methodName],
                          }))
                        }
                        type="checkbox"
                      />
                      <span>{methodName}</span>
                    </label>
                  );
                })}
              </div>
              <FieldHint text="These are the checkout-facing delivery methods that should be available for this zone." />
            </Field>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Weight based rates</p>
                  <button
                    className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        weightRates: [
                          ...current.weightRates,
                          {
                            id: `wr-${Date.now()}`,
                            name: current.methods[0] ?? 'Standard Delivery',
                            range: '0.10kg - 1.00kg',
                            rate: 'MYR5.00',
                          },
                        ],
                      }))
                    }
                    type="button"
                  >
                    Add Rate
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {draft.weightRates.map((rate, index) => (
                    <div className="grid gap-3 rounded-xl border border-outline-variant/10 bg-surface-low p-3" key={rate.id}>
                      <div className="flex items-start justify-between gap-3">
                        <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updateWeightRate(index, 'name', event.target.value)} value={rate.name} />
                        <button
                          className="rounded border border-error/20 px-3 py-2 text-xs text-error hover:bg-error/5"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              weightRates: current.weightRates.filter((_, itemIndex) => itemIndex !== index),
                            }))
                          }
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updateWeightRate(index, 'range', event.target.value)} value={rate.range} />
                        <input className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updateWeightRate(index, 'rate', event.target.value)} value={rate.rate} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Price based rates</p>
                  <button
                    className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        priceRates: [
                          ...current.priceRates,
                          {
                            id: `pr-${Date.now()}`,
                            name: current.methods[0] ?? 'Standard Delivery',
                            range: 'MYR0.00 - MYR99.00',
                            rate: 'MYR5.00',
                          },
                        ],
                      }))
                    }
                    type="button"
                  >
                    Add Rate
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {draft.priceRates.map((rate, index) => (
                    <div className="grid gap-3 rounded-xl border border-outline-variant/10 bg-surface-low p-3" key={rate.id}>
                      <div className="flex items-start justify-between gap-3">
                        <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updatePriceRate(index, 'name', event.target.value)} value={rate.name} />
                        <button
                          className="rounded border border-error/20 px-3 py-2 text-xs text-error hover:bg-error/5"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              priceRates: current.priceRates.filter((_, itemIndex) => itemIndex !== index),
                            }))
                          }
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updatePriceRate(index, 'range', event.target.value)} value={rate.range} />
                        <input className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => updatePriceRate(index, 'rate', event.target.value)} value={rate.rate} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-outline-variant/20 bg-surface-lowest p-5">
            <button className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm hover:bg-surface-low" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => onSave(draft)} type="button">
              Save Zone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShippingMethodEditorModal({
  method,
  courierOptions,
  onClose,
  onSave,
}: {
  method: ShippingMethodDraft;
  courierOptions: string[];
  onClose: () => void;
  onSave: (method: ShippingMethodDraft) => void;
}) {
  const [draft, setDraft] = useState(method);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-start justify-center px-4 py-6">
        <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-lowest shadow-2xl">
          <div className="sticky top-0 border-b border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">Edit Delivery Method</p>
                <p className="mt-1 text-sm text-on-surface-variant">{method.name}</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-surface-low" onClick={onClose} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              <Field label="Method Name">
                <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} value={draft.name} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Method Status">
                  <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setDraft((current) => ({ ...current, active: event.target.value === 'active' }))} value={draft.active ? 'active' : 'inactive'}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <FieldHint text="Inactive methods stay out of checkout until seller is ready." />
                </Field>
                <Field label="Expected SLA">
                  <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setDraft((current) => ({ ...current, sla: event.target.value }))} value={draft.sla} />
                </Field>
              </div>
              <Field label="Preferred Courier">
                <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setDraft((current) => ({ ...current, preferredCourier: event.target.value }))} value={draft.preferredCourier}>
                  <option value="">No preferred courier yet</option>
                  {courierOptions.map((courier) => (
                    <option key={courier} value={courier}>
                      {courier}
                    </option>
                  ))}
                </select>
                <FieldHint text="This is the preferred default path for the method, not a forced live shipment assignment by itself." />
              </Field>
              <Field label="Seller Note">
                <textarea className="min-h-[120px] w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} value={draft.note} />
                <FieldHint text="Keep this simple and seller-friendly. This explains when the method should be used." />
              </Field>
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-outline-variant/20 bg-surface-lowest p-5">
            <button className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm hover:bg-surface-low" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => onSave(draft)} type="button">
              Save Method
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsSettingsPage({
  subSection,
  notify,
  onSave,
  onSendTest,
}: {
  subSection?: string;
  notify: (title: string, description: string) => void;
  onSave: (name: string, patch?: Record<string, any>) => void;
  onSendTest: (channel: string) => void | Promise<void>;
}) {
  const tab = normalizeNotificationsTab(subSection);
  const [enabled, setEnabled] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [eventTemplates, setEventTemplates] = useState(notificationEventTemplatesSeed);
  const [selectedEventTemplate, setSelectedEventTemplate] = useState<NotificationEventTemplate | null>(null);
  const [quietHours, setQuietHours] = useState(true);
  const [triggerToggles, setTriggerToggles] = useState([
    { id: 'packed', label: 'Order packed', enabled: true },
    { id: 'shipped', label: 'Order shipped', enabled: true },
    { id: 'out-for-delivery', label: 'Out for delivery', enabled: true },
    { id: 'delivered', label: 'Delivered', enabled: true },
    { id: 'delivery-exception', label: 'Delivery exception', enabled: false },
  ]);
  const [aiTimingEnabled, setAiTimingEnabled] = useState(true);
  const [smartChannelEnabled, setSmartChannelEnabled] = useState(true);
  const [frequencyControlEnabled, setFrequencyControlEnabled] = useState(true);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLogRecord[]>([]);
  const [notificationSummary, setNotificationSummary] = useState({ queued: 0, sent: 0, failed: 0 });
  const [processingQueue, setProcessingQueue] = useState(false);

  const refreshNotificationLogs = () => {
    if (!hasApiSession()) {
      return;
    }

    fetchNotificationLogs()
      .then((result) => {
        setNotificationLogs(result.logs);
        setNotificationSummary(result.summary);
      })
      .catch(() => {
        setNotificationLogs([]);
        setNotificationSummary({ queued: 0, sent: 0, failed: 0 });
      });
  };

  useEffect(() => {
    refreshNotificationLogs();
  }, []);

  const updateLogStatus = async (id: string, status: 'queued' | 'sent' | 'failed') => {
    const updated = await updateNotificationLogStatus(id, status);
    setNotificationLogs((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    refreshNotificationLogs();
  };

  const retryLog = async (id: string) => {
    const updated = await retryNotificationLog(id);
    setNotificationLogs((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    refreshNotificationLogs();
  };

  const sendTestNotification = async (channel: string) => {
    await onSendTest(channel);
    refreshNotificationLogs();
  };

  const processQueueNow = async () => {
    if (processingQueue) {
      return;
    }

    setProcessingQueue(true);

    try {
      const summary = await processNotificationQueue(25);
      notify('Queue processed', `${summary.sent} sent, ${summary.failed} failed, ${summary.processed} checked.`);
      refreshNotificationLogs();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Backend could not process the notification queue.';
      notify('Queue process failed', message);
    } finally {
      setProcessingQueue(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm">
          <p className="text-sm font-medium text-on-surface">Notification control center</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Decide which customer moments should trigger a send, which channel should carry the message, and how often the store should
            follow up.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={() => setShowGuide(true)} type="button">
              Open Notification Guide
            </button>
          </div>
        </div>

        <Panel title="Automation Queue">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-on-surface-variant">Process queued notifications immediately for this tenant.</p>
              <button className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60" disabled={processingQueue} onClick={() => void processQueueNow()} type="button">
                {processingQueue ? 'Processing...' : 'Process Queue'}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatRow label="Queued" value={String(notificationSummary.queued)} />
              <StatRow label="Sent" value={String(notificationSummary.sent)} />
              <StatRow label="Failed" value={String(notificationSummary.failed)} />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-outline-variant/20">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 text-left">Event</th>
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Channel</th>
                    <th className="px-4 py-3 text-left">Recipient</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {notificationLogs.slice(0, 8).map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{log.event.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-on-surface-variant">{log.subject || log.message}</p>
                      </td>
                      <td className="px-4 py-3">{log.orderNumber || 'System'}</td>
                      <td className="px-4 py-3">{log.channel}</td>
                      <td className="px-4 py-3">{log.recipient}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={log.status === 'sent' ? 'success' : log.status === 'failed' ? 'warning' : 'neutral'}>
                          {log.status}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {log.status === 'failed' ? (
                            <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => void retryLog(log.id)} type="button">
                              Retry
                            </button>
                          ) : null}
                          <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => void updateLogStatus(log.id, 'sent')} type="button">
                            Mark Sent
                          </button>
                          <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => void updateLogStatus(log.id, 'failed')} type="button">
                            Failed
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {notificationLogs.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-on-surface-variant" colSpan={6}>
                        Notification queue is empty for this tenant.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>

        <LocalTabs
          tabs={[
            { key: 'shipment', label: 'Shipment' },
            { key: 'defaults', label: 'Channel Defaults' },
            { key: 'ai', label: 'AI Optimization' },
          ]}
          activeTab={tab}
          onTabChange={(next) => (window.location.hash = `/settings/notifications/${next}`)}
        />

        {tab === 'shipment' ? (
          <Panel title="Shipment Notifications">
            <div className="space-y-4">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-medium">1. Sending Rules</p>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  Use this area to decide when the system should send shipment updates, how often customers should hear from the store, and
                  which moments are important enough to notify.
                </p>
              </div>

              <ToggleRow checked={enabled} label="Enable Shipment Notifications" onChange={setEnabled} />
              <ToggleRow checked={quietHours} label="Respect quiet hours for non-urgent sends" onChange={setQuietHours} />

              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="text-sm font-medium">Choose shipment trigger moments</p>
                <div className="mt-3 space-y-3">
                  {triggerToggles.map((trigger) => (
                    <ToggleRow
                      checked={trigger.enabled}
                      key={trigger.id}
                      label={trigger.label}
                      onChange={() =>
                        setTriggerToggles((current) =>
                          current.map((item) => (item.id === trigger.id ? { ...item, enabled: !item.enabled } : item)),
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="text-sm font-medium">Channel test only</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Test send is only for checking message formatting and channel readiness. It does not notify real customer orders.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {['Email', 'SMS', 'WhatsApp'].map((channel) => (
                    <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" key={channel} onClick={() => void sendTestNotification(channel)} type="button">
                      Test {channel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="text-sm font-medium">Recommended channel mapping</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
                      <tr>
                        <th className="px-4 py-3 text-left">Customer Event</th>
                        <th className="px-4 py-3 text-left">Best Channel</th>
                        <th className="px-4 py-3 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {[
                        ['Payment success / invoice ready', 'Email', 'Best for invoice, receipt, and records customer may revisit later.'],
                        ['Order shipped', 'Email', 'Good for richer shipment detail and tracking link.'],
                        ['Out for delivery', 'SMS', 'Best for urgent final-mile awareness.'],
                        ['Delivery exception', 'WhatsApp', 'Useful when support may need back-and-forth replies.'],
                        ['Delivered confirmation', 'SMS or Email', 'Use SMS for urgency, Email for fuller confirmation and summary.'],
                      ].map(([event, channel, reason]) => (
                        <tr key={event}>
                          <td className="px-4 py-3">{event}</td>
                          <td className="px-4 py-3">{channel}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="text-sm font-medium">2. Event Templates</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Edit each customer-facing notification separately. This is where seller controls the actual message content for
                  confirmation, payment, shipping, and exception moments.
                </p>
                <div className="mt-4 space-y-3">
                  {eventTemplates.map((template) => (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 bg-surface-low px-4 py-4" key={template.id}>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{template.name}</p>
                          <StatusBadge tone={template.status === 'Enabled' ? 'success' : 'neutral'}>{template.status}</StatusBadge>
                        </div>
                        <p className="text-sm text-on-surface-variant">{template.description}</p>
                      </div>
                      <button
                        className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface"
                        onClick={() => setSelectedEventTemplate(template)}
                        type="button"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        ) : null}

        {tab === 'defaults' ? (
          <Panel title="Channel Defaults">
            <div className="space-y-4">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-medium">Default channel behavior</p>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  Use this area for channel-wide defaults only. This is not where seller edits each customer event. Event message editing stays
                  under Shipment / Event Templates.
                </p>
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                <NotificationChannelPanel name="Email" onSave={onSave} onSendTest={sendTestNotification} />
                <NotificationChannelPanel name="SMS" onSave={onSave} onSendTest={sendTestNotification} />
                <NotificationChannelPanel name="WhatsApp" onSave={onSave} onSendTest={sendTestNotification} />
              </div>
            </div>
          </Panel>
        ) : null}
        {tab === 'ai' ? (
          <Panel title="AI Notification Optimization">
            <div className="space-y-4">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-medium">Future-facing optimization layer</p>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  This area is for future smart delivery logic. Right now it is configuration-ready UI, not a fully automated live engine yet.
                </p>
              </div>
              <ToggleRow checked={aiTimingEnabled} label="Enable AI timing optimization" onChange={setAiTimingEnabled} />
              <ToggleRow checked={smartChannelEnabled} label="Smart channel selection" onChange={setSmartChannelEnabled} />
              <ToggleRow checked={frequencyControlEnabled} label="Frequency control" onChange={setFrequencyControlEnabled} />
            </div>
            <button className="mt-3 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => onSave('AI Optimization')} type="button">
              Save AI Settings
            </button>
          </Panel>
        ) : null}
      </div>

      <aside className="space-y-4">
        <Panel title="Live Notification Preview">
          <div className="space-y-3 rounded-2xl border border-outline-variant/20 bg-surface-low p-4 text-sm">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-3">
              <p className="font-medium">Order shipped</p>
              <p className="mt-1 text-on-surface-variant">Email sent with tracking link and shipment summary.</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-3">
              <p className="font-medium">Out for delivery</p>
              <p className="mt-1 text-on-surface-variant">SMS reserved for high-importance final-mile updates.</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-3">
              <p className="font-medium">Delivery exception</p>
              <p className="mt-1 text-on-surface-variant">WhatsApp can be used when customer support may need a reply loop.</p>
            </div>
          </div>
        </Panel>
      </aside>

      {showGuide ? <NotificationGuideModal onClose={() => setShowGuide(false)} /> : null}
      {selectedEventTemplate ? (
        <NotificationTemplateEditorModal
          template={selectedEventTemplate}
          onClose={() => setSelectedEventTemplate(null)}
          onSave={(nextTemplate) => {
            setEventTemplates((current) => current.map((item) => (item.id === nextTemplate.id ? nextTemplate : item)));
            setSelectedEventTemplate(null);
            onSave(nextTemplate.name);
          }}
        />
      ) : null}
    </div>
  );
}

function NotificationChannelPanel({
  name,
  onSave,
  onSendTest,
}: {
  name: string;
  onSave: (name: string, patch?: Record<string, any>) => void;
  onSendTest: (channel: string) => void | Promise<void>;
}) {
  const defaults = notificationChannelDefaults[name] ?? notificationChannelDefaults.Email;
  const [draft, setDraft] = useState<NotificationChannelDraft>(defaults);

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm">
      <div className="space-y-4">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-base font-semibold">{name}</p>
          <p className="text-sm font-medium">When to use {name}</p>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">
            {name === 'Email'
              ? 'Best for richer shipment details, tracking links, and messages that customer may want to revisit later.'
              : name === 'SMS'
                ? 'Best for short, high-priority updates such as out-for-delivery or delivery completion.'
                : 'Best when seller wants a more conversational support path for issues, follow-up, or reassurance.'}
          </p>
        </div>
        <ToggleRow checked={draft.enabled} label={`Enable ${name} channel`} onChange={() => setDraft((current) => ({ ...current, enabled: !current.enabled }))} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Sender Label">
            <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setDraft((current) => ({ ...current, senderLabel: event.target.value }))} value={draft.senderLabel} />
          </Field>
          <Field label="Primary Trigger">
            <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setDraft((current) => ({ ...current, trigger: event.target.value }))} value={draft.trigger}>
              <option>Shipment marked as shipped</option>
              <option>Out for delivery / delivered</option>
              <option>Delivery exception / customer follow-up</option>
              <option>Manual support follow-up</option>
            </select>
          </Field>
        </div>
        <Field label="Send Timing">
          <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setDraft((current) => ({ ...current, sendTiming: event.target.value }))} value={draft.sendTiming}>
            <option>Immediately after shipment status update</option>
            <option>Only for important milestones</option>
            <option>For conversational support moments</option>
            <option>Wait 15 minutes to reduce duplicate sends</option>
          </select>
        </Field>
        <Field label="Template Subject">
          <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))} value={draft.subject} />
        </Field>
        <Field label="Message Body">
          <textarea className="min-h-[120px] w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} value={draft.body} />
          <FieldHint text="Use placeholders like {{customer_name}} and {{order_number}} so the message stays reusable." />
        </Field>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-medium">Current delivery logic</p>
          <div className="mt-3 grid gap-2 text-sm text-on-surface-variant">
            <span>Channel status: {draft.enabled ? 'Enabled' : 'Disabled'}</span>
            <span>Trigger: {draft.trigger}</span>
            <span>Send timing: {draft.sendTiming}</span>
            <span>Sender label: {draft.senderLabel}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={() => void onSendTest(name)} type="button">
            Send Test
          </button>
          <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => onSave(name, buildNotificationChannelSettings(name, draft))} type="button">
            Save Default
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-start justify-center px-4 py-6">
        <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-lowest shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">Notification Guide</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Seller guide for deciding which event should send to which channel, and why not every message should go everywhere.
                </p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-surface-low" onClick={onClose} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">Short answer for seller flow</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  If customer buys from the storefront and payment is confirmed, then invoice or receipt normally goes through `Email` first.
                  After that, shipping updates do not have to go to every channel automatically. Seller should choose the best channel for
                  each moment.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <p className="text-sm font-semibold">What usually goes to Email</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                    <li>Payment success confirmation</li>
                    <li>Invoice / receipt</li>
                    <li>Order shipped with tracking link</li>
                    <li>Longer order summary that customer may revisit later</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <p className="text-sm font-semibold">What usually goes to SMS or WhatsApp</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                    <li>`SMS`: urgent short updates like out-for-delivery or delivered</li>
                    <li>`WhatsApp`: exception handling, customer reassurance, or support-led follow-up</li>
                    <li>Not every shipping event should go to WhatsApp unless seller really wants that style of communication</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">Recommended event matrix</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-surface-lowest text-xs uppercase tracking-wide text-on-surface-variant">
                      <tr>
                        <th className="px-4 py-3 text-left">Event</th>
                        <th className="px-4 py-3 text-left">Recommended Channel</th>
                        <th className="px-4 py-3 text-left">Why</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {[
                        ['Payment confirmed', 'Email', 'Best for invoice and payment record.'],
                        ['Invoice available', 'Email', 'Customer can revisit later and download details.'],
                        ['Order shipped', 'Email', 'Tracking link and fuller shipment summary fit best here.'],
                        ['Out for delivery', 'SMS', 'Short and urgent message works best.'],
                        ['Delivery exception', 'WhatsApp', 'More suitable if support conversation may happen.'],
                        ['Delivered', 'SMS or Email', 'Depends whether seller wants urgent ping or fuller written summary.'],
                      ].map(([event, channel, why]) => (
                        <tr key={event}>
                          <td className="px-4 py-3">{event}</td>
                          <td className="px-4 py-3">{channel}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{why}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">How to read the Notifications page</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                  <li>`Sending Rules` = decide when the system should send.</li>
                  <li>`Event Templates` = decide what the customer actually receives for each event.</li>
                  <li>`Channel Defaults` = set channel-wide defaults like sender label and default timing.</li>
                  <li>`Channel Test` = only checks formatting and readiness, not live customer delivery.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">Important seller rule</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Do not assume `shipping happened = send WhatsApp automatically`. WhatsApp should be a deliberate seller choice. Default
                  safer mental model is:
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                  <li>payment/invoice: Email</li>
                  <li>shipment summary: Email</li>
                  <li>urgent final-mile update: SMS</li>
                  <li>exception or support conversation: WhatsApp</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex justify-end">
              <button className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm hover:bg-surface-low" onClick={onClose} type="button">
                Close Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationTemplateEditorModal({
  template,
  onClose,
  onSave,
}: {
  template: NotificationEventTemplate;
  onClose: () => void;
  onSave: (template: NotificationEventTemplate) => void;
}) {
  const [draft, setDraft] = useState<NotificationEventTemplate>(template);
  const [activeChannel, setActiveChannel] = useState<'Email' | 'SMS' | 'WhatsApp'>('Email');
  const [showPreview, setShowPreview] = useState(false);

  const activeDraft = draft.channels[activeChannel];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-start justify-center px-4 py-6">
        <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-lowest shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">{draft.name}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{draft.description}</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-surface-low" onClick={onClose} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={() => setShowPreview((current) => !current)} type="button">
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </button>
              </div>

              <LocalTabs
                tabs={[
                  { key: 'Email', label: 'Email' },
                  { key: 'SMS', label: 'SMS' },
                  { key: 'WhatsApp', label: 'Whatsapp' },
                ]}
                activeTab={activeChannel}
                onTabChange={(next) => setActiveChannel(next as 'Email' | 'SMS' | 'WhatsApp')}
              />

              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <div className="space-y-4">
                  <Field label={`${activeChannel} Subject`}>
                    <input
                      className="w-full rounded border border-outline-variant/30 bg-surface-low px-3 py-2 text-sm"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          channels: {
                            ...current.channels,
                            [activeChannel]: {
                              ...current.channels[activeChannel],
                              subject: event.target.value,
                            },
                          },
                        }))
                      }
                      value={activeDraft.subject}
                    />
                  </Field>

                  <Field label={`${activeChannel} Body`}>
                    <textarea
                      className="min-h-[260px] w-full rounded border border-outline-variant/30 bg-surface-low px-3 py-2 text-sm"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          channels: {
                            ...current.channels,
                            [activeChannel]: {
                              ...current.channels[activeChannel],
                              body: event.target.value,
                            },
                          },
                        }))
                      }
                      value={activeDraft.body}
                    />
                  </Field>

                  <ToggleRow
                    checked={activeDraft.enabled}
                    label={`Enable ${activeChannel}`}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        channels: {
                          ...current.channels,
                          [activeChannel]: {
                            ...current.channels[activeChannel],
                            enabled: !current.channels[activeChannel].enabled,
                          },
                        },
                        status:
                          Object.values({
                            ...current.channels,
                            [activeChannel]: {
                              ...current.channels[activeChannel],
                              enabled: !current.channels[activeChannel].enabled,
                            },
                          }).some((channel) => channel.enabled)
                            ? 'Enabled'
                            : 'Disabled',
                      }))
                    }
                  />
                </div>
              </div>

              {showPreview ? (
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <p className="text-sm font-medium">Preview</p>
                  <div className="mt-3 rounded-2xl border border-outline-variant/20 bg-surface p-4">
                    <p className="font-medium">{activeDraft.subject}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">{activeDraft.body}</p>
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="text-sm font-medium">Notification variables</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  You can use these parameters inside your templates so the message stays reusable.
                </p>
                <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
                  {draft.variables.map((variable) => (
                    <li key={variable}>{variable}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex justify-end gap-2">
              <button className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm hover:bg-surface-low" onClick={onClose} type="button">
                Cancel
              </button>
              <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => onSave(draft)} type="button">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationsSettingsPage({
  items,
  storeSettings,
  subSection,
  onToggleConnection,
  onOpenIntegration,
  onSave,
}: {
  items: IntegrationItem[];
  storeSettings: StoreSettings | null;
  subSection?: string;
  onToggleConnection: (id: string) => void;
  onOpenIntegration: (id: string) => void;
  onSave: (name: string, patch?: Record<string, any>) => void;
}) {
  const tab = normalizeIntegrationsTab(subSection);
  const [showGuide, setShowGuide] = useState(false);
  const integrationMeta: Record<
    IntegrationItem['id'],
    { sellerFit: string; setupHint: string; primaryUse: string }
  > = {
    'in-1': {
      sellerFit: 'Best for stores that want stronger Meta retargeting and server-side conversion visibility.',
      setupHint: 'Connect this when ads team needs Pixel + CAPI consistency.',
      primaryUse: 'Track purchase events and improve Meta campaign attribution.',
    },
    'in-2': {
      sellerFit: 'Best for stores already running Google Ads and wanting better conversion optimization.',
      setupHint: 'Add this after GA4 if seller is actively spending on Google Ads campaigns.',
      primaryUse: 'Send storefront conversion signals back into Google Ads.',
    },
    'in-3': {
      sellerFit: 'Best for stores testing TikTok acquisition and event tracking.',
      setupHint: 'Connect before scaling TikTok campaigns that rely on event visibility.',
      primaryUse: 'Track storefront conversion signals for TikTok ads.',
    },
    'in-4': {
      sellerFit: 'Best starting point for most stores, especially when seller wants basic analytics without heavy setup.',
      setupHint: 'Usually the first Google integration to connect before Ads or GTM.',
      primaryUse: 'Measure traffic, sessions, behavior, and purchase performance.',
    },
    'in-5': {
      sellerFit: 'Best for stores with a marketer, developer, or agency managing tags in one central place.',
      setupHint: 'Use this only when seller wants centralized tag control and more advanced flexibility.',
      primaryUse: 'Manage tracking scripts and marketing tags from one container.',
    },
    'in-6': {
      sellerFit: 'Best for stores using WhatsApp as a support, order update, or sales touchpoint.',
      setupHint: 'Open this to choose the WhatsApp provider path seller actually wants to use.',
      primaryUse: 'Connect one WhatsApp delivery provider for store messaging.',
    },
    'in-7': {
      sellerFit: 'Best for stores that need stable transactional email delivery and a clear sender setup path.',
      setupHint: 'Open this to choose the email provider seller will use for receipts and notifications.',
      primaryUse: 'Connect one email provider for order, payment, and shipment emails.',
    },
    'in-8': {
      sellerFit: 'Best for stores sending urgent short updates to customers.',
      setupHint: 'Open this to choose the SMS provider seller will use for urgent notifications.',
      primaryUse: 'Connect one SMS provider for short urgent transactional updates.',
    },
    'in-9': {
      sellerFit: 'Best for stores, developers, or agencies that need controlled API access into Bisora.',
      setupHint: 'Use this when an external app, custom panel, or backend service needs API credentials.',
      primaryUse: 'Create and manage API credentials for technical integrations.',
    },
    'in-10': {
      sellerFit: 'Best for technical setups that need Bisora to push order, payment, or fulfillment events outward.',
      setupHint: 'Use this when another system should receive live event updates from Bisora automatically.',
      primaryUse: 'Send event notifications from Bisora to external endpoints by webhook.',
    },
    'in-11': {
      sellerFit: 'Best for stores with ERP, CRM, OMS, WMS, or custom back-office sync requirements.',
      setupHint: 'Use this when seller has a developer or agency building a custom system connection.',
      primaryUse: 'Prepare custom app or ERP sync flow between Bisora and external systems.',
    },
  };

  const selectedIntegration = items.find((item) => item.id === subSection);
  if (selectedIntegration) {
    return (
      <IntegrationDetailPage
        item={selectedIntegration}
        meta={integrationMeta[selectedIntegration.id]}
        notificationSettings={storeSettings?.settings?.notifications}
        onBack={() => (window.location.hash = '/settings/integrations')}
        onSave={(patch) => onSave(selectedIntegration.name, patch)}
      />
    );
  }

  const filtered =
    tab === 'overview'
      ? items
      : items.filter((item) =>
          tab === 'tracking'
            ? item.category === 'Tracking & Analytics'
            : tab === 'messaging'
              ? item.category === 'Messaging'
              : item.category === 'Developer',
        );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-on-surface">Integrations control center</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Connect marketing, messaging, and technical integrations from one place. Keep the main list simple, then open an integration only
              when seller needs deeper setup.
            </p>
          </div>
          <button className="rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={() => setShowGuide(true)} type="button">
            Open Integration Guide
          </button>
        </div>
      </div>

      <LocalTabs
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'tracking', label: 'Tracking & Analytics' },
          { key: 'messaging', label: 'Messaging' },
          { key: 'developer', label: 'Developer' },
        ]}
        activeTab={tab}
        onTabChange={(next) => (window.location.hash = `/settings/integrations/${next}`)}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {[ 
          {
            title: 'Tracking & Analytics',
            count: items.filter((item) => item.category === 'Tracking & Analytics').length,
            note: 'For attribution, campaign signals, and storefront analytics.',
          },
          {
            title: 'Messaging',
            count: items.filter((item) => item.category === 'Messaging').length,
            note: 'For notification delivery and customer communication channels.',
          },
          {
            title: 'Developer',
            count: items.filter((item) => item.category === 'Developer').length,
            note: 'For developer integration choices. Actual API key and webhook management happens in Settings > Developer.',
          },
        ].map((group) => (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4" key={group.title}>
            <p className="text-sm font-medium">{group.title}</p>
            <p className="mt-2 text-2xl font-semibold">{group.count}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{group.note}</p>
          </div>
        ))}
      </div>

      <Panel title="Integrations Hub">
        {tab === 'tracking' || tab === 'overview' ? (
          <div className="mb-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">How sellers should choose their tracking path</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="text-sm font-medium">1. Meta ads path</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">If seller mainly runs Meta ads, start with Meta Pixel & CAPI for retargeting and purchase signal visibility.</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="text-sm font-medium">2. Google basic path</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">Most sellers using Google tools should start with GA4, then add Google Ads only if they are actively running ads.</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="text-sm font-medium">3. TikTok test path</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">Use TikTok Pixel when seller is testing or scaling TikTok campaigns and wants storefront event visibility there.</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="text-sm font-medium">4. Advanced tag control</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">Use GTM only when seller has a marketer, agency, or technical team managing multiple tracking tags in one place.</p>
              </div>
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm" key={item.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{item.name}</p>
                <StatusBadge tone={item.status === 'Connected' ? 'success' : 'neutral'}>{item.status}</StatusBadge>
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">{item.category}</p>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{integrationMeta[item.id]?.sellerFit}</p>
              <p className="mt-2 text-xs text-on-surface-variant">{integrationMeta[item.id]?.setupHint}</p>
              <div className="mt-4 flex gap-2">
                <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onOpenIntegration(item.id)} type="button">
                  {item.category === 'Messaging'
                    ? 'Open Providers'
                    : item.category === 'Developer'
                      ? 'Open Details'
                      : item.status === 'Connected'
                        ? 'Manage'
                        : 'Open Setup'}
                </button>
                {item.category !== 'Messaging' && item.category !== 'Developer' ? (
                  <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onToggleConnection(item.id)} type="button">
                    {item.status === 'Connected' ? 'Disconnect' : 'Connect'}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {showGuide ? <IntegrationGuideModal onClose={() => setShowGuide(false)} /> : null}
    </div>
  );
}

function IntegrationDetailPage({
  item,
  meta,
  notificationSettings,
  onBack,
  onSave,
}: {
  item: IntegrationItem;
  meta?: { sellerFit: string; setupHint: string; primaryUse: string };
  notificationSettings?: Record<string, any>;
  onBack: () => void;
  onSave: (patch?: Record<string, any>) => void;
}) {
  const isTrackingTool = item.category === 'Tracking & Analytics';
  const isMessagingHub = item.category === 'Messaging';
  const isDeveloperIntegration = item.category === 'Developer';
  const messagingProviders = (() => {
    switch (item.id) {
      case 'in-6':
        return [
          {
            id: 'wa-meta',
            name: 'Meta Cloud API',
            cost: 'Seller pays',
            status: 'Recommended',
            bestFor: 'Best official path for scalable WhatsApp order and support messaging.',
            setupHint: 'Use this when seller wants reliable WhatsApp delivery and compliance-ready setup.',
            fields: [
              { label: 'Access Token', value: 'meta_access_token_xxx' },
              { label: 'Phone Number ID', value: '123456789012345' },
              { label: 'Business Account ID', value: '987654321098765' },
              { label: 'Webhook Verify Token', value: 'bisora_wa_verify_token' },
            ],
          },
          {
            id: 'wa-onesend',
            name: 'Onesend',
            cost: 'Seller pays',
            status: item.status === 'Connected' ? 'Connected' : 'Available',
            bestFor: 'Good when seller already uses Onesend as a WhatsApp delivery partner.',
            setupHint: 'Connect API token first, then test WhatsApp template delivery before going live.',
            fields: [{ label: 'API Token', value: 'onesend_api_token_xxx' }],
          },
          {
            id: 'wa-wabot',
            name: 'Wabot',
            cost: 'Seller pays',
            status: 'Available',
            bestFor: 'Good for sellers who already manage a Wabot instance and need a simpler bridge.',
            setupHint: 'Only use when seller already has a stable Wabot setup and support process.',
            fields: [
              { label: 'Access Token', value: 'wabot_access_token_xxx' },
              { label: 'Instance ID', value: 'instance_001' },
            ],
          },
        ];
      case 'in-7':
        return [
          {
            id: 'email-brevo',
            name: 'Brevo',
            cost: 'Free start',
            status: 'Recommended',
            bestFor: 'Best default for transactional email with an easy free starting path.',
            setupHint: 'Recommended first choice for receipts, order updates, and shipment emails.',
            fields: [
              { label: 'API Key', value: 'xkeysib-xxxxxxxxxxxx' },
              { label: 'Sender Email', value: 'orders@bisora.co' },
              { label: 'Sender Name', value: 'Bisora Orders' },
            ],
          },
          {
            id: 'email-mailerlite',
            name: 'MailerLite',
            cost: 'Free start',
            status: 'Available',
            bestFor: 'Good when seller also wants light email marketing with a smaller list.',
            setupHint: 'Use if seller already keeps audience lists in MailerLite and wants simple sync.',
            fields: [
              { label: 'API Key', value: 'mailerlite_api_key_xxx' },
              { label: 'Subscriber Group ID', value: 'group_001' },
              { label: 'API Version', value: 'Version 2' },
            ],
          },
          {
            id: 'email-omnisend',
            name: 'Omnisend',
            cost: 'Seller pays',
            status: 'Available',
            bestFor: 'Good for stores wanting stronger lifecycle marketing on top of email delivery.',
            setupHint: 'Connect if seller already runs campaigns and flows inside Omnisend.',
            fields: [
              { label: 'API Key', value: 'omnisend_api_key_xxx' },
              { label: 'Brand ID', value: 'brand_001' },
            ],
          },
          {
            id: 'email-sender',
            name: 'Sender.net',
            cost: 'Free start',
            status: 'Available',
            bestFor: 'Good fallback option for smaller stores that want a lighter email stack.',
            setupHint: 'Connect sender token and verified sender email before enabling delivery.',
            fields: [
              { label: 'API Token', value: 'sender_token_xxx' },
              { label: 'Sender Email', value: 'hello@bisora.co' },
            ],
          },
        ];
      case 'in-8':
        return [
          {
            id: 'sms-twilio',
            name: 'Twilio',
            cost: 'Seller pays',
            status: 'Recommended',
            bestFor: 'Best default for stable SMS delivery and broad operational support.',
            setupHint: 'Recommended when seller needs dependable transactional SMS for delivery updates.',
            fields: [
              { label: 'Prefix', value: 'BISORA' },
              { label: 'Account SID', value: 'ACxxxxxxxxxxxxxxxx' },
              { label: 'Auth Token', value: 'twilio_auth_token_xxx' },
              { label: 'Twilio Number', value: '+60123456789' },
            ],
          },
          {
            id: 'sms-klasik',
            name: 'Klasik SMS',
            cost: 'Seller pays',
            status: 'Available',
            bestFor: 'Good for Malaysia-focused sellers already using Klasik SMS operations.',
            setupHint: 'Use when seller wants a local SMS provider path and already has account access.',
            fields: [
              { label: 'Prefix', value: 'BISORA' },
              { label: 'Email', value: 'ops@bisora.co' },
              { label: 'Token', value: 'klasik_sms_token_xxx' },
            ],
          },
          {
            id: 'sms-adasms',
            name: 'Adasms',
            cost: 'Seller pays',
            status: 'Available',
            bestFor: 'Good for local SMS routing when seller already uses Adasms credits and sender setup.',
            setupHint: 'Connect the secret token and confirm sender readiness before enabling order sends.',
            fields: [
              { label: 'Prefix', value: 'BISORA' },
              { label: 'Secret Token', value: 'adasms_secret_token_xxx' },
            ],
          },
        ];
      default:
        return [];
    }
  })();
  const visibleMessagingProviders = applyMessagingProviderConnectionStatus(item.id, messagingProviders, notificationSettings);
  const [activeProviderId, setActiveProviderId] = useState(messagingProviders[0]?.id ?? '');
  const connectedProviderId = visibleMessagingProviders.find((provider) => provider.status === 'Connected')?.id ?? '';

  useEffect(() => {
    setActiveProviderId(connectedProviderId || visibleMessagingProviders[0]?.id || '');
  }, [connectedProviderId, item.id]);

  const trackingConfig = (() => {
    switch (item.id) {
      case 'in-1':
        return (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">Meta tracking setup</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Facebook Pixel ID">
                <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="123456789012345,987654321098765" />
                <FieldHint text="You can add multiple Meta Pixel IDs separated by commas." />
              </Field>
              <Field label="Conversions API Token">
                <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="meta_capi_token_xxx" />
              </Field>
            </div>
          </div>
        );
      case 'in-2':
        return (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">Google Ads conversion setup</p>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <ToggleRow checked={true} label="Enable Google Ads Conversion Tracking" onChange={() => undefined} />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Google Ads ID">
                  <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="AW-XXXXXX" />
                </Field>
                <Field label="Purchase Label">
                  <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="AW-XXXXXX/purchase_label" />
                </Field>
                <Field label="Begin Checkout Label">
                  <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="AW-XXXXXX/begin_checkout" />
                </Field>
                <Field label="Add To Cart Label">
                  <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="AW-XXXXXX/add_to_cart" />
                </Field>
              </div>
            </div>
          </div>
        );
      case 'in-3':
        return (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">TikTok tracking setup</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="TikTok Pixel ID">
                <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="TT-982341234" />
              </Field>
              <Field label="Access Token">
                <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="tiktok_access_token_xxx" />
              </Field>
            </div>
          </div>
        );
      case 'in-4':
        return (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">Google Analytics 4 setup</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Measurement ID">
                <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="G-XXXXXX" />
              </Field>
              <Field label="API Secret">
                <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="ga4_api_secret_xxx" />
              </Field>
            </div>
          </div>
        );
      case 'in-5':
        return (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">Google Tag Manager setup</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Container ID">
                <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="GTM-XXXXX" />
              </Field>
              <Field label="Environment Snippet">
                <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="gtm_env_snippet_xxx" />
              </Field>
            </div>
          </div>
        );
      default:
        return null;
    }
  })();
  const activeProvider = visibleMessagingProviders.find((provider) => provider.id === activeProviderId) ?? visibleMessagingProviders[0];
  const [providerFieldValues, setProviderFieldValues] = useState<Record<string, string>>({});
  const recommendedProvider = visibleMessagingProviders.find((provider) => provider.status === 'Recommended') ?? visibleMessagingProviders[0];
  const alternativeProviders = visibleMessagingProviders.filter((provider) => provider.id !== recommendedProvider?.id);

  useEffect(() => {
    if (!activeProvider) {
      setProviderFieldValues({});
      return;
    }

    setProviderFieldValues(
      activeProvider.fields.reduce<Record<string, string>>((carry, field) => {
        carry[field.label] = field.value;
        return carry;
      }, {}),
    );
  }, [activeProviderId, item.id]);

  const activeProviderDraft = activeProvider
    ? {
        id: activeProvider.id,
        name: activeProvider.name,
        fields: activeProvider.fields.map((field) => ({
          ...field,
          value: providerFieldValues[field.label] ?? field.value,
        })),
      }
    : null;
  const googleSetupGuide = (() => {
    switch (item.id) {
      case 'in-4':
        return {
          startHere: 'Start here for most stores',
          whenToUse: 'Use GA4 when seller wants basic traffic, purchase, and conversion visibility without needing a marketer-heavy setup.',
          bestFit: 'Best for founder-led stores, small teams, and sellers who want the simplest Google analytics starting point.',
        };
      case 'in-2':
        return {
          startHere: 'Add this only if running Google Ads',
          whenToUse: 'Use Google Ads conversion tracking when seller is already spending on Google Ads and wants better optimization from purchase and checkout signals.',
          bestFit: 'Best for stores with active ad campaigns, a marketer, or a performance-focused founder.',
        };
      case 'in-5':
        return {
          startHere: 'Use this for advanced setup',
          whenToUse: 'Use GTM when seller, marketer, or agency wants one place to control tags like GA4, Google Ads, and Meta without hardcoding each script separately.',
          bestFit: 'Best for stores with agency help, in-house marketers, or technical teams that want flexible tag control.',
        };
      default:
        return null;
    }
  })();
  const developerGuide = (() => {
    switch (item.id) {
      case 'in-9':
        return {
          title: 'API access path',
          whenToUse: 'Use this when external apps, custom dashboards, or agency-built tools need controlled API access into Bisora.',
          nextStep: 'Create and manage the real API credentials inside Settings > Developer.',
        };
      case 'in-10':
        return {
          title: 'Webhook event path',
          whenToUse: 'Use this when another system should receive live updates like order, payment, or fulfillment events from Bisora.',
          nextStep: 'Create, review, and test the actual webhook flow inside Settings > Developer.',
        };
      case 'in-11':
        return {
          title: 'Custom sync path',
          whenToUse: 'Use this when seller has ERP, CRM, OMS, WMS, or another custom back-office system that should sync with Bisora.',
          nextStep: 'Use Settings > Developer as the technical workspace for API keys, webhooks, and test events during implementation.',
        };
      default:
        return null;
    }
  })();

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <button className="text-sm font-medium text-primary hover:underline" onClick={onBack} type="button">
          Back to Integrations
        </button>
        <Panel title={`${item.name} Configuration`}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-medium">Who this is for</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{meta?.sellerFit ?? 'Use this integration when seller needs this external system inside store operations.'}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="text-sm font-medium">Primary use</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{meta?.primaryUse ?? 'Connect external platform data into Bisora.'}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="text-sm font-medium">Setup note</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{meta?.setupHint ?? 'Collect credentials and confirm the connection path before going live.'}</p>
              </div>
            </div>
            {googleSetupGuide ? (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-medium">{googleSetupGuide.startHere}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                    <p className="text-sm font-medium">When to use this</p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">{googleSetupGuide.whenToUse}</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                    <p className="text-sm font-medium">Best fit</p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">{googleSetupGuide.bestFit}</p>
                  </div>
                </div>
              </div>
            ) : null}
            {developerGuide ? (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-medium">{developerGuide.title}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                    <p className="text-sm font-medium">When to use this</p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">{developerGuide.whenToUse}</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                    <p className="text-sm font-medium">Where actual setup happens</p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">{developerGuide.nextStep}</p>
                    <button
                      className="mt-4 rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low"
                      onClick={() => (window.location.hash = '/settings/developer')}
                      type="button"
                    >
                      Open Developer Workspace
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {isTrackingTool ? trackingConfig : null}
            {isMessagingHub ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <p className="text-sm font-medium">Provider hub</p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Pick one provider path first. Seller should only set up the provider they really plan to use, so the messaging flow stays simple.
                  </p>
                </div>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <div className="space-y-3">
                    {recommendedProvider ? (
                      <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Bisora Recommended</p>
                            <p className="mt-2 font-medium">{recommendedProvider.name}</p>
                            <p className="mt-1 text-sm text-on-surface-variant">{recommendedProvider.bestFor}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge tone="warning">{recommendedProvider.status}</StatusBadge>
                            <StatusBadge tone={recommendedProvider.cost === 'Free start' ? 'success' : 'warning'}>{recommendedProvider.cost}</StatusBadge>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-on-surface-variant">{recommendedProvider.setupHint}</p>
                        <div className="mt-4 flex gap-2">
                          <button
                            className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-on-primary hover:bg-primary-dim"
                            onClick={() => setActiveProviderId(recommendedProvider.id)}
                            type="button"
                          >
                            {activeProviderId === recommendedProvider.id ? 'Editing Setup' : 'Use Recommended'}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {alternativeProviders.length ? (
                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm">
                        <p className="text-sm font-medium">Other provider options</p>
                        <p className="mt-1 text-xs text-on-surface-variant">Use these only if seller already has an existing provider account or team preference.</p>
                        <div className="mt-4 space-y-3">
                          {alternativeProviders.map((provider) => (
                            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4" key={provider.id}>
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium">{provider.name}</p>
                                  <p className="mt-1 text-sm text-on-surface-variant">{provider.bestFor}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <StatusBadge tone={provider.status === 'Connected' ? 'success' : 'neutral'}>{provider.status}</StatusBadge>
                                  <StatusBadge tone={provider.cost === 'Free start' ? 'success' : 'warning'}>{provider.cost}</StatusBadge>
                                </div>
                              </div>
                              <p className="mt-2 text-xs text-on-surface-variant">{provider.setupHint}</p>
                              <div className="mt-4 flex gap-2">
                                <button
                                  className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                                  onClick={() => setActiveProviderId(provider.id)}
                                  type="button"
                                >
                                  {activeProviderId === provider.id ? 'Editing Setup' : provider.status === 'Connected' ? 'Manage' : 'Activate'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {activeProvider ? (
                    <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{activeProvider.name} setup</p>
                          <p className="mt-1 text-sm text-on-surface-variant">{activeProvider.setupHint}</p>
                        </div>
                        <StatusBadge tone={activeProvider.cost === 'Free start' ? 'success' : 'warning'}>{activeProvider.cost}</StatusBadge>
                      </div>
                      <div className="mt-4 space-y-4">
                        {activeProvider.fields.map((field) => (
                          <Field key={field.label} label={field.label}>
                            <input
                              className="w-full rounded border border-outline-variant/30 bg-surface-lowest px-3 py-2 text-sm"
                              onChange={(event) =>
                                setProviderFieldValues((current) => ({
                                  ...current,
                                  [field.label]: event.target.value,
                                }))
                              }
                              value={providerFieldValues[field.label] ?? field.value}
                            />
                          </Field>
                        ))}
                        <ToggleRow checked={activeProvider.status !== 'Available'} label={`Enable ${activeProvider.name}`} onChange={() => undefined} />
                        <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                          <p className="text-sm font-medium">What seller should know</p>
                          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                            {activeProvider.cost === 'Free start'
                              ? 'This provider can help seller start lighter, but message limits or feature caps may still apply later.'
                              : 'This provider usually means live sending costs or provider billing will apply once seller starts using it.'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
                            onClick={() => {
                              if (activeProviderDraft) {
                                onSave(buildMessagingProviderNotificationSettings(item.id, activeProviderDraft));
                              }
                            }}
                            type="button"
                          >
                            Save Provider Setup
                          </button>
                          {activeProvider.status === 'Connected' && activeProviderDraft ? (
                            <button
                              className="rounded border border-outline-variant/30 px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-low"
                              onClick={() => onSave(buildMessagingProviderDisconnectSettings(item.id, activeProviderDraft))}
                              type="button"
                            >
                              Disconnect Provider
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : isDeveloperIntegration ? null : (
              <>
                <Field label="Connection Status">
                  <StatusBadge tone={item.status === 'Connected' ? 'success' : 'neutral'}>{item.status}</StatusBadge>
                </Field>
                <Field label="API Credential">
                  <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="xxxxxxxxxxxxxxxxxx" />
                </Field>
                <Field label="Webhook Endpoint">
                  <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue={`https://api.atelier.com/hooks/${item.id}`} />
                </Field>
                <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => onSave()} type="button">
                  Save Configuration
                </button>
              </>
            )}
          </div>
        </Panel>
      </div>
      <aside className="space-y-4">
        <Panel title="Integration Snapshot">
          <div className="space-y-3 text-sm text-on-surface-variant">
            <p>Category: {item.category}</p>
            <p>Status: {item.status}</p>
            <p>{meta?.primaryUse ?? 'External platform sync'}</p>
            {isMessagingHub ? <p>Provider paths: {visibleMessagingProviders.map((provider) => provider.name).join(', ')}</p> : null}
            {isDeveloperIntegration ? <p>Actual management: Settings &gt; Developer</p> : null}
          </div>
        </Panel>
      </aside>
    </div>
  );
}

function StaffRolesPage({
  members,
  onInviteMember,
  onResendInvite,
  onUpdateMemberRole,
}: {
  members: TeamMember[];
  onInviteMember: (payload: InviteMemberPayload) => void;
  onResendInvite: (member: TeamMember) => void;
  onUpdateMemberRole: (memberId: string, role: string) => void;
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const activeMembers = members.filter((member) => member.status === 'Active').length;
  const invitedMembers = members.filter((member) => member.status === 'Invited').length;
  const roleGuides: Record<
    string,
    {
      access: string;
      modules: string;
      limits: string;
    }
  > = {
    Owner: {
      access: 'Full store ownership and settings control.',
      modules: 'Can access orders, products, marketing, shipping, payments, integrations, staff, and developer tools.',
      limits: 'No operational limits inside the admin workspace.',
    },
    'Store Manager': {
      access: 'Runs day-to-day store operations.',
      modules: 'Can manage orders, products, campaigns, and most shipping work.',
      limits: 'Does not fully control sensitive settings or owner-level technical tools.',
    },
    Fulfillment: {
      access: 'Handles packing, shipment flow, courier work, and order progress.',
      modules: 'Can work on orders and shipping operations.',
      limits: 'Cannot control marketing, financial setup, or most core settings.',
    },
    Support: {
      access: 'Customer-service visibility and issue follow-up.',
      modules: 'Can view order progress, shipment status, and customer-facing context.',
      limits: 'Mostly view-only. Cannot run sensitive store configuration changes.',
    },
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_300px]">
      <div className="space-y-5">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm">
          <p className="text-sm font-medium text-on-surface">Staff & roles control center</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Manage who can access the store, what role they hold, and how much operational control each team member should have.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">Active Members</p>
            <p className="mt-2 text-2xl font-semibold">{activeMembers}</p>
            <p className="mt-1 text-sm text-on-surface-variant">Currently working inside the store workspace.</p>
          </div>
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">Pending Invites</p>
            <p className="mt-2 text-2xl font-semibold">{invitedMembers}</p>
            <p className="mt-1 text-sm text-on-surface-variant">Still waiting for acceptance or onboarding completion.</p>
          </div>
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">Role Presets</p>
            <p className="mt-2 text-2xl font-semibold">{roleCards.length}</p>
            <p className="mt-1 text-sm text-on-surface-variant">Default paths for owner, ops, fulfillment, and support.</p>
          </div>
        </div>

        <Panel
          title="Team Members"
          action={
            <button className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-on-primary hover:bg-primary-dim" onClick={() => setShowInviteModal(true)} type="button">
              Invite Member
            </button>
          }
        >
          <div className="mb-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">What Edit Role does</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Editing a team member here only changes which preset they use. The matrix below is the default access reference for each role, not an editable custom permission builder.
            </p>
          </div>
          <div className="space-y-3">
            {members.map((member) => (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm" key={member.id}>
                <div className="flex items-center gap-3">
                  <img alt={member.name} className="h-10 w-10 rounded object-cover" src={member.avatarUrl} />
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-on-surface-variant">{member.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={member.status === 'Active' ? 'success' : 'warning'}>{member.status}</StatusBadge>
                  <span className="rounded-full border border-outline-variant/20 bg-surface px-3 py-1 text-xs text-on-surface-variant">{member.role}</span>
                  <button
                    className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                    onClick={() => {
                      if (member.status === 'Invited') {
                        onResendInvite(member);
                        return;
                      }
                      setSelectedMember(member);
                    }}
                    type="button"
                  >
                    {member.status === 'Invited' ? 'Resend Invite' : 'Edit Role'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Role Presets">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {roleCards.map((role) => (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4" key={role.id}>
                <p className="font-medium">{role.name}</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{role.description}</p>
                <div className="mt-4 space-y-2 rounded-2xl border border-outline-variant/20 bg-surface p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">What this role gets</p>
                  <p className="text-sm text-on-surface-variant">{roleGuides[role.name]?.access}</p>
                  <p className="text-xs text-on-surface-variant">{roleGuides[role.name]?.modules}</p>
                  <p className="text-xs text-on-surface-variant">{roleGuides[role.name]?.limits}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Role Access Matrix">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-sm font-medium">How to read this</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Use these presets as the default operating model. Owners keep full control, while ops, fulfillment, and support get only the access needed for their work. This table explains what each role can see or manage in the admin website.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-on-surface-variant">
              <span className="rounded-full border border-outline-variant/20 bg-surface px-3 py-1">Full = complete control</span>
              <span className="rounded-full border border-outline-variant/20 bg-surface px-3 py-1">Manage = can work in that area</span>
              <span className="rounded-full border border-outline-variant/20 bg-surface px-3 py-1">View = can see only</span>
              <span className="rounded-full border border-outline-variant/20 bg-surface px-3 py-1">Limited = restricted settings access</span>
              <span className="rounded-full border border-outline-variant/20 bg-surface px-3 py-1">No = hidden / no access</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-left">Module</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Store Manager</th>
                  <th className="px-4 py-3 text-left">Fulfillment</th>
                  <th className="px-4 py-3 text-left">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {[
                  ['Orders', 'Full', 'Manage', 'Manage', 'View'],
                  ['Products', 'Full', 'Manage', 'View', 'View'],
                  ['Marketing', 'Full', 'Manage', 'View', 'View'],
                  ['Shipping & Fulfillment', 'Full', 'Manage', 'Manage', 'View'],
                  ['Settings', 'Full', 'Limited', 'No', 'No'],
                ].map(([module, owner, manager, fulfillment, support]) => (
                  <tr key={module}>
                    <td className="px-4 py-3">{module}</td>
                    <td className="px-4 py-3">{owner}</td>
                    <td className="px-4 py-3">{manager}</td>
                    <td className="px-4 py-3">{fulfillment}</td>
                    <td className="px-4 py-3">{support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <aside className="space-y-4">
        <Panel title="Activity Snapshot">
          <p className="text-sm text-on-surface-variant">Recent access updates and role activity logs are visible here.</p>
          <ul className="mt-3 space-y-2 text-xs text-on-surface-variant">
            <li>- New invite sent to operations team</li>
            <li>- Permission update on Marketing module</li>
            <li>- Role switched to Store Manager</li>
          </ul>
        </Panel>
      </aside>
      {showInviteModal ? <InviteMemberModal onClose={() => setShowInviteModal(false)} onInvite={onInviteMember} /> : null}
      {selectedMember ? (
        <EditRoleModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onSave={(role) => {
            onUpdateMemberRole(selectedMember.id, role);
            setSelectedMember(null);
          }}
        />
      ) : null}
    </div>
  );
}

function InviteMemberModal({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (payload: InviteMemberPayload) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Support');
  const canInvite = name.trim().length > 0 && email.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-8">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-outline-variant/20 bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-on-surface">Invite Team Member</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Add a new teammate and assign the role that matches their actual store responsibility.
            </p>
          </div>
          <button className="rounded border border-outline-variant/20 px-3 py-1.5 text-sm hover:bg-surface-low" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <Field label="Full Name">
            <input className="h-11 w-full rounded border border-outline-variant/30 bg-surface px-3 text-sm outline-none focus:border-primary" onChange={(event) => setName(event.target.value)} placeholder="Aisyah Rahman" type="text" value={name} />
          </Field>
          <Field label="Email">
            <input className="h-11 w-full rounded border border-outline-variant/30 bg-surface px-3 text-sm outline-none focus:border-primary" onChange={(event) => setEmail(event.target.value)} placeholder="aisyah@store.com" type="email" value={email} />
          </Field>
          <Field label="Role">
            <select className="h-11 w-full rounded border border-outline-variant/30 bg-surface px-3 text-sm outline-none focus:border-primary" onChange={(event) => setRole(event.target.value)} value={role}>
              <option>Owner</option>
              <option>Store Manager</option>
              <option>Fulfillment</option>
              <option>Support</option>
            </select>
          </Field>
        </div>

        <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-medium">Invite summary</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Bisora will create a pending invite and let the teammate enter the workspace under the selected role after acceptance.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canInvite}
            onClick={() => {
              onInvite({ name: name.trim(), email: email.trim(), role });
              onClose();
            }}
            type="button"
          >
            Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}

function EditRoleModal({
  member,
  onClose,
  onSave,
}: {
  member: TeamMember;
  onClose: () => void;
  onSave: (role: string) => void;
}) {
  const [role, setRole] = useState(member.role);
  const accessPreview: Record<
    string,
    {
      summary: string;
      modules: string[];
      limits: string;
    }
  > = {
    Owner: {
      summary: 'Full store ownership and full operational control.',
      modules: ['Orders: Full', 'Products: Full', 'Marketing: Full', 'Shipping: Full', 'Settings: Full'],
      limits: 'No major limits inside the admin workspace.',
    },
    'Store Manager': {
      summary: 'Runs daily operations across the store.',
      modules: ['Orders: Manage', 'Products: Manage', 'Marketing: Manage', 'Shipping: Manage', 'Settings: Limited'],
      limits: 'Sensitive owner-level settings and technical controls stay restricted.',
    },
    Fulfillment: {
      summary: 'Focuses on order handling, packing, and shipment execution.',
      modules: ['Orders: Manage', 'Products: View', 'Marketing: View', 'Shipping: Manage', 'Settings: No'],
      limits: 'Cannot control marketing, financial setup, or most core settings.',
    },
    Support: {
      summary: 'Supports customers with status visibility and follow-up context.',
      modules: ['Orders: View', 'Products: View', 'Marketing: View', 'Shipping: View', 'Settings: No'],
      limits: 'Mostly view-only. Cannot manage operational setup.',
    },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-8">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-outline-variant/20 bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-on-surface">Edit Role</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Update access level for {member.name} without changing the rest of the workspace setup.
            </p>
          </div>
          <button className="rounded border border-outline-variant/20 px-3 py-1.5 text-sm hover:bg-surface-low" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <Field label="Team Member">
            <div className="rounded border border-outline-variant/20 bg-surface-low px-3 py-3 text-sm text-on-surface">
              {member.name} - {member.email}
            </div>
          </Field>
          <Field label="Role">
            <select className="h-11 w-full rounded border border-outline-variant/30 bg-surface px-3 text-sm outline-none focus:border-primary" onChange={(event) => setRole(event.target.value)} value={role}>
              <option>Owner</option>
              <option>Store Manager</option>
              <option>Fulfillment</option>
              <option>Support</option>
            </select>
          </Field>
        </div>

        <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-medium">Access Preview</p>
          <p className="mt-1 text-sm text-on-surface-variant">{accessPreview[role]?.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {accessPreview[role]?.modules.map((item) => (
              <span className="rounded-full border border-outline-variant/20 bg-surface px-3 py-1 text-xs text-on-surface-variant" key={item}>
                {item}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">{accessPreview[role]?.limits}</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary" onClick={() => onSave(role)} type="button">
            Save Role
          </button>
        </div>
      </div>
    </div>
  );
}

function DeveloperPage({
  apiKeys,
  webhooks,
  onGenerateApiKey,
  onToggleWebhook,
  onSendTestEvent,
}: {
  apiKeys: ApiKeyItem[];
  webhooks: WebhookItem[];
  onGenerateApiKey: (payload: GenerateApiKeyPayload) => void;
  onToggleWebhook: (id: string) => void;
  onSendTestEvent: () => void;
}) {
  const [apiKeyName, setApiKeyName] = useState('New App Integration');
  const [scope, setScope] = useState('Read Only');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm">
        <p className="text-sm font-medium text-on-surface">Developer control center</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          This area is for technical setup only. Use it when seller has a developer, agency, or external system that needs API keys,
          webhook events, or test calls from Bisora.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-semibold">API Keys</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Give external apps or custom systems controlled access into Bisora.
          </p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-semibold">Webhooks</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Let Bisora send event updates like order or payment changes to another system automatically.
          </p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-semibold">Logs & Test Console</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Send test events and check technical flow before the real live connection is used.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
        <p className="text-sm font-medium">When seller should use this</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
          <li>Seller has custom ERP, OMS, CRM, or warehouse system.</li>
          <li>Seller has developer or agency doing external sync work.</li>
          <li>Seller wants Bisora events pushed out through webhook automation.</li>
          <li>If seller does not have technical setup needs yet, this area can be ignored safely.</li>
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-medium">1. Generate an API key</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Create a controlled key for the app, system, or partner that needs access into Bisora.
          </p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-medium">2. Connect webhook endpoint</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Decide which order or payment events Bisora should push out automatically.
          </p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-medium">3. Send a test event</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Verify the external system receives the payload before switching live operations over.
          </p>
        </div>
      </div>

      <Panel title="API Keys">
        <div className="mb-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-medium">What API keys do</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            API keys let outside systems authenticate into Bisora. Use a limited scope whenever possible instead of giving everything full write access.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-left">Key Name</th>
                <th className="px-4 py-3 text-left">API Key</th>
                <th className="px-4 py-3 text-left">Scope</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {apiKeys.map((key) => (
                <tr key={key.id}>
                  <td className="px-4 py-3">{key.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{key.keyMasked}</td>
                  <td className="px-4 py-3">{key.scope}</td>
                  <td className="px-4 py-3">{key.createdAt}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={key.status === 'Active' ? 'success' : 'neutral'}>{key.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setApiKeyName(event.target.value)} placeholder="Key name" value={apiKeyName} />
          <select className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setScope(event.target.value)} value={scope}>
            <option>Read Only</option>
            <option>Read / Write</option>
          </select>
          <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => onGenerateApiKey({ name: apiKeyName, scope })} type="button">
            Generate Key
          </button>
        </div>
      </Panel>

      <Panel title="Webhooks">
        <div className="mb-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-medium">What webhooks do</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Webhooks let Bisora push events out to another system. This is useful when the seller wants outside tools to react to new orders, payments, or shipping milestones automatically.
          </p>
        </div>
        <div className="space-y-3">
          {webhooks.map((hook) => (
            <div className="rounded border border-outline-variant/20 p-3" key={hook.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{hook.endpoint}</p>
                  <p className="text-xs text-on-surface-variant">{hook.events.join(', ')}</p>
                  <p className="text-xs text-on-surface-variant">Last delivery: {hook.lastDelivery}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge tone={hook.status === 'Active' ? 'success' : 'warning'}>{hook.status}</StatusBadge>
                  <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onToggleWebhook(hook.id)} type="button">
                    Toggle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Logs & Test Console">
        <div className="mb-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-medium">What happens when you send a test event</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Bisora sends a safe sample payload to help the external system confirm receipt and event parsing. It should not create a real customer-facing change in live operations.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <select className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm">
            <option>order.created</option>
            <option>payment.success</option>
            <option>cart.abandoned</option>
          </select>
          <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onSendTestEvent} type="button">
            Send Test Event
          </button>
        </div>
        <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-medium">Recent test expectation</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            After a successful test, the external endpoint should show a received event, status 200 response, and payload fields that match the selected event type.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function CourierConfigModal({
  courier,
  onClose,
  onSave,
}: {
  courier: CourierProvider;
  onClose: () => void;
  onSave: (payload: CourierSavePayload) => void;
}) {
  const [environment, setEnvironment] = useState(courier.mode);
  const [setupStage, setSetupStage] = useState<CourierSetupStage>(courier.setupStage);
  const [enabledForRouting, setEnabledForRouting] = useState(courier.enabledForRouting);
  const [apiKey, setApiKey] = useState('********************');
  const [secretKey, setSecretKey] = useState('********************');
  const [pickupContact, setPickupContact] = useState('Warehouse Manager');
  const [phone, setPhone] = useState('+60 12 345 6789');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testSyncStatus, setTestSyncStatus] = useState<'idle' | 'success'>('idle');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-start justify-center px-4 py-6">
        <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-lowest shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">Courier Setup Workspace</p>
                <p className="mt-1 text-sm text-on-surface-variant">{courier.name}</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-surface-low" onClick={onClose} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_320px]">
              <div className="space-y-5">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <p className="text-sm font-medium">Start simple</p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Seller only needs to know whether this courier is not started, in setup, ready to connect, or already live. The rest can
                    be done step by step here.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                    <p className="text-sm font-medium">Who this is for</p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">{courier.sellerFit}</p>
                    <div className="mt-4 space-y-2">
                      {courier.requirements.slice(0, 4).map((item) => (
                        <div className="flex items-start gap-2 text-sm text-on-surface-variant" key={item}>
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-outline-variant/20 bg-surface p-4">
                    <Field label="Setup Progress">
                      <select className="w-full rounded border border-outline-variant/30 bg-surface-low px-3 py-2 text-sm" onChange={(event) => setSetupStage(event.target.value as CourierSetupStage)} value={setupStage}>
                        <option>Not Started</option>
                        <option>Applied</option>
                        <option>Ready to Connect</option>
                        <option>Live</option>
                      </select>
                      <FieldHint text="Use this as your internal progress tracker. It does not auto-connect the courier." />
                    </Field>
                    <Field label="Environment">
                      <select className="w-full rounded border border-outline-variant/30 bg-surface-low px-3 py-2 text-sm" onChange={(event) => setEnvironment(event.target.value as 'Live' | 'Test')} value={environment}>
                        <option>Test</option>
                        <option>Live</option>
                      </select>
                    </Field>
                    <div className="rounded-xl border border-outline-variant/20 bg-surface-low p-3">
                      <ToggleRow
                        checked={enabledForRouting}
                        disabled={setupStage !== 'Ready to Connect' && setupStage !== 'Live'}
                        label="Use this courier in routing"
                        onChange={() => setEnabledForRouting((current) => !current)}
                      />
                      <FieldHint
                        text={
                          setupStage === 'Ready to Connect' || setupStage === 'Live'
                            ? 'Only turn this on when seller is ready for live routing decisions.'
                            : 'Finish setup until at least "Ready to Connect" before routing can be enabled.'
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <a className="rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-medium text-on-primary hover:bg-primary-dim" href={courier.applyUrl} rel="noreferrer" target="_blank">
                        Open {courier.name} Setup
                      </a>
                      <a className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-center text-sm hover:bg-surface-low" href={courier.infoUrl} rel="noreferrer" target="_blank">
                        Read Official Info
                      </a>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <p className="text-sm font-medium">What happens after connect</p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{courier.syncFlow}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-outline-variant/20 bg-surface px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Step 1</p>
                      <p className="mt-1 text-sm">Order is ready for fulfillment</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/20 bg-surface px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Step 2</p>
                      <p className="mt-1 text-sm">Bisora sends shipment request</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/20 bg-surface px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Step 3</p>
                      <p className="mt-1 text-sm">Tracking reference returns to order timeline</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Test courier sync</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Run a simple mock test before trusting live shipment creation and tracking updates.
                      </p>
                    </div>
                    <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface" onClick={() => setTestSyncStatus('success')} type="button">
                      Run Mock Test
                    </button>
                  </div>
                  {testSyncStatus === 'success' ? (
                    <div className="mt-4 rounded-2xl border border-success/20 bg-success-soft p-4 text-sm">
                      <p className="font-medium text-success">Mock shipment sync received</p>
                      <p className="mt-1 text-on-surface-variant">
                        Example result: label request created, tracking number `TRK-2026-0421-5568` returned, and order can continue with
                        courier visibility.
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Advanced setup</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Open this only when account approval is done and you are ready for API and pickup configuration.
                      </p>
                    </div>
                    <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface" onClick={() => setShowAdvanced((current) => !current)} type="button">
                      {showAdvanced ? 'Hide Advanced Setup' : 'Show Advanced Setup'}
                    </button>
                  </div>
                  {showAdvanced ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label="Pickup Contact">
                        <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setPickupContact(event.target.value)} value={pickupContact} />
                      </Field>
                      <Field label="Phone">
                        <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setPhone(event.target.value)} value={phone} />
                      </Field>
                      <Field label="API Key / Account Token">
                        <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setApiKey(event.target.value)} value={apiKey} />
                      </Field>
                      <Field label="Secret Key / Signing Secret">
                        <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setSecretKey(event.target.value)} value={secretKey} type="password" />
                      </Field>
                    </div>
                  ) : null}
                </div>
              </div>

              <aside className="space-y-4">
                <Panel title="Courier Status">
                  <StatRow label="Connection" value={getCourierStatusFromSetup(setupStage, environment)} />
                  <StatRow label="Mode" value={environment} />
                  <StatRow label="Routing" value={enabledForRouting ? 'Enabled' : 'Disabled'} />
                  <StatRow label="Pickup Contact" value={pickupContact} />
                </Panel>

                <Panel title="Before going live">
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium">Seller checklist</p>
                      <ul className="mt-2 space-y-2 text-on-surface-variant">
                        {courier.onboardingItems.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3 text-on-surface-variant">
                      Verify label creation, pickup details, tracking updates, and routing behavior in test mode before allowing live orders.
                    </div>
                  </div>
                </Panel>
              </aside>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex justify-end gap-2">
              <button className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm hover:bg-surface-low" onClick={onClose} type="button">
                Close
              </button>
              <button
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-dim"
                onClick={() =>
                  onSave({
                    environment,
                    setupStage,
                    enabledForRouting,
                  })
                }
                type="button"
              >
                Save Courier Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShippingProviderConfigModal({
  provider,
  onClose,
  onSave,
}: {
  provider: ShippingProviderIntegration;
  onClose: () => void;
  onSave: (payload: ShippingProviderSavePayload) => void;
}) {
  const [environment, setEnvironment] = useState(provider.mode);
  const [apiKey, setApiKey] = useState('');
  const [defaultCourierId, setDefaultCourierId] = useState('');
  const [autoTracking, setAutoTracking] = useState(provider.autoTracking);
  const [enabled, setEnabled] = useState(provider.enabled);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-start justify-center px-4 py-6">
        <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-lowest shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">Shipping Provider Setup</p>
                <p className="mt-1 text-sm text-on-surface-variant">{provider.name}</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-surface-low" onClick={onClose} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_320px]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <p className="text-sm font-medium">What this provider is for</p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{provider.setupHint}</p>
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Environment">
                      <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setEnvironment(event.target.value as 'Live' | 'Test')} value={environment}>
                        <option>Test</option>
                        <option>Live</option>
                      </select>
                      <FieldHint text="Use test mode while validating provider sync before enabling it live." />
                    </Field>
                    <Field label="Default Courier ID (Optional)">
                      <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setDefaultCourierId(event.target.value)} value={defaultCourierId} />
                    </Field>
                    <Field label="API Key">
                      <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setApiKey(event.target.value)} value={apiKey} />
                    </Field>
                  </div>

                  <div className="mt-4 space-y-3">
                    <ToggleRow checked={autoTracking} label="Automatically add tracking" onChange={setAutoTracking} />
                    <ToggleRow checked={enabled} label={`Enable ${provider.name}`} onChange={setEnabled} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm hover:bg-surface-low" href={provider.infoUrl} rel="noreferrer" target="_blank">
                      Read Provider Info
                    </a>
                    <a className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm hover:bg-surface-low" href={provider.applyUrl} rel="noreferrer" target="_blank">
                      Open Provider Setup
                    </a>
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <Panel title="Provider Status">
                  <StatRow label="Connection" value={enabled ? (environment === 'Live' ? 'Connected' : 'Sandbox') : 'Disabled'} />
                  <StatRow label="Mode" value={environment} />
                  <StatRow label="Auto Tracking" value={autoTracking ? 'On' : 'Off'} />
                  <StatRow label="Default Courier ID" value={defaultCourierId || 'Not set'} />
                </Panel>

                <Panel title="Before going live">
                  <div className="space-y-3 text-sm text-on-surface-variant">
                    <p>Provider sync can help Bisora create shipment records, return courier options, and push tracking visibility back into ops.</p>
                    <p>Still verify that the provider setup matches the real courier lanes and routing rules before you allow live use.</p>
                  </div>
                </Panel>
              </aside>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex justify-end gap-2">
              <button className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm hover:bg-surface-low" onClick={onClose} type="button">
                Close
              </button>
              <button
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-dim"
                onClick={() =>
                  onSave({
                    environment,
                    enabled,
                    autoTracking,
                  })
                }
                type="button"
              >
                Save Provider Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DomainVerificationModal({
  customDomain,
  storeSubdomain,
  connectionStatus,
  lastChecked,
  mode,
  onClose,
  onDomainChange,
  onRunCheck,
}: {
  customDomain: string;
  storeSubdomain: string;
  connectionStatus: string;
  lastChecked: string;
  mode: 'add' | 'edit';
  onClose: () => void;
  onDomainChange: (value: string) => void;
  onRunCheck: () => void;
}) {
  const dnsRecords = [
    {
      type: 'A',
      host: customDomain,
      value: '76.76.21.21',
      note: 'Point apex/root domain to storefront edge.',
    },
    {
      type: 'CNAME',
      host: `www.${customDomain.replace(/^www\./, '')}`,
      value: storeSubdomain,
      note: 'Alias www traffic to your managed storefront subdomain.',
    },
    {
      type: 'TXT',
      host: `_bisora-verify.${customDomain.replace(/^www\./, '')}`,
      value: 'bisora-domain-verification=9f1c2a7d',
      note: 'Used to confirm domain ownership before production sync.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-start justify-center px-4 py-6">
        <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-lowest shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">{mode === 'add' ? 'Add Existing Domain' : 'Edit Custom Domain'}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Enter your custom domain, then add the DNS records below inside your domain provider before connecting.
                </p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-surface-low" onClick={onClose} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_320px]">
          <div className="space-y-4">
            <Field label="Custom Domain">
              <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => onDomainChange(event.target.value)} value={customDomain} />
              <FieldHint text="Enter the domain you want to connect, for example `yourbrand.com`." />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">Managed Subdomain</p>
                <p className="mt-2 text-sm font-medium">{storeSubdomain}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">Connection Status</p>
                <div className="mt-2">
                  <StatusBadge tone={connectionStatus === 'Connected' ? 'success' : 'warning'}>{connectionStatus}</StatusBadge>
                </div>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">Last Checked</p>
                <p className="mt-2 text-sm font-medium">{lastChecked}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest">
              <div className="border-b border-outline-variant/20 px-4 py-3">
                <p className="text-sm font-semibold">Configure Your DNS Records</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  DNS records can be added inside your domain registrar or DNS provider panel.
                </p>
              </div>
              <div className="divide-y divide-outline-variant/20">
                {dnsRecords.map((record) => (
                  <div className="space-y-3 px-4 py-4" key={`${record.type}-${record.host}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <PreviewChip label={record.type} />
                      <p className="text-sm font-medium">{record.host}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                      <div className="rounded-xl border border-outline-variant/20 bg-surface-low px-3 py-3">
                        <p className="break-all font-mono text-xs text-on-surface">{record.value}</p>
                      </div>
                      <button
                        className="rounded-xl border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low"
                        onClick={() => navigator.clipboard?.writeText(record.value)}
                        type="button"
                      >
                        Copy Value
                      </button>
                    </div>
                    <p className="text-xs leading-5 text-on-surface-variant">{record.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">Setup Steps</p>
              <ol className="mt-3 space-y-2 text-sm text-on-surface-variant">
                <li>1. Open your DNS provider dashboard.</li>
                <li>2. Add the records shown on the left exactly as listed.</li>
                <li>3. Remove conflicting A or CNAME entries if needed.</li>
                <li>4. Wait for propagation, then run verification again.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">Propagation Note</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">DNS changes may take up to 48-72 hours to fully propagate, although it is often faster.</p>
            </div>
          </aside>
        </div>
          </div>

          <div className="sticky bottom-0 border-t border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex justify-end gap-2">
              <button className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm hover:bg-surface-low" onClick={onClose} type="button">
                Cancel
              </button>
              <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onRunCheck} type="button">
                {mode === 'add' ? 'Connect Domain' : 'Save Domain'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-start justify-center px-4 py-6">
        <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-lowest shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">Integration Guide</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Seller guide for choosing the right tracking, messaging, and technical integrations without setting up more than needed.
                </p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-surface-low" onClick={onClose} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">How seller should think about integrations</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Do not connect everything just because the list exists. Seller should only connect the tools actually used by the business,
                  ads team, marketer, agency, or support workflow.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <p className="text-sm font-semibold">Tracking & Analytics</p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Use this for ad signals, analytics, attribution, and purchase event visibility across Meta, Google, or TikTok.
                  </p>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <p className="text-sm font-semibold">Messaging</p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Use this for email, SMS, and WhatsApp delivery providers. Seller should choose one provider path per channel first.
                  </p>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <p className="text-sm font-semibold">Developer</p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Use this only when seller has technical needs like API keys, webhooks, custom apps, or external system sync.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">Recommended setup paths</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-surface-lowest text-xs uppercase tracking-wide text-on-surface-variant">
                      <tr>
                        <th className="px-4 py-3 text-left">Seller situation</th>
                        <th className="px-4 py-3 text-left">Start with</th>
                        <th className="px-4 py-3 text-left">Add later if needed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {[
                        ['Seller runs Meta ads only', 'Meta Pixel & CAPI', 'GA4 later if seller wants fuller analytics.'],
                        ['Seller wants simple analytics only', 'GA4', 'Google Ads only if ads start later.'],
                        ['Seller runs Google Ads', 'GA4 + Google Ads', 'GTM only if marketer or agency wants central tag control.'],
                        ['Seller tests TikTok campaigns', 'TikTok Pixel', 'GA4 later if seller wants wider store reporting.'],
                        ['Seller has marketer or agency', 'GA4 + main ad platform', 'GTM for more advanced tag control.'],
                        ['Seller just wants order emails', 'Email Providers', 'SMS or WhatsApp only if communication flow grows later.'],
                      ].map(([situation, start, later]) => (
                        <tr key={situation}>
                          <td className="px-4 py-3">{situation}</td>
                          <td className="px-4 py-3">{start}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{later}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <p className="text-sm font-semibold">What each tracking tool means</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                    <li>`Meta Pixel & CAPI` = best for Meta ads retargeting and conversion signals.</li>
                    <li>`GA4` = best for store analytics, traffic, and purchase reporting.</li>
                    <li>`Google Ads` = best for Google ad conversion optimization.</li>
                    <li>`TikTok Pixel` = best for TikTok ad event visibility.</li>
                    <li>`GTM` = advanced control layer for marketers, agencies, or technical teams.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                  <p className="text-sm font-semibold">What each messaging path means</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                    <li>`Email Providers` = receipts, invoices, order updates, shipment emails.</li>
                    <li>`SMS Providers` = urgent short messages like out-for-delivery or critical updates.</li>
                    <li>`WhatsApp Providers` = support-led messaging, exception handling, or conversational flows.</li>
                    <li>Seller should not activate every channel just because it exists.</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">Important seller rule</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Start with the smallest setup that matches the real business workflow. If seller does not run Google Ads, do not connect
                  Google Ads. If seller does not use WhatsApp for operations, do not connect WhatsApp just to fill the page.
                </p>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex justify-end">
              <button className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm hover:bg-surface-low" onClick={onClose} type="button">
                Close Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentGuideModal({ onClose }: { onClose: () => void }) {
  const guides = [
    {
      name: 'SecurePay',
      sourceLabel: 'SecurePay Docs',
      sourceUrl: 'https://docs.securepay.my/',
      steps: [
        'Register and get approved as a SecurePay merchant.',
        'Generate API/app credentials from the SecurePay merchant side.',
        'Paste public/secret credentials into the gateway config.',
        'Set callback + webhook URL so order payment can update automatically.',
      ],
    },
    {
      name: 'FPX',
      sourceLabel: 'PayNet FPX',
      sourceUrl: 'https://www.paynet.my/business-solutions/fpx.html',
      steps: [
        'Usually enabled through a payment acquirer or gateway partner.',
        'Configure bank redirect / return URL flow.',
        'Listen to callback or webhook to confirm bank payment success.',
        'Mark order as paid only after provider confirmation arrives.',
      ],
    },
    {
      name: 'GrabPay',
      sourceLabel: 'Grab Merchant Pay',
      sourceUrl: 'https://www.grab.com/my/merchant/pay/',
      steps: [
        'Apply as a GrabPay / PayLater merchant first.',
        'Wait for merchant verification and onboarding support.',
        'Receive integration details or onboarding path from Grab.',
        'Enable provider callback/webhook before trusting payment completion.',
      ],
    },
    {
      name: 'Atome',
      sourceLabel: 'Atome Merchant',
      sourceUrl: 'https://www.atome.my/',
      steps: [
        'Register as an Atome merchant partner.',
        'Complete commercial + merchant approval first.',
        'Use credentials/onboarding details provided after approval.',
        'Order becomes paid only after Atome callback/webhook confirms approval/payment success.',
      ],
    },
    {
      name: 'Touch n Go eWallet',
      sourceLabel: 'TNG Merchant',
      sourceUrl: 'https://www.touchngo.com.my/merchant/be-a-merchant/',
      steps: [
        'Register as a TNG merchant and get approved.',
        'Choose merchant dashboard / QR / online path based on business type.',
        'Map payment notification or integration callback into the system.',
        'Use provider confirmation or merchant dashboard reconciliation before marking payment received.',
      ],
    },
    {
      name: 'DuitNow QR / Company QR',
      sourceLabel: 'PayNet DuitNow QR',
      sourceUrl: 'https://knowledgebase.paynet.my/hc/en-us/articles/49583136924441-How-do-merchants-onboard-to-DuitNow-QR',
      steps: [
        'Onboard with a participating bank, acquirer, or merchant QR provider.',
        'Link the QR to your company / merchant settlement account.',
        'Decide whether you use static QR (same QR every time) or dynamic QR (per order amount).',
        'For reliable automation, system should read provider callback/reconciliation data before marking order as paid.',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-start justify-center px-4 py-6">
        <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-lowest shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">Payment Setup Guide</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Real-world seller guide for what to prepare before connecting each payment provider live.
                </p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-surface-low" onClick={onClose} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-5">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">What this guide means</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                This guide is based on real merchant onboarding patterns used by payment providers, banks, acquirers, and QR operators.
                Exact API fields, approval requirements, and settlement timelines will still depend on the provider account you open later.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">Manual methods for sellers</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">Cash on Delivery</p>
                    <StatusBadge tone="warning">Not auto-paid</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Turn this on only if you want customers to see COD at checkout. The order should remain unpaid until delivery handoff or
                    rider collection is confirmed.
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                    <li>Track by delivery completion, rider note, or courier collection confirmation.</li>
                    <li>Good for selected zones and lower-risk orders.</li>
                    <li>Do not release COD order as paid just because customer selected it.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">Bank Transfer</p>
                    <StatusBadge tone="warning">Needs proof review</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Turn this on only if you want seller-approved transfer flow. The order should stay in payment review until receipt,
                    reference, and transferred amount have been verified.
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                    <li>Track by transfer slip, bank reference, and finance / ops verification.</li>
                    <li>Good for invoice-style or approval-based checkout.</li>
                    <li>Do not auto-mark paid until proof or reconciliation matches the order.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">Payment Rules Engine for sellers</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Payment Rules are checkout behavior rules. They help you decide which payment method should appear, be hidden, or be
                prioritized for certain orders. They do not collect money and they do not replace payment confirmation.
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4">
                  <p className="text-sm font-semibold">What rules are good for</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                    <li>Show safer payment methods for high-value orders.</li>
                    <li>Hide COD during risky hours or for risky checkout cases.</li>
                    <li>Prioritize a preferred gateway for VIP or selected customer segments.</li>
                    <li>Control when manual methods should appear or stay hidden.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4">
                  <p className="text-sm font-semibold">What rules do not do</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                    <li>Rules do not mean payment was successful.</li>
                    <li>Rules do not replace webhook, callback, or bank reconciliation.</li>
                    <li>Rules do not move an order to `Paid` by themselves.</li>
                    <li>Rules only shape the checkout choices that the customer sees.</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4">
                <p className="text-sm font-semibold">Simple seller examples</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                  <li>`High Value Secure`: if cart is above RM1,000, guide customer to card or online banking.</li>
                  <li>`Night COD Block`: if checkout happens late at night, hide COD to reduce manual collection risk.</li>
                  <li>`VIP Premium Route`: if customer is tagged VIP, show your preferred gateway first.</li>
                </ul>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {guides.map((guide) => (
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4" key={guide.name}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{guide.name}</p>
                    <a
                      className="text-xs font-medium text-primary hover:text-primary-dim"
                      href={guide.sourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {guide.sourceLabel}
                    </a>
                  </div>
                  <ol className="mt-3 space-y-2 text-sm text-on-surface-variant">
                    {guide.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">QR payments: what seller should know</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                  <li>`Static QR` means one QR code reused for many orders. Good for simple acceptance, but usually needs manual or reconciliation-based matching.</li>
                  <li>`Dynamic QR` means a new QR or encoded amount per order. This is better for automation because amount and order reference can be tied together.</li>
                  <li>QR settlement normally goes to a linked merchant or company bank account, not a random personal wallet flow.</li>
                  <li>If seller wants automatic order status updates, dynamic QR + provider callback/webhook is much stronger than static QR alone.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">How seller knows payment already masuk</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  The system should not trust only what the customer sees. Order payment becomes `Paid` only after provider callback,
                  webhook, or verified settlement confirmation is received and recorded with a transaction reference.
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                  <li>Best case: provider webhook updates order automatically.</li>
                  <li>Fallback case: seller reconciles against merchant dashboard or bank settlement record.</li>
                  <li>Only after verification should fulfillment, shipment, and notification flows continue.</li>
                </ul>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">Recommended live setup path</p>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                <li>1. Open merchant account with provider / acquirer.</li>
                <li>2. Complete KYC / company verification.</li>
                <li>3. Collect API keys, webhook secret, return URL requirements, and settlement details.</li>
                <li>4. Configure test mode first inside Bisora.</li>
                <li>5. Validate callback/webhook before switching gateway to live.</li>
              </ol>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex justify-end">
              <button className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm hover:bg-surface-low" onClick={onClose} type="button">
                Close Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShippingGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-start justify-center px-4 py-6">
        <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-lowest shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">Shipping & Logistics Guide</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Seller guide for understanding zones, delivery methods, courier setup, and routing behavior inside Bisora.
                </p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-surface-low" onClick={onClose} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-5">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">What this guide means</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                This guide explains how seller should think about shipping setup in Bisora. It is not only about courier credentials. It is
                also about where you ship, which delivery options customers see, and how orders should be assigned after checkout.
              </p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">Shipping Zones</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Zones help seller group destinations such as Malaysia, East Malaysia, Singapore, or international regions so pricing,
                  courier eligibility, and service rules can be controlled more cleanly.
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                  <li>Use zones to separate domestic and international shipping logic.</li>
                  <li>Only show delivery methods that actually make sense for that destination.</li>
                  <li>Zones are the foundation for courier routing and shipping pricing later.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">Delivery Methods</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Delivery methods are what customers see at checkout, such as standard, express, or same-day. These methods are not the
                  same as courier accounts. A method is customer-facing, while courier connection is operations-facing.
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                  <li>`Standard` is usually the base option for broad coverage.</li>
                  <li>`Express` is useful when seller supports faster SLA and higher cost.</li>
                  <li>`Same-Day` should only appear where seller and courier can actually fulfill it.</li>
                </ul>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">Courier connection logic for sellers</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4">
                  <p className="text-sm font-semibold">What connecting a courier does</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                    <li>Allows Bisora to create shipment requests or labels faster.</li>
                    <li>Lets tracking references return into order operations.</li>
                    <li>Makes the courier available for routing decisions after seller enables it.</li>
                    <li>Helps fulfillment team see shipment progress more clearly.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4">
                  <p className="text-sm font-semibold">What connecting a courier does not mean</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                    <li>It does not mean every order will use that courier automatically.</li>
                    <li>It does not replace delivery method setup or shipping zone setup.</li>
                    <li>It does not mean routing is already on.</li>
                    <li>It does not mean live shipping sync is safe until test mode has been verified.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-semibold">How this shipping page is organized now</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4">
                  <p className="text-sm font-semibold">Courier section</p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Main surface only shows a simple status view so seller can scan quickly. Click into a courier only when you want to manage
                    setup stage, test mode, tracking test, or routing readiness.
                  </p>
                </div>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4">
                  <p className="text-sm font-semibold">Shipping provider section</p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Use this only if seller prefers aggregator or provider workflows. Keep it optional unless your operations really need it.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">Routing rules: what seller should know</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Routing rules decide which courier should be assigned after checkout based on zone, service level, courier readiness,
                  fallback logic, or seller preference.
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                    <li>Example: Semenanjung orders use the preferred local courier first.</li>
                  <li>Example: if primary courier is slow or unavailable, fallback to secondary courier.</li>
                  <li>Routing should only use couriers that are ready and enabled by seller.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">What test simulation means</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Test simulation is a safe preview. It helps seller see which rule would win and which courier would likely be chosen for a
                  sample order.
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                  <li>It does not create a real shipment.</li>
                  <li>It does not call courier APIs for a live order.</li>
                  <li>It does not change existing customer orders.</li>
                  <li>It is only for checking routing logic before going live.</li>
                  <li>Seller can test sample zone, delivery method, and scenario before reviewing the preview result.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4 lg:col-span-2">
                <p className="text-sm font-semibold">Suggested seller setup flow</p>
                <ol className="mt-3 space-y-2 text-sm leading-6 text-on-surface-variant">
                  <li>1. Set shipping zones first.</li>
                  <li>2. Decide which delivery methods should appear per zone.</li>
                  <li>3. Onboard courier account and collect setup details.</li>
                  <li>4. Connect courier in test mode first.</li>
                  <li>5. Run shipment sync test and verify tracking flow.</li>
                  <li>6. Only then enable courier for routing and live order assignment.</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex justify-end">
              <button className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm hover:bg-surface-low" onClick={onClose} type="button">
                Close Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LocalTabs({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: Array<{ key: string; label: string }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          className={`rounded border px-3 py-1.5 text-xs ${
            activeTab === tab.key
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-low'
          }`}
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest">
      <header className="flex items-center justify-between gap-3 border-b border-outline-variant/20 px-4 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Banner({ title, description }: BannerState) {
  return (
    <div className="rounded border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
      <p className="font-medium">{title}</p>
      <p className="text-xs">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string | ReactNode; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-xs uppercase tracking-wide text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}

function FieldHint({ text }: { text: string }) {
  return <p className="text-xs leading-5 text-on-surface-variant">{text}</p>;
}

function InfoLabel({ label, info }: { label: string; info: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-outline-variant/40 text-[10px] font-semibold normal-case text-on-surface-variant"
        title={info}
      >
        ?
      </span>
    </span>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded border border-outline-variant/20 px-3 py-2 ${disabled ? 'opacity-60' : ''}`}>
      <p className="text-sm">{label}</p>
      <button
        aria-label={label}
        className={`h-6 w-11 rounded-full p-0.5 transition ${checked ? 'bg-primary' : 'bg-surface-container-high'} ${disabled ? 'cursor-not-allowed' : ''}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span className={`block h-5 w-5 rounded-full bg-white transition ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: 'success' | 'warning' | 'neutral';
  children: ReactNode;
}) {
  const className = {
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    neutral: 'bg-surface-low text-on-surface-variant',
  }[tone];
  return <span className={`rounded px-2 py-1 text-xs font-medium ${className}`}>{children}</span>;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-outline-variant/20 px-3 py-2">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function PreviewField({ placeholder }: { placeholder: string }) {
  return (
    <div className="rounded-lg border border-outline-variant/20 bg-white px-3 py-2 text-xs text-[#9b938b] shadow-sm">
      {placeholder}
    </div>
  );
}

function PreviewChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#e7ddd2] bg-[#fcfbf8] px-3 py-1.5 text-xs font-medium text-[#6b5b4d]">
      {label}
    </span>
  );
}

function BrandSwatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-[#fcfbf8] p-3">
      <div className="h-10 w-full rounded-lg border border-black/5" style={{ backgroundColor: value }} />
      <p className="mt-2 text-[11px] uppercase tracking-wide text-[#8e857d]">{label}</p>
      <p className="text-xs font-medium text-[#473f37]">{value}</p>
    </div>
  );
}

function PreviewToggleRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-outline-variant/20 bg-[#fcfbf8] px-3 py-2">
      <span>{label}</span>
      <StatusBadge tone={enabled ? 'success' : 'neutral'}>{enabled ? 'On' : 'Off'}</StatusBadge>
    </div>
  );
}

function PreviewLineItem({
  imageSeed,
  name,
  price,
  compact = false,
}: {
  imageSeed: string;
  name: string;
  price: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : ''}`}>
      <img
        alt={name}
        className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-lg object-cover`}
        src={`https://picsum.photos/seed/${imageSeed}/80/80`}
      />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-medium text-[#473f37] ${compact ? 'text-xs' : 'text-sm'}`}>{name}</p>
        <p className="text-xs text-[#8e857d]">Premium collection</p>
      </div>
      <span className={`font-medium text-[#473f37] ${compact ? 'text-[11px]' : 'text-xs'}`}>{price}</span>
    </div>
  );
}

function normalizeSection(section?: string): SettingsSection {
  if (!section) {
    return 'hub';
  }
  if (
    section === 'general' ||
    section === 'checkout' ||
    section === 'domain-branding' ||
    section === 'payments' ||
    section === 'shipping-logistics' ||
    section === 'notifications' ||
    section === 'integrations' ||
    section === 'staff-roles' ||
    section === 'developer'
  ) {
    return section;
  }
  return 'hub';
}

function normalizePaymentsTab(subSection?: string): PaymentsTab {
  if (!subSection || subSection === 'overview') {
    return 'overview';
  }
  if (subSection === 'gateway' || subSection === 'manual' || subSection === 'rules') {
    return subSection;
  }
  return 'overview';
}

function normalizeShippingTab(subSection?: string): ShippingTab {
  if (!subSection || subSection === 'overview') {
    return 'overview';
  }
  if (
    subSection === 'zones' ||
    subSection === 'methods' ||
    subSection === 'courier' ||
    subSection === 'api' ||
    subSection === 'routing'
  ) {
    return subSection;
  }
  return 'overview';
}

function normalizeNotificationsTab(subSection?: string): NotificationsTab {
  if (!subSection || subSection === 'shipment') {
    return 'shipment';
  }
  if (subSection === 'email' || subSection === 'sms' || subSection === 'whatsapp') {
    return 'defaults';
  }
  if (subSection === 'defaults' || subSection === 'ai') {
    return subSection;
  }
  return 'shipment';
}

function normalizeIntegrationsTab(subSection?: string): IntegrationsTab {
  if (!subSection || subSection === 'overview') {
    return 'overview';
  }
  if (
    subSection === 'tracking' ||
    subSection === 'messaging' ||
    subSection === 'developer'
  ) {
    return subSection;
  }
  return 'overview';
}

