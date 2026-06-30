import test from 'node:test';
import assert from 'node:assert/strict';

import { themeLibraryPresets } from '../websiteBuilder/themeLibrary';
import { buildPublicStorefrontThemeRuntime } from './publicStorefrontTheme';
import type { PublicStorefrontViewModel } from './publicStorefrontViewModel';

const viewModel: PublicStorefrontViewModel = {
  brandName: 'By Shayl',
  tagline: 'Ready to shop',
  domainLabel: 'byshayl.bisora.app',
  productCountLabel: '1 product',
  heroProductImage: '',
  theme: {
    primaryColor: '#4f46e5',
    accentColor: '#e0e7ff',
    neutralColor: '#f8fafc',
  },
  products: [],
};

test('public storefront runtime applies the luxe published theme shell', () => {
  const theme = themeLibraryPresets.find((item) => item.id === 'luxe-atelier');
  assert.ok(theme);

  const runtime = buildPublicStorefrontThemeRuntime(theme, viewModel);

  assert.equal(runtime.accent, '#8a7b6c');
  assert.match(runtime.shellClassName, /#f7f3ed/);
  assert.match(runtime.headingClassName, /font-serif/);
  assert.equal(runtime.collectionHeading, 'Shop the collection');
});

test('public storefront runtime switches styling for campaign themes', () => {
  const theme = themeLibraryPresets.find((item) => item.id === 'campaign-glow');
  assert.ok(theme);

  const runtime = buildPublicStorefrontThemeRuntime(theme, viewModel);

  assert.equal(runtime.accent, '#d49d4d');
  assert.match(runtime.buttonClassName, /rounded-xl/);
  assert.match(runtime.cardClassName, /shadow-sm/);
});
