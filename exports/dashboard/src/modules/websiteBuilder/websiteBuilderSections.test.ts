import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeWebsiteBuilderSection, websiteBuilderTabs } from './websiteBuilderSections';

test('websiteBuilderTabs includes the new SEO tab', () => {
  assert.ok(websiteBuilderTabs.some((tab) => tab.key === 'page-seo' && tab.label === 'SEO'));
});

test('normalizeWebsiteBuilderSection accepts page-seo and falls back safely', () => {
  assert.equal(normalizeWebsiteBuilderSection('page-seo'), 'page-seo');
  assert.equal(normalizeWebsiteBuilderSection('unknown-section'), 'overview');
});
