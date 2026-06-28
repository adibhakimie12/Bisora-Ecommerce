import test from 'node:test';
import assert from 'node:assert/strict';

import { getImagePerformanceProps } from './performance';

test('getImagePerformanceProps prioritizes hero images', () => {
  const props = getImagePerformanceProps('hero');

  assert.equal(props.loading, 'eager');
  assert.equal(props.decoding, 'sync');
  assert.equal(props.fetchPriority, 'high');
  assert.match(props.sizes, /100vw/);
});

test('getImagePerformanceProps lazily loads card images', () => {
  const props = getImagePerformanceProps('card');

  assert.equal(props.loading, 'lazy');
  assert.equal(props.decoding, 'async');
  assert.equal(props.fetchPriority, 'auto');
  assert.match(props.sizes, /50vw|25vw/);
});

test('getImagePerformanceProps keeps thumbnails lightweight', () => {
  const props = getImagePerformanceProps('thumbnail');

  assert.equal(props.loading, 'lazy');
  assert.equal(props.decoding, 'async');
  assert.equal(props.fetchPriority, 'low');
});
