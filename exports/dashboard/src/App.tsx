import { Suspense, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, Crown, CreditCard, Megaphone, Trash2, UserCircle2 } from 'lucide-react';
import { ActivityFeed } from './components/ActivityFeed';
import { KpiGrid } from './components/KpiGrid';
import { LoginScreen } from './components/LoginScreen';
import { OnboardingChecklist } from './components/OnboardingChecklist';
import { QuickActionsPanel } from './components/QuickActionsPanel';
import { RecentTransactions } from './components/RecentTransactions';
import { RevenueChart } from './components/RevenueChart';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { clearStoredSession, getStoredSession, setActiveTenant, type AdminSession } from './api/authSession';
import { PublicStorefrontRuntime } from './modules/storefront/PublicStorefrontRuntime';
import {
  CustomersModuleLazy,
  FrontendModuleLazy,
  MarketingModuleLazy,
  OrdersModuleLazy,
  ProductsModuleLazy,
  ReportsModuleLazy,
  SettingsModuleLazy,
  SuperadminModuleLazy,
  WebsiteBuilderModuleLazy,
} from './moduleRegistry';
import { categories } from './modules/products/data';
import { resolveCanonicalPathFromHash, syncCanonicalUrl } from './modules/seo/canonical';
import { useStorefrontProducts } from './modules/storefront/productStore';
import { useStorefrontPages } from './modules/storefront/websitePagesStore';
import { buildStorePlanState } from './storePlan';

type AdminRoute =
  | { module: 'Dashboard' }
  | { module: 'Orders'; section?: string; orderId?: string; subSection?: string }
  | { module: 'Products'; section?: string; id?: string; subSection?: string }
  | { module: 'Customers'; section?: string; customerId?: string }
  | { module: 'Marketing'; section?: string; subSection?: string }
  | { module: 'Frontend'; section?: string; slug?: string }
  | { module: 'Reports'; section?: string }
  | { module: 'Settings'; section?: string; subSection?: string }
  | { module: 'Website Builder'; section?: string; subSection?: string; themeId?: string }
  | { module: 'Superadmin'; section?: string }
  | { module: 'Public Storefront'; store: string; productSlug?: string; orderNumber?: string; orderEmail?: string }
  | { module: 'Account'; section: 'billing' | 'store-plan' | 'profile' }
  | { module: 'Placeholder'; label: string };

const routeLabels = new Map([
  ['customers', 'Customers'],
  ['builder', 'Website Builder'],
  ['website-builder', 'Website Builder'],
]);

