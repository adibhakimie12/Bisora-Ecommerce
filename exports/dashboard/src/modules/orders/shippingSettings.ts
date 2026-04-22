export interface CourierSetting {
  id: string;
  name: string;
  enabled: boolean;
  serviceTypes: string[];
}

// Mock source for seller courier settings.
// Backend integration can replace this array with API response later.
const courierSettings: CourierSetting[] = [
  {
    id: 'dhl-express',
    name: 'DHL Express',
    enabled: true,
    serviceTypes: ['Next Day Air', 'Express Worldwide'],
  },
  {
    id: 'jt',
    name: 'J&T',
    enabled: true,
    serviceTypes: ['Standard', 'Express'],
  },
  {
    id: 'pos-laju',
    name: 'Pos Laju',
    enabled: false,
    serviceTypes: ['Standard'],
  },
];

export function getEnabledCourierSettings() {
  return courierSettings.filter((courier) => courier.enabled);
}

export function getCourierSettingByName(courierName: string) {
  return getEnabledCourierSettings().find((courier) => courier.name === courierName);
}
