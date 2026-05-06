import {
  BarChart3,
  Globe,
  LayoutDashboard,
  Megaphone,
  Package,
  PlusCircle,
  Settings,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
  DollarSign,
  CheckSquare,
} from 'lucide-react';
import type { ActivityItem, KpiMetric, NavItem, QuickAction, RevenuePoint, Transaction } from './types';

export const navItems: NavItem[] = [
  { label: 'Superadmin', href: '#/superadmin', icon: ShieldCheck },
  { label: 'Dashboard', href: '#/dashboard', icon: LayoutDashboard },
  { label: 'Orders', href: '#/orders', icon: ShoppingBag },
  { label: 'Products', href: '#/products', icon: Package },
  { label: 'Customers', href: '#/customers', icon: Users },
  { label: 'Marketing', href: '#/marketing', icon: Megaphone },
  { label: 'Reports', href: '#/reports', icon: BarChart3 },
  { label: 'Settings', href: '#/settings', icon: Settings },
  { label: 'Website Builder', href: '#/website-builder', icon: Globe },
];

export const kpiMetrics: KpiMetric[] = [
  {
    label: 'Total Revenue',
    value: '$128,430',
    change: '+12.5%',
    comparison: 'vs last month',
    direction: 'up',
    icon: DollarSign,
    href: '#/orders',
  },
  {
    label: 'Total Orders',
    value: '1,240',
    change: '+8.2%',
    comparison: 'vs last month',
    direction: 'up',
    icon: ShoppingBag,
    href: '#/orders',
  },
  {
    label: 'Conversion Rate',
    value: '3.42%',
    change: '-0.4%',
    comparison: 'vs last month',
    direction: 'down',
    icon: TrendingUp,
    href: '#/orders/abandoned',
  },
  {
    label: 'Net Profit',
    value: '$42,910',
    change: '+5.1%',
    comparison: 'vs last month',
    direction: 'up',
    icon: Wallet,
    href: '#/reports',
  },
];

export const monthlyRevenue: RevenuePoint[] = [
  { label: 'Jan', revenue: 32000 },
  { label: 'Feb', revenue: 42000 },
  { label: 'Mar', revenue: 38000 },
  { label: 'Apr', revenue: 56000 },
  { label: 'May', revenue: 49000 },
  { label: 'Jun', revenue: 68000 },
];

export const weeklyRevenue: RevenuePoint[] = [
  { label: 'Week 1', revenue: 11200 },
  { label: 'Week 2', revenue: 14600 },
  { label: 'Week 3', revenue: 12800 },
  { label: 'Week 4', revenue: 17300 },
];

export const recentTransactions: Transaction[] = [
  { id: '#ORD-9021', customerName: 'Amina Al-Farsi', status: 'Paid', amount: '$450.00', href: '#/orders/ORD-9021' },
  { id: '#ORD-9019', customerName: 'Laila Bin-Khalid', status: 'Processing', amount: '$1,220.00', href: '#/orders/ORD-9019' },
  { id: '#ORD-9015', customerName: 'Zahra Mansour', status: 'Shipped', amount: '$890.00', href: '#/orders/ORD-9015' },
  { id: '#ORD-9011', customerName: 'Noura Saleh', status: 'Paid', amount: '$315.00', href: '#/orders/ORD-9011' },
];

export const quickActions: QuickAction[] = [
  {
    label: 'Add Product',
    description: 'Create a new catalog item',
    href: '#/products/edit/prod-abaya-silk',
    icon: PlusCircle,
  },
  {
    label: 'Create Campaign',
    description: 'Launch a marketing campaign',
    href: '#/marketing/campaigns/create',
    icon: Megaphone,
  },
  {
    label: 'Manage Orders',
    description: 'Review fulfillment queue',
    href: '#/orders',
    icon: CheckSquare,
  },
  {
    label: 'Open Builder',
    description: 'Edit storefront pages',
    href: '#/website-builder',
    icon: Globe,
  },
];

export const activityItems: ActivityItem[] = [
  {
    id: 'activity-1',
    title: 'New order received from Amina Al-Farsi',
    time: '12 minutes ago',
    href: '#/orders/ORD-9021',
  },
  {
    id: 'activity-2',
    title: 'Spring collection content updated',
    time: '2 hours ago',
    href: '#/products/categories/cat-evening',
  },
  {
    id: 'activity-3',
    title: 'Customer review moderation completed',
    time: 'Yesterday, 10:45 PM',
    href: '#/customers/reviews',
  },
];
