import assert from 'node:assert/strict';
import { fetchPublicOrder, fetchPublicStorefront, mapPublicStorefrontFromApi, submitPublicCheckout } from './storefront';

function testMapsPublicStorefrontFromApi() {
  const storefront = mapPublicStorefrontFromApi({
    store: {
      id: '1',
      name: 'Live Store',
      slug: 'live-store',
      managed_domain: 'live-store.bisora.app',
      custom_domain: 'shop.live.test',
      currency: 'MYR',
      status: 'live',
      published_url: 'https://shop.live.test',
      branding: { brandName: 'Live Store', primaryColor: '#4f46e5' },
    },
    pages: [
      {
        id: 'about',
        title: 'About Us',
        slug: '/pages/about-us',
        status: 'Published',
      },
    ],
    blog_posts: [
      {
        id: 'blog-1',
        title: 'Published Blog',
        slug: '/blog/published-blog',
        status: 'Published',
      },
    ],
    products: [
      {
        id: '10',
        title: 'Published Product',
        slug: 'published-product',
        sku: 'PUB-001',
        price: 12900,
        compare_at_price: null,
        stock: 8,
        thumbnail_url: 'https://example.test/product.jpg',
        description: 'Ready.',
        vendor: 'Bisora',
        product_type: 'Hijab',
        tags: ['featured'],
        variants: [],
        seo_title: 'Published Product',
        seo_description: 'Ready for customers.',
        category: { id: '2', name: 'Scarves', slug: 'scarves' },
      },
    ],
  });

  assert.equal(storefront.store.name, 'Live Store');
  assert.equal(storefront.store.status, 'live');
  assert.equal(storefront.pages[0].title, 'About Us');
  assert.equal(storefront.blogPosts[0].slug, '/blog/published-blog');
  assert.equal(storefront.products[0].price, 129);
  assert.equal(storefront.products[0].category?.name, 'Scarves');
}

async function testFetchPublicStorefrontUsesPublicEndpoint() {
  const calls: string[] = [];
  const fetcher = async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(JSON.stringify({
      data: {
        store: {
          id: '1',
          name: 'Live Store',
          slug: 'live-store',
          managed_domain: 'live-store.bisora.app',
          custom_domain: null,
          currency: 'MYR',
          status: 'live',
          published_url: 'https://live-store.bisora.app',
          branding: {},
        },
        pages: [],
        blog_posts: [],
        products: [],
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  await fetchPublicStorefront('live-store', { baseUrl: 'https://api.bisora.test/api', fetcher });

  assert.equal(calls[0], 'https://api.bisora.test/api/storefront/live-store');
}

async function testSubmitPublicCheckoutPostsBuyerOrder() {
  let requestBody = '';
  let requestMethod = '';
  const calls: string[] = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push(String(url));
    requestMethod = init?.method ?? '';
    requestBody = String(init?.body ?? '');

    return new Response(JSON.stringify({
      data: {
        id: 55,
        number: 'ORD-260524-0001',
        total: 25800,
        payment_status: 'pending',
        fulfillment_status: 'unfulfilled',
        customer: { id: 9, name: 'Nur Aisyah', email: 'nur@example.test', status: 'new' },
      },
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  };

  const order = await submitPublicCheckout('live-store', {
    customer: { name: 'Nur Aisyah', email: 'nur@example.test', phone: '+60123456789' },
    shippingAddress: { addressLine1: 'No 12 Jalan Demo', city: 'Kuala Lumpur', postcode: '50000', country: 'Malaysia' },
    shippingMethod: {
      id: 'sz-1-wr-1',
      label: 'J&T EXPRESS (2-3 working days)',
      zoneName: 'Semenanjung',
      courier: 'J&T EXPRESS',
      service: 'J&T EXPRESS (2-3 working days)',
      amount: 6,
    },
    paymentMethod: 'manual_bank_transfer',
    items: [{ productId: '10', quantity: 2 }],
  }, { baseUrl: 'https://api.bisora.test/api', fetcher });

  assert.equal(calls[0], 'https://api.bisora.test/api/storefront/live-store/checkout');
  assert.equal(requestMethod, 'POST');
  assert.deepEqual(JSON.parse(requestBody), {
    customer: { name: 'Nur Aisyah', email: 'nur@example.test', phone: '+60123456789' },
    shipping_address: { address_line_1: 'No 12 Jalan Demo', city: 'Kuala Lumpur', postcode: '50000', country: 'Malaysia' },
    shipping_method: {
      id: 'sz-1-wr-1',
      label: 'J&T EXPRESS (2-3 working days)',
      zone_name: 'Semenanjung',
      courier: 'J&T EXPRESS',
      service: 'J&T EXPRESS (2-3 working days)',
      amount: 600,
    },
    payment_method: 'manual_bank_transfer',
    items: [{ product_id: 10, quantity: 2 }],
  });
  assert.equal(order.number, 'ORD-260524-0001');
  assert.equal(order.total, 258);
  assert.equal(order.customer.email, 'nur@example.test');
}

async function testFetchPublicOrderUsesOrderNumberAndEmail() {
  const calls: string[] = [];
  const fetcher = async (url: string | URL | Request) => {
    calls.push(String(url));

    return new Response(JSON.stringify({
      data: {
        id: 55,
        number: 'ORD-260524-0001',
        total: 25800,
        payment_status: 'paid',
        settlement_status: 'processing',
        fulfillment_status: 'shipped',
        payment_method: 'manual_bank_transfer',
        items: [{ name: 'Premium Modal Hijab', sku: 'HIJAB-001', quantity: 2, price: 12900 }],
        shipping_address: { recipient: 'Nur Aisyah', city: 'Kuala Lumpur', country: 'Malaysia' },
        shipment: { courier: 'DHL', tracking_number: 'DHL-1', tracking_location: 'In transit' },
        customer: { id: 9, name: 'Nur Aisyah', email: 'nur@example.test', status: 'new' },
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const order = await fetchPublicOrder('live-store', 'ORD-260524-0001', 'nur@example.test', {
    baseUrl: 'https://api.bisora.test/api',
    fetcher,
  });

  assert.equal(calls[0], 'https://api.bisora.test/api/storefront/live-store/orders/ORD-260524-0001?email=nur%40example.test');
  assert.equal(order.number, 'ORD-260524-0001');
  assert.equal(order.total, 258);
  assert.equal(order.shipment.trackingNumber, 'DHL-1');
}

testMapsPublicStorefrontFromApi();
await testFetchPublicStorefrontUsesPublicEndpoint();
await testSubmitPublicCheckoutPostsBuyerOrder();
await testFetchPublicOrderUsesOrderNumberAndEmail();

console.log('public storefront api tests passed');
