import { navItems } from '../data';

export function Sidebar({ activeItem }: { activeItem: string }) {
  return (
    <aside className="border-outline bg-surface-lowest lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r">
      <div className="border-b border-outline px-6 py-5 lg:border-b-0 lg:py-8">
        <p className="text-lg font-semibold text-primary">Bisora Admin</p>
        <p className="text-xs uppercase tracking-widest text-muted">Order Operations</p>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-4 py-3 lg:flex-1 lg:flex-col lg:overflow-visible">
        {navItems.map((item) => {
          const active = item.label === activeItem;

          return (
            <a
              key={item.label}
              className={`flex min-w-max items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                active ? 'bg-primary text-on-primary' : 'text-muted hover:bg-surface-low hover:text-on-surface'
              }`}
              href={item.href}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
