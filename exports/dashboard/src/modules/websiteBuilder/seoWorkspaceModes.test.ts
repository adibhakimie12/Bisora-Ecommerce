import test from 'node:test';
import assert from 'node:assert/strict';

import { seoWorkspaceModes } from './seoWorkspaceModes';

test('seo workspace exposes clear modes for pages and products', () => {
  assert.ok(seoWorkspaceModes.some((mode) => mode.key === 'pages' && mode.label === 'Pages'));
  assert.ok(seoWorkspaceModes.some((mode) => mode.key === 'products' && mode.label === 'Products'));
});
