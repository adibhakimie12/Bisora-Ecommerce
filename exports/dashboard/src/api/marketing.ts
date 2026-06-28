import { createApiClient, type ApiClientOptions } from './http';
import type {
  AbandonedCheckout,
  AutomationRule,
  BroadcastCampaign,
  DiscountCampaign,
  UpsellOffer,
} from '../modules/marketing/types';

export type MarketingCollection = 'discounts' | 'upsells' | 'recovery' | 'broadcasts' | 'automation-rules';

interface ApiMarketingWorkspace {
  initialized?: boolean;
  discounts?: DiscountCampaign[];
  upsells?: UpsellOffer[];
  recovery?: AbandonedCheckout[];
  broadcasts?: BroadcastCampaign[];
  automation_rules?: AutomationRule[];
}

export interface MarketingWorkspace {
  initialized: boolean;
  discounts: DiscountCampaign[];
  upsells: UpsellOffer[];
  recovery: AbandonedCheckout[];
  broadcasts: BroadcastCampaign[];
  automationRules: AutomationRule[];
}

function mapMarketingWorkspace(payload: ApiMarketingWorkspace): MarketingWorkspace {
  return {
    initialized: Boolean(payload.initialized),
    discounts: payload.discounts ?? [],
    upsells: payload.upsells ?? [],
    recovery: payload.recovery ?? [],
    broadcasts: payload.broadcasts ?? [],
    automationRules: payload.automation_rules ?? [],
  };
}

export async function fetchMarketingWorkspace(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiMarketingWorkspace }>('/marketing');

  return mapMarketingWorkspace(response.data);
}

export async function saveMarketingCollection<T>(collection: MarketingCollection, items: T[], options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiMarketingWorkspace }>(`/marketing/${collection}`, {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  });

  return mapMarketingWorkspace(response.data);
}

export async function queueBroadcast(broadcastId: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);

  return client.request<{ queued: number }>(`/marketing/broadcasts/${encodeURIComponent(broadcastId)}/queue`, {
    method: 'POST',
  });
}

export async function queueRecoveryReminder(checkoutId: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiMarketingWorkspace }>(`/marketing/recovery/${encodeURIComponent(checkoutId)}/remind`, {
    method: 'POST',
  });

  return mapMarketingWorkspace(response.data);
}
