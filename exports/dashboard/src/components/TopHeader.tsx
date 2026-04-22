import { Bell, Search } from 'lucide-react';

export function TopHeader() {
  return (
    <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-outline-variant/20 bg-surface-lowest/95 px-4 py-4 backdrop-blur sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <p className="text-sm text-on-surface-variant">Morning, Sarah</p>
        <p className="text-xs uppercase tracking-widest text-on-surface-variant">Tuesday, April 21</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

        <a href="#/settings/profile" className="flex items-center gap-3 rounded border border-outline-variant/30 px-3 py-2">
          <span className="grid h-8 w-8 place-items-center rounded bg-primary text-xs font-semibold text-on-primary">SA</span>
          <span className="text-sm font-medium">Sarah Admin</span>
        </a>
      </div>
    </header>
  );
}
