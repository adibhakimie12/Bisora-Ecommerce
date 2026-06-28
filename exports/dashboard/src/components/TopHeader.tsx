import { Bell, ChevronDown, CreditCard, Crown, LogOut, Search, UserCircle2 } from 'lucide-react';
import { useState } from 'react';
import type { AdminSession } from '../api/authSession';

export function TopHeader({
  session,
  onLogout,
  onTenantChange,
}: {
  session: AdminSession;
  onLogout: () => void;
  onTenantChange: (tenantId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = session.user.name || session.user.email;
  const activeTenant = session.tenants.find((tenant) => tenant.id === session.activeTenantId) ?? session.tenants[0];
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-outline-variant/20 bg-surface-lowest/95 px-4 py-4 backdrop-blur sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <p className="text-sm text-on-surface-variant">Morning, {displayName}</p>
        <p className="text-xs uppercase tracking-widest text-on-surface-variant">
          {session.user.isPlatformOwner ? 'Platform owner' : activeTenant?.name ?? 'Seller workspace'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {session.tenants.length > 1 && (
          <label className="block sm:w-56">
            <span className="sr-only">Active store</span>
            <select
              className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              onChange={(event) => onTenantChange(event.target.value)}
              value={activeTenant?.id ?? ''}
            >
              {session.tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name ?? tenant.slug}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="relative block sm:w-80">
          <span className="sr-only">Search orders, products, customers</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            className="w-full rounded border border-outline-variant/30 bg-surface px-9 py-2 text-sm outline-none focus:border-primary"
            placeholder="Search orders, products, customers"
            type="search"
          />
        </label>

        <button className="inline-flex h-10 w-10 items-center justify-center rounded border border-outline-variant/30 text-on-surface-variant hover:text-primary">
          <span className="sr-only">Notifications</span>
          <Bell className="h-4 w-4" />
        </button>

        <div className="relative">
          <button
            className="flex items-center gap-3 rounded border border-outline-variant/30 px-3 py-2"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            <span className="grid h-8 w-8 place-items-center rounded bg-primary text-xs font-semibold text-on-primary">{initials || 'BA'}</span>
            <span className="text-sm font-medium">{displayName}</span>
            <ChevronDown className="h-4 w-4 text-on-surface-variant" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 min-w-56 rounded border border-outline-variant/20 bg-surface-lowest p-2 shadow-lg">
              <a className="flex items-center gap-3 rounded px-3 py-2 text-sm hover:bg-surface-low" href="#/billing">
                <CreditCard className="h-4 w-4 text-on-surface-variant" />
                Billing
              </a>
              <a className="flex items-center gap-3 rounded px-3 py-2 text-sm hover:bg-surface-low" href="#/store-plan">
                <Crown className="h-4 w-4 text-on-surface-variant" />
                Store plan
              </a>
              <div className="my-2 border-t border-outline-variant/20" />
              <a className="flex items-center gap-3 rounded px-3 py-2 text-sm hover:bg-surface-low" href="#/my-account">
                <UserCircle2 className="h-4 w-4 text-on-surface-variant" />
                My account
              </a>
              <button className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-surface-low" onClick={onLogout} type="button">
                <LogOut className="h-4 w-4 text-on-surface-variant" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
