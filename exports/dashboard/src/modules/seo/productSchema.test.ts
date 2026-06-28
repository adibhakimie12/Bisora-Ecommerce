import test from 'node:test';
import assert from 'node:assert/strict';

import { products } from '../products/data';
import { buildProductSchema, mapProductAvailability, toProductSchemaJson } from './productSchema';

test('mapProductAvailability returns in stock for active products with stock', () => {
  assert.equal(mapProductAvailability(products[0]), 'https://schema.org/InStock');
});

test('mapProductAvailability returns out of stock when inventory is empty', () => {
  assert.equal(
    mapProductAvailability({ ...products[0], stock: 0, stockState: 'Out of Stock' }),
    'https://schema.org/OutOfStock',
  );
});

test('mapProductAvailability returns discontinued for hidden or unpublished products', () => {
  assert.equal(mapProductAvailability(products[3]), 'https://schema.org/Discontinued');
});

test('buildProductSchema returns rich result product payload from catalog data', () => {
  const schema = buildProductSchema(products[0], { siteUrl: 'https://bisora.com', currency: 'MYR' });

  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema['@type'], 'Product');
  assert.equal(schema.name, products[0].title);
  assert.equal(schema.description, products[0].seoDescription);
  assert.equal(schema.image, products[0].thumbnailUrl);
  assert.equal(schema.offers.price, '360.00');
  assert.equal(schema.offers.priceCurrency, 'MYR');
  assert.equal(schema.offers.url, 'https://bisora.com/products/silk-evening-abaya');
  assert.equal(schema.offers.availability, 'https://schema.org/InStock');
});

test('toProductSchemaJson serializes schema into JSON-LD safe text', () => {
  const json = toProductSchemaJson(products[1], { siteUrl: 'https://bisora.com' });

  assert.match(json, /"@type":"Product"/);
  assert.match(json, /"priceCurrency":"MYR"/);
  assert.match(json, /"url":"https:\/\/bisora\.com\/products\/premium-modal-hijab"/);
});
