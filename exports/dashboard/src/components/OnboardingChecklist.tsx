import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Rocket } from 'lucide-react';
import { defaultOnboardingChecklist, fetchDashboardAnalytics, type OnboardingChecklist as OnboardingChecklistData } from '../api/analytics';

export function OnboardingChecklist() {
  const [checklist, setChecklist] = useState<OnboardingChecklistData>(defaultOnboardingChecklist);

  useEffect(() => {
    let cancelled = false;

    fetchDashboardAnalytics()
      .then((dashboard) => {
        if (!cancelled) {
          setChecklist(dashboard.onboarding);
        }
      })
      .catch(() => {
        // Keep default onboarding when API is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded bg-primary/10 text-primary">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Trial launch checklist</p>
            <h2 className="mt-1 text-xl font-semibold text-on-surface">Get your store ready for customers</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Complete these setup steps before sharing your storefront link.
            </p>
          </div>
        </div>
        <div className="min-w-[180px]">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-on-surface">{checklist.progress.percent}% ready</span>
            <span className="text-on-surface-variant">
              {checklist.progress.completed}/{checklist.progress.total}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-low">
            <div className="h-full rounded-full bg-primary" style={{ width: `${checklist.progress.percent}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {checklist.items.map((item) => (
          <a
            className="rounded border border-outline-variant/20 bg-surface p-4 transition hover:border-primary/30 hover:bg-surface-low"
            href={item.href}
            key={item.key}
          >
            <div className="flex items-start gap-3">
              {item.completed ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-on-surface-variant" />
              )}
              <div>
                <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-on-surface-variant">{item.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