export default function App() {
  const [route, setRoute] = useState<AdminRoute>(() => parseRoute());
  const [session, setSession] = useState(() => getStoredSession());
  const [productRecords] = useStorefrontProducts();
  const [pageRecords] = useStorefrontPages();
  const activeItem = route.module === 'Placeholder' ? route.label : route.module;

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '/dashboard';
      return;
    }

    const onHashChange = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHashChange);

    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (route.module === 'Frontend' || route.module === 'Website Builder' || route.module === 'Public Storefront') {
      return;
    }

    syncCanonicalUrl(
      resolveCanonicalPathFromHash(window.location.hash, {
        products: productRecords,
        categories,
        pages: pageRecords,
      }),
    );
  }, [pageRecords, productRecords, route]);

  const content = useMemo(() => {
    if (route.module === 'Public Storefront') {
      return <PublicStorefrontRuntime orderEmail={route.orderEmail} orderNumber={route.orderNumber} productSlug={route.productSlug} store={route.store} />;
    }

    if (route.module === 'Superadmin') {
      return session?.user.isPlatformOwner ? <SuperadminModuleLazy section={route.section} /> : <PlaceholderPage label="Superadmin access denied" />;
    }

    if (route.module === 'Dashboard') {
      return <DashboardPage />;
    }

    if (route.module === 'Orders') {
      return <OrdersModuleLazy section={route.section} orderId={route.orderId} subSection={route.subSection} />;
    }

    if (route.module === 'Products') {
      const activeTenant = session?.tenants.find((tenant) => tenant.id === session.activeTenantId) ?? session?.tenants[0];
      return <ProductsModuleLazy activeTenant={activeTenant} section={route.section} id={route.id} subSection={route.subSection} />;
    }

    if (route.module === 'Customers') {
      return <CustomersModuleLazy section={route.section} customerId={route.customerId} />;
    }

    if (route.module === 'Marketing') {
      return <MarketingModuleLazy section={route.section} subSection={route.subSection} />;
    }

    if (route.module === 'Frontend') {
      return <FrontendModuleLazy section={route.section} slug={route.slug} />;
    }

    if (route.module === 'Reports') {
      return <ReportsModuleLazy section={route.section} />;
    }

    if (route.module === 'Settings') {
      return <SettingsModuleLazy section={route.section} subSection={route.subSection} />;
    }

    if (route.module === 'Website Builder') {
      return <WebsiteBuilderModuleLazy section={route.section} subSection={route.subSection} themeId={route.themeId} />;
    }

    if (route.module === 'Account') {
      return <AccountPage section={route.section} session={session} />;
    }

    return <PlaceholderPage label={route.label} />;
  }, [route, session]);

  if (route.module === 'Public Storefront') {
    return <Suspense fallback={<ModuleLoadingState module={route.module} />}>{content}</Suspense>;
  }

  if (!session) {
    return <LoginScreen onLogin={setSession} />;
  }

  const logout = () => {
    clearStoredSession();
    setSession(null);
    window.location.hash = '/login';
  };

  const switchTenant = (tenantId: string) => {
    const nextSession = setActiveTenant(tenantId);
    if (nextSession) {
      setSession(nextSession);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar activeItem={activeItem} />

      <div className="min-h-screen lg:pl-64">
        <TopHeader session={session} onLogout={logout} onTenantChange={switchTenant} />

        <main className="p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<ModuleLoadingState module={route.module} />}>{content}</Suspense>
        </main>
      </div>
    </div>
  );
}

function ModuleLoadingState({ module }: { module: AdminRoute['module'] }) {
  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest p-8">
      <p className="text-sm text-on-surface-variant">Loading workspace</p>
      <h1 className="mt-2 text-3xl font-semibold">{module}</h1>
      <p className="mt-4 max-w-xl text-sm text-on-surface-variant">
        Module code is loading on demand to keep the initial app load lighter.
      </p>
    </section>
  );
}

function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-on-surface-variant">Store Performance Overview</p>
        <h1 className="text-3xl font-semibold tracking-tight text-on-surface">Dashboard</h1>
      </section>

      <OnboardingChecklist />

      <KpiGrid />

      <section className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-8">
          <RevenueChart />
          <RecentTransactions />
        </div>

        <aside className="space-y-8">
          <QuickActionsPanel />
          <ActivityFeed />
        </aside>
      </section>

      <AnnouncementsPanel />
    </div>
  );
}

function PlaceholderPage({ label }: { label: string }) {
  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest p-8">
      <p className="text-sm text-on-surface-variant">Module route connected</p>
      <h1 className="mt-2 text-3xl font-semibold">{label}</h1>
      <p className="mt-4 max-w-xl text-sm text-on-surface-variant">
        This module is in the routing map and will be built in a later phase.
      </p>
    </section>
  );
}

function AccountPage({ section, session }: { section: 'billing' | 'store-plan' | 'profile'; session: AdminSession | null }) {
  if (section === 'store-plan') {
    return <StorePlanPage session={session} />;
  }

  if (section === 'billing') {
    return <BillingPage />;
  }

  return <MyAccountPage />;
}

