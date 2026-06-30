import test from 'node:test';
import assert from 'node:assert/strict';

import { formatOrderMoney } from './ordersFormatting';

test('formatOrderMoney renders Malaysian Ringgit for seller order values', () => {
  assert.equal(formatOrderMoney(49), 'RM 49.00');
  assert.equal(formatOrderMoney(1288.5), 'RM 1,288.50');
});
