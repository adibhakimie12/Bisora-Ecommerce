import { API_STORAGE_KEYS, type LoginResponse } from './http';

type ApiStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface AdminTenantSession {
  id: string;
  name?: string;
  slug: string;
  role?: string;
}

export interface AdminUserSession {
  id: number;
  name?: string;
  email: string;
  isPlatformOwner: boolean;
}

export interface AdminSession {
  token: string;
  activeTenantId?: string;
  user: AdminUserSession;
  tenants: AdminTenantSession[];
}

function getDefaultStorage(): ApiStorage | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage;
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function saveStoredSession(response: LoginResponse, storage: ApiStorage | undefined = getDefaultStorage()) {
  if (!storage) return;

  storage.setItem(API_STORAGE_KEYS.token, response.token);
  storage.setItem(API_STORAGE_KEYS.user, JSON.stringify(response.user));
  storage.setItem(API_STORAGE_KEYS.tenants, JSON.stringify(response.tenants));

  const activeTenant = response.tenants[0];
  if (activeTenant) {
    storage.setItem(API_STORAGE_KEYS.tenantId, String(activeTenant.id));
  }
}

export function getStoredSession(storage: ApiStorage | undefined = getDefaultStorage()): AdminSession | null {
  if (!storage) return null;

  const token = storage.getItem(API_STORAGE_KEYS.token);
  const user = parseJson<LoginResponse['user']>(storage.getItem(API_STORAGE_KEYS.user));
  const tenants = parseJson<LoginResponse['tenants']>(storage.getItem(API_STORAGE_KEYS.tenants)) ?? [];

  if (!token || !user?.email) {
    return null;
  }

  return {
    token,
    activeTenantId: storage.getItem(API_STORAGE_KEYS.tenantId) ?? undefined,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isPlatformOwner: Boolean(user.is_platform_owner),
    },
    tenants: tenants.map((tenant) => ({
      id: String(tenant.id),
      name: tenant.name,
      slug: tenant.slug,
      role: tenant.role,
    })),
  };
}

export function setActiveTenant(tenantId: string, storage: ApiStorage | undefined = getDefaultStorage()): AdminSession | null {
  const session = getStoredSession(storage);
  if (!storage || !session?.tenants.some((tenant) => tenant.id === tenantId)) {
    return null;
  }

  storage.setItem(API_STORAGE_KEYS.tenantId, tenantId);

  return getStoredSession(storage);
}

export function clearStoredSession(storage: ApiStorage | undefined = getDefaultStorage()) {
  if (!storage) return;

  storage.removeItem(API_STORAGE_KEYS.token);
  storage.removeItem(API_STORAGE_KEYS.tenantId);
  storage.removeItem(API_STORAGE_KEYS.user);
  storage.removeItem(API_STORAGE_KEYS.tenants);
}
