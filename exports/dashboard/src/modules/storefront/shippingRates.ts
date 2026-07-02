import { shippingZonesSeed } from '../settings/data';

export interface CheckoutShippingOption {
  id: string;
  zoneName: string;
  label: string;
  courier: string;
  service: string;
  amount: number;
  isFree: boolean;
  helper: string;
}

export interface CheckoutShippingInput {
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  subtotal: number;
}

const stateAliases: Record<string, string> = {
  kl: 'kuala lumpur',
  'wp kuala lumpur': 'kuala lumpur',
  'wilayah persekutuan': 'kuala lumpur',
  pj: 'selangor',
  petaling: 'selangor',
  gombak: 'selangor',
  setapak: 'kuala lumpur',
  shahalam: 'selangor',
  'shah alam': 'selangor',
  penang: 'pulau pinang',
};

function normalize(value = '') {
  return value.trim().toLowerCase();
}

function parseMoney(value: string) {
  const amount = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

function parseMinimumSubtotal(range: string) {
  const [minimum] = range.split('-');
  return parseMoney(minimum);
}

function getCourierName(method: string) {
  const match = method.match(/^([^()]+)/);
  return (match?.[1] ?? method).trim();
}

function resolveRegion(input: CheckoutShippingInput) {
  const haystack = [input.state, input.city, input.postcode].map(normalize).filter(Boolean);
  const expanded = haystack.flatMap((part) => [part, stateAliases[part]].filter(Boolean));

  const matchedZone = shippingZonesSeed.find((zone) =>
    zone.regions.some((region) => expanded.includes(normalize(region))),
  );

  return matchedZone ?? shippingZonesSeed[0];
}

export function getCheckoutShippingOptions(input: CheckoutShippingInput): CheckoutShippingOption[] {
  const country = normalize(input.country || 'Malaysia');
  if (country && country !== 'malaysia') {
    return [{
      id: 'manual-international',
      zoneName: 'International',
      label: 'Manual shipping quote',
      courier: 'Manual',
      service: 'International quote',
      amount: 0,
      isFree: false,
      helper: 'Seller will confirm international shipping manually.',
    }];
  }

  const zone = resolveRegion(input);
  const baseRate = zone.weightRates[0];
  const freeRate = zone.priceRates.find((rate) => rate.rate.toUpperCase() === 'FREE' && input.subtotal >= parseMinimumSubtotal(rate.range));
  const amount = freeRate ? 0 : parseMoney(baseRate?.rate ?? 'MYR0.00');
  const label = freeRate ? `${baseRate?.name ?? zone.methods[0]} - Free shipping` : (baseRate?.name ?? zone.methods[0] ?? 'Standard delivery');

  return [{
    id: `${zone.id}-${freeRate ? 'free' : baseRate?.id ?? 'standard'}`,
    zoneName: zone.name,
    label,
    courier: getCourierName(baseRate?.name ?? zone.methods[0] ?? 'Standard Delivery'),
    service: baseRate?.name ?? zone.methods[0] ?? 'Standard Delivery',
    amount,
    isFree: Boolean(freeRate),
    helper: freeRate
      ? `Free shipping applied for ${zone.name}.`
      : `${zone.name} rate based on current shipping setup.`,
  }];
}

export function formatShippingMoney(currency: string, amount: number) {
  const prefix = currency.toUpperCase() === 'MYR' ? 'RM' : currency.toUpperCase();
  return `${prefix} ${amount.toFixed(2)}`;
}
