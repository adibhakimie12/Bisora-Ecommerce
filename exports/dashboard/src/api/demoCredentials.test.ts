import assert from 'node:assert/strict';
import { createOfflineDemoLoginResponse, shouldUseOfflineDemoLoginFallback, resolveLoginCredentials } from './demoCredentials';

function testDemoAccountsUseSeedPassword() {
  const credentials = resolveLoginCredentials({ email: 'adib.hakimi19@gmail.com', password: 'anything' });

  assert.deepEqual(credentials, { email: 'adib.hakimi19@gmail.com', password: 'Kimiey12.' });
}

function testNormalAccountsKeepPassword() {
  const credentials = resolveLoginCredentials({ email: 'merchant@example.test', password: 'secret-pass' });

  assert.deepEqual(credentials, { email: 'merchant@example.test', password: 'secret-pass' });
}

function testOfflineDemoOwnerCanEnterSuperadminWhenBackendIsMissing() {
  const response = createOfflineDemoLoginResponse({ email: 'adib.hakimi19@gmail.com', password: 'anything' });

  assert.equal(response?.user.email, 'adib.hakimi19@gmail.com');
  assert.equal(response?.user.is_platform_owner, true);
  assert.equal(response?.tenants[0]?.role, 'platform_owner');
}

function testOfflineDemoFallbackAcceptsApiFailures() {
  const response = createOfflineDemoLoginResponse({ email: 'adib.hakimi19@gmail.com', password: 'anything' });

  assert.equal(shouldUseOfflineDemoLoginFallback(response, new Error('API request failed')), true);
}

testDemoAccountsUseSeedPassword();
testNormalAccountsKeepPassword();
testOfflineDemoOwnerCanEnterSuperadminWhenBackendIsMissing();
testOfflineDemoFallbackAcceptsApiFailures();

console.log('demo credential tests passed');
