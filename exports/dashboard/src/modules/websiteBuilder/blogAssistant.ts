import type { BlogPost } from '../storefront/blogStore';

type BlogAiAction =
  | 'title'
  | 'meta'
  | 'outline'
  | 'article'
  | 'readability'
  | 'keyword'
  | 'keyword-article'
  | 'title-suggestions'
  | 'heading-suggestions'
  | 'expand'
  | 'rewrite-seo';

export type BlogAiMode = 'template' | 'api';

export interface BlogAiRuntime {
  mode: BlogAiMode;
  endpoint?: string;
  apiKey?: string;
  connected?: boolean;
}

function sanitizeBlogSlugValue(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/[^\w\s/-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/-+/g, '-')
    .replace(/\/$/, '');

  return normalized.startsWith('/blog/') ? normalized : `/blog/${normalized.replace(/^\/+/, '')}`;
}

export function createBlogSlug(title: string) {
  return sanitizeBlogSlugValue(title || 'new-blog-post');
}

export function ensureBlogSlug(value: string, posts: Array<{ id: string; slug: string }>, currentId: string) {
  const cleaned = sanitizeBlogSlugValue(value);
  let candidate = cleaned;
  let counter = 2;

  while (posts.some((post) => post.id !== currentId && sanitizeBlogSlugValue(post.slug) === candidate)) {
    candidate = `${cleaned}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function shorten(value: string, limit: number) {
  const cleaned = value.trim();
  if (cleaned.length <= limit) {
    return cleaned;
  }

  return `${cleaned.slice(0, limit - 3).trim()}...`;
}

function pickTemplate(templates: string[], seed: string) {
  if (!templates.length) {
    return '';
  }

  const hash = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return templates[hash % templates.length];
}

function generateBlogTitle(post: BlogPost) {
  const keyword = (post.primaryKeyword || post.keyword).trim() || 'Buyer Guide';
  const baseTitle = post.title.trim() || 'Blog Post';
  const templates = [
    `${keyword} Guide | ${baseTitle}`,
    `How to Choose ${keyword} (Simple Guide)`,
    `${keyword}: What to Know Before You Buy`,
    `${baseTitle} | ${keyword} Tips`,
    `Beginner Guide to ${keyword}`,
    `${keyword} Checklist for New Buyers`,
    `${baseTitle}: Better ${keyword} Decisions`,
    `Practical ${keyword} Guide for Everyday Buyers`,
  ];
  return shorten(pickTemplate(templates, `${keyword}${baseTitle}`), 60).replace(/\s+/g, ' ');
}

function generateBlogMeta(post: BlogPost) {
  const keyword = (post.primaryKeyword || post.keyword).trim() || 'this topic';
  const summary = post.summary.trim() || 'A practical guide for buyers.';
  const templates = [
    `${summary} Learn ${keyword} with simple tips that help you choose the right products and collections.`,
    `Clear and beginner-friendly ${keyword} guide to help buyers compare better and shop with confidence.`,
    `Understand ${keyword} faster with practical advice, common mistakes to avoid, and smart next steps.`,
    `${keyword} explained in simple language so shoppers can decide quickly and confidently.`,
    `A quick ${keyword} walkthrough with useful examples and conversion-focused product direction.`,
  ];
  return shorten(pickTemplate(templates, `${keyword}${summary}`), 155);
}

function generateOutline(post: BlogPost) {
  return [
    `Hook: Why ${post.primaryKeyword || post.keyword} matters now`,
    'Problem: What buyers usually get wrong',
    'Solution: Clear steps and practical advice',
    'Product Mention: Introduce the relevant product or collection naturally',
    'CTA: Invite the next action',
  ];
}

function generateArticle(post: BlogPost) {
  const keyword = post.primaryKeyword || post.keyword;
  return [
    `Hook: ${post.title}`,
    `Problem: Buyers searching for ${keyword} often feel unsure because the options and language are unclear.`,
    `Solution: Break the decision into fabric, fit, use case, and styling so the article feels useful instead of promotional.`,
    `Product Mention: Bring in a matching product or collection naturally once the reader understands the solution.`,
    `CTA: Invite the reader to shop the featured edit, explore the collection, or message the brand on WhatsApp.`,
  ].join('\n\n');
}

function suggestTitles(post: BlogPost) {
  const keyword = (post.primaryKeyword || post.keyword).trim();
  const base = post.title.trim() || 'Helpful buyer guide';
  const shortKeyword = keyword || 'your niche keyword';

  return [
    `${shortKeyword}: A Simple Buyer Guide`,
    `${base} (${shortKeyword})`,
    `How to Choose Better ${shortKeyword}`,
    `${shortKeyword} Tips for First-Time Buyers`,
    `Beginner Guide: ${shortKeyword}`,
    `${shortKeyword} Made Simple`,
    `${shortKeyword}: What to Check Before Buying`,
    `Smart Buyer Tips for ${shortKeyword}`,
  ].map((title) => shorten(title, 60));
}

function suggestHeadings(post: BlogPost) {
  const keyword = (post.primaryKeyword || post.keyword).trim() || 'this topic';
  return {
    h1: shorten(`${keyword}: what buyers should know before they buy`, 70),
    h2: [
      `Why ${keyword} matters`,
      `Common mistakes buyers make`,
      `How to choose the right option`,
      'What to compare before checkout',
    ],
    h3: [
      'Quick checklist',
      'Price vs value',
      'Materials and quality',
      'Best fit for your needs',
    ],
  };
}

function generateArticleFromKeyword(post: BlogPost) {
  const keyword = (post.primaryKeyword || post.keyword).trim() || 'your keyword';
  const heading = post.title.trim() || `A practical guide to ${keyword}`;
  const intros = [
    `If you are searching for ${keyword}, this guide gives a simple path so you can decide with more confidence.`,
    `This article breaks down ${keyword} in a simple way so first-time buyers can choose without confusion.`,
    `Need help with ${keyword}? Here is a clean step-by-step approach to make better buying decisions.`,
    `Use this quick ${keyword} guide to compare options clearly and avoid expensive mistakes.`,
  ];
  const intro = pickTemplate(intros, `${post.id}${keyword}${heading}`);

  return [
    `# ${heading}`,
    '',
    intro,
    '',
    '## What most buyers get wrong',
    `Many shoppers feel overwhelmed because ${keyword} options look similar, but quality, fit, and long-term value can be very different.`,
    '',
    '## A simple way to choose',
    'Start with your use case, compare materials, then narrow to products with clear sizing and trusted reviews.',
    '',
    '## Recommended product direction',
    'Choose one product or one collection that matches your main need. Keep the choice focused and practical.',
    '',
    '## Final takeaway',
    `Use this checklist whenever you review ${keyword} so your final pick feels easy and informed.`,
    '',
    'Ready to continue? Explore the related product card or collection below.',
  ].join('\n');
}

