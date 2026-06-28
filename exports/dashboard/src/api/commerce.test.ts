import assert from 'node:assert/strict';
import { API_STORAGE_KEYS } from './http';
import {
  addCustomerNote,
  contactCustomer,
  convertDraftOrder,
  createCustomer,
  createDraftOrder,
  createOrder,
  deactivateCustomer,
  deleteCustomer,
  deleteOrder,
  deleteReview,
  exportReviewReport,
  fetchCustomers,
  fetchDraftOrders,
  fetchOrders,
  mapCustomerFromApi,
  mapDraftOrderFromApi,
  mapOrderFromApi,
  sendDraftInvoice,
  updateCustomer,
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
  assert.equal(order.backendId, '9');
  assert.equal(order.total, 450);
  assert.equal(order.paymentStatus, 'Paid');
  assert.equal(order.settlementStatus, 'Unsettled');
  assert.equal(order.fulfillmentStatus, 'Processing');
  assert.equal(order.customer.email, 'amina@example.test');
}

function testMapsCheckoutShippingAddressShape() {
  const order = mapOrderFromApi({
    id: 12,
    number: 'ORD-260523-0004',
    total: 12900,
    payment_status: 'pending',
    settlement_status: 'unsettled',
    fulfillment_status: 'unfulfilled',
    ordered_at: '2026-05-23',
    customer: { id: 4, name: 'Trial Buyer', email: 'trial-buyer@example.test', status: 'new' },
    items: [],
    shipping_address: {
      recipient: 'Trial Buyer',
      address_line_1: 'No 12 Jalan Demo',
      address_line_2: 'Level 2',
      city: 'Kuala Lumpur',
      country: 'Malaysia',
    },
    shipment: {},
  });

  assert.equal(order.shippingAddress.line1, 'No 12 Jalan Demo');
  assert.equal(order.shippingAddress.line2, 'Level 2');
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

function testMapsDraftOrderFromApi() {
  const draft = mapDraftOrderFromApi({
    id: 3,
    number: 'DRAFT-260525-0001',
    customer_name: 'Nur Amirah',
    customer_email: 'nur.amirah@example.test',
    source: 'WhatsApp',
    items: [{ name: 'Silk Midnight Abaya', sku: 'ABY-LGC-097', quantity: 2, price: 42000 }],
    total: 84000,
    status: 'invoice_sent',
    note: 'Follow up tomorrow.',
    updated_at: '2026-05-25',
  });

  assert.equal(draft.backendId, '3');
  assert.equal(draft.id, 'DRAFT-260525-0001');
  assert.equal(draft.items, 2);
  assert.equal(draft.total, 840);
  assert.equal(draft.status, 'Invoice Sent');
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

async function testCreateOrderCallsBackend() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  const calls: Array<{ url: string; init: RequestInit }> = [];

  const order = await createOrder({
    customer: { name: 'Nur Amirah', email: 'nur.amirah@example.test', phone: '+60 12-888 3391' },
    items: [{ productId: '21', quantity: 2 }],
    paymentMethod: 'Manual transfer',
    paymentStatus: 'Pending',
    shippingAddress: { line1: 'No 12 Jalan Demo', city: 'Kuala Lumpur', country: 'Malaysia' },
  }, {
    baseUrl: '/api',
    storage,
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({
        data: {
          id: 17,
          number: 'ORD-260525-0001',
          total: 18000,
          payment_status: 'pending',
          settlement_status: 'unsettled',
          fulfillment_status: 'unfulfilled',
          ordered_at: '2026-05-25',
          payment_method: 'Manual transfer',
          customer: { id: 6, name: 'Nur Amirah', email: 'nur.amirah@example.test', status: 'new' },
          items: [{ product_id: '21', name: 'Premium Modal Hijab', sku: 'HJB-MDL-018', quantity: 2, price: 9000 }],
          shipping_address: { line1: 'No 12 Jalan Demo', city: 'Kuala Lumpur', country: 'Malaysia' },
          shipment: { tracking_location: 'Manual order received' },
        },
      }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    },
  });

  const body = JSON.parse(calls[0].init.body as string);
  assert.equal(calls[0].url, '/api/orders');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(body.items, [{ product_id: 21, quantity: 2 }]);
  assert.equal(body.payment_status, 'pending');
  assert.equal(body.shipping_address.line1, 'No 12 Jalan Demo');
  assert.equal(order.id, '#ORD-260525-0001');
  assert.equal(order.total, 180);
}

async function testUpdateOrderStatusCanConfirmPaymentAndSettlement() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  const calls: Array<{ url: string; init: RequestInit }> = [];

  await updateOrderStatus('12', { paymentStatus: 'Paid', settlementStatus: 'Processing' }, {
    baseUrl: '/api',
    storage,
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({
        data: {
          id: 12,
          number: 'ORD-12',
          total: 1000,
          payment_status: 'paid',
          settlement_status: 'processing',
          fulfillment_status: 'processing',
          items: [],
          shipping_address: {},
          shipment: {},
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  });

  const body = JSON.parse(calls[0].init.body as string);
  assert.equal(calls[0].url, '/api/orders/12/status');
  assert.equal(body.payment_status, 'paid');
  assert.equal(body.settlement_status, 'processing');
}

async function testDeleteOrderCallsBackend() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  let url = '';
  let method = '';

  await deleteOrder('#17', {
    baseUrl: '/api',
    storage,
    fetcher: async (requestUrl, init) => {
      url = String(requestUrl);
      method = String(init?.method ?? '');
      return new Response(null, { status: 204 });
    },
  });

  assert.equal(url, '/api/orders/17');
  assert.equal(method, 'DELETE');
}

async function testDraftOrderCallsBackend() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  const calls: Array<{ url: string; init: RequestInit }> = [];

  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const responsePayload = String(url).endsWith('/draft-orders') && init?.method === 'POST'
      ? {
        data: {
          id: 4,
          number: 'DRAFT-260525-0002',
          customer_name: 'Nur Amirah',
          customer_email: 'nur.amirah@example.test',
          source: 'WhatsApp',
          items: [{ name: 'Silk Midnight Abaya', sku: 'ABY-LGC-097', quantity: 1, price: 42000 }],
          total: 42000,
          status: 'draft',
          updated_at: '2026-05-25',
        },
      }
      : { data: [] };
    return new Response(JSON.stringify(responsePayload), { status: init?.method === 'POST' ? 201 : 200, headers: { 'Content-Type': 'application/json' } });
  };

  await fetchDraftOrders({ baseUrl: '/api', storage, fetcher });
  const draft = await createDraftOrder({
    customerName: 'Nur Amirah',
    customerEmail: 'nur.amirah@example.test',
    source: 'WhatsApp',
    items: [{ name: 'Silk Midnight Abaya', sku: 'ABY-LGC-097', quantity: 1, price: 420 }],
  }, { baseUrl: '/api', storage, fetcher });

  const body = JSON.parse(calls[1].init.body as string);
  assert.equal(calls[0].url, '/api/draft-orders');
  assert.equal(calls[1].url, '/api/draft-orders');
  assert.equal(calls[1].init.method, 'POST');
  assert.equal(body.items[0].price, 42000);
  assert.equal(draft.id, 'DRAFT-260525-0002');
}

