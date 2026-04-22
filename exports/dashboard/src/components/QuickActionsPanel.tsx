import { ChevronRight } from 'lucide-react';
import { quickActions } from '../data';

export function QuickActionsPanel() {
  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
      <h2 className="text-lg font-semibold text-on-surface">Quick Actions</h2>
      <div className="mt-4 space-y-3">
        {quickActions.map((action) => (
          <a
            key={action.label}
            className="flex items-center justify-between gap-4 rounded border border-outline-variant/20 p-4 transition-colors hover:border-primary/40 hover:bg-surface-low"
            href={action.href}
          >
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded bg-surface-low text-primary">
                <action.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-on-surface">{action.label}</span>
                <span className="block text-xs text-on-surface-variant">{action.description}</span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-on-surface-variant" />
          </a>
        ))}
      </div>
    </section>
  );
}