function expandShortContent(post: BlogPost) {
  const current = post.content.trim();
  const keyword = (post.primaryKeyword || post.keyword).trim() || 'your keyword';
  if (current.length >= 420) {
    return current;
  }

  return [
    current || `This post helps buyers understand ${keyword} in simple terms.`,
    '',
    '## Practical examples',
    `When reviewing ${keyword}, compare one budget option, one balanced option, and one premium option before deciding.`,
    '',
    '## What to check before buying',
    'Look at sizing notes, delivery expectations, return policy, and real-use photos.',
    '',
    '## Next step',
    'Use the linked product and collection blocks to move from learning into action.',
  ].join('\n');
}

function rewriteForSeo(post: BlogPost) {
  const keyword = (post.primaryKeyword || post.keyword).trim();
  const raw = post.content.trim();
  const intro = raw.length ? raw : `${post.title}. This guide is written to help buyers choose faster.`;
  const withKeyword = keyword && !intro.toLowerCase().includes(keyword.toLowerCase())
    ? `${intro}\n\nMain focus keyword: ${keyword}.`
    : intro;

  return [
    withKeyword,
    '',
    'This version is rewritten with clearer sentences, stronger buyer intent, and natural keyword usage.',
  ].join('\n');
}

function mergeBlogPostPatch(post: BlogPost, patch: Partial<BlogPost>): BlogPost {
  return {
    ...post,
    ...patch,
    content: patch.content ?? post.content,
    title: patch.title ?? post.title,
    seoTitle: patch.seoTitle ?? post.seoTitle,
    metaDescription: patch.metaDescription ?? post.metaDescription,
    outline: patch.outline ?? post.outline,
    aiTitleSuggestions: patch.aiTitleSuggestions ?? post.aiTitleSuggestions,
    aiHeadingSuggestions: patch.aiHeadingSuggestions ?? post.aiHeadingSuggestions,
  };
}