function StorePlanPage({ session }: { session: AdminSession | null }) {
  const activeTenant = session?.tenants.find((tenant) => tenant.id === session.activeTenantId) ?? session?.tenants[0];
  const planState = buildStorePlanState(activeTenant);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-on-surface-variant">Account / Store Plan</p>
        <h1 className="text-3xl font-semibold tracking-tight text-on-surface">Store plan</h1>
        <p className="text-sm text-on-surface-variant">
          {activeTenant?.freeAccess ? 'Owner-granted access is active for this store.' : 'Free trial starts here, then sellers can upgrade when they are ready.'}
        </p>
      </section>

      <section className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {planState.usage.map(([label, value]) => (
            <div key={label} className="rounded border border-outline-variant/20 bg-surface p-4">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
              <p className="mt-2 text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        {planState.options.map((plan) => (
          <article
            key={plan.name}
            className={`rounded border bg-surface-lowest p-6 ${plan.active ? 'border-primary shadow-sm' : 'border-outline-variant/20'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{plan.name}</p>
                <p className="mt-3 text-4xl font-semibold">{plan.price}</p>
                <p className="mt-3 text-sm text-on-surface-variant">{plan.note}</p>
              </div>
              {plan.active && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Current plan</span>}
            </div>
            <div className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <button
              className={`mt-6 w-full rounded px-4 py-2 text-sm font-medium ${
                plan.active ? 'border border-outline-variant/30 text-on-surface-variant' : 'bg-primary text-on-primary hover:bg-primary-dim'
              }`}
              type="button"
            >
              {plan.active ? 'Current plan' : 'Choose this plan'}
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

function BillingPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-on-surface-variant">Account / Billing</p>
        <h1 className="text-3xl font-semibold tracking-tight text-on-surface">Billing</h1>
        <p className="text-sm text-on-surface-variant">Invoices, payment method, and renewal history should live here instead of the dashboard.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <article className="rounded border border-outline-variant/20 bg-surface-lowest p-6">
          <h2 className="text-lg font-semibold">Recent invoices</h2>
          <div className="mt-4 divide-y divide-outline-variant/20">
            {[
              ['April 2026', 'RM199.00', 'Paid'],
              ['March 2026', 'RM199.00', 'Paid'],
              ['February 2026', 'RM199.00', 'Paid'],
            ].map(([month, amount, status]) => (
              <div key={month} className="flex items-center justify-between py-4 text-sm">
                <div>
                  <p className="font-medium">{month}</p>
                  <p className="text-on-surface-variant">Premium monthly subscription</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{amount}</p>
                  <p className="text-success">{status}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded border border-outline-variant/20 bg-surface-lowest p-6">
          <h2 className="text-lg font-semibold">Billing method</h2>
          <div className="mt-4 rounded border border-outline-variant/20 bg-surface p-4">
            <p className="text-sm font-medium">Visa ending 4242</p>
            <p className="mt-1 text-sm text-on-surface-variant">Renews automatically on April 27, 2026</p>
          </div>
          <button className="mt-4 w-full rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" type="button">
            Update billing method
          </button>
        </article>
      </section>
    </div>
  );
}

function MyAccountPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-on-surface-variant">Account / My Account</p>
        <h1 className="text-3xl font-semibold tracking-tight text-on-surface">My account</h1>
        <p className="text-sm text-on-surface-variant">Personal account identity, login security, and owner profile live here.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="rounded border border-outline-variant/20 bg-surface-lowest p-6">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <AccountField label="Name" value="Adib Hakimi" />
            <AccountField label="Email" value="adib@example.com" />
          </div>
        </article>
        <article className="rounded border border-outline-variant/20 bg-surface-lowest p-6">
          <h2 className="text-lg font-semibold">Security</h2>
          <p className="mt-3 text-sm text-on-surface-variant">Reset password, enable stronger login protection, and manage account sessions here.</p>
          <button className="mt-4 w-full rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" type="button">
            Manage security
          </button>
        </article>
      </section>
    </div>
  );
}

function AnnouncementsPanel() {
  const [items, setItems] = useState([
    { id: 'ann-1', title: 'New update: Sender.net Email Marketing Integration', time: '20 hours ago', unread: true },
    { id: 'ann-2', title: 'Brevo Email Marketing Integration', time: '1 month ago', unread: true },
    { id: 'ann-3', title: 'Page template improvements now live', time: '1 month ago', unread: false },
    { id: 'ann-4', title: 'New feature available: TikTok Shop integration', time: '2 months ago', unread: false },
  ]);

  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-on-surface-variant">Announcements</p>
          <h2 className="mt-1 text-2xl font-semibold">Owner update center</h2>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            System updates, new features, or owner notices can live here. This is better lower on the dashboard so it informs without blocking daily operations.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low"
          onClick={() => setItems((current) => current.map((item) => ({ ...item, unread: false })))}
          type="button"
        >
          <Bell className="h-4 w-4" />
          Mark all read
        </button>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded border border-outline-variant/20 bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-on-surface-variant">
                    <span>{item.time}</span>
                    {item.unread && <span className="h-2 w-2 rounded-full bg-error" />}
                  </div>
                </div>
              </div>
              <button
                className="grid h-8 w-8 place-items-center rounded border border-outline-variant/20 text-on-surface-variant hover:bg-surface-low"
                onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AccountField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input
        className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2"
        readOnly
        value={value}
      />
    </label>
  );
}

function parseRoute(): AdminRoute {
  const rawHash = window.location.hash.replace(/^#\/?/, '');
  const [segment, id] = rawHash.split('/');

  if (!segment || segment === 'dashboard') {
    return { module: 'Dashboard' };
  }

  if (segment === 'login') {
    return { module: 'Dashboard' };
  }

  if (segment === 'superadmin') {
    return { module: 'Superadmin', section: id };
  }

  if ((segment === 'store' || segment === 'storefront') && id) {
    const parts = rawHash.split('/');
    const orderPart = parts[3]?.split('?')[0];
    const query = rawHash.includes('?') ? new URLSearchParams(rawHash.split('?')[1]) : new URLSearchParams();
    return {
      module: 'Public Storefront',
      store: id,
      productSlug: parts[2] === 'product' ? parts[3] : undefined,
      orderNumber: parts[2] === 'orders' ? orderPart : undefined,
      orderEmail: parts[2] === 'orders' ? query.get('email') ?? undefined : undefined,
    };
  }

  if (segment === 'orders') {
    if (id === 'drafts' || id === 'abandoned' || id === 'new') {
      return { module: 'Orders', section: id };
    }

    return { module: 'Orders', orderId: id, subSection: rawHash.split('/')[2] };
  }

  if (segment === 'products') {
    return { module: 'Products', section: id, id: rawHash.split('/')[2], subSection: rawHash.split('/')[3] };
  }

  if (segment === 'customers') {
    if (id === 'reviews') {
      return { module: 'Customers', section: 'reviews' };
    }

    return { module: 'Customers', customerId: id };
  }

  if (segment === 'marketing') {
    return { module: 'Marketing', section: id, subSection: rawHash.split('/')[2] };
  }

  if (segment === 'frontend' || segment === 'frontstore') {
    return { module: 'Frontend', section: id, slug: rawHash.split('/')[2] };
  }

  if (segment === 'reports') {
    return { module: 'Reports', section: id };
  }

  if (segment === 'settings') {
    return { module: 'Settings', section: id, subSection: rawHash.split('/')[2] };
  }

  if (segment === 'website-builder' || segment === 'builder') {
    return {
      module: 'Website Builder',
      section: id,
      subSection: rawHash.split('/')[2],
      themeId: rawHash.split('/')[2],
    };
  }

  if (segment === 'billing') {
    return { module: 'Account', section: 'billing' };
  }

  if (segment === 'store-plan') {
    return { module: 'Account', section: 'store-plan' };
  }

  if (segment === 'my-account') {
    return { module: 'Account', section: 'profile' };
  }

  return { module: 'Placeholder', label: routeLabels.get(segment) ?? 'Dashboard' };
}
