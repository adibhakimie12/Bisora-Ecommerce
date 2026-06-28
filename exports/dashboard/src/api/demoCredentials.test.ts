import assert from 'node:assert/strict';
import { resolveLoginCredentials } from './demoCredentials';

function testDemoAccountsUseSeedPassword() {
  const credentials = resolveLoginCredentials({ email: 'adib.hakimi19@gmail.com', password: 'anything' });

  assert.deepEqual(credentials, { email: 'adib.hakimi19@gmail.com', password: 'Kimiey12.' });
}

function testNormalAccountsKeepPassword() {
  const credentials = resolveLoginCredentials({ email: 'merchant@example.test', password: 'secret-pass' });

  assert.deepEqual(credentials, { email: 'merchant@example.test', password: 'secret-pass' });
}

testDemoAccountsUseSeedPassword();
testNormalAccountsKeepPassword();

console.log('demo credential tests passed');
