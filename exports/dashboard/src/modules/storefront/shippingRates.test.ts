import test from 'node:test';
import assert from 'node:assert/strict';

import { getCheckoutShippingOptions } from './shippingRates';

test('uses Semenanjung shipping rate for Kuala Lumpur addresses', () => {
  const [option] = getCheckoutShippingOptions({
    city: 'Setapak',
    postcode: '53000',
    country: 'Malaysia',
    subtotal: 49,
  });

  assert.equal(option.zoneName, 'Semenanjung');
  assert.equal(option.amount, 6);
  assert.equal(option.courier, 'J&T EXPRESS');
});

test('uses Sabah and Sarawak shipping rate for East Malaysia addresses', () => {
  const [option] = getCheckoutShippingOptions({
    state: 'Sabah',
    country: 'Malaysia',
    subtotal: 49,
  });

  assert.equal(option.zoneName, 'Sabah & Sarawak');
  assert.equal(option.amount, 14);
});

test('applies free shipping when subtotal reaches the configured threshold', () => {
  const [option] = getCheckoutShippingOptions({
    city: 'Kuala Lumpur',
    country: 'Malaysia',
    subtotal: 160,
  });

  assert.equal(option.amount, 0);
  assert.equal(option.isFree, true);
});

test('prefers saved tenant shipping zones over seed rates', () => {
  const [option] = getCheckoutShippingOptions({
    city: 'Kuala Lumpur',
    country: 'Malaysia',
    subtotal: 49,
    settings: {
      shipping: {
        zones: [
          {
            id: 'custom-kl',
            name: 'Custom KL',
            regions: ['Kuala Lumpur'],
            methods: ['Custom Courier'],
            weightRates: [{ id: 'wr-custom', name: 'Custom Courier Same Day', range: '0.10kg - 5.00kg', rate: 'MYR8.00' }],
            priceRates: [],
          },
        ],
      },
    },
  });

  assert.equal(option.zoneName, 'Custom KL');
  assert.equal(option.amount, 8);
  assert.equal(option.courier, 'Custom Courier Same Day');
});
