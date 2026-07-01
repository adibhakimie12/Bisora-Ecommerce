import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildShippingAddressMapUrl,
  getNextOpenOrderMenu,
  getShippedActionState,
  isPendingFulfillment,
} from './orderDetailActions';

test('getNextOpenOrderMenu keeps only one order detail menu open at a time', () => {
  assert.equal(getNextOpenOrderMenu('invoice', undefined), 'invoice');
  assert.equal(getNextOpenOrderMenu('more', 'invoice'), 'more');
  assert.equal(getNextOpenOrderMenu('more', 'more'), undefined);
});

test('getShippedActionState disables shipped action after order is shipped', () => {
  assert.deepEqual(getShippedActionState('Processing'), {
    label: 'Mark Shipped',
    disabled: false,
  });
  assert.deepEqual(getShippedActionState('Shipped'), {
    label: 'Already shipped',
    disabled: true,
  });
});

test('isPendingFulfillment only counts orders that still need seller shipment work', () => {
  assert.equal(isPendingFulfillment('Unfulfilled'), true);
  assert.equal(isPendingFulfillment('Processing'), true);
  assert.equal(isPendingFulfillment('Shipped'), false);
  assert.equal(isPendingFulfillment('Delivered'), false);
});

test('buildShippingAddressMapUrl opens a Google Maps search for buyer address', () => {
  assert.equal(
    buildShippingAddressMapUrl({
      recipient: 'Ahmad',
      line1: 'jaln gombak',
      line2: '',
      city: 'setapak',
      country: 'Malaysia',
    }),
    'https://www.google.com/maps/search/?api=1&query=jaln%20gombak%2C%20setapak%2C%20Malaysia',
  );
});
