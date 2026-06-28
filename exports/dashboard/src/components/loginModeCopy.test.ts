import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ApiError } from '../api/http';
import { getAuthErrorMessage, getLoginModeCopy, getPostAuthRoute } from './loginModeCopy';

describe('login mode copy', () => {
  test('labels the merchant creation tab as sign up instead of free trial', () => {
    assert.equal(getLoginModeCopy('trial').tabLabel, 'Sign up');
    assert.equal(getLoginModeCopy('trial').title, 'Create workspace');
  });

  test('routes new seller workspaces to store plan after signup', () => {
    assert.equal(getPostAuthRoute({ isPlatformOwner: false, mode: 'trial' }), '/store-plan');
  });

  test('keeps owner login on sign in and routes platform owner to superadmin', () => {
    assert.equal(getLoginModeCopy('login').tabLabel, 'Sign in');
    assert.equal(getLoginModeCopy('login').helperTitle, 'Owner access:');
    assert.equal(getLoginModeCopy('login').helperText, 'Use adib.hakimi19@gmail.com with password Kimiey12. Demo mode also accepts any non-empty password for this owner email.');
    assert.equal(getPostAuthRoute({ isPlatformOwner: true, mode: 'login' }), '/superadmin');
  });

  test('shows backend validation details for signup failures', () => {
    const error = new ApiError('The email has already been taken.', 422, {
      message: 'The email has already been taken.',
      errors: { email: ['The email has already been taken.'] },
    });

    assert.equal(getAuthErrorMessage('trial', error), 'The email has already been taken.');
  });

  test('keeps safe fallback for unknown signup failures', () => {
    assert.equal(
      getAuthErrorMessage('trial', new Error('Network failed')),
      'Trial signup failed. Check all fields, use a new email, and keep password 8+ characters.',
    );
  });

  test('shows clear backend offline message for login network failures', () => {
    assert.equal(
      getAuthErrorMessage('login', new TypeError('Failed to fetch')),
      'Backend offline. Start Laravel API at http://127.0.0.1:8000, then sign in again.',
    );
  });
});
