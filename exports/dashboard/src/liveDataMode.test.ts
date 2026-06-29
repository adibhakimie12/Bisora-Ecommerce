import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldUseDemoData } from './liveDataMode';

class FakeStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

test('shouldUseDemoData disables bundled records for authenticated tenant sessions', () => {
  const storage = new FakeStorage();
  storage.setItem('bisora.apiToken', 'token-123');
  storage.setItem('bisora.tenantId', '77');

  assert.equal(shouldUseDemoData(storage), false);
});

test('shouldUseDemoData keeps bundled records before live credentials exist', () => {
  assert.equal(shouldUseDemoData(new FakeStorage()), true);
});
