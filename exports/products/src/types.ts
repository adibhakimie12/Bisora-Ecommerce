export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'HIDDEN';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image: string;
  description: string;
  variants: Variant[];
  tags: string[];
  lastUpdated: string;
}

export interface Variant {
  id: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  stock: number;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
}

export interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  status: 'PUBLISHED' | 'HIDDEN' | 'DRAFT';
  image: string;
  lastUpdated: string;
  lastUpdatedTime: string;
}
