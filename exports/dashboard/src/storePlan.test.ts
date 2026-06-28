import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { storePlanOptions, storePlanUsage } from './storePlan';

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
