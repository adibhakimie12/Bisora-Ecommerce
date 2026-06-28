import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRobotsTxt } from './robots';

test('buildRobotsTxt includes default allow/disallow rules and sitemap', () => {
  const robots = buildRobotsTxt({
    siteUrl: 'https://bisora.com',
  });

  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \/products\//);
  assert.match(robots, /Allow: \/collections\//);
  assert.match(robots, /Allow: \/pages\//);
  assert.match(robots, /Disallow: \/admin/);
  assert.match(robots, /Disallow: \/checkout/);
  assert.match(robots, /Disallow: \/cart/);
  assert.match(robots, /Disallow: \/__internal/);
  assert.match(robots, /Sitemap: https:\/\/bisora\.com\/sitemap\.xml/);
});

test('buildRobotsTxt supports future customization overrides', () => {
  const robots = buildRobotsTxt({
    siteUrl: 'https://bisora.com',
    additionalAllow: ['/lookbook/'],
    additionalDisallow: ['/private-preview/'],
  });

  assert.match(robots, /Allow: \/lookbook\//);
  assert.match(robots, /Disallow: \/private-preview\//);
});
