import assert from 'node:assert/strict';
import { API_STORAGE_KEYS } from './http';
import { fetchMarketingWorkspace, queueBroadcast, queueRecoveryReminder, saveMarketingCollection } from './marketing';

function createMemoryStorage() {
  const records = new Map<string, string>();
  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
    removeItem: (key: string) => records.delete(key),
  };
}

async function testFetchMarketingWorkspaceUsesTenantApi() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '9');
  const calls: Array<{ url: string; headers: Record<string, string> }> = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), headers: init?.headers as Record<string, string> });

    return new Response(
      JSON.stringify({
        data: {
          discounts: [{ id: 'disc-1', code: 'FIRST20' }],
          upsells: [],
          recovery: [],
          broadcasts: [],
          automation_rules: [{ id: 'rule-1', name: 'VIP Rule' }],
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const workspace = await fetchMarketingWorkspace({ baseUrl: 'https://api.bisora.test/api', storage, fetcher });

  assert.equal(calls[0].url, 'https://api.bisora.test/api/marketing');
  assert.equal(calls[0].headers['X-Tenant-Id'], '9');
  assert.equal(workspace.discounts[0].code, 'FIRST20');
  assert.equal(workspace.automationRules[0].name, 'VIP Rule');
}

async function testSaveMarketingCollectionPatchesItems() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '9');
  let requestBody = '';
  let requestMethod = '';
  const calls: string[] = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push(String(url));
    requestMethod = init?.method ?? '';
    requestBody = String(init?.body ?? '');

    return new Response(
      JSON.stringify({
        data: {
          discounts: [{ id: 'disc-new', code: 'RAYA25' }],
          upsells: [],
          recovery: [],
          broadcasts: [],
          automation_rules: [],
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  await saveMarketingCollection('discounts', [{ id: 'disc-new', code: 'RAYA25' }], {
    baseUrl: 'https://api.bisora.test/api',
    storage,
    fetcher,
  });

  assert.equal(calls[0], 'https://api.bisora.test/api/marketing/discounts');
  assert.equal(requestMethod, 'PATCH');
  assert.equal(JSON.parse(requestBody).items[0].code, 'RAYA25');
}

async function testQueueBroadcastUsesBackendAction() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '9');
  let requestMethod = '';
  const calls: string[] = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push(String(url));
    requestMethod = init?.method ?? '';

    return new Response(JSON.stringify({ queued: 2 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const response = await queueBroadcast('bc-1', { baseUrl: 'https://api.bisora.test/api', storage, fetcher });

  assert.equal(calls[0], 'https://api.bisora.test/api/marketing/broadcasts/bc-1/queue');
  assert.equal(requestMethod, 'POST');
  assert.equal(response.queued, 2);
}

async function testQueueRecoveryReminderUsesBackendAction() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '9');
  const calls: string[] = [];
  const fetcher = async (url: string | URL | Request) => {
    calls.push(String(url));

    return new Response(
      JSON.stringify({
        data: {
          discounts: [],
          upsells: [],
          recovery: [{ id: 'CHK-1', status: 'Contacted' }],
          broadcasts: [],
          automation_rules: [],
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const response = await queueRecoveryReminder('CHK-1', { baseUrl: 'https://api.bisora.test/api', storage, fetcher });

  assert.equal(calls[0], 'https://api.bisora.test/api/marketing/recovery/CHK-1/remind');
  assert.equal(response.recovery[0].status, 'Contacted');
}

await testFetchMarketingWorkspaceUsesTenantApi();
await testSaveMarketingCollectionPatchesItems();
await testQueueBroadcastUsesBackendAction();
await testQueueRecoveryReminderUsesBackendAction();

console.log('marketing api tests passed');
