import { DollarSign, Package, ShoppingBag, TrendingUp, Users, Wallet } from 'lucide-react';
import { createApiClient, type ApiClientOptions } from './http';
import type { ActivityItem, KpiMetric, RevenuePoint, Transaction } from '../types';
import type { FinanceKpi, ReportsMetric, RevenuePoint as ReportsRevenuePoint, TopProduct } from '../modules/reports/types';

interface ApiDashboard {
  metrics: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
    conversion_rate: number;
    net_profit: number;
  };
  revenue_trend: Array<{ label: string; revenue: number; orders: number }>;
  recent_orders: Array<{
    id: number | string;
    number: string;
    total: number;
    payment_status: string;
    fulfillment_status: string;
    customer?: { name?: string; email?: string } | null;
  }>;
  activity: ActivityItem[];
}

interface ApiReportsOverview {
  overview: {
    total_revenue: number;
    total_orders: number;
    conversion_rate: number;
    average_order_value: number;
  };
  revenue_performance: Array<{ label: string; current: number; previous: number }>;
  top_products: Array<{ id: string; name: string; category: string; image_url: string; revenue: number; units: number; trend: 'up' | 'down' | 'flat' }>;
  finance: {
    cash_collected: number;
    in_settlement: number;
    upcoming_payouts: number;
    exceptions: number;
  };
}

function toMajorUnits(value: number) {
  return Number((value / 100).toFixed(2));
}

function money(value: number) {
  return `RM ${toMajorUnits(value).toLocaleString()}`;
}

function titleCase(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1).toLowerCase()}`;
}

export function mapDashboardFromApi(payload: ApiDashboard) {
  const metrics: KpiMetric[] = [
    { label: 'Total Revenue', value: money(payload.metrics.revenue), change: '+0%', comparison: 'live tenant data', direction: 'up', icon: DollarSign, href: '#/reports' },
    { label: 'Total Orders', value: payload.metrics.orders.toLocaleString(), change: '+0%', comparison: 'live tenant data', direction: 'up', icon: ShoppingBag, href: '#/orders' },
    { label: 'Conversion Rate', value: `${payload.metrics.conversion_rate.toFixed(2)}%`, change: '+0%', comparison: 'live estimate', direction: 'up', icon: TrendingUp, href: '#/reports' },
    { label: 'Net Profit', value: money(payload.metrics.net_profit), change: '+0%', comparison: 'estimated from paid orders', direction: 'up', icon: Wallet, href: '#/reports/transactions' },
  ];

  return {
    metrics,
    revenueTrend: payload.revenue_trend.map((point): RevenuePoint => ({
      label: point.label,
      revenue: toMajorUnits(point.revenue),
    })),
    recentTransactions: payload.recent_orders.map((order): Transaction => ({
      id: `#${order.number}`,
      customerName: order.customer?.name ?? 'Guest customer',
      status: order.fulfillment_status === 'shipped' ? 'Shipped' : order.payment_status === 'paid' ? 'Paid' : 'Processing',
      amount: money(order.total),
      href: `#/orders/${order.number}`,
    })),
    activity: payload.activity,
  };
}

export function mapReportsOverviewFromApi(payload: ApiReportsOverview) {
  const overviewMetrics: ReportsMetric[] = [
    { label: 'Total Revenue', value: money(payload.overview.total_revenue), helper: 'Paid order revenue', trendDirection: 'up' },
    { label: 'Total Orders', value: payload.overview.total_orders.toLocaleString(), helper: 'Orders in selected store', trendDirection: 'up' },
    { label: 'Conversion Rate', value: `${payload.overview.conversion_rate.toFixed(2)}%`, helper: 'Live estimate', trendDirection: 'neutral' },
    { label: 'Average Order Value', value: money(payload.overview.average_order_value), helper: 'Gross order average', trendDirection: 'up' },
  ];
  const financeKpis: FinanceKpi[] = [
    { label: 'Cash Collected', value: money(payload.finance.cash_collected), helper: 'Paid orders captured' },
    { label: 'In Settlement', value: money(payload.finance.in_settlement), helper: 'Pending processor release' },
    { label: 'Upcoming Payouts', value: money(payload.finance.upcoming_payouts), helper: 'Processing settlement amount' },
    { label: 'Exceptions', value: payload.finance.exceptions.toLocaleString(), helper: 'Pending payment records' },
  ];

  return {
    overviewMetrics,
    revenuePerformance: payload.revenue_performance.map((point): ReportsRevenuePoint => ({
      label: point.label,
      current: toMajorUnits(point.current),
      previous: toMajorUnits(point.previous),
    })),
    topProducts: payload.top_products.map((product): TopProduct => ({
      id: product.id,
      name: product.name,
      category: product.category,
      imageUrl: product.image_url,
      revenue: toMajorUnits(product.revenue),
      units: product.units,
      trend: product.trend,
    })),
    financeKpis,
  };
}

export async function fetchDashboardAnalytics(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiDashboard }>('/dashboard');

  return mapDashboardFromApi(response.data);
}

export async function fetchReportsOverview(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiReportsOverview }>('/reports/overview');

  return mapReportsOverviewFromApi(response.data);
}

export function formatAnalyticsStatus(value: string) {
  return titleCase(value);
}
