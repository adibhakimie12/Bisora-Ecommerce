import { createApiClient, type ApiClientOptions } from './http';

export interface ApiStoreSettings {
  id: number | string;
  tenant_id: number | string;
  name: string;
  slug: string;
  managed_domain?: string | null;
  custom_domain?: string | null;
  currency: string;
  timezone: string;
  settings: Record<string, any>;
}

export interface StoreSettings {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  managedDomain: string;
  customDomain: string;
  currency: string;
  timezone: string;
  settings: Record<string, any>;
}

export interface StoreSettingsPatch {
  name?: string;
  slug?: string;
  managedDomain?: string;
  customDomain?: string | null;
  currency?: string;
  timezone?: string;
  settings?: Record<string, any>;
}

export function mapStoreSettingsFromApi(payload: ApiStoreSettings): StoreSettings {
  return {
    id: String(payload.id),
    tenantId: String(payload.tenant_id),
    name: payload.name,
    slug: payload.slug,
    managedDomain: payload.managed_domain ?? '',
    customDomain: payload.custom_domain ?? '',
    currency: payload.currency,
    timezone: payload.timezone,
    settings: payload.settings ?? {},
  };
}

function toApiPatch(patch: StoreSettingsPatch) {
  return {
    name: patch.name,
    slug: patch.slug,
    managed_domain: patch.managedDomain,
    custom_domain: patch.customDomain,
    currency: patch.currency,
    timezone: patch.timezone,
    settings: patch.settings,
  };
}

export async function fetchStoreSettings(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiStoreSettings }>('/settings/store');

  return mapStoreSettingsFromApi(response.data);
}

export async function saveStoreSettings(patch: StoreSettingsPatch, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiStoreSettings }>('/settings/store', {
    method: 'PATCH',
    body: JSON.stringify(toApiPatch(patch)),
  });

  return mapStoreSettingsFromApi(response.data);
}

export async function publishStorefront(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiStoreSettings }>('/settings/store/publish', {
    method: 'POST',
  });

  return mapStoreSettingsFromApi(response.data);
}

export async function unpublishStorefront(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiStoreSettings }>('/settings/store/unpublish', {
    method: 'POST',
  });

  return mapStoreSettingsFromApi(response.data);
}
