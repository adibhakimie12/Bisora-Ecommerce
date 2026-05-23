import assert from 'node:assert/strict';
import { API_STORAGE_KEYS } from './http';
import {
  fetchCustomers,
  fetchOrders,
  mapCustomerFromApi,
  mapOrderFromApi,
  updateOrderStatus,
} from './commerce';

function createMemoryStorage() {
  const records = new Map<string, string>();
  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
    removeItem: (key: string) => records.delete(key),
  };
}

function testMapsOrderFromApi() {
  const order = mapOrderFromApi({
    id: 9,
    number: 'ORD-9021',
    total: 45000,
    payment_status: 'paid',
    settlement_status: 'unsettled',
    fulfillment_status: 'processing',
    ordered_at: '2026-04-21',
    payment_method: 'Visa ending 4242',
    customer: { id: 3, name: 'Amina Al-Farsi', email: 'amina@example.test', status: 'vip' },
    items: [{ name: 'Premium Modal Hijab', sku: 'HIJAB-001', quantity: 1, price: 12900 }],
    shipping_address: { recipient: 'Amina Al-Farsi', city: 'Kuala Lumpur', country: 'Malaysia' },
    shipment: { courier: 'DHL', tracking_location: 'Preparing shipment', tracking_number: 'DHL-9021' },
  });

  assert.equal(order.id, '#ORD-9021');
  assert.equal(order.total, 450);
  assert.equal(order.paymentStatus, 'Paid');
  assert.equal(order.settlementStatus, 'Unsettled');
  assert.equal(order.fulfillmentStatus, 'Processing');
  assert.equal(order.customer.email, 'amina@example.test');
}

function testMapsCustomerFromApi() {
  const customer = mapCustomerFromApi({
    id: 4,
    name: 'Amina Al-Farsi',
    email: 'amina@example.test',
    avatar_url: null,
    status: 'vip',
    orders_count: 2,
    total_spent: 45000,
    last_order_at: '2026-04-21',
    member_since: '2026-01-10',
    shipping_address: ['Kuala Lumpur', 'Malaysia'],
    notes: ['VIP'],
    orders: [],
  });

  assert.equal(customer.id, '4');
  assert.equal(customer.status, 'VIP');
  assert.equal(customer.totalSpent, 450);
  assert.deepEqual(customer.shippingAddress, ['Kuala Lumpur', 'Malaysia']);
}

async function testFetchersUseTenantHeaders() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  await fetchCustomers({ baseUrl: 'https://api.bisora.test/api', storage, fetcher });
  await fetchOrders({ baseUrl: 'https://api.bisora.test/api', storage, fetcher });

  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(calls[0].url, 'https://api.bisora.test/api/customers');
  assert.equal(calls[1].url, 'https://api.bisora.test/api/orders');
  assert.equal(headers.Authorization, 'Bearer token-123');
  assert.equal(headers['X-Tenant-Id'], '8');
}

async function testUpdateOrderStatusCallsStatusEndpoint() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  const calls: RequestInit[] = [];

  await updateOrderStatus('9', { fulfillmentStatus: 'Shipped', trackingNumber: 'DHL-9' }, {
    baseUrl: '/api',
    storage,
    fetcher: async (_url, init) => {
      calls.push(init ?? {});
      return new Response(JSON.stringify({
        data: {
          id: 9,
          number: 'ORD-9',
          total: 1000,
          payment_status: 'paid',
          fulfillment_status: 'shipped',
          items: [],
          shipping_address: {},
          shipment: { tracking_number: 'DHL-9' },
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  });

  const body = JSON.parse(calls[0].body as string);
  assert.equal(body.fulfillment_status, 'shipped');
  assert.equal(body.tracking_number, 'DHL-9');
}

testMapsOrderFromApi();
testMapsCustomerFromApi();
await testFetchersUseTenantHeaders();
await testUpdateOrderStatusCallsStatusEndpoint();

console.log('commerce api tests passed');
