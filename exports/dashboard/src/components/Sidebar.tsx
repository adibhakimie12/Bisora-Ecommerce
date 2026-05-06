import { navItems } from '../data';
import { canAccessSuperadmin, getCurrentAdminEmail } from '../modules/superadmin/superadminAccess';

export function Sidebar({ activeItem }: { activeItem: string }) {
  const visibleNavItems = navItems.filter((item) => item.label !== 'Superadmin' || canAccessSuperadmin(getCurrentAdminEmail()));

  return (
    <aside className="border-outline-variant/20 bg-surface-lowest lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r">
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-5 lg:block lg:border-b-0 lg:py-8">
        <div>
          <p className="text-lg font-semibold text-primary">Bisora Admin</p>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant">Ecommerce SaaS</p>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-4 py-3 lg:flex-1 lg:flex-col lg:overflow-visible">
        {visibleNavItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex min-w-max items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
              item.label === activeItem
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
