import test from 'node:test';
import assert from 'node:assert/strict';

import { getOrdersAttentionCount } from './orderNotifications';
import type { Order } from './types';

function createOrder(id: string, fulfillmentStatus: Order['fulfillmentStatus'], paymentStatus: Order['paymentStatus'] = 'Paid'): Order {
  return {
    id,
    customer: { name: 'Buyer', email: 'buyer@example.com', tag: 'Storefront customer' },
    products: 'Test Product',
    date: 'Jul 01, 2026',
    total: 49,
    paymentStatus,
    fulfillmentStatus,
    paymentMethod: 'manual_bank_transfer',
    shipment: {
      orderDate: 'Jul 01, 2026',
      courier: fulfillmentStatus === 'Unfulfilled' ? 'Not assigned' : 'J&T',
      status: fulfillmentStatus,
      trackingLocation: fulfillmentStatus === 'Unfulfilled' ? 'Awaiting seller fulfillment' : 'Tracking number saved',
      trackingNumber: fulfillmentStatus === 'Unfulfilled' ? undefined : 'EP1234567',
    },
    shippingAddress: {
      recipient: 'Buyer',
      line1: 'Jalan Gombak',
      line2: '',
      city: 'Setapak',
      country: 'Malaysia',
    },
    items: [
      {
        id: 'item-1',
        name: 'Test Product',
        sku: 'SKU-001',
        quantity: 1,
        price: 49,
        imageUrl: 'https://example.com/product.jpg',
      },
    ],
  };
}

test('getOrdersAttentionCount counts only orders needing seller action', () => {
  assert.equal(
    getOrdersAttentionCount([
      createOrder('#ORD-1', 'Unfulfilled', 'Pending'),
      createOrder('#ORD-2', 'Processing'),
      createOrder('#ORD-3', 'Shipped'),
      createOrder('#ORD-4', 'Delivered'),
    ]),
    2,
  );
});