async function testConvertDraftOrderCallsBackend() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  const calls: Array<{ url: string; init: RequestInit }> = [];

  const result = await convertDraftOrder('4', { paymentStatus: 'Pending', paymentMethod: 'Manual transfer' }, {
    baseUrl: '/api',
    storage,
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({
        data: {
          order: {
            id: 19,
            number: 'ORD-260525-0003',
            total: 42000,
            payment_status: 'pending',
            fulfillment_status: 'unfulfilled',
            ordered_at: '2026-05-25',
            customer: { id: 7, name: 'Nur Amirah', email: 'nur.amirah@example.test', status: 'new' },
            items: [{ name: 'Silk Midnight Abaya', sku: 'ABY-LGC-097', quantity: 1, price: 42000 }],
            shipping_address: {},
            shipment: {},
          },
          draft: {
            id: 4,
            number: 'DRAFT-260525-0002',
            customer_name: 'Nur Amirah',
            customer_email: 'nur.amirah@example.test',
            source: 'WhatsApp',
            items: [],
            total: 42000,
            status: 'converted',
            updated_at: '2026-05-25',
          },
        },
      }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    },
  });

  const body = JSON.parse(calls[0].init.body as string);
  assert.equal(calls[0].url, '/api/draft-orders/4/convert');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(body.payment_status, 'pending');
  assert.equal(result.order.id, '#ORD-260525-0003');
  assert.equal(result.draft.status, 'Converted');
}

async function testSendDraftInvoiceCallsBackend() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  const calls: Array<{ url: string; init: RequestInit }> = [];

  const draft = await sendDraftInvoice('4', {
    baseUrl: '/api',
    storage,
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({
        data: {
          draft: {
            id: 4,
            number: 'DRAFT-260525-0002',
            customer_name: 'Nur Amirah',
            customer_email: 'nur.amirah@example.test',
            source: 'WhatsApp',
            items: [],
            total: 42000,
            status: 'invoice_sent',
            updated_at: '2026-05-25',
          },
        },
      }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    },
  });

  assert.equal(calls[0].url, '/api/draft-orders/4/send-invoice');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(draft.status, 'Invoice Sent');
}

