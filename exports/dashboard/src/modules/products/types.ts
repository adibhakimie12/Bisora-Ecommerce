import type { LucideIcon } from 'lucide-react';

export type ProductStatus = 'Active' | 'Unpublished' | 'Hidden' | 'Draft';
export type StockState = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'High Stock';
export type CategoryStatus = 'Published' | 'Hidden';
export type ProductTab = 'All Products' | 'Inventory' | 'Categories';
export type CategoryDetailTab = 'Category' | 'Category Products' | 'SEO';

export interface Product {
  id: string;
  title: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  price: number;
  stock: number;
  status: ProductStatus;
  stockState: StockState;
  thumbnailUrl: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  slug: string;
  compareAtPrice?: number;
  taxable?: boolean;
  manageStock?: boolean;
  hasSku?: boolean;
  isPhysical?: boolean;
  weightKg?: number;
  packageProfile?: 'Pouch' | 'Box' | 'Large Box';
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  stockState: StockState;
  lastUpdated: string;
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  status: CategoryStatus;
  productIds: string[];
  coverUrl: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  health: 'Good' | 'Needs Products' | 'Needs SEO';
}

export interface KpiMetric {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}
