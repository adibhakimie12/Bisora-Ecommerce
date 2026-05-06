export interface LuxuryTemplateField {
  key: string;
  label: string;
  group: 'Brand' | 'Hero' | 'Products' | 'Checkout' | 'Account';
}

export interface LuxuryTemplateProduct {
  name: string;
  category: string;
  price: string;
  badge?: string;
  image: string;
  colors: string[];
}

export interface LuxuryMuslimahTemplate {
  id: string;
  name: string;
  niche: string;
  mood: string;
  sections: string[];
  editableFields: LuxuryTemplateField[];
  collections: string[];
  bestSellers: LuxuryTemplateProduct[];
  trending: LuxuryTemplateProduct[];
}

export const luxuryMuslimahTemplate: LuxuryMuslimahTemplate = {
  id: 'luxury-muslimah-editorial',
  name: 'Maison Noor Editorial',
  niche: 'Muslimah fashion and feminine luxury products',
  mood: 'Soft luxury, editorial, feminine, premium commerce',
  sections: [
    'header',
    'hero',
    'collections',
    'bestSellers',
    'editorialBanner',
    'trending',
    'reviews',
    'instagram',
    'newsletter',
    'productPage',
    'cartDrawer',
    'checkout',
    'customerAccount',
  ],
  editableFields: [
    { key: 'logoText', label: 'Logo text', group: 'Brand' },
    { key: 'announcementText', label: 'Announcement text', group: 'Brand' },
    { key: 'heroHeading', label: 'Hero heading', group: 'Hero' },
    { key: 'heroSubtitle', label: 'Hero subtitle', group: 'Hero' },
    { key: 'heroImage', label: 'Hero image', group: 'Hero' },
    { key: 'collectionTiles', label: 'Collection tiles', group: 'Products' },
    { key: 'productCards', label: 'Product cards', group: 'Products' },
    { key: 'checkoutFields', label: 'Checkout fields', group: 'Checkout' },
    { key: 'accountModules', label: 'Account modules', group: 'Account' },
  ],
  collections: ['Abaya', 'Tudung', 'Dresses', 'Perfume', 'Lipmatte', 'New Arrivals'],
  bestSellers: [
    {
      name: 'Noor Silk Abaya',
      category: 'Abaya',
      price: 'MYR 289',
      badge: 'Best Seller',
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',
      colors: ['#f6efe7', '#8a715f', '#1f1b18'],
    },
    {
      name: 'Champagne Satin Shawl',
      category: 'Tudung',
      price: 'MYR 89',
      image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80',
      colors: ['#ead8c0', '#c7a77d', '#ffffff'],
    },
    {
      name: 'Musk Bloom Eau',
      category: 'Perfume',
      price: 'MYR 159',
      badge: 'New',
      image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80',
      colors: ['#f8f1e6', '#d6b56d', '#5a4637'],
    },
    {
      name: 'Velvet Rose Lipmatte',
      category: 'Beauty',
      price: 'MYR 59',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
      colors: ['#b66a5f', '#8f4f49', '#e8b9aa'],
    },
  ],
  trending: [
    {
      name: 'Ivory Modest Dress',
      category: 'Dresses',
      price: 'MYR 239',
      badge: 'Sale',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
      colors: ['#f7f0e6', '#b79d7b', '#3d3028'],
    },
    {
      name: 'Nude Cream Skincare Set',
      category: 'Skincare',
      price: 'MYR 189',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80',
      colors: ['#f2dfcd', '#ffffff', '#b8906d'],
    },
    {
      name: 'Mocha Everyday Shawl',
      category: 'Tudung',
      price: 'MYR 79',
      image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=900&q=80',
      colors: ['#73533f', '#d9c4aa', '#1e1916'],
    },
    {
      name: 'Gold Ritual Body Mist',
      category: 'Perfume',
      price: 'MYR 119',
      image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=80',
      colors: ['#e3c46f', '#f7efe3', '#8f7652'],
    },
  ],
};

export function getEditableFieldKeys(template: LuxuryMuslimahTemplate) {
  return template.editableFields.map((field) => field.key);
}
