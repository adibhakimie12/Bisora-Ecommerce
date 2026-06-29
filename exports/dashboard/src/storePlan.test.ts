import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { buildStorePlanState, storePlanOptions, storePlanUsage } from './storePlan';

describe('store plan options', () => {
  test('shows free trial as the current basic access package before paid plans', () => {
    assert.equal(storePlanUsage[0][1], 'Free Trial');
    assert.equal(storePlanOptions[0].name, 'Free Trial');
    assert.equal(storePlanOptions[0].price, 'RM 0');
    assert.equal(storePlanOptions[0].active, true);
    assert.ok(storePlanOptions[0].features.includes('Basic access'));
    assert.deepEqual(storePlanOptions.slice(1).map((plan) => plan.name), ['Basic', 'Standard', 'Premium']);
  });
});

describe('store plan state', () => {
  test('marks the granted tenant package as the current plan', () => {
    const state = buildStorePlanState({
      plan: 'premium',
      billingStatus: 'trial',
      accessStatus: 'active',
      freeAccess: true,
    });

    assert.equal(state.usage[0][1], 'Premium');
    assert.equal(state.usage[1][1], 'Premium free access');
    assert.equal(state.usage[2][1], '0.0MB / 10,000MB');
    assert.equal(state.usage[3][1], '0 / 1,000');
    assert.equal(state.options.find((plan) => plan.active)?.name, 'Premium');
  });
});