async function testCustomerMutationsCallBackend() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const customerPayload = {
    data: {
      id: 4,
      name: 'Nur Aisyah',
      email: 'nur@example.test',
      avatar_url: null,
      status: 'vip',
      orders_count: 0,
      total_spent: 0,
      last_order_at: null,
      member_since: '2026-05-24',
      shipping_address: [],
      notes: [],
      orders: [],
    },
  };
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify(customerPayload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  await createCustomer({ name: 'Nur Aisyah', email: 'nur@example.test', status: 'VIP' }, { baseUrl: '/api', storage, fetcher });
  await updateCustomer('4', { name: 'Nur Aisyah', email: 'nur@example.test', status: 'Returning' }, { baseUrl: '/api', storage, fetcher });
  await addCustomerNote('4', 'Prefers WhatsApp.', { baseUrl: '/api', storage, fetcher });

  assert.equal(calls[0].url, '/api/customers');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body as string), { name: 'Nur Aisyah', email: 'nur@example.test', status: 'VIP' });
  assert.equal(calls[1].url, '/api/customers/4');
  assert.equal(calls[1].init.method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[2].init.body as string), { message: 'Prefers WhatsApp.' });
}

async function testDeleteCustomerCallsBackend() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  let url = '';
  let method = '';

  await deleteCustomer('4', {
    baseUrl: '/api',
    storage,
    fetcher: async (requestUrl, init) => {
      url = String(requestUrl);
      method = String(init?.method ?? '');
      return new Response(null, { status: 204 });
    },
  });

  assert.equal(url, '/api/customers/4');
  assert.equal(method, 'DELETE');
}

async function testCustomerQuickActionsCallBackend() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify({
      data: {
        id: 4,
        name: 'Nur Aisyah',
        email: 'nur@example.test',
        avatar_url: null,
        status: 'inactive',
        orders_count: 0,
        total_spent: 0,
        last_order_at: null,
        member_since: '2026-05-24',
        shipping_address: [],
        notes: [],
        orders: [],
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  await contactCustomer('4', 'WhatsApp', 'Hi Nur.', { baseUrl: '/api', storage, fetcher });
  const deactivated = await deactivateCustomer('4', { baseUrl: '/api', storage, fetcher });

  assert.equal(calls[0].url, '/api/customers/4/contact');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body as string), { channel: 'WhatsApp', message: 'Hi Nur.' });
  assert.equal(calls[1].url, '/api/customers/4/deactivate');
  assert.equal(calls[1].init.method, 'POST');
  assert.equal(deactivated.status, 'Inactive');
}

async function testReviewExportAndDeleteCallBackend() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-123');
  storage.setItem(API_STORAGE_KEYS.tenantId, '8');
  const calls: Array<{ url: string; init: RequestInit }> = [];

  const report = await exportReviewReport({
    baseUrl: '/api',
    storage,
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({
        summary: { total: 1, average_rating: 5, pending: 0, approved: 1, featured: 0, hidden: 0 },
        data: [{
          id: 7,
          customer_name: 'Amina',
          customer_email: 'amina@example.test',
          product_name: 'Hijab',
          rating: 5,
          excerpt: 'Great',
          full_review: 'Great',
          status: 'approved',
          verified_purchase: true,
          reviewed_at: '2026-05-24',
        }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  });

  await deleteReview('7', {
    baseUrl: '/api',
    storage,
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(null, { status: 204 });
    },
  });

  assert.equal(calls[0].url, '/api/reviews/export');
  assert.equal(report.summary.total, 1);
  assert.equal(report.reviews[0].customerName, 'Amina');
  assert.equal(calls[1].url, '/api/reviews/7');
  assert.equal(calls[1].init.method, 'DELETE');
}

testMapsOrderFromApi();
testMapsCheckoutShippingAddressShape();
testMapsCustomerFromApi();
testMapsDraftOrderFromApi();
await testFetchersUseTenantHeaders();
await testCreateOrderCallsBackend();
await testUpdateOrderStatusCallsStatusEndpoint();
await testUpdateOrderStatusCanConfirmPaymentAndSettlement();
await testDeleteOrderCallsBackend();
await testDraftOrderCallsBackend();
await testConvertDraftOrderCallsBackend();
await testSendDraftInvoiceCallsBackend();
await testCustomerMutationsCallBackend();
await testDeleteCustomerCallsBackend();
await testCustomerQuickActionsCallBackend();
await testReviewExportAndDeleteCallBackend();

console.log('commerce api tests passed');
