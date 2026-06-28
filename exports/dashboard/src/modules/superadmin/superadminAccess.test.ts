import assert from 'node:assert/strict';
import { canAccessSuperadmin, getConfiguredOwnerEmail } from './superadminAccess';

assert.equal(canAccessSuperadmin('adib.hakimi19@gmail.com', 'adib.hakimi19@gmail.com'), true);
assert.equal(canAccessSuperadmin('ADIB.HAKIMI19@GMAIL.COM', 'adib.hakimi19@gmail.com'), true);
assert.equal(canAccessSuperadmin('seller@store.my', 'adib.hakimi19@gmail.com'), false);
assert.equal(canAccessSuperadmin('', 'adib.hakimi19@gmail.com'), false);
assert.equal(getConfiguredOwnerEmail({ VITE_SUPERADMIN_EMAIL: 'hakim@example.com' }), 'hakim@example.com');
assert.equal(getConfiguredOwnerEmail({}), 'adib.hakimi19@gmail.com');

console.log('superadminAccess tests passed');
