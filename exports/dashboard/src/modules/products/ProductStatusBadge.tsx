import type { CategoryStatus, ProductStatus, StockState } from './types';

type BadgeStatus = ProductStatus | StockState | CategoryStatus | 'Good' | 'Needs Products' | 'Needs SEO';

const statusClasses: Record<BadgeStatus, string> = {
  Active: 'bg-success/10 text-success',
  Draft: 'bg-warning/10 text-warning',
  Hidden: 'bg-on-surface-variant/10 text-on-surface-variant',
  Unpublished: 'bg-warning/10 text-warning',
  Published: 'bg-success/10 text-success',
  'In Stock': 'bg-success/10 text-success',
  'High Stock': 'bg-primary/10 text-primary',
  'Low Stock': 'bg-warning/10 text-warning',
  'Out of Stock': 'bg-error/10 text-error',
  Good: 'bg-success/10 text-success',
  'Needs Products': 'bg-error/10 text-error',
  'Needs SEO': 'bg-warning/10 text-warning',
};

export function ProductStatusBadge({ status }: { status: BadgeStatus }) {
  return (
    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${statusClasses[status]}`}>
      {status}
    </span>
  );
}
