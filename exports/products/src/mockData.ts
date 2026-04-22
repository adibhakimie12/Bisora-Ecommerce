import { Product, Category } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Silk Organza Abaya',
    sku: 'AT-8829-S',
    category: 'Outerwear',
    price: 285.00,
    stock: 42,
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400',
    description: 'A masterpiece of minimalist elegance, crafted from the finest Italian silk organza. Features a subtle nude palette with delicate hand-stitched detailing.',
    tags: ['Silk', 'Nude', 'New Arrival'],
    lastUpdated: '2 hours ago',
    variants: [
      { id: 'v1', size: 'S', color: 'Champagne', sku: 'AN-SA-01-SC', price: 280, stock: 15, status: 'Available' },
      { id: 'v2', size: 'M', color: 'Champagne', sku: 'AN-SA-01-MC', price: 280, stock: 12, status: 'Available' },
      { id: 'v3', size: 'S', color: 'Sand', sku: 'AN-SA-01-SS', price: 280, stock: 8, status: 'Available' },
    ]
  },
  {
    id: '2',
    name: 'Premium Chiffon Hijab',
    sku: 'AT-1120-P',
    category: 'Headwear',
    price: 45.00,
    stock: 128,
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1594235412402-9f99b217db27?auto=format&fit=crop&q=80&w=400',
    description: 'Our signature chiffon hijab offers a light, breathable feel with a sophisticated matte finish.',
    tags: ['Chiffon', 'Elite'],
    lastUpdated: 'Yesterday',
    variants: []
  },
  {
    id: '3',
    name: 'Velvet Prayer Set',
    sku: 'AT-9034-V',
    category: 'Modest Wear',
    price: 120.00,
    stock: 0,
    status: 'DRAFT',
    image: 'https://images.unsplash.com/photo-1574015974293-817f0ebebb74?auto=format&fit=crop&q=80&w=400',
    description: 'Luxurious velvet prayer set with intricate silver floral details.',
    tags: ['Velvet', 'Modesty'],
    lastUpdated: 'Oct 12, 2023',
    variants: []
  },
  {
    id: '4',
    name: 'Linen Geometric Kaftan',
    sku: 'AT-4421-L',
    category: 'Eid Collection',
    price: 340.00,
    stock: 0,
    status: 'ARCHIVED',
    image: 'https://images.unsplash.com/photo-1621112904887-419379ce6824?auto=format&fit=crop&q=80&w=400',
    description: 'Modern kaftan with geometric gold embroidery on cream linen fabric.',
    tags: ['Linen', 'Eid'],
    lastUpdated: 'Sep 28, 2023',
    variants: []
  },
  {
    id: '5',
    name: 'Satin Pleated Skirt',
    sku: 'AT-5590-S',
    category: 'Bottoms',
    price: 155.00,
    stock: 18,
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&q=80&w=400',
    description: 'Flowing satin pleated skirt in pearl white, editorial styling, minimal aesthetic.',
    tags: ['Satin', 'White'],
    lastUpdated: 'Sep 15, 2023',
    variants: []
  }
];

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'c1',
    name: 'Abayas',
    description: 'Signature Modest Collection',
    productCount: 42,
    status: 'PUBLISHED',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=200',
    lastUpdated: 'Oct 12, 2023',
    lastUpdatedTime: '14:22 PM'
  },
  {
    id: 'c2',
    name: 'Hijabs',
    description: 'Premium Silk & Chiffon',
    productCount: 128,
    status: 'PUBLISHED',
    image: 'https://images.unsplash.com/photo-1594235412402-9f99b217db27?auto=format&fit=crop&q=80&w=200',
    lastUpdated: 'Oct 08, 2023',
    lastUpdatedTime: '09:15 AM'
  },
  {
    id: 'c3',
    name: 'Baju Kurung',
    description: 'Modern Traditional Wear',
    productCount: 18,
    status: 'HIDDEN',
    image: 'https://images.unsplash.com/photo-1621112904887-419379ce6824?auto=format&fit=crop&q=80&w=200',
    lastUpdated: 'Sep 28, 2023',
    lastUpdatedTime: '18:45 PM'
  },
  {
    id: 'c4',
    name: 'Accessories',
    description: 'Jewelry & Handbags',
    productCount: 64,
    status: 'PUBLISHED',
    image: 'https://images.unsplash.com/photo-1611085583191-a3b1494676a1?auto=format&fit=crop&q=80&w=200',
    lastUpdated: 'Sep 15, 2023',
    lastUpdatedTime: '11:00 AM'
  }
];
