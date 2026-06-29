import { API_STORAGE_KEYS } from './api/http';

type SessionStorageLike = Pick<Storage, 'getItem'>;

function getBrowserStorage(): SessionStorageLike | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage;
}

export function hasLiveTenantSession(storage: SessionStorageLike | undefined = getBrowserStorage()) {
  return Boolean(storage?.getItem(API_STORAGE_KEYS.token) && storage?.getItem(API_STORAGE_KEYS.tenantId));
}

export function shouldUseDemoData(storage: SessionStorageLike | undefined = getBrowserStorage()) {
  return !hasLiveTenantSession(storage);
}
