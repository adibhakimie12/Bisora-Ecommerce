import assert from 'node:assert/strict';
import { API_STORAGE_KEYS } from './http';
import { fetchNotificationLogs, processNotificationQueue, queueTestNotification, retryNotificationLog, updateNotificationLogStatus } from './notifications';

function createMemoryStorage() {
  const records = new Map<string, string>();
  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
    removeItem: (key: string) => records.delete(key),
  };
}

async function testFetchNotificationLogsMapsSummaryAndRows() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  const calls: string[] = [];

  const response = await fetchNotificationLogs({
    baseUrl: '/api',
    storage,
    fetcher: async (url) => {
      calls.push(String(url));
      return new Response(JSON.stringify({
        summary: { queued: 2, sent: 1, failed: 0 },
        data: [{
          id: 4,
          event: 'order_placed',
          channel: 'email',
          recipient: 'buyer@example.test',
          subject: 'Order received',
          message: 'We received your order.',
          status: 'queued',
          queued_at: '2026-05-24T10:00:00Z',
          sent_at: null,
          order: { id: 5, number: 'ORD-1' },
        }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  });

  assert.equal(calls[0], '/api/notifications/logs');
  assert.equal(response.summary.queued, 2);
  assert.equal(response.logs[0].id, '4');
  assert.equal(response.logs[0].orderNumber, 'ORD-1');
}

async function testUpdateNotificationLogStatusCallsBackend() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  let body = '';

  await updateNotificationLogStatus('4', 'sent', {
    baseUrl: '/api',
    storage,
    fetcher: async (_url, init) => {
      body = String(init?.body ?? '');
      return new Response(JSON.stringify({
        data: {
          id: 4,
          event: 'order_placed',
          channel: 'email',
          recipient: 'buyer@example.test',
          subject: 'Order received',
          message: 'We received your order.',
          status: 'sent',
          queued_at: '2026-05-24T10:00:00Z',
          sent_at: '2026-05-24T10:01:00Z',
          order: { id: 5, number: 'ORD-1' },
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  });

  assert.deepEqual(JSON.parse(body), { status: 'sent' });
}

async function testQueueTestNotificationCallsBackend() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  let url = '';
  let body = '';

  const response = await queueTestNotification('WhatsApp', {
    baseUrl: '/api',
    storage,
    fetcher: async (requestUrl, init) => {
      url = String(requestUrl);
      body = String(init?.body ?? '');
      return new Response(JSON.stringify({
        data: {
          id: 12,
          event: 'test_notification',
          channel: 'whatsapp',
          recipient: 'test@bisora.local',
          subject: 'Bisora whatsapp test',
          message: 'Test whatsapp notification queued from Bisora settings.',
          status: 'queued',
          queued_at: '2026-05-24T10:00:00Z',
          sent_at: null,
          order: null,
        },
      }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    },
  });

  assert.equal(url, '/api/notifications/test-send');
  assert.deepEqual(JSON.parse(body), { channel: 'WhatsApp' });
  assert.equal(response.event, 'test_notification');
  assert.equal(response.channel, 'whatsapp');
}

async function testRetryNotificationLogCallsBackend() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  let url = '';
  let method = '';

  const response = await retryNotificationLog('4', {
    baseUrl: '/api',
    storage,
    fetcher: async (requestUrl, init) => {
      url = String(requestUrl);
      method = String(init?.method ?? '');
      return new Response(JSON.stringify({
        data: {
          id: 4,
          event: 'order_placed',
          channel: 'email',
          recipient: 'buyer@example.test',
          subject: 'Order received',
          message: 'We received your order.',
          status: 'queued',
          queued_at: '2026-05-24T10:00:00Z',
          sent_at: null,
          order: { id: 5, number: 'ORD-1' },
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  });

  assert.equal(url, '/api/notifications/logs/4/retry');
  assert.equal(method, 'POST');
  assert.equal(response.status, 'queued');
}

async function testProcessNotificationQueueCallsBackend() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  let url = '';
  let body = '';

  const response = await processNotificationQueue(10, {
    baseUrl: '/api',
    storage,
    fetcher: async (requestUrl, init) => {
      url = String(requestUrl);
      body = String(init?.body ?? '');
      return new Response(JSON.stringify({
        summary: { processed: 3, sent: 2, failed: 1 },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  });

  assert.equal(url, '/api/notifications/process');
  assert.deepEqual(JSON.parse(body), { limit: 10 });
  assert.equal(response.processed, 3);
  assert.equal(response.sent, 2);
  assert.equal(response.failed, 1);
}

await testFetchNotificationLogsMapsSummaryAndRows();
await testUpdateNotificationLogStatusCallsBackend();
await testQueueTestNotificationCallsBackend();
await testRetryNotificationLogCallsBackend();
await testProcessNotificationQueueCallsBackend();

console.log('notification api tests passed');
