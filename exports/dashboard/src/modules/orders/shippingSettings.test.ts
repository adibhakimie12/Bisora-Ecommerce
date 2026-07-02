import test from 'node:test';
import assert from 'node:assert/strict';

import { getCourierSettingByName, getEnabledCourierSettings } from './shippingSettings';

test('default enabled couriers come from seller courier seed', () => {
  const couriers = getEnabledCourierSettings();
  const names = couriers.map((courier) => courier.name);

  assert.ok(names.includes('J&T'));
  assert.ok(names.includes('Ninja Van'));
  assert.ok(!names.includes('POS Malaysia'));
});

test('saved store settings control which couriers are available for shipment flows', () => {
  const couriers = getEnabledCourierSettings({
    couriers: [
      {
        id: 'cp-1',
        slug: 'jt-express',
        name: 'J&T',
        status: 'Connected',
        mode: 'Live',
        enabledForRouting: false,
        setupStage: 'Live',
        trackingUrl: 'https://www.jtexpress.my/',
      },
      {
        id: 'cp-6',
        slug: 'pos-malaysia',
        name: 'POS Malaysia',
        status: 'Sandbox',
        mode: 'Test',
        enabledForRouting: true,
        setupStage: 'Ready to Connect',
        trackingUrl: 'https://www.pos.com.my/',
      },
    ],
  });

  assert.deepEqual(couriers.map((courier) => courier.name), ['POS Malaysia']);
  assert.equal(couriers[0]?.serviceTypes[0], 'Standard');
});

test('courier lookup respects saved store settings', () => {
  const settings = {
    couriers: [
      {
        id: 'cp-4',
        slug: 'ninja-van',
        name: 'Ninja Van',
        status: 'Connected',
        mode: 'Live',
        enabledForRouting: true,
        setupStage: 'Live',
        trackingUrl: 'https://www.ninjavan.co/en-my/tracking',
      },
    ],
  };

  assert.equal(getCourierSettingByName('Ninja Van', settings)?.serviceTypes[0], 'Standard');
  assert.equal(getCourierSettingByName('J&T', settings), undefined);
});
