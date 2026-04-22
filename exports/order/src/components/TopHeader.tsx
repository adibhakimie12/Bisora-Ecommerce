import { Bell, Search } from 'lucide-react';

export function TopHeader() {
  return (
    <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-outline bg-surface-lowest/95 px-4 py-4 backdrop-blur sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <label className="relative block max-w-xl flex-1">
        <span className="sr-only">Search orders, customers, or tracking numbers</span>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className="w-full rounded border border-outline bg-surface px-9 py-2 text-sm outline-none focus:border-primary"
          placeholder="Search orders, customers, or tracking numbers"
          type="search"
        />
      </label>

      <div className="flex items-center gap-3">
        <button className="grid h-10 w-10 place-items-center rounded border border-outline text-muted hover:text-primary">
          <span className="sr-only">Notifications</span>
          <Bell className="h-4 w-4" />
        </button>
        <a className="rounded border border-outline px-3 py-2 text-sm font-medium text-on-surface" href="#/settings/profile">
          Fulfillment Admin
        </a>
      </div>
    </header>
  );
}