async function applyBlogAiApiAction(post: BlogPost, action: BlogAiAction, runtime: BlogAiRuntime): Promise<BlogPost> {
  const endpoint = runtime.endpoint?.trim();
  if (!endpoint) {
    throw new Error('Missing AI endpoint');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (runtime.apiKey?.trim()) {
    headers.Authorization = `Bearer ${runtime.apiKey.trim()}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action,
      post,
      source: 'website-builder-blog',
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API request failed (${response.status})`);
  }

  const payload = (await response.json()) as { post?: Partial<BlogPost> };
  return mergeBlogPostPatch(post, payload.post ?? {});
}

export function applyBlogAiAction(post: BlogPost, action: BlogAiAction): BlogPost {
  if (action === 'title-suggestions') {
    return {
      ...post,
      aiTitleSuggestions: suggestTitles(post),
    };
  }

  if (action === 'heading-suggestions') {
    return {
      ...post,
      aiHeadingSuggestions: suggestHeadings(post),
    };
  }

  if (action === 'keyword-article') {
    return {
      ...post,
      outline: generateOutline(post),
      content: generateArticleFromKeyword(post),
    };
  }

  if (action === 'expand') {
    return {
      ...post,
      content: expandShortContent(post),
    };
  }

  if (action === 'rewrite-seo') {
    return {
      ...post,
      content: rewriteForSeo(post),
      seoTitle: post.seoTitle || generateBlogTitle(post),
      metaDescription: post.metaDescription || generateBlogMeta(post),
    };
  }

  if (action === 'title') {
    return {
      ...post,
      title: generateBlogTitle(post).replace(/ \| .+$/, ''),
      seoTitle: generateBlogTitle(post),
      slug: createBlogSlug(generateBlogTitle(post).replace(/ \| .+$/, '')),
    };
  }

  if (action === 'meta') {
    return {
      ...post,
      metaDescription: generateBlogMeta(post),
    };
  }

  if (action === 'outline') {
    return {
      ...post,
      outline: generateOutline(post),
    };
  }

  if (action === 'article') {
    return {
      ...post,
      outline: generateOutline(post),
      content: generateArticle(post),
    };
  }

  if (action === 'readability') {
    return {
      ...post,
      content: `${post.content}\n\nKeep each paragraph short and clear so the article feels easier to scan on mobile.`,
    };
  }

  return {
    ...post,
    content: post.content.toLowerCase().includes((post.primaryKeyword || post.keyword).toLowerCase())
      ? post.content
      : `${post.content}\n\nPrimary keyword: ${post.primaryKeyword || post.keyword}`,
  };
}

export async function applyBlogAiActionWithRuntime(
  post: BlogPost,
  action: BlogAiAction,
  runtime: BlogAiRuntime,
): Promise<BlogPost> {
  const canUseApi = runtime.mode === 'api' && runtime.connected && !!runtime.endpoint?.trim();
  if (canUseApi) {
    return applyBlogAiApiAction(post, action, runtime);
  }

  return applyBlogAiAction(post, action);
}

export async function testBlogAiConnection(runtime: BlogAiRuntime): Promise<boolean> {
  const endpoint = runtime.endpoint?.trim();
  if (!endpoint) {
    return false;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (runtime.apiKey?.trim()) {
      headers.Authorization = `Bearer ${runtime.apiKey.trim()}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'health',
        source: 'website-builder-blog',
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function resolveBlogPreview(post: BlogPost, siteUrl = 'https://bisora.com') {
  const title = post.seoTitle.trim() || post.title.trim();
  const description = post.metaDescription.trim() || post.summary.trim();
  const url = `${siteUrl}${(post.slug || createBlogSlug(post.title)).replace(/^\/+/, '/')}`.replace(/^https?:\/\//, '');

  return {
    title,
    description,
    url,
  };
}
