export type CustomerTag = 'VIP' | 'Returning' | 'New' | 'Inactive';
export type ReviewStatus = 'Pending' | 'Approved' | 'Hidden' | 'Featured';

export interface CustomerOrderHistory {
  id: string;
  date: string;
  total: number;
  paymentStatus: 'Paid' | 'Pending';
  fulfillmentStatus: 'Shipped' | 'Delivered' | 'Processing';
}

export interface RecentPurchase {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  status: CustomerTag;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  memberSince: string;
  shippingAddress: string[];
  notes: string[];
  orderHistory: CustomerOrderHistory[];
  recentPurchases: RecentPurchase[];
}

export interface ReviewRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  productImageUrl: string;
  rating: number;
  excerpt: string;
  fullReview: string;
  status: ReviewStatus;
  date: string;
  verifiedPurchase: boolean;
}
