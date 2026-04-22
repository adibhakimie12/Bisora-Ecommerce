import type { LucideIcon } from 'lucide-react';

export type TrendDirection = 'up' | 'down';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
}

export interface KpiMetric {
  label: string;
  value: string;
  change: string;
  comparison: string;
  direction: TrendDirection;
  icon: LucideIcon;
  href?: string;
}

export interface RevenuePoint {
  label: string;
  revenue: number;
}

export interface Transaction {
  id: string;
  customerName: string;
  status: 'Paid' | 'Processing' | 'Shipped';
  amount: string;
  href: string;
}

export interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export interface ActivityItem {
  id: string;
  title: string;
  time: string;
  href?: string;
}
