import assert from 'node:assert/strict';
import { API_STORAGE_KEYS } from './http';
import { fetchStoreSettings, mapStoreSettingsFromApi, publishStorefront, saveStoreSettings, unpublishStorefront } from './settings';

function createMemoryStorage() {
  const records = new Map<string, string>();
  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
    removeItem: (key: string) => records.delete(key),
  };
}

function testMapsStoreSettingsFromApi() {
  const settings = mapStoreSettingsFromApi({
    id: 1,
    tenant_id: 9,
    name: 'Bisora Demo Store',
    slug: 'bisora-demo',
    managed_domain: 'bisora-demo.bisora.app',
    custom_domain: 'shop.example.test',
    currency: 'MYR',
    timezone: 'Asia/Kuala_Lumpur',
    settings: {
      contact_email: 'hello@example.test',
      payments: { manual_methods: [{ slug: 'cod', enabled: true }] },
      shipping: { providers: [{ slug: 'easyparcel', enabled: false }] },
      storage: { max_upload_mb: 20 },
    },
  });

  assert.equal(settings.name, 'Bisora Demo Store');
  assert.equal(settings.customDomain, 'shop.example.test');
  assert.equal(settings.settings.contact_email, 'hello@example.test');
  assert.equal(settings.settings.storage.max_upload_mb, 20);
}

async function testFetchAndSaveUseTenantHeaders() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '9');
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify({
      data: {
        id: 1,
        tenant_id: 9,
        name: 'Bisora Demo Store',
        slug: 'bisora-demo',
        managed_domain: 'bisora-demo.bisora.app',
        custom_domain: null,
        currency: 'MYR',
        timezone: 'Asia/Kuala_Lumpur',
        settings: {},
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  await fetchStoreSettings({ baseUrl: 'https://api.bisora.test/api', storage, fetcher });
  await saveStoreSettings({ name: 'Updated Store', settings: { contact_email: 'support@example.test' } }, {
    baseUrl: 'https://api.bisora.test/api',
    storage,
    fetcher,
  });

  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(calls[0].url, 'https://api.bisora.test/api/settings/store');
  assert.equal(calls[1].url, 'https://api.bisora.test/api/settings/store');
  assert.equal(calls[1].init.method, 'PATCH');
  assert.equal(headers.Authorization, 'Bearer token-123');
  assert.equal(headers['X-Tenant-Id'], '9');
  assert.equal(JSON.parse(calls[1].init.body as string).settings.contact_email, 'support@example.test');
}

async function testPublishAndUnpublishUseStorefrontEndpoints() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '9');
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify({
      data: {
        id: 1,
        tenant_id: 9,
        name: 'Bisora Demo Store',
        slug: 'bisora-demo',
        managed_domain: 'bisora-demo.bisora.app',
        custom_domain: null,
        currency: 'MYR',
        timezone: 'Asia/Kuala_Lumpur',
        settings: { storefront: { status: 'live', published_url: 'https://bisora-demo.bisora.app' } },
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  await publishStorefront({ baseUrl: 'https://api.bisora.test/api', storage, fetcher });
  await unpublishStorefront({ baseUrl: 'https://api.bisora.test/api', storage, fetcher });

  assert.equal(calls[0].url, 'https://api.bisora.test/api/settings/store/publish');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[1].url, 'https://api.bisora.test/api/settings/store/unpublish');
  assert.equal(calls[1].init.method, 'POST');
}

testMapsStoreSettingsFromApi();
await testFetchAndSaveUseTenantHeaders();
await testPublishAndUnpublishUseStorefrontEndpoints();

console.log('settings api tests passed');
