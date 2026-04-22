export type MarketingTab = 'overview' | 'discounts' | 'upsells' | 'recovery' | 'broadcasts' | 'funnels';

export interface MarketingMetric {
  label: string;
  value: string;
  helper: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

export interface CampaignPerformance {
  id: string;
  name: string;
  type: string;
  reach: number;
  clicks: number;
  conversionRate: number;
  revenue: number;
  imageUrl: string;
}

export interface DiscountCampaign {
  id: string;
  code: string;
  type: 'Percentage' | 'Fixed' | 'Free Shipping' | 'Fixed Shipping';
  value: number;
  audience: 'All Customers' | 'First-Time Purchase' | 'Returning Customers';
  codeAccess: 'Public' | 'Direct Code';
  deliveryChannels: Array<'WhatsApp' | 'Email' | 'SMS'>;
  usage: number;
  usageCap: number;
  status: 'Active' | 'Expired' | 'Scheduled';
  isEnabled: boolean;
  startsAt: string;
  endsAt: string;
  appliesTo?: 'All Products' | 'Specific Categories' | 'Specific Products';
  minimumRequirementType?: 'None' | 'Minimum Purchase Amount' | 'Minimum Quantity';
  minimumRequirementValue?: number;
  customerEligibility?: 'Everyone' | 'Specific Customer';
  customerTarget?: string;
  limitDiscountValueEnabled?: boolean;
  limitDiscountValue?: number;
  usageLimitTotalEnabled?: boolean;
  usageLimitPerCustomerEnabled?: boolean;
  usageLimitPerCustomer?: number;
  hasEndDate?: boolean;
}

export interface UpsellOffer {
  id: string;
  name: string;
  type: 'Bump Offer' | 'One-Time Offer';
  trigger: string;
  conversionRate: number;
  revenue: number;
  status: 'Active' | 'Draft';
  imageUrl: string;
}

export interface AbandonedCheckout {
  id: string;
  customer: string;
  email: string;
  cartValue: number;
  cartItems: number;
  lastActivity: string;
  status: 'Pending' | 'Contacted' | 'Recovered';
  imageUrl: string;
}

export interface BroadcastCampaign {
  id: string;
  name: string;
  channel: 'Email' | 'WhatsApp' | 'SMS';
  audience: string;
  schedule: string;
  openRate: number;
  clickRate: number;
  revenue: number;
  status: 'Draft' | 'Scheduled' | 'Sent';
}

export interface FunnelStepNode {
  id: string;
  label: string;
  type: 'page' | 'offer';
  conversionRate: number;
  status: 'active' | 'optional';
}

export interface AutomationRule {
  id: string;
  name: string;
  priority: 'Low' | 'Medium' | 'High';
  condition: string;
  action: string;
  estUplift: number;
  status: 'Active' | 'Draft';
}
