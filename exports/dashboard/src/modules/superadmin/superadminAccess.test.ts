import assert from 'node:assert/strict';
import { canAccessSuperadmin, getConfiguredOwnerEmail } from './superadminAccess';

assert.equal(canAccessSuperadmin('owner@bisora.my', 'owner@bisora.my'), true);
assert.equal(canAccessSuperadmin('OWNER@BISORA.MY', 'owner@bisora.my'), true);
assert.equal(canAccessSuperadmin('seller@store.my', 'owner@bisora.my'), false);
assert.equal(canAccessSuperadmin('', 'owner@bisora.my'), false);
assert.equal(getConfiguredOwnerEmail({ VITE_SUPERADMIN_EMAIL: 'hakim@example.com' }), 'hakim@example.com');
assert.equal(getConfiguredOwnerEmail({}), 'owner@bisora.my');

console.log('superadminAccess tests passed');
