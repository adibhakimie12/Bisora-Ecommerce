import assert from 'node:assert/strict';
import {
  mapGatewayFromApi,
  mapPackageFromApi,
  mapTenantFromApi,
  updateTenantAccess,
} from './superadmin';
import { API_STORAGE_KEYS } from './http';

function createMemoryStorage() {
  const records = new Map<string, string>();
  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
    removeItem: (key: string) => records.delete(key),
  };
}

function testMapsTenantFromApi() {
  const tenant = mapTenantFromApi({
    id: 8,
    brand_name: 'Sarah Beauty',
    owner_name: 'Sarah Admin',
    owner_email: 'sarah@example.test',
    package_name: 'growth',
    monthly_fee: 12900,
    billing_status: 'paid',
    access_status: 'active',
    days_overdue: 0,
    free_access: false,
  });

  assert.equal(tenant.id, '8');
  assert.equal(tenant.brandName, 'Sarah Beauty');
  assert.equal(tenant.ownerEmail, 'sarah@example.test');
  assert.equal(tenant.monthlyFee, 129);
  assert.equal(tenant.billingStatus, 'Paid');
  assert.equal(tenant.accessStatus, 'Active');
}

function testMapsPackageAndGatewayFromApi() {
  const subscriptionPackage = mapPackageFromApi({
    id: 4,
    name: 'Growth',
    monthly_fee: 9900,
    discount_percent: 15,
    features: ['Automation queue'],
  });
  const gateway = mapGatewayFromApi({
    id: 'billplz',
    provider: 'Billplz',
    mode: 'Live',
    enabled: true,
    merchant_id: 'merchant-1',
    api_key: 'configured',
    secret_key: 'configured',
    webhook_url: 'https://bisora.test/webhooks/billplz',
  });

  assert.equal(subscriptionPackage.monthlyFee, 99);
  assert.equal(subscriptionPackage.discountPercent, 15);
  assert.equal(gateway.provider, 'Billplz');
  assert.equal(gateway.apiKey, 'configured');
}

async function testUpdateTenantAccessUsesSuperadminEndpoint() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'owner-token');
  const calls: Array<{ url: string; init: RequestInit }> = [];

  await updateTenantAccess('8', 'Suspended', {
    baseUrl: 'https://api.bisora.test/api',
    storage,
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(
        JSON.stringify({
          data: {
            id: 8,
            brand_name: 'Sarah Beauty',
            package_name: 'Growth',
            monthly_fee: 0,
            billing_status: 'trial',
            access_status: 'suspended',
            days_overdue: 0,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    },
  });

  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(calls[0].url, 'https://api.bisora.test/api/superadmin/tenants/8/access');
  assert.equal(headers.Authorization, 'Bearer owner-token');
  assert.equal(JSON.parse(calls[0].init.body as string).access_status, 'suspended');
}

testMapsTenantFromApi();
testMapsPackageAndGatewayFromApi();
await testUpdateTenantAccessUsesSuperadminEndpoint();

console.log('superadmin api tests passed');
