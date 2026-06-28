import assert from 'node:assert/strict';
import { buildPublicStorefrontViewModel } from './publicStorefrontViewModel';
import type { PublicStorefront } from '../../api/storefront';

const storefront: PublicStorefront = {
  store: {
    id: '1',
    name: 'Live Store',
    slug: 'live-store',
    managedDomain: 'live-store.bisora.app',
    customDomain: 'shop.live.test',
    currency: 'MYR',
    status: 'live',
    publishedUrl: 'https://shop.live.test',
    branding: {
      brandName: 'Live Store',
      tagline: 'Ready for customers',
      primaryColor: '#4f46e5',
      accentColor: '#c7d2fe',
      neutralColor: '#f8fafc',
    },
  },
  pages: [],
  blogPosts: [],
  products: [
    {
      id: '10',
      title: 'Published Product',
      slug: 'published-product',
      sku: 'PUB-001',
      price: 129,
      compareAtPrice: 159,
      stock: 8,
      thumbnailUrl: 'https://example.test/product.jpg',
      description: 'Ready.',
      vendor: 'Bisora',
      productType: 'Hijab',
      tags: ['featured'],
      variants: [],
      seoTitle: 'Published Product',
      seoDescription: 'Ready for customers.',
      category: { id: '2', name: 'Scarves', slug: 'scarves' },
    },
  ],
};

function testBuildsHeroAndProductCards() {
  const viewModel = buildPublicStorefrontViewModel(storefront);

  assert.equal(viewModel.brandName, 'Live Store');
  assert.equal(viewModel.tagline, 'Ready for customers');
  assert.equal(viewModel.products[0].priceLabel, 'MYR 129');
  assert.equal(viewModel.products[0].compareAtPriceLabel, 'MYR 159');
  assert.equal(viewModel.theme.primaryColor, '#4f46e5');
}

testBuildsHeroAndProductCards();

console.log('public storefront view model tests passed');
