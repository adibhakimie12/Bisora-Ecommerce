import assert from 'node:assert/strict';
import { ApiError, API_STORAGE_KEYS, createApiClient } from './http';

function createMemoryStorage() {
  const records = new Map<string, string>();
  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
    removeItem: (key: string) => records.delete(key),
  };
}

async function testLoginStoresTokenAndTenant() {
  const storage = createMemoryStorage();
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createApiClient({
    baseUrl: 'https://api.bisora.test/api',
    storage,
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(
        JSON.stringify({
          token: 'token-123',
          user: { id: 1, email: 'seller@bisora.my' },
          tenants: [{ id: 99, slug: 'demo-store', role: 'owner' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    },
  });

  const result = await client.auth.login({ email: 'seller@bisora.my', password: 'secret-pass' });

  assert.equal(calls[0].url, 'https://api.bisora.test/api/auth/login');
  assert.equal(result.token, 'token-123');
  assert.equal(storage.getItem(API_STORAGE_KEYS.token), 'token-123');
  assert.equal(storage.getItem(API_STORAGE_KEYS.tenantId), '99');
}

async function testCatalogRequestsSendAuthAndTenantHeaders() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-abc');
  storage.setItem(API_STORAGE_KEYS.tenantId, '42');
  const calls: RequestInit[] = [];
  const client = createApiClient({
    baseUrl: '/api',
    storage,
    fetcher: async (_url, init) => {
      calls.push(init ?? {});
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });

  await client.catalog.listProducts();

  const headers = calls[0].headers as Record<string, string>;
  assert.equal(headers.Authorization, 'Bearer token-abc');
  assert.equal(headers['X-Tenant-Id'], '42');
  assert.equal(headers.Accept, 'application/json');
}

async function testApiErrorCarriesStatusAndPayload() {
  const client = createApiClient({
    baseUrl: '/api',
    fetcher: async () =>
      new Response(JSON.stringify({ message: 'Invalid data', errors: { email: ['Required'] } }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      }),
  });

  await assert.rejects(
    () => client.auth.login({ email: '', password: '' }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 422);
      assert.equal(error.payload.message, 'Invalid data');
      return true;
    },
  );
}

await testLoginStoresTokenAndTenant();
await testCatalogRequestsSendAuthAndTenantHeaders();
await testApiErrorCarriesStatusAndPayload();

console.log('api http tests passed');
