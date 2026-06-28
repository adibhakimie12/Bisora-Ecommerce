import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applySeoAction,
  buildSeoRecommendations,
  buildSeoValidation,
  ensurePageSlug,
  getSeoWorkspaceState,
  resolvePageSeoState,
  sanitizePageSlug,
  suggestKeywordInsights,
  type WebsiteBuilderPageSeoInput,
} from './seo';

const basePage: WebsiteBuilderPageSeoInput = {
  id: 'about',
  title: 'About The Brand',
  purpose: 'Brand story and trust-building summary for the storefront.',
  pageType: 'Custom Page',
  heroHeading: 'A Quiet Luxury Story',
  subheading: 'Tell buyers why the brand exists and what makes the perspective distinct.',
  cta: 'Read Our Story',
  seoTitle: '',
  metaDescription: '',
  primaryKeyword: 'quiet luxury modestwear',
  slug: '',
  openGraphImage: '',
  slugManuallyEdited: false,
};

test('resolvePageSeoState falls back to page content and auto-generates slug', () => {
  const resolved = resolvePageSeoState(basePage, [
    {
      id: 'homepage',
      slug: '/',
      title: 'Homepage',
      heroHeading: 'Define Your Grace',
      seoTitle: '',
      metaDescription: '',
      purpose: '',
      subheading: '',
      cta: '',
      primaryKeyword: '',
      openGraphImage: '',
      pageType: 'Homepage',
      slugManuallyEdited: false,
    },
    basePage,
  ]);

  assert.equal(resolved.title, 'About The Brand');
  assert.match(resolved.description, /Brand story and trust-building summary/i);
  assert.equal(resolved.slug, '/about-the-brand');
  assert.equal(resolved.url, 'https://bisora.com/about-the-brand');
  assert.equal(resolved.openGraphImage, '');
});

test('ensurePageSlug keeps manual override unique and sanitized', () => {
  const slug = ensurePageSlug('/Pages/About The Brand!!!', [
    { id: 'about', slug: '/about-the-brand' },
    { id: 'about-2', slug: '/pages/about-the-brand' },
  ], 'about');

  assert.equal(slug, '/pages/about-the-brand-2');
});

test('sanitizePageSlug removes special characters and normalizes separators', () => {
  assert.equal(sanitizePageSlug('  /Pages//New @ Brand!!!  '), '/pages/new-brand');
});

test('buildSeoValidation returns beginner-friendly warnings and recommendations', () => {
  const resolved = resolvePageSeoState(
    {
      ...basePage,
      seoTitle: 'Short',
      metaDescription: 'Tiny description.',
      slug: '/Bad Slug',
      openGraphImage: '',
    },
    [basePage],
  );

  const validation = buildSeoValidation(
    {
      ...basePage,
      seoTitle: 'Short',
      metaDescription: 'Tiny description.',
      slug: '/Bad Slug',
      openGraphImage: '',
    },
    resolved,
  );

  assert.equal(validation.title.status, 'warning');
  assert.equal(validation.description.status, 'warning');
  assert.equal(validation.keyword.status, 'warning');
  assert.equal(validation.slug.status, 'warning');
  assert.equal(validation.openGraphImage.status, 'warning');
  assert.match(validation.slug.recommendation, /lowercase/i);
});

test('applySeoAction generates usable title and description suggestions', () => {
  const titled = applySeoAction(basePage, 'title');
  const described = applySeoAction(basePage, 'description');
  const keyworded = applySeoAction({ ...basePage, seoTitle: 'About The Brand' }, 'keyword');
  const shortened = applySeoAction(
    {
      ...basePage,
      seoTitle: 'About The Brand for Quiet Luxury Modestwear Lovers Who Want a Long Search Result',
      metaDescription:
        'This is an extremely long meta description written to make sure the shorter helper trims the copy into a more realistic search result length for preview cards.',
    },
    'shorten',
  );

  assert.match(titled.seoTitle, /quiet luxury modestwear|custom page/i);
  assert.match(described.metaDescription, /quiet luxury modestwear|Brand story/i);
  assert.match(keyworded.seoTitle, /quiet luxury modestwear/i);
  assert.ok(shortened.seoTitle.length <= 60);
  assert.ok(shortened.metaDescription.length <= 155);
});

