import { useMemo, useState } from 'react';
import { monthlyRevenue, weeklyRevenue } from '../data';
import type { RevenuePoint } from '../types';

type RevenueRange = 'Monthly' | 'Weekly';

export function RevenueChart() {
  const [range, setRange] = useState<RevenueRange>('Monthly');
  const data = range === 'Monthly' ? monthlyRevenue : weeklyRevenue;
  const maxRevenue = useMemo(() => Math.max(...data.map((point) => point.revenue)), [data]);

  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-on-surface">Revenue Performance</h2>
          <p className="text-sm text-on-surface-variant">Revenue trend sourced from orders data</p>
        </div>

        <div className="inline-flex rounded border border-outline-variant/30 p-1">
          {(['Monthly', 'Weekly'] as RevenueRange[]).map((option) => (
            <button
              key={option}
              className={`rounded px-3 py-1.5 text-sm ${
                range === option ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setRange(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <BarChart data={data} maxRevenue={maxRevenue} />
    </section>
  );
}

function BarChart({ data, maxRevenue }: { data: RevenuePoint[]; maxRevenue: number }) {
  return (
    <div className="mt-8 h-72">
      <div className="grid h-full grid-cols-[auto_minmax(0,1fr)] gap-4">
        <div className="flex flex-col justify-between text-xs text-on-surface-variant">
          <span>${Math.round(maxRevenue / 1000)}k</span>
          <span>${Math.round(maxRevenue / 2000)}k</span>
          <span>$0</span>
        </div>

        <div className="flex items-end gap-3 border-b border-l border-outline-variant/30 px-3 pt-4">
          {data.map((point) => {
            const height = `${Math.max((point.revenue / maxRevenue) * 100, 8)}%`;

            return (
              <div key={point.label} className="flex h-full flex-1 flex-col justify-end gap-2">
                <div className="flex flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-primary/80 transition-colors hover:bg-primary"
                    style={{ height }}
                    title={`${point.label}: $${point.revenue.toLocaleString()}`}
                  />
                </div>
                <span className="text-center text-xs text-on-surface-variant">{point.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
