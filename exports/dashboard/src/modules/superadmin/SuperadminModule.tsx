import { useEffect, useMemo, useState } from 'react';
import { Ban, RotateCcw, XCircle } from 'lucide-react';
import { API_STORAGE_KEYS } from '../../api/http';
import {
  fetchGateways,
  fetchPackages,
  fetchTenants,
  grantTenantFreeAccess as grantTenantFreeAccessApi,
  saveGateway,
  savePackage,
  updateTenantAccess as updateTenantAccessApi,
} from '../../api/superadmin';
import {
  applyPackageDiscount,
  canTerminateTenant,
  grantFreeAccess,
  getGatewayConnectionState,
  getTenantAccessState,
  getTenantBillingRisk,
  type TenantAccessStatus,
  type TenantAccount,
  type PlatformGatewayConfig,
  type SubscriptionPackage,
} from './superadminModel';

type SuperadminSection = 'overview' | 'tenants' | 'packages' | 'integrations' | 'access';

const tabs: Array<{ key: SuperadminSection; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'tenants', label: 'Stores' },
  { key: 'packages', label: 'Packages' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'access', label: 'Access Control' },
];

function hasApiToken() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem(API_STORAGE_KEYS.token));
}

export function SuperadminModule({ section }: { section?: string }) {
  const activeSection = normalizeSection(section);
  const [tenants, setTenants] = useState<TenantAccount[]>([
    {
      id: 'store-bisora-demo',
      brandName: 'Bisora Demo Store',
      ownerName: 'Sarah Admin',
      ownerEmail: 'sarah@bisora.my',
      packageName: 'Growth',
      monthlyFee: 299,
      billingStatus: 'Paid',
      accessStatus: 'Active',
      daysOverdue: 0,
    },
    {
      id: 'store-nur-atelier',
      brandName: 'Nur Atelier',
      ownerName: 'Aina Rahman',
      ownerEmail: 'aina@nuratelier.my',
      packageName: 'Starter',
      monthlyFee: 99,
      billingStatus: 'Overdue',
      accessStatus: 'Active',
      daysOverdue: 8,
    },
    {
      id: 'store-legacy-shop',
      brandName: 'Legacy Shop',
      ownerName: 'Hakim Owner',
      ownerEmail: 'hakim@legacyshop.my',
      packageName: 'Pro',
      monthlyFee: 499,
      billingStatus: 'Failed',
      accessStatus: 'Suspended',
      daysOverdue: 19,
    },
  ]);

  useEffect(() => {
    if (!hasApiToken()) return;

    fetchTenants()
      .then((items) => {
        if (items.length > 0) {
          setTenants(items);
        }
      })
      .catch(() => {
        // Keep demo data usable when backend credentials are not ready.
      });
  }, []);

  const totals = useMemo(() => {
    const active = tenants.filter((tenant) => tenant.accessStatus === 'Active').length;
    const suspended = tenants.filter((tenant) => tenant.accessStatus === 'Suspended').length;
    const mrr = tenants
      .filter((tenant) => tenant.accessStatus !== 'Terminated')
      .reduce((sum, tenant) => sum + tenant.monthlyFee, 0);

    return { active, suspended, mrr };
  }, [tenants]);

  const updateTenantAccess = (tenantId: string, accessStatus: TenantAccessStatus) => {
    setTenants((current) =>
      current.map((tenant) =>
        tenant.id === tenantId
          ? {
              ...tenant,
              accessStatus,
            }
          : tenant,
      ),
    );

    if (hasApiToken()) {
      updateTenantAccessApi(tenantId, accessStatus)
        .then((updatedTenant) => {
          setTenants((current) => current.map((tenant) => (tenant.id === tenantId ? updatedTenant : tenant)));
        })
        .catch(() => {
          // Optimistic state remains; next load will reconcile with backend.
        });
    }
  };

  const grantTenantFreeAccess = (tenantId: string, ownerEmail: string, packageName: string) => {
    setTenants((current) =>
      current.map((tenant) => (tenant.id === tenantId ? grantFreeAccess(tenant, ownerEmail, packageName) : tenant)),
    );

    if (hasApiToken()) {
      grantTenantFreeAccessApi(tenantId, ownerEmail, packageName)
        .then((updatedTenant) => {
          setTenants((current) => current.map((tenant) => (tenant.id === tenantId ? updatedTenant : tenant)));
        })
        .catch(() => {
          // Optimistic state remains; next load will reconcile with backend.
        });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Owner Console</p>
            <h1 className="mt-2 text-3xl font-semibold text-on-surface">Superadmin</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
              Control tenant access, packages, subscription payment status, and platform-level gateway setup. This is the owner layer, not the seller dashboard.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Active Stores" value={`${totals.active}`} />
            <StatCard label="Suspended" value={`${totals.suspended}`} />
            <StatCard label="Monthly Revenue" value={`MYR ${totals.mrr}`} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/20 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <a
              key={tab.key}
              href={`#/superadmin/${tab.key}`}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                tab.key === activeSection ? 'bg-primary text-on-primary' : 'bg-surface-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </section>

      {(activeSection === 'overview' || activeSection === 'tenants' || activeSection === 'access') && (
        <TenantAccessPanel tenants={tenants} onUpdateAccess={updateTenantAccess} onGrantFreeAccess={grantTenantFreeAccess} />
      )}
      {activeSection === 'packages' && <PackagesPanel />}
      {activeSection === 'integrations' && <IntegrationsPanel />}
    </div>
  );
}

function TenantAccessPanel({
  tenants,
  onUpdateAccess,
  onGrantFreeAccess,
}: {
  tenants: TenantAccount[];
  onUpdateAccess: (tenantId: string, accessStatus: TenantAccessStatus) => void;
  onGrantFreeAccess: (tenantId: string, ownerEmail: string, packageName: string) => void;
}) {
  const [freeAccessEmail, setFreeAccessEmail] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState(tenants[0]?.id ?? '');
  const [selectedPackageName, setSelectedPackageName] = useState('Growth');

  return (
    <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-on-surface-variant">Stores</p>
          <h2 className="mt-2 text-2xl font-semibold text-on-surface">Tenant access control</h2>
        </div>
        <span className="rounded-full bg-surface-low px-3 py-1 text-xs text-on-surface-variant">Owner only</span>
      </div>

      <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
        <p className="text-sm font-medium text-on-surface">Grant free access by email</p>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          Use this when you want a tenant to login with email only and access the platform without monthly billing.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <select
            value={selectedTenantId}
            onChange={(event) => setSelectedTenantId(event.target.value)}
            className="rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.brandName} - {tenant.packageName}
              </option>
            ))}
          </select>
          <input
            value={freeAccessEmail}
            onChange={(event) => setFreeAccessEmail(event.target.value)}
            placeholder="owner@email.com"
            className="rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <select
            value={selectedPackageName}
            onChange={(event) => setSelectedPackageName(event.target.value)}
            className="rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          >
            <option value="Starter">Starter</option>
            <option value="Growth">Growth</option>
            <option value="Pro">Pro</option>
          </select>
          <button
            type="button"
            onClick={() => {
              if (!selectedTenantId || !freeAccessEmail.trim()) return;
              onGrantFreeAccess(selectedTenantId, freeAccessEmail.trim(), selectedPackageName);
              setFreeAccessEmail('');
            }}
            className="rounded-2xl bg-primary px-4 py-3 text-sm text-on-primary transition-colors hover:bg-primary-dim"
          >
            Give Free Access
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-outline-variant/20">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.8fr_1fr] gap-4 bg-surface-low px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant">
          <span>Store</span>
          <span>Package</span>
          <span>Billing</span>
          <span>Access</span>
          <span>Owner Actions</span>
        </div>
        {tenants.map((tenant) => (
          <div key={tenant.id} className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.8fr_1fr] gap-4 border-t border-outline-variant/20 px-4 py-4 text-sm">
            <div>
              <p className="font-medium text-on-surface">{tenant.brandName}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{tenant.ownerName}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{tenant.ownerEmail}</p>
            </div>
            <div>
              <p className="font-medium text-on-surface">{tenant.packageName}</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {tenant.freeAccess ? 'Free access' : `MYR ${tenant.monthlyFee}/mo`}
              </p>
            </div>
            <StatusPill label={tenant.billingStatus} tone={getTenantBillingRisk(tenant)} />
            <StatusPill label={getTenantAccessState(tenant)} tone={tenant.accessStatus === 'Active' ? 'Low' : tenant.accessStatus === 'Suspended' ? 'Medium' : 'High'} />
            <div className="flex flex-wrap gap-2">
              <ActionButton label="Suspend" icon={<Ban className="h-3.5 w-3.5" />} onClick={() => onUpdateAccess(tenant.id, 'Suspended')} disabled={tenant.accessStatus !== 'Active'} />
              <ActionButton label="Restore" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => onUpdateAccess(tenant.id, 'Active')} disabled={tenant.accessStatus === 'Active' || tenant.accessStatus === 'Terminated'} />
              <ActionButton label="Terminate" icon={<XCircle className="h-3.5 w-3.5" />} onClick={() => onUpdateAccess(tenant.id, 'Terminated')} disabled={!canTerminateTenant(tenant)} danger />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PackagesPanel() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([
    { id: 'starter', name: 'Starter', monthlyFee: 99, discountPercent: 0, features: ['Basic store', 'Standard support', 'Starter builder access'] },
    { id: 'growth', name: 'Growth', monthlyFee: 299, discountPercent: 0, features: ['Automation', 'Campaigns', 'Advanced builder'] },
    { id: 'pro', name: 'Pro', monthlyFee: 499, discountPercent: 0, features: ['Team access', 'Custom gateway support', 'Higher sales volume'] },
  ]);

  useEffect(() => {
    if (!hasApiToken()) return;

    fetchPackages()
      .then((items) => {
        if (items.length > 0) {
          setPackages(items);
        }
      })
      .catch(() => {
        // Local package controls remain editable without backend access.
      });
  }, []);

  const updatePackage = (packageId: string, patch: Partial<SubscriptionPackage>) => {
    setPackages((current) =>
      current.map((item) => (item.id === packageId ? { ...item, ...patch } : item)),
    );
  };

  const persistPackage = (subscriptionPackage: SubscriptionPackage) => {
    if (!hasApiToken()) return;

    savePackage(subscriptionPackage)
      .then((savedPackage) => {
        setPackages((current) => current.map((item) => (item.id === subscriptionPackage.id ? savedPackage : item)));
      })
      .catch(() => {
        // Keep editable state; backend validation can be surfaced in a later toast layer.
      });
  };

  return (
    <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-on-surface-variant">Packages</p>
      <h2 className="mt-2 text-2xl font-semibold text-on-surface">Subscription package control</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {packages.map((item) => (
          <div key={item.id} className="rounded-2xl border border-outline-variant/20 bg-surface-low p-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">Package Name</span>
              <input
                value={item.name}
                onChange={(event) => updatePackage(item.id, { name: event.target.value })}
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-on-surface">Monthly Fee</span>
                <input
                  type="number"
                  value={item.monthlyFee}
                  onChange={(event) => updatePackage(item.id, { monthlyFee: Number(event.target.value) })}
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-on-surface">Discount %</span>
                <input
                  type="number"
                  value={item.discountPercent}
                  onChange={(event) =>
                    setPackages((current) =>
                      current.map((packageItem) =>
                        packageItem.id === item.id ? applyPackageDiscount(packageItem, Number(event.target.value)) : packageItem,
                      ),
                    )
                  }
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
            <p className="mt-4 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-primary shadow-sm">
              Final price: MYR {item.monthlyFee}/mo
            </p>
            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-on-surface">Features</span>
              <textarea
                rows={4}
                value={item.features.join('\n')}
                onChange={(event) => updatePackage(item.id, { features: event.target.value.split('\n').filter(Boolean) })}
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <button
              type="button"
              onClick={() => persistPackage(item)}
              className="mt-4 rounded-full bg-primary px-4 py-2 text-sm text-on-primary transition-colors hover:bg-primary-dim"
            >
              Save Package
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function IntegrationsPanel() {
  const [gateways, setGateways] = useState<PlatformGatewayConfig[]>([
    {
      id: 'billplz',
      provider: 'Billplz',
      mode: 'Test',
      enabled: true,
      merchantId: '',
      apiKey: '',
      secretKey: '',
      webhookUrl: 'https://admin.bisora.app/webhooks/platform/billplz',
    },
    {
      id: 'securepay',
      provider: 'SecurePay',
      mode: 'Test',
      enabled: false,
      merchantId: '',
      apiKey: '',
      secretKey: '',
      webhookUrl: 'https://admin.bisora.app/webhooks/platform/securepay',
    },
    {
      id: 'toyyibpay',
      provider: 'ToyyibPay',
      mode: 'Test',
      enabled: false,
      merchantId: '',
      apiKey: '',
      secretKey: '',
      webhookUrl: 'https://admin.bisora.app/webhooks/platform/toyyibpay',
    },
    {
      id: 'stripe',
      provider: 'Stripe',
      mode: 'Test',
      enabled: false,
      merchantId: '',
      apiKey: '',
      secretKey: '',
      webhookUrl: 'https://admin.bisora.app/webhooks/platform/stripe',
    },
  ]);

  useEffect(() => {
    if (!hasApiToken()) return;

    fetchGateways()
      .then((items) => {
        if (items.length > 0) {
          setGateways(items);
        }
      })
      .catch(() => {
        // Keep local gateway drafts visible without backend access.
      });
  }, []);

  const updateGateway = (gatewayId: string, patch: Partial<PlatformGatewayConfig>) => {
    setGateways((current) =>
      current.map((gateway) => (gateway.id === gatewayId ? { ...gateway, ...patch } : gateway)),
    );
  };

  const persistGateway = (gateway: PlatformGatewayConfig) => {
    if (!hasApiToken()) return;

    saveGateway(gateway)
      .then((savedGateway) => {
        setGateways((current) => current.map((item) => (item.id === gateway.id ? savedGateway : item)));
      })
      .catch(() => {
        // Keep editable state; backend validation can be surfaced in a later toast layer.
      });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">Integrations</p>
        <h2 className="mt-2 text-2xl font-semibold text-on-surface">Platform payment gateway setup</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
          This is Superadmin billing integration for Bisora SaaS subscriptions, package payments, trial-to-paid upgrades, and tenant invoices. Seller storefront payment gateways are separate and belong inside each seller account settings.
        </p>
      </section>

      <section className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5 shadow-sm">
        <p className="text-sm font-medium text-amber-900">Important separation</p>
        <div className="mt-3 grid gap-4 text-sm leading-6 text-amber-800 lg:grid-cols-2">
          <div>
            <p className="font-medium text-amber-900">Superadmin gateway</p>
            <p>Used when you collect monthly SaaS package payment from store owners.</p>
          </div>
          <div>
            <p className="font-medium text-amber-900">Seller gateway</p>
            <p>Used when seller collects money from their customers inside their storefront checkout.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {gateways.map((gateway) => {
          const connectionState = getGatewayConnectionState(gateway);

          return (
            <div key={gateway.id} className="rounded-3xl border border-outline-variant/20 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-on-surface">{gateway.provider}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Platform billing credentials and webhook setup.</p>
                </div>
                <StatusPill
                  label={connectionState}
                  tone={connectionState.includes('Ready') ? 'Low' : connectionState === 'Disabled' ? 'Medium' : 'High'}
                />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-on-surface">Provider</span>
                  <select
                    value={gateway.provider}
                    onChange={(event) => updateGateway(gateway.id, { provider: event.target.value as PlatformGatewayConfig['provider'] })}
                    className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="Billplz">Billplz</option>
                    <option value="SecurePay">SecurePay</option>
                    <option value="ToyyibPay">ToyyibPay</option>
                    <option value="Stripe">Stripe</option>
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-on-surface">Mode</span>
                  <select
                    value={gateway.mode}
                    onChange={(event) => updateGateway(gateway.id, { mode: event.target.value as PlatformGatewayConfig['mode'] })}
                    className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="Test">Test</option>
                    <option value="Live">Live</option>
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-on-surface">Merchant ID / UID</span>
                  <input
                    value={gateway.merchantId}
                    onChange={(event) => updateGateway(gateway.id, { merchantId: event.target.value })}
                    placeholder="Merchant UID from gateway dashboard"
                    className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-on-surface">API Key</span>
                  <input
                    value={gateway.apiKey}
                    onChange={(event) => updateGateway(gateway.id, { apiKey: event.target.value })}
                    placeholder="API key"
                    className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-on-surface">Secret / X-Signature Key</span>
                  <input
                    value={gateway.secretKey}
                    onChange={(event) => updateGateway(gateway.id, { secretKey: event.target.value })}
                    placeholder="Secret key or callback signature key"
                    className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-on-surface">Webhook / Callback URL</span>
                  <input
                    value={gateway.webhookUrl}
                    onChange={(event) => updateGateway(gateway.id, { webhookUrl: event.target.value })}
                    className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-low p-4">
                <div>
                  <p className="text-sm font-medium text-on-surface">Enable for platform billing</p>
                  <p className="mt-1 text-xs text-on-surface-variant">Only enable Live after credentials and callback verification are complete.</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateGateway(gateway.id, { enabled: !gateway.enabled })}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    gateway.enabled ? 'bg-primary text-on-primary' : 'bg-white text-on-surface shadow-sm'
                  }`}
                >
                  {gateway.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  type="button"
                  onClick={() => persistGateway(gateway)}
                  className="rounded-full bg-primary px-4 py-2 text-sm text-on-primary transition-colors hover:bg-primary-dim"
                >
                  Save Gateway
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-low px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-on-surface-variant">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-on-surface">{value}</p>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'Low' | 'Medium' | 'High' }) {
  const className =
    tone === 'Low'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'Medium'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-rose-50 text-rose-700';

  return <span className={`inline-flex h-fit rounded-full px-3 py-1 text-xs font-medium ${className}`}>{label}</span>;
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
  danger = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'border-rose-100 text-rose-700 hover:bg-rose-50'
          : 'border-outline-variant/20 text-on-surface hover:bg-surface-low'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function normalizeSection(section?: string): SuperadminSection {
  if (section === 'tenants' || section === 'packages' || section === 'integrations' || section === 'access') {
    return section;
  }

  return 'overview';
}
