import assert from 'node:assert/strict';
import { navItems } from './data';

assert.equal(navItems.some((item) => item.label === 'Frontstore Preview'), false);
assert.equal(navItems.some((item) => item.href === '#/frontend'), false);
assert.equal(navItems.some((item) => item.label === 'Website Builder'), true);

console.log('data tests passed');