test('suggestKeywordInsights returns a simple primary keyword and related keyword ideas', () => {
  const suggestions = suggestKeywordInsights({
    ...basePage,
    primaryKeyword: '',
    title: 'Abaya Size Guide',
    heroHeading: 'Find Your Best Abaya Fit',
    purpose: 'Help buyers choose the correct abaya size with less hesitation before checkout.',
    cta: 'Check Size Guide',
  });

  assert.match(suggestions.primaryKeyword, /abaya/i);
  assert.ok(suggestions.relatedKeywords.length >= 3);
  assert.ok(suggestions.relatedKeywords.length <= 5);
  assert.ok(suggestions.relatedKeywords.some((keyword) => /size/i.test(keyword)));
});

test('suggestKeywordInsights shows keyword usage for title description and slug', () => {
  const suggestions = suggestKeywordInsights(
    {
      ...basePage,
      primaryKeyword: 'abaya size guide',
      seoTitle: 'Lumiere Noor Size Guide',
      metaDescription: 'Use this abaya size guide before placing your order.',
      slug: '/pages/size-help',
      slugManuallyEdited: true,
    },
    {
      title: 'Lumiere Noor Size Guide',
      description: 'Use this abaya size guide before placing your order.',
      slug: '/pages/size-help',
      url: 'https://bisora.com/pages/size-help',
      openGraphImage: '',
    },
  );

  assert.equal(suggestions.usage.title.status, 'warning');
  assert.equal(suggestions.usage.description.status, 'good');
  assert.equal(suggestions.usage.slug.status, 'warning');
  assert.match(suggestions.usage.title.note, /missing from title/i);
  assert.match(suggestions.usage.description.note, /appears naturally in description/i);
  assert.match(suggestions.usage.slug.note, /slug can be improved/i);
});

test('getSeoWorkspaceState maps score into premium assistant states', () => {
  assert.equal(getSeoWorkspaceState('Strong').label, 'Strong SEO Setup');
  assert.equal(getSeoWorkspaceState('Good').label, 'Quick Win');
  assert.equal(getSeoWorkspaceState('Fair').label, 'Needs Improvement');
});

test('applySeoAction supports premium tone chips', () => {
  const elegant = applySeoAction({ ...basePage, seoTitle: 'About The Brand', metaDescription: 'Learn our story and values.' }, 'elegant');
  const brandLed = applySeoAction({ ...basePage, seoTitle: 'About The Brand', metaDescription: 'Learn our story and values.' }, 'brand');
  const conversion = applySeoAction({ ...basePage, seoTitle: 'About The Brand', metaDescription: 'Learn our story and values.' }, 'conversion');

  assert.match(elegant.seoTitle, /atelier|refined|elegant|luxury/i);
  assert.match(brandLed.metaDescription, /brand|signature|story/i);
  assert.match(conversion.metaDescription, /discover|shop|explore|buy/i);
});

test('buildSeoRecommendations returns compact premium recommendation cards', () => {
  const resolved = resolvePageSeoState(
    {
      ...basePage,
      seoTitle: 'Short',
      metaDescription: 'Tiny description.',
      slug: '/bad slug',
      openGraphImage: '',
      primaryKeyword: 'quiet luxury modestwear',
    },
    [basePage],
  );
  const validation = buildSeoValidation(
    {
      ...basePage,
      seoTitle: 'Short',
      metaDescription: 'Tiny description.',
      slug: '/bad slug',
      openGraphImage: '',
      primaryKeyword: 'quiet luxury modestwear',
    },
    resolved,
  );
  const keywordInsights = suggestKeywordInsights(
    {
      ...basePage,
      seoTitle: 'Short',
      metaDescription: 'Tiny description.',
      slug: '/bad slug',
      openGraphImage: '',
      primaryKeyword: 'quiet luxury modestwear',
    },
    resolved,
  );

  const cards = buildSeoRecommendations(
    {
      ...basePage,
      seoTitle: 'Short',
      metaDescription: 'Tiny description.',
      slug: '/bad slug',
      openGraphImage: '',
      primaryKeyword: 'quiet luxury modestwear',
    },
    resolved,
    validation,
    keywordInsights,
  );

  assert.ok(cards.some((card) => /Improve title clarity/i.test(card.title)));
  assert.ok(cards.some((card) => /Add keyword to description/i.test(card.title)));
  assert.ok(cards.some((card) => /Shorten title length|Improve title clarity/i.test(card.title)));
  assert.ok(cards.some((card) => /Rewrite description for better clicks/i.test(card.title)));
  assert.ok(cards.some((card) => /Add Open Graph image for stronger sharing/i.test(card.title)));
});
