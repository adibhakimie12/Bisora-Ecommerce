import test from 'node:test';
import assert from 'node:assert/strict';

import type { BlogPost } from '../storefront/blogStore';
import {
  applyBlogAiAction,
  createBlogSlug,
  ensureBlogSlug,
  resolveBlogPreview,
} from './blogAssistant';

const basePost: BlogPost = {
  id: 'blog-1',
  title: 'How to Choose a Premium Abaya for Daily Elegance',
  status: 'Draft',
  slug: '',
  keyword: 'premium abaya malaysia',
  primaryKeyword: 'premium abaya malaysia',
  summary: 'SEO article meant to attract search traffic while naturally guiding visitors into the signature collection.',
  metaDescription: '',
  seoTitle: '',
  coverImage: 'Editorial cover image',
  coverImagePreview: 'https://picsum.photos/seed/blog/400/240',
  author: 'Sarah',
  publishDate: '2026-04-23',
  content:
    'Hook: Premium abaya buying should feel clearer. Problem: Many shoppers do not know what to look for. Solution: Focus on fabric, cut, and comfort.',
  outline: ['Hook', 'Problem', 'Solution', 'Product Mention', 'CTA'],
  relatedProductIds: ['prod-abaya-silk'],
  relatedCollectionIds: ['cat-evening'],
  relatedPostIds: [],
  ctaBlocks: [
    { id: 'cta-buy', type: 'buy-now', label: 'Buy Now', href: '/products/silk-evening-abaya' },
    { id: 'cta-wa', type: 'whatsapp', label: 'WhatsApp Us', href: 'https://wa.me/60123456789' },
  ],
  contentFlow: {
    hook: 'Start with a compelling opening.',
    problem: 'Explain the buyer hesitation.',
    solution: 'Show the answer clearly.',
    productMention: 'Introduce the featured product naturally.',
    cta: 'Invite the next step.',
  },
};

test('createBlogSlug generates a clean blog slug from title', () => {
  assert.equal(createBlogSlug('How to Choose a Premium Abaya for Daily Elegance'), '/blog/how-to-choose-a-premium-abaya-for-daily-elegance');
});

test('ensureBlogSlug keeps slugs unique among blog posts', () => {
  const slug = ensureBlogSlug('/blog/how-to-choose-a-premium-abaya', [
    { id: 'blog-1', slug: '/blog/how-to-choose-a-premium-abaya' },
    { id: 'blog-2', slug: '/blog/how-to-choose-a-premium-abaya-2' },
  ], 'blog-3');

  assert.equal(slug, '/blog/how-to-choose-a-premium-abaya-3');
});

test('applyBlogAiAction can generate a blog outline and full article', () => {
  const outlined = applyBlogAiAction(basePost, 'outline');
  const drafted = applyBlogAiAction(basePost, 'article');

  assert.equal(outlined.outline.length, 5);
  assert.match(drafted.content, /Hook|Problem|Solution|Product Mention|CTA/i);
});

test('applyBlogAiAction supports beginner AI content actions for blog creation', () => {
  const titles = applyBlogAiAction(basePost, 'title-suggestions');
  const headings = applyBlogAiAction(basePost, 'heading-suggestions');
  const keywordArticle = applyBlogAiAction(basePost, 'keyword-article');
  const expanded = applyBlogAiAction({ ...basePost, content: 'Short intro only.' }, 'expand');
  const rewritten = applyBlogAiAction({ ...basePost, content: 'This is a basic draft without target phrase.' }, 'rewrite-seo');

  assert.ok((titles.aiTitleSuggestions?.length ?? 0) >= 3);
  assert.ok((headings.aiHeadingSuggestions?.h2.length ?? 0) >= 3);
  assert.match(keywordArticle.content, /#|##|guide|buyers/i);
  assert.ok(expanded.content.length > 'Short intro only.'.length);
  assert.match(rewritten.content, /keyword|rewritten|clearer/i);
});

test('applyBlogAiAction improves readability and inserts keyword naturally', () => {
  const improved = applyBlogAiAction(
    { ...basePost, content: 'Premium abaya buyers often feel confused because there are too many choices and too much unclear product wording.' },
    'readability',
  );
  const keyworded = applyBlogAiAction({ ...basePost, content: 'This article helps buyers choose with more confidence.' }, 'keyword');

  assert.match(improved.content, /clear|simple|easier/i);
  assert.match(keyworded.content, /premium abaya malaysia/i);
});

test('resolveBlogPreview builds a Google-style preview from blog SEO fields', () => {
  const preview = resolveBlogPreview({ ...basePost, seoTitle: 'Premium Abaya Guide | Bisora', metaDescription: 'Learn how to choose a premium abaya with confidence.' });

  assert.equal(preview.title, 'Premium Abaya Guide | Bisora');
  assert.equal(preview.description, 'Learn how to choose a premium abaya with confidence.');
  assert.equal(preview.url, 'bisora.com/blog/how-to-choose-a-premium-abaya-for-daily-elegance');
});
