import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPublicOrderTrackingModel, shouldShowOrderTrackingPage } from './publicOrderTracking';
import type { PublicOrder } from '../../api/storefront';

function order(overrides: Partial<PublicOrder> = {}): PublicOrder {
  return {
    id: '#ORD-260630-225331530',
    number: 'ORD-260630-225331530',
    total: 49,
    paymentStatus: 'paid',
    settlementStatus: 'processing',
    fulfillmentStatus: 'shipped',
    paymentMethod: 'manual_bank_transfer',
    items: [{ name: 'Comfy', sku: 'NEW-SKU-001', quantity: 1, price: 49 }],
    shipment: {
      courier: 'J&T',
      trackingNumber: 'ep1234567',
      trackingLocation: 'Tracking number saved',
    },
    shippingAddress: {
      recipient: 'ahmad',
      city: 'setapak',
      country: 'Malaysia',
    },
    customer: {
      id: 'test@123',
      name: 'ahmad',
      email: 'test@123',
      status: 'Storefront customer',
    },
    ...overrides,
  };
}

test('shouldShowOrderTrackingPage routes order links before product/homepage views', () => {
  assert.equal(shouldShowOrderTrackingPage('ORD-260630-225331530'), true);
  assert.equal(shouldShowOrderTrackingPage(undefined), false);
});

test('buildPublicOrderTrackingModel marks paid shipped orders through shipped step', () => {
  const model = buildPublicOrderTrackingModel(order(), {
    currency: 'MYR',
    storeSlug: 'byshayl',
  });

  assert.equal(model.totalLabel, 'RM 49.00');
  assert.equal(model.backToStoreHref, '#/store/byshayl');
  assert.deepEqual(
    model.steps.map((step) => [step.label, step.active]),
    [
      ['Order received', true],
      ['Payment paid', true],
      ['Processing', true],
      ['Shipped', true],
      ['Delivered', false],
    ],
  );
});

test('buildPublicOrderTrackingModel exposes courier tracking and address map links', () => {
  const model = buildPublicOrderTrackingModel(order(), {
    currency: 'MYR',
    storeSlug: 'byshayl',
  });

  assert.equal(model.shipmentLabel, 'J&T tracking ep1234567');
  assert.equal(model.trackingUrl, 'https://www.google.com/search?q=J%26T%20tracking%20ep1234567');
  assert.equal(model.mapUrl, 'https://www.google.com/maps/search/?api=1&query=ahmad%2C%20setapak%2C%20Malaysia');
});
