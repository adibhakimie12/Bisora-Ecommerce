export type SettingsSection =
  | 'hub'
  | 'general'
  | 'checkout'
  | 'domain-branding'
  | 'payments'
  | 'shipping-logistics'
  | 'notifications'
  | 'integrations'
  | 'staff-roles'
  | 'developer';

export interface SettingsHubCard {
  key: Exclude<SettingsSection, 'hub'>;
  title: string;
  description: string;
  group: 'Store Setup' | 'Commerce' | 'Communication' | 'System Control';
}

export interface PaymentGateway {
  id: string;
  slug: 'securepay' | 'stripe' | 'paypal' | 'grabpay' | 'atome' | 'tng-ewallet' | 'fpx' | 'duitnow-qr';
  name: 'SecurePay' | 'Stripe' | 'PayPal' | 'GrabPay' | 'Atome' | 'Touch n Go eWallet' | 'FPX' | 'DuitNow QR';
  checkoutLabel: string;
  status: 'Connected' | 'Disconnected' | 'Pending';
  mode: 'Live' | 'Test';
  health: number;
  enabledAtCheckout: boolean;
  setupStage: 'Not Started' | 'Applied' | 'Awaiting Approval' | 'Ready to Connect' | 'Live';
}

export interface ManualMethod {
  id: string;
  slug: 'cod' | 'bank-transfer';
  name: 'Cash on Delivery' | 'Bank Transfer';
  enabled: boolean;
  description: string;
  operationalUse: string;
  customerExpectation: string;
  paymentStatusLabel: string;
  trackingMode: string;
  proofRequired: boolean;
  proofChecklist: string[];
  orderFlow: string[];
  caution: string;
}

export interface PaymentRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  status: 'Active' | 'Draft';
}

export interface ShippingRateBand {
  id: string;
  name: string;
  range: string;
  rate: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  regions: string[];
  methods: string[];
  weightRates: ShippingRateBand[];
  priceRates: ShippingRateBand[];
}

export interface CourierProvider {
  id: string;
  slug:
    | 'jt-express'
    | 'dhl-ecommerce'
    | 'dhl-express'
    | 'ninja-van'
    | 'ninja-van-international'
    | 'pos-malaysia'
    | 'gdex'
    | 'aramex';
  name:
    | 'J&T'
    | 'DHL eCommerce'
    | 'DHL Express'
    | 'Ninja Van'
    | 'Ninja Van International'
    | 'POS Malaysia'
    | 'GDEX'
    | 'Aramex';
  status: 'Connected' | 'Disconnected' | 'Sandbox';
  mode: 'Live' | 'Test';
  enabledForRouting: boolean;
  setupStage: 'Not Started' | 'Applied' | 'Ready to Connect' | 'Live';
  description: string;
  sellerFit: string;
  requirements: string[];
  onboardingItems: string[];
  syncFlow: string;
  applyUrl: string;
  infoUrl: string;
  trackingUrl: string;
}

export interface ShippingProviderIntegration {
  id: string;
  slug: 'easyparcel' | 'delyva' | 'sendparcel' | 'parcel-daily' | 'ninjavan-optimise' | 'pos-malaysia-provider';
  name: 'Easyparcel' | 'Delyva (Matdispatch)' | 'Sendparcel by Poslaju' | 'ParcelDaily' | 'NinjaVan Optimise' | 'Pos Malaysia';
  status: 'Connected' | 'Disabled' | 'Sandbox';
  mode: 'Live' | 'Test';
  autoTracking: boolean;
  enabled: boolean;
  description: string;
  setupHint: string;
  applyUrl: string;
  infoUrl: string;
}

export interface ShippingRoutingRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  status: 'Active' | 'Draft';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Invited';
  avatarUrl: string;
}

export interface RoleCard {
  id: string;
  name: string;
  description: string;
}

export interface IntegrationItem {
  id: string;
  name: string;
  category:
    | 'Tracking & Analytics'
    | 'Messaging'
    | 'Developer';
  status: 'Connected' | 'Not Connected';
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyMasked: string;
  scope: string;
  createdAt: string;
  status: 'Active' | 'Revoked';
}

export interface WebhookItem {
  id: string;
  endpoint: string;
  events: string[];
  status: 'Active' | 'Paused';
  lastDelivery: string;
}
