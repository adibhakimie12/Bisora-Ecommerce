import assert from 'node:assert/strict';
import { API_STORAGE_KEYS } from './http';
import { clearStoredSession, getStoredSession, saveStoredSession } from './authSession';

function createMemoryStorage() {
  const records = new Map<string, string>();
  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
    removeItem: (key: string) => records.delete(key),
  };
}

function testStoresAndReadsLoginSession() {
  const storage = createMemoryStorage();

  saveStoredSession(
    {
      token: 'token-123',
      user: { id: 1, name: 'Owner', email: 'owner@bisora.my', is_platform_owner: true },
      tenants: [{ id: 5, name: 'Bisora Demo', slug: 'bisora-demo', role: 'owner' }],
    },
    storage,
  );

  const session = getStoredSession(storage);

  assert.equal(storage.getItem(API_STORAGE_KEYS.token), 'token-123');
  assert.equal(storage.getItem(API_STORAGE_KEYS.tenantId), '5');
  assert.equal(session?.user.email, 'owner@bisora.my');
  assert.equal(session?.user.isPlatformOwner, true);
  assert.equal(session?.tenants[0].slug, 'bisora-demo');
}

function testClearsAllSessionStorage() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '5');
  storage.setItem(API_STORAGE_KEYS.user, '{"email":"owner@bisora.my"}');
  storage.setItem(API_STORAGE_KEYS.tenants, '[]');

  clearStoredSession(storage);

  assert.equal(getStoredSession(storage), null);
  assert.equal(storage.getItem(API_STORAGE_KEYS.token), null);
  assert.equal(storage.getItem(API_STORAGE_KEYS.tenantId), null);
  assert.equal(storage.getItem(API_STORAGE_KEYS.user), null);
  assert.equal(storage.getItem(API_STORAGE_KEYS.tenants), null);
}

testStoresAndReadsLoginSession();
testClearsAllSessionStorage();

console.log('auth session tests passed');
