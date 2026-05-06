import { useEffect, useMemo, useState } from 'react';
import { ActivityFeed } from './components/ActivityFeed';
import { KpiGrid } from './components/KpiGrid';
import { QuickActionsPanel } from './components/QuickActionsPanel';
import { RecentTransactions } from './components/RecentTransactions';
import { RevenueChart } from './components/RevenueChart';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { PromoCard } from './components/PromoCard';
import { CustomersModule } from './modules/customers/CustomersModule';
import { FrontendModule } from './modules/frontend/FrontendModule';
import { MarketingModule } from './modules/marketing/MarketingModule';
import { OrdersModule } from './modules/orders/OrdersModule';
import { ProductsModule } from './modules/products/ProductsModule';
import { ReportsModule } from './modules/reports/ReportsModule';
import { SettingsModule } from './modules/settings/SettingsModule';
import { SuperadminModule } from './modules/superadmin/SuperadminModule';
import { canAccessSuperadmin, getCurrentAdminEmail } from './modules/superadmin/superadminAccess';
import { WebsiteBuilderModule } from './modules/websiteBuilder/WebsiteBuilderModule';

type AdminRoute =
  | { module: 'Dashboard' }
  | { module: 'Orders'; section?: string; orderId?: string; subSection?: string }
  | { module: 'Products'; section?: string; id?: string; subSection?: string }
  | { module: 'Customers'; section?: string; customerId?: string }
  | { module: 'Marketing'; section?: string; subSection?: string }
  | { module: 'Frontend'; section?: string; slug?: string }
  | { module: 'Reports'; section?: string }
  | { module: 'Settings'; section?: string; subSection?: string }
  | { module: 'Superadmin'; section?: string }
  | { module: 'Website Builder'; section?: string; subSection?: string; themeId?: string }
  | { module: 'Placeholder'; label: string };

const routeLabels = new Map([
  ['customers', 'Customers'],
  ['builder', 'Website Builder'],
  ['website-builder', 'Website Builder'],
  ['superadmin', 'Superadmin'],
]);

export default function App() {
  const [route, setRoute] = useState<AdminRoute>(() => parseRoute());
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

  const content = useMemo(() => {
    if (route.module === 'Dashboard') {
      return <DashboardPage />;
    }

    if (route.module === 'Orders') {
      return <OrdersModule section={route.section} orderId={route.orderId} subSection={route.subSection} />;
    }

    if (route.module === 'Products') {
      return <ProductsModule section={route.section} id={route.id} subSection={route.subSection} />;
    }

    if (route.module === 'Customers') {
      return <CustomersModule section={route.section} customerId={route.customerId} />;
    }

    if (route.module === 'Marketing') {
      return <MarketingModule section={route.section} subSection={route.subSection} />;
    }

    if (route.module === 'Frontend') {
      return <FrontendModule section={route.section} slug={route.slug} />;
    }

    if (route.module === 'Reports') {
      return <ReportsModule section={route.section} />;
    }

    if (route.module === 'Settings') {
      return <SettingsModule section={route.section} subSection={route.subSection} />;
    }

    if (route.module === 'Superadmin') {
      if (!canAccessSuperadmin(getCurrentAdminEmail())) {
        return <UnauthorizedSuperadminPage />;
      }

      return <SuperadminModule section={route.section} />;
    }

    if (route.module === 'Website Builder') {
      return <WebsiteBuilderModule section={route.section} subSection={route.subSection} themeId={route.themeId} />;
    }

    return <PlaceholderPage label={route.label} />;
  }, [route]);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar activeItem={activeItem} />

      <div className="min-h-screen lg:pl-64">
        <TopHeader />

        <main className="p-4 sm:p-6 lg:p-8">{content}</main>
      </div>
    </div>
  );
}

function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-on-surface-variant">Store Performance Overview</p>
        <h1 className="text-3xl font-semibold tracking-tight text-on-surface">Dashboard</h1>
      </section>

      <KpiGrid />

      <section className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-8">
          <RevenueChart />
          <RecentTransactions />
        </div>

        <aside className="space-y-8">
          <QuickActionsPanel />
          <PromoCard />
          <ActivityFeed />
        </aside>
      </section>
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

function UnauthorizedSuperadminPage() {
  return (
    <section className="rounded-3xl border border-rose-100 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium text-rose-700">Owner only</p>
      <h1 className="mt-2 text-3xl font-semibold text-on-surface">Superadmin access blocked</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-on-surface-variant">
        This area is only visible to the configured owner email. Backend access control still needs to enforce this later.
      </p>
    </section>
  );
}

function parseRoute(): AdminRoute {
  const rawHash = window.location.hash.replace(/^#\/?/, '');
  const [segment, id] = rawHash.split('/');

  if (!segment || segment === 'dashboard') {
    return { module: 'Dashboard' };
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

  if (segment === 'superadmin') {
    return { module: 'Superadmin', section: id };
  }

  if (segment === 'website-builder' || segment === 'builder') {
    return {
      module: 'Website Builder',
      section: id,
      subSection: rawHash.split('/')[2],
      themeId: rawHash.split('/')[2],
    };
  }

  return { module: 'Placeholder', label: routeLabels.get(segment) ?? 'Dashboard' };
}
