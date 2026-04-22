export type View = 'customers' | 'customer-detail' | 'reviews';

export interface Customer {
  id: string;
  name: string;
  email: string;
  avatar: string;
  orders: number;
  totalSpent: number;
  status: 'VIP' | 'Returning' | 'New' | 'High Spender';
  lastOrder: string;
  phone?: string;
  memberSince?: string;
  address?: {
    street: string;
    area: string;
    city: string;
    country: string;
  };
}

export interface Order {
  id: string;
  date: string;
  total: number;
  payment: 'Paid' | 'Pending' | 'Refunded';
  fulfillment: 'Shipped' | 'Delivered' | 'In Progress';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export interface Review {
  id: string;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  productName: string;
  productImage: string;
  rating: number;
  comment: string;
  status: 'Pending' | 'Approved' | 'Featured' | 'Hidden';
  date: string;
}
