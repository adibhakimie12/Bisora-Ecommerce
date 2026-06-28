export type TenantBillingStatus = 'Paid' | 'Trial' | 'Overdue' | 'Failed';
export type TenantAccessStatus = 'Active' | 'Suspended' | 'Terminated';

export interface TenantAccount {
  id: string;
  brandName: string;
  ownerName: string;
  ownerEmail?: string;
  packageName: string;
  monthlyFee: number;
  billingStatus: TenantBillingStatus;
  accessStatus: TenantAccessStatus;
  daysOverdue: number;
  freeAccess?: boolean;
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  monthlyFee: number;
  discountPercent: number;
  features: string[];
}

export interface PlatformGatewayConfig {
  id: string;
  provider: 'Billplz' | 'SecurePay' | 'ToyyibPay' | 'Stripe';
  mode: 'Test' | 'Live';
  enabled: boolean;
  merchantId: string;
  apiKey: string;
  secretKey: string;
  webhookUrl: string;
}

export const defaultSubscriptionPackages: SubscriptionPackage[] = [
  { id: 'free-trial', name: 'Free Trial', monthlyFee: 0, discountPercent: 0, features: ['Basic access', 'Products: 15', 'Storage: 250MB', 'Bisora managed subdomain', 'Checkout and order tracking'] },
  { id: 'basic', name: 'Basic', monthlyFee: 59, discountPercent: 0, features: ['Use your own domain', 'Products: 30', 'Storage: 500MB', 'Drag & Drop page builder'] },
  { id: 'standard', name: 'Standard', monthlyFee: 99, discountPercent: 0, features: ['All features in Basic', 'Products: 200', 'Storage: 2,000MB', 'Webhooks', 'Embedded checkout'] },
  { id: 'premium', name: 'Premium', monthlyFee: 199, discountPercent: 0, features: ['All features in Standard', 'Products: 1,000', 'Storage: 10,000MB', 'Courier integration', 'Built-in SMS & Email integration'] },
];

export function getTenantAccessState(tenant: TenantAccount) {
  if (tenant.accessStatus === 'Terminated') {
    return 'Terminated';
  }

  if (tenant.accessStatus === 'Suspended') {
    return 'Suspended by owner';
  }

  return 'Active access';
}

export function getTenantBillingRisk(tenant: TenantAccount): 'Low' | 'Medium' | 'High' {
  if (tenant.billingStatus === 'Failed' || tenant.daysOverdue >= 14) {
    return 'High';
  }

  if (tenant.billingStatus === 'Overdue' || tenant.daysOverdue > 0) {
    return 'Medium';
  }

  return 'Low';
}

export function canTerminateTenant(tenant: TenantAccount) {
  return tenant.accessStatus !== 'Terminated';
}

export function grantFreeAccess(tenant: TenantAccount, ownerEmail: string, packageName = tenant.packageName): TenantAccount {
  return {
    ...tenant,
    ownerEmail,
    packageName,
    monthlyFee: 0,
    billingStatus: 'Trial',
    accessStatus: 'Active',
    daysOverdue: 0,
    freeAccess: true,
  };
}

export function applyPackageDiscount(subscriptionPackage: SubscriptionPackage, discountPercent: number): SubscriptionPackage {
  const clampedDiscount = Math.min(100, Math.max(0, discountPercent));
  const discountedFee = subscriptionPackage.monthlyFee * (1 - clampedDiscount / 100);

  return {
    ...subscriptionPackage,
    discountPercent: clampedDiscount,
    monthlyFee: Number(discountedFee.toFixed(2)),
  };
}

export function getGatewayConnectionState(config: PlatformGatewayConfig) {
  if (!config.enabled) {
    return 'Disabled';
  }

  if (!config.merchantId || !config.apiKey || !config.secretKey || !config.webhookUrl) {
    return 'Missing credentials';
  }

  return config.mode === 'Live' ? 'Ready for live billing' : 'Ready for test billing';
}
