import { courierProvidersSeed } from '../settings/data';
import type { CourierProvider } from '../settings/types';

export interface CourierSetting {
  id: string;
  name: string;
  enabled: boolean;
  serviceTypes: string[];
  status?: string;
  mode?: string;
  trackingUrl?: string;
}

const serviceTypesByCourier: Record<string, string[]> = {
  'J&T': ['Standard', 'Express'],
  'DHL eCommerce': ['Standard', 'Economy'],
  'DHL Express': ['Next Day Air', 'Express Worldwide'],
  'Ninja Van': ['Standard', 'Pickup'],
  'Ninja Van International': ['International Standard'],
  'POS Malaysia': ['Standard'],
  GDEX: ['Standard'],
  Aramex: ['International Priority'],
};

function isRouteReady(courier: Pick<CourierProvider, 'enabledForRouting' | 'setupStage' | 'status'>) {
  return courier.enabledForRouting && (courier.setupStage === 'Ready to Connect' || courier.setupStage === 'Live' || courier.status === 'Connected');
}

function normalizeCourier(courier: CourierProvider): CourierSetting {
  return {
    id: courier.slug,
    name: courier.name,
    enabled: isRouteReady(courier),
    serviceTypes: serviceTypesByCourier[courier.name] ?? ['Standard'],
    status: courier.status,
    mode: courier.mode,
    trackingUrl: courier.trackingUrl,
  };
}

function getCourierSource(settings?: Record<string, any>) {
  return Array.isArray(settings?.couriers) && settings.couriers.length > 0
    ? settings.couriers as CourierProvider[]
    : courierProvidersSeed;
}

export function buildCourierSettingsFromStoreSettings(settings?: Record<string, any>): CourierSetting[] {
  return getCourierSource(settings).map(normalizeCourier);
}

export function getEnabledCourierSettings(settings?: Record<string, any>) {
  return buildCourierSettingsFromStoreSettings(settings).filter((courier) => courier.enabled);
}

export function getCourierSettingByName(courierName: string, settings?: Record<string, any>) {
  return getEnabledCourierSettings(settings).find((courier) => courier.name === courierName);
}
