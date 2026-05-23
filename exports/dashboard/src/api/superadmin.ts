import { createApiClient, type ApiClientOptions } from './http';
import type {
  PlatformGatewayConfig,
  SubscriptionPackage,
  TenantAccessStatus,
  TenantAccount,
  TenantBillingStatus,
} from '../modules/superadmin/superadminModel';

type ApiBillingStatus = 'paid' | 'trial' | 'overdue' | 'failed';
type ApiAccessStatus = 'active' | 'suspended' | 'terminated';

interface ApiTenantAccount {
  id: number | string;
  brand_name: string;
  owner_name?: string | null;
  owner_email?: string | null;
  package_name: string;
  monthly_fee: number;
  billing_status: ApiBillingStatus;
  access_status: ApiAccessStatus;
  days_overdue: number;
  free_access?: boolean;
}

interface ApiSubscriptionPackage {
  id: number | string;
  name: string;
  monthly_fee: number;
  discount_percent: number;
  features?: string[] | null;
}

interface ApiPlatformGatewayConfig {
  id: string;
  provider: PlatformGatewayConfig['provider'];
  mode: PlatformGatewayConfig['mode'];
  enabled: boolean;
  merchant_id?: string | null;
  api_key?: string | null;
  secret_key?: string | null;
  webhook_url?: string | null;
}

function toMajorUnits(value: number) {
  return Number((value / 100).toFixed(2));
}

function toMinorUnits(value: number) {
  return Math.round(value * 100);
}

function titleCaseStatus<T extends string>(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1).toLowerCase()}` as T;
}

function toApiAccessStatus(value: TenantAccessStatus): ApiAccessStatus {
  return value.toLowerCase() as ApiAccessStatus;
}

function toApiBillingStatus(value: TenantBillingStatus): ApiBillingStatus {
  return value.toLowerCase() as ApiBillingStatus;
}

export function mapTenantFromApi(tenant: ApiTenantAccount): TenantAccount {
  return {
    id: String(tenant.id),
    brandName: tenant.brand_name,
    ownerName: tenant.owner_name ?? 'Store Owner',
    ownerEmail: tenant.owner_email ?? undefined,
    packageName: tenant.package_name,
    monthlyFee: toMajorUnits(tenant.monthly_fee),
    billingStatus: titleCaseStatus<TenantBillingStatus>(tenant.billing_status),
    accessStatus: titleCaseStatus<TenantAccessStatus>(tenant.access_status),
    daysOverdue: tenant.days_overdue,
    freeAccess: Boolean(tenant.free_access),
  };
}

export function mapPackageFromApi(subscriptionPackage: ApiSubscriptionPackage): SubscriptionPackage {
  return {
    id: String(subscriptionPackage.id),
    name: subscriptionPackage.name,
    monthlyFee: toMajorUnits(subscriptionPackage.monthly_fee),
    discountPercent: subscriptionPackage.discount_percent,
    features: subscriptionPackage.features ?? [],
  };
}

export function mapGatewayFromApi(gateway: ApiPlatformGatewayConfig): PlatformGatewayConfig {
  return {
    id: gateway.id,
    provider: gateway.provider,
    mode: gateway.mode,
    enabled: gateway.enabled,
    merchantId: gateway.merchant_id ?? '',
    apiKey: gateway.api_key ?? '',
    secretKey: gateway.secret_key ?? '',
    webhookUrl: gateway.webhook_url ?? '',
  };
}

export async function fetchSuperadminOverview(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{
    data: {
      total_tenants: number;
      active_tenants: number;
      overdue_tenants: number;
      monthly_recurring_revenue: number;
    };
  }>('/superadmin/overview');

  return {
    totalTenants: response.data.total_tenants,
    activeTenants: response.data.active_tenants,
    overdueTenants: response.data.overdue_tenants,
    monthlyRecurringRevenue: toMajorUnits(response.data.monthly_recurring_revenue),
  };
}

export async function fetchTenants(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiTenantAccount[] }>('/superadmin/tenants');

  return response.data.map(mapTenantFromApi);
}

export async function updateTenantAccess(tenantId: string, accessStatus: TenantAccessStatus, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiTenantAccount }>(`/superadmin/tenants/${tenantId}/access`, {
    method: 'PATCH',
    body: JSON.stringify({ access_status: toApiAccessStatus(accessStatus) }),
  });

  return mapTenantFromApi(response.data);
}

export async function grantTenantFreeAccess(tenantId: string, ownerEmail: string, packageName: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiTenantAccount }>(`/superadmin/tenants/${tenantId}/free-access`, {
    method: 'POST',
    body: JSON.stringify({
      owner_email: ownerEmail,
      package_name: packageName,
      monthly_fee: 0,
    }),
  });

  return mapTenantFromApi(response.data);
}

export async function fetchPackages(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiSubscriptionPackage[] }>('/superadmin/packages');

  return response.data.map(mapPackageFromApi);
}

export async function savePackage(subscriptionPackage: SubscriptionPackage, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const body = JSON.stringify({
    name: subscriptionPackage.name,
    monthly_fee: toMinorUnits(subscriptionPackage.monthlyFee),
    discount_percent: subscriptionPackage.discountPercent,
    features: subscriptionPackage.features,
  });
  const isNumericId = /^\d+$/.test(subscriptionPackage.id);
  const response = await client.request<{ data: ApiSubscriptionPackage }>(
    isNumericId ? `/superadmin/packages/${subscriptionPackage.id}` : '/superadmin/packages',
    {
      method: isNumericId ? 'PATCH' : 'POST',
      body,
    },
  );

  return mapPackageFromApi(response.data);
}

export async function fetchGateways(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiPlatformGatewayConfig[] }>('/superadmin/gateways');

  return response.data.map(mapGatewayFromApi);
}

export async function saveGateway(gateway: PlatformGatewayConfig, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiPlatformGatewayConfig }>(`/superadmin/gateways/${gateway.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      mode: gateway.mode,
      enabled: gateway.enabled,
      merchant_id: gateway.merchantId,
      api_key: gateway.apiKey === 'configured' ? undefined : gateway.apiKey,
      secret_key: gateway.secretKey === 'configured' ? undefined : gateway.secretKey,
      webhook_url: gateway.webhookUrl,
    }),
  });

  return mapGatewayFromApi(response.data);
}

export function mapTenantToApiBillingStatus(value: TenantBillingStatus): ApiBillingStatus {
  return toApiBillingStatus(value);
}
