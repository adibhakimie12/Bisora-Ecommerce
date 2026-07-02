import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSellerOrderNotifications,
  filterDismissedSellerNotifications,
  filterSellerNotifications,
  getOrdersAttentionCount,
  getUnreadSellerNotificationCount,
} from './orderNotifications';
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

test('buildSellerOrderNotifications creates actionable order alerts', () => {
  const notifications = buildSellerOrderNotifications([
    createOrder('#ORD-1', 'Unfulfilled', 'Pending'),
    createOrder('#ORD-2', 'Shipped', 'Paid'),
  ]);

  assert.deepEqual(
    notifications.map((notification) => [notification.id, notification.title, notification.href, notification.read]),
    [
      ['#ORD-1:new-order', 'New order needs action', '#/orders/%23ORD-1', false],
      ['#ORD-2:shipped', 'Order shipped', '#/orders/%23ORD-2', false],
      ['#ORD-2:payment-paid', 'Payment confirmed', '#/orders/%23ORD-2', false],
      ['#ORD-2:tracking-saved', 'Tracking saved', '#/orders/%23ORD-2', false],
    ],
  );
});

test('getUnreadSellerNotificationCount ignores read notifications', () => {
  const notifications = buildSellerOrderNotifications([createOrder('#ORD-1', 'Unfulfilled', 'Pending')], new Set(['#ORD-1:new-order']));

  assert.equal(getUnreadSellerNotificationCount(notifications), 0);
  assert.equal(notifications[0]?.read, true);
});

test('filterSellerNotifications can show unread alerts only', () => {
  const notifications = buildSellerOrderNotifications(
    [createOrder('#ORD-1', 'Unfulfilled', 'Pending'), createOrder('#ORD-2', 'Delivered', 'Paid')],
    new Set(['#ORD-2:delivered', '#ORD-2:payment-paid', '#ORD-2:tracking-saved']),
  );

  assert.deepEqual(
    filterSellerNotifications(notifications, 'unread').map((notification) => notification.id),
    ['#ORD-1:new-order'],
  );
  assert.equal(filterSellerNotifications(notifications, 'all').length, 4);
});

test('filterDismissedSellerNotifications hides cleared read alerts', () => {
  const notifications = buildSellerOrderNotifications([createOrder('#ORD-1', 'Shipped', 'Paid')]);

  assert.deepEqual(
    filterDismissedSellerNotifications(notifications, new Set(['#ORD-1:shipped', '#ORD-1:payment-paid'])).map((notification) => notification.id),
    ['#ORD-1:tracking-saved'],
  );
});
