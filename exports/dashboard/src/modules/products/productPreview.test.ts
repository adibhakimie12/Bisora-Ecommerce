import assert from 'node:assert/strict';
import { buildProductPreviewHash } from './productPreview';

function testBuildsLiveStorefrontProductHash() {
  const hash = buildProductPreviewHash(
    { id: 'prod-1', slug: 'comfy-tshirt', title: 'Comfy Tshirt' },
    { slug: 'byshayl' },
  );

  assert.equal(hash, '#/store/byshayl/product/comfy-tshirt');
}

function testFallsBackToSlugifiedTitle() {
  const hash = buildProductPreviewHash(
    { id: 'prod-2', slug: '', title: 'Premium Bawal Comfy' },
    { slug: 'my test store' },
  );

  assert.equal(hash, '#/store/my%20test%20store/product/premium-bawal-comfy');
}

testBuildsLiveStorefrontProductHash();
testFallsBackToSlugifiedTitle();

console.log('product preview tests passed');
