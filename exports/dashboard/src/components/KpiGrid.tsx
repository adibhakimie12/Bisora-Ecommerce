import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { kpiMetrics } from '../data';
import type { KpiMetric } from '../types';

export function KpiGrid() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key performance indicators">
      {kpiMetrics.map((metric) => (
        <KpiCard key={metric.label} metric={metric} />
      ))}
    </section>
  );
}

function KpiCard({ metric }: { metric: KpiMetric }) {
  const TrendIcon = metric.direction === 'up' ? ArrowUpRight : ArrowDownRight;
  const trendClass = metric.direction === 'up' ? 'text-success' : 'text-error';
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-on-surface-variant">{metric.label}</p>
          <p className="mt-3 text-2xl font-semibold text-on-surface">{metric.value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded bg-surface-low text-primary transition group-hover:bg-primary/10">
          <metric.icon className="h-5 w-5" />
        </span>
      </div>

      <p className={`mt-4 flex items-center gap-1 text-sm font-medium ${trendClass}`}>
        <TrendIcon className="h-4 w-4" />
        <span>{metric.change}</span>
        <span className="font-normal text-on-surface-variant">{metric.comparison}</span>
      </p>
    </>
  );

  if (metric.href) {
    return (
      <a className="group block rounded border border-outline-variant/20 bg-surface-lowest p-5 transition hover:border-primary/35 hover:shadow-sm" href={metric.href}>
        {content}
      </a>
    );
  }

  return <article className="rounded border border-outline-variant/20 bg-surface-lowest p-5">{content}</article>;
}
