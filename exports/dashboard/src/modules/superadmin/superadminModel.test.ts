import assert from 'node:assert/strict';
import {
  applyPackageDiscount,
  canTerminateTenant,
  defaultSubscriptionPackages,
  grantFreeAccess,
  getGatewayConnectionState,
  getTenantAccessState,
  getTenantBillingRisk,
  type TenantAccount,
  type SubscriptionPackage,
} from './superadminModel';

const activeTenant: TenantAccount = {
  id: 'tenant-active',
  brandName: 'Active Store',
  ownerName: 'Aina Owner',
  packageName: 'Growth',
  monthlyFee: 299,
  billingStatus: 'Paid',
  accessStatus: 'Active',
  daysOverdue: 0,
};

const overdueTenant: TenantAccount = {
  ...activeTenant,
  id: 'tenant-overdue',
  billingStatus: 'Overdue',
  accessStatus: 'Active',
  daysOverdue: 17,
};

assert.equal(getTenantAccessState(activeTenant), 'Active access');
assert.equal(getTenantAccessState({ ...activeTenant, accessStatus: 'Suspended' }), 'Suspended by owner');
assert.equal(getTenantAccessState({ ...activeTenant, accessStatus: 'Terminated' }), 'Terminated');
assert.equal(getTenantBillingRisk(activeTenant), 'Low');
assert.equal(getTenantBillingRisk(overdueTenant), 'High');
assert.equal(canTerminateTenant(activeTenant), true);
assert.equal(canTerminateTenant({ ...activeTenant, accessStatus: 'Terminated' }), false);

const freeTenant = grantFreeAccess(activeTenant, 'owner@bisora.my', 'Pro');
assert.equal(freeTenant.billingStatus, 'Trial');
assert.equal(freeTenant.packageName, 'Pro');
assert.equal(freeTenant.accessStatus, 'Active');
assert.equal(freeTenant.ownerEmail, 'owner@bisora.my');
assert.equal(freeTenant.monthlyFee, 0);
assert.equal(freeTenant.freeAccess, true);

const growthPackage: SubscriptionPackage = {
  id: 'growth',
  name: 'Growth',
  monthlyFee: 299,
  discountPercent: 0,
  features: ['Advanced builder'],
};

assert.equal(applyPackageDiscount(growthPackage, 20).monthlyFee, 239.2);
assert.equal(applyPackageDiscount(growthPackage, 150).discountPercent, 100);
assert.deepEqual(defaultSubscriptionPackages.map((item) => item.name), ['Free Trial', 'Basic', 'Standard', 'Premium']);
assert.equal(defaultSubscriptionPackages[0].monthlyFee, 0);
assert.ok(defaultSubscriptionPackages[0].features.includes('Basic access'));

assert.equal(
  getGatewayConnectionState({
    id: 'billplz',
    provider: 'Billplz',
    mode: 'Live',
    enabled: true,
    merchantId: 'BISORA',
    apiKey: 'key_live',
    secretKey: 'secret_live',
    webhookUrl: 'https://bisora.app/webhooks/billplz',
  }),
  'Ready for live billing',
);
assert.equal(
  getGatewayConnectionState({
    id: 'securepay',
    provider: 'SecurePay',
    mode: 'Test',
    enabled: true,
    merchantId: '',
    apiKey: '',
    secretKey: '',
    webhookUrl: '',
  }),
  'Missing credentials',
);

console.log('superadminModel tests passed');
