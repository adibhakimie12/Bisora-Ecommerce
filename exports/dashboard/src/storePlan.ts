export interface StorePlanOption {
  name: string;
  price: string;
  note: string;
  features: string[];
  active?: boolean;
}

export interface StorePlanTenant {
  plan?: string;
  billingStatus?: string;
  accessStatus?: string;
  freeAccess?: boolean;
}

interface PlanLimit {
  label: string;
  storageMb: number;
  products: number;
  pages: number;
  forms: number;
}

const planLimits: Record<string, PlanLimit> = {
  'free-trial': { label: 'Free Trial', storageMb: 250, products: 15, pages: 3, forms: 1 },
  basic: { label: 'Basic', storageMb: 500, products: 30, pages: 10, forms: 3 },
  standard: { label: 'Standard', storageMb: 2000, products: 200, pages: 30, forms: 10 },
  premium: { label: 'Premium', storageMb: 10000, products: 1000, pages: 100, forms: 30 },
};

export const storePlanUsage: string[][] = [
  ['Plan name', 'Free Trial'],
  ['Plan expiry date', '14 days after signup'],
  ['Storage used', '0.0MB / 250MB'],
  ['Products', '0 / 15'],
  ['Pages', '1 / 3'],
  ['Forms', '1 / 1'],
];

export const storePlanOptions: StorePlanOption[] = [
  {
    name: 'Free Trial',
    price: 'RM 0',
    note: 'Start testing Bisora with basic access before choosing a paid package.',
    features: ['Basic access', 'Products: 15', 'Storage: 250MB', 'Bisora managed subdomain', 'Checkout and order tracking'],
    active: true,
  },
  {
    name: 'Basic',
    price: 'RM 59',
    note: 'Kick start your brand with essential online store features.',
    features: ['Use your own domain', 'Products: 30', 'Storage: 500MB', 'Drag & Drop page builder'],
  },
  {
    name: 'Standard',
    price: 'RM 99',
    note: 'Build your business brand with a more beautiful and professional store.',
    features: ['All features in Basic', 'Products: 200', 'Storage: 2,000MB', 'Webhooks', 'Embedded checkout'],
  },
  {
    name: 'Premium',
    price: 'RM 199',
    note: 'Scale with built-in courier, marketing, and higher conversion tools.',
    features: ['All features in Standard', 'Products: 1,000', 'Storage: 10,000MB', 'Courier integration', 'Built-in SMS & Email integration'],
  },
];

function normalizePlan(plan?: string) {
  const key = String(plan ?? '').trim().toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
  if (key === 'trial' || key === 'free') return 'free-trial';
  return key in planLimits ? key : 'free-trial';
}

function formatStorageLimit(storageMb: number) {
  return `${storageMb.toLocaleString('en-US')}MB`;
}

function resolvePlanStatus(tenant: StorePlanTenant | undefined, planKey: string) {
  if (tenant?.freeAccess && planKey !== 'free-trial') {
    return `${planLimits[planKey].label} free access`;
  }

  if (tenant?.billingStatus === 'paid') return 'Paid';
  if (tenant?.billingStatus === 'trial') return planKey === 'free-trial' ? '14 days after signup' : 'Trial access';
  if (tenant?.accessStatus === 'active') return 'Active access';

  return '14 days after signup';
}

export function buildStorePlanState(tenant?: StorePlanTenant) {
  const planKey = normalizePlan(tenant?.plan);
  const plan = planLimits[planKey];

  return {
    usage: [
      ['Plan name', plan.label],
      ['Plan expiry date', resolvePlanStatus(tenant, planKey)],
      ['Storage used', `0.0MB / ${formatStorageLimit(plan.storageMb)}`],
      ['Products', `0 / ${plan.products.toLocaleString('en-US')}`],
      ['Pages', `1 / ${plan.pages}`],
      ['Forms', `1 / ${plan.forms}`],
    ],
    options: storePlanOptions.map((option) => ({
      ...option,
      active: option.name === plan.label,
    })),
  };
}
