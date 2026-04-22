export type ReportsTab = 'overview' | 'date' | 'product' | 'variant' | 'ai-insights';
export type FinanceTab = 'transactions' | 'settlements' | 'payouts' | 'reconciliation';
export type ReportsSection = ReportsTab | FinanceTab;

export interface ReportsMetric {
  label: string;
  value: string;
  helper: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

export interface RevenuePoint {
  label: string;
  current: number;
  previous: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  revenue: number;
  units: number;
  trend: 'up' | 'down' | 'flat';
}

export interface DateBreakdownRow {
  id: string;
  date: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
}

export interface ProductSalesRow {
  id: string;
  rank: number;
  name: string;
  category: string;
  imageUrl: string;
  unitsSold: number;
  revenue: number;
  conversionRate: number;
  status: 'Healthy' | 'Watch' | 'Opportunity';
}

export interface VariantSalesRow {
  id: string;
  productName: string;
  variant: string;
  sku: string;
  imageUrl: string;
  stock: number;
  revenue: number;
  orders: number;
  trend: 'up' | 'down' | 'flat';
}

export interface IntelligenceCard {
  id: string;
  title: string;
  summary: string;
  status: 'Positive' | 'Warning' | 'Critical';
  cta: string;
}

export interface RecommendedAction {
  id: string;
  action: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Inventory' | 'Pricing' | 'Promotion' | 'Channel';
  impact: string;
  status: 'Pending' | 'Executed';
}

export interface FinanceKpi {
  label: string;
  value: string;
  helper: string;
}

export interface TransactionRow {
  id: string;
  transactionId: string;
  orderId: string;
  customer: string;
  customerEmail: string;
  gateway: 'SecurePay' | 'Stripe';
  paymentMethod: 'FPX' | 'Card' | 'Wallet';
  status: 'Paid' | 'Failed' | 'Refunded';
  grossAmount: number;
  fee: number;
  netAmount: number;
  paymentDate: string;
  notes: string;
}

export interface SettlementRow {
  id: string;
  settlementBatchId: string;
  gateway: 'SecurePay' | 'Stripe';
  orderCount: number;
  grossAmount: number;
  fees: number;
  netPayout: number;
  bankAccount: string;
  status: 'Pending' | 'Processing' | 'Settled';
  estimatedArrivalDate: string;
  settledDate: string;
  timeline: Array<{
    label: 'Payment collected' | 'Processing' | 'Sent to bank' | 'Settled';
    at: string;
    state: 'complete' | 'current' | 'upcoming';
  }>;
}

export interface PayoutRow {
  id: string;
  payoutId: string;
  gateway: 'SecurePay' | 'Stripe';
  destination: string;
  initiatedAt: string;
  expectedAt: string;
  grossSales: number;
  fees: number;
  amount: number;
  periodLabel: string;
  status: 'In transit' | 'Completed' | 'On hold';
}

export interface ReconciliationRow {
  id: string;
  orderId: string;
  issueType: 'Unsettled' | 'Missing' | 'Failed Sync';
  amount: number;
  status: 'Open' | 'In review' | 'Resolved';
  actionLabel: 'View Order' | 'Re-sync Payment' | 'Investigate';
  description: string;
}
