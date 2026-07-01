import test from 'node:test';
import assert from 'node:assert/strict';

import { buildInvoiceHtml, openInvoicePrintWindow } from './orderInvoice';
import type { Order } from './types';

const order: Order = {
  id: '#ORD-260630-225331530',
  customer: { name: 'Ahmad <Buyer>', email: 'test@example.com', tag: 'Storefront customer' },
  products: 'Comfy',
  date: 'Jun 30, 2026',
  total: 49,
  paymentStatus: 'Paid',
  settlementStatus: 'Processing',
  fulfillmentStatus: 'Delivered',
  paymentMethod: 'manual_bank_transfer',
  shipment: {
    orderDate: 'Jun 30, 2026',
    courier: 'J&T',
    status: 'Delivered',
    trackingLocation: 'Tracking number saved',
    trackingNumber: 'ep1234567',
  },
  shippingAddress: {
    recipient: 'ahmad',
    line1: 'jaln gombak',
    line2: '',
    city: 'setapak',
    country: 'Malaysia',
  },
  items: [
    {
      id: 'item-1',
      name: 'Comfy',
      sku: 'NEW-SKU-001',
      quantity: 1,
      price: 49,
      imageUrl: 'https://example.com/comfy.jpg',
    },
  ],
};

test('buildInvoiceHtml renders printable invoice details safely', () => {
  const html = buildInvoiceHtml(order);

  assert.match(html, /Invoice/);
  assert.match(html, /#ORD-260630-225331530/);
  assert.match(html, /Ahmad &lt;Buyer&gt;/);
  assert.match(html, /Comfy/);
  assert.match(html, /NEW-SKU-001/);
  assert.match(html, /RM 49\.00/);
  assert.doesNotMatch(html, /Ahmad <Buyer>/);
});

test('openInvoicePrintWindow opens a blob invoice document instead of writing to about blank', () => {
  const originalWindow = globalThis.window;
  const originalUrl = globalThis.URL;
  const openedUrls: string[] = [];
  let revokedUrl = '';

  globalThis.URL = {
    ...originalUrl,
    createObjectURL: () => 'blob:https://bisora-admin.test/invoice',
    revokeObjectURL: (url: string) => {
      revokedUrl = url;
    },
  } as unknown as typeof URL;

  globalThis.window = {
    open: (url: string) => {
      openedUrls.push(url);
      return {} as Window;
    },
    setTimeout: (callback: () => void) => {
      callback();
      return 1;
    },
  } as unknown as Window & typeof globalThis;

  try {
    assert.equal(openInvoicePrintWindow(order), true);
    assert.deepEqual(openedUrls, ['blob:https://bisora-admin.test/invoice']);
    assert.equal(revokedUrl, 'blob:https://bisora-admin.test/invoice');
  } finally {
    globalThis.window = originalWindow;
    globalThis.URL = originalUrl;
  }
});
