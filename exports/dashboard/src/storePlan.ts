export interface StorePlanOption {
  name: string;
  price: string;
  note: string;
  features: string[];
  active?: boolean;
}

export const storePlanUsage = [
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
