import { categories } from '../products/data';
import { fetchStoreSettings, saveStoreSettings } from '../../api/settings';

export type BlogPostStatus = 'Draft' | 'Published';
export type BlogCtaType = 'product-card' | 'buy-now' | 'whatsapp';

export interface BlogCtaBlock {
  id: string;
  type: BlogCtaType;
  label: string;
  href: string;
}

export interface BlogContentFlow {
  hook: string;
  problem: string;
  solution: string;
  productMention: string;
  cta: string;
}

export interface BlogHeadingSuggestions {
  h1: string;
  h2: string[];
  h3: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  status: BlogPostStatus;
  slug: string;
  keyword: string;
  primaryKeyword: string;
  summary: string;
  metaDescription: string;
  seoTitle: string;
  coverImage: string;
  coverImagePreview?: string;
  author: string;
  publishDate: string;
  content: string;
  outline: string[];
  relatedProductIds: string[];
  relatedCollectionIds: string[];
  relatedPostIds: string[];
  ctaBlocks: BlogCtaBlock[];
  contentFlow: BlogContentFlow;
  aiTitleSuggestions?: string[];
  aiHeadingSuggestions?: BlogHeadingSuggestions;
}

const BLOG_STORAGE_KEY = 'bisora-storefront-blog-posts';

function hasApiCredentials() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.localStorage.getItem('bisora.apiToken') && window.localStorage.getItem('bisora.tenantId'));
}

function createDefaultFlow(title: string): BlogContentFlow {
  return {
    hook: `Start with a clear reason why "${title}" matters to the reader.`,
    problem: 'Explain the buyer problem or hesitation in simple language.',
    solution: 'Show the answer with helpful guidance and practical steps.',
    productMention: 'Mention a relevant product or collection naturally inside the advice.',
    cta: 'End with a simple next step such as shop now, view collection, or WhatsApp us.',
  };
}

function toDefaultOutline() {
  return ['Hook', 'Problem', 'Solution', 'Product Mention', 'CTA'];
}

function normalizeLegacyBlogPost(
  post: Partial<BlogPost> & Pick<BlogPost, 'id' | 'title' | 'status' | 'keyword' | 'summary' | 'coverImage'>,
): BlogPost {
  const slugBase =
    post.slug?.trim() ||
    `/blog/${post.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')}`;

  return {
    id: post.id,
    title: post.title,
    status: post.status,
    slug: slugBase,
    keyword: post.keyword,
    primaryKeyword: post.primaryKeyword?.trim() || post.keyword,
    summary: post.summary,
    metaDescription: post.metaDescription?.trim() || post.summary,
    seoTitle: post.seoTitle?.trim() || post.title,
    coverImage: post.coverImage,
    coverImagePreview: post.coverImagePreview,
    author: post.author?.trim() || 'Bisora Team',
    publishDate: post.publishDate?.trim() || '2026-04-23',
    content:
      post.content?.trim() ||
      `Hook: ${post.title}\n\nProblem: Readers are searching for a clearer answer.\n\nSolution: Use this article to explain the topic simply and guide them into the store.\n\nProduct Mention: Recommend a matching product or collection.\n\nCTA: Invite them to shop, explore, or message the brand.`,
    outline: post.outline?.length ? post.outline : toDefaultOutline(),
    relatedProductIds: post.relatedProductIds ?? [],
    relatedCollectionIds: post.relatedCollectionIds ?? [],
    relatedPostIds: post.relatedPostIds ?? [],
    ctaBlocks:
      post.ctaBlocks?.length
        ? post.ctaBlocks
        : [
            {
              id: `${post.id}-buy-now`,
              type: 'buy-now',
              label: 'Buy Now',
              href: '/products/silk-evening-abaya',
            },
          ],
    contentFlow: post.contentFlow ?? createDefaultFlow(post.title),
    aiTitleSuggestions: post.aiTitleSuggestions ?? [],
    aiHeadingSuggestions: post.aiHeadingSuggestions,
  };
}

export const blogSeed: BlogPost[] = [
  normalizeLegacyBlogPost({
    id: 'blog-1',
    title: 'How to Choose a Premium Abaya for Daily Elegance',
    status: 'Published',
    keyword: 'premium abaya malaysia',
    summary: 'SEO article meant to attract search traffic while naturally guiding visitors into the signature collection.',
    coverImage: 'Editorial cover image',
    coverImagePreview: categories[0]?.coverUrl,
    author: 'Sarah',
    publishDate: '2026-04-20',
    relatedProductIds: ['prod-abaya-silk'],
    relatedCollectionIds: ['cat-evening'],
    ctaBlocks: [
      { id: 'blog-1-product', type: 'product-card', label: 'Featured Product', href: '/products/silk-evening-abaya' },
      { id: 'blog-1-whatsapp', type: 'whatsapp', label: 'WhatsApp Us', href: 'https://wa.me/60123456789' },
    ],
  }),
  normalizeLegacyBlogPost({
    id: 'blog-2',
    title: 'Styling a Hijab Capsule Wardrobe for Work and Raya',
    status: 'Draft',
    keyword: 'hijab capsule wardrobe',
    summary: 'Content piece designed for organic search and remarketing support.',
    coverImage: 'Styling article cover',
    coverImagePreview: categories[1]?.coverUrl,
    author: 'Nadia',
    publishDate: '2026-04-23',
    relatedCollectionIds: ['cat-everyday'],
  }),
];

export function normalizeBlogPost(post: Partial<BlogPost> & Pick<BlogPost, 'id' | 'title' | 'status' | 'keyword' | 'summary' | 'coverImage'>) {
  return normalizeLegacyBlogPost(post);
}

export function loadBlogPosts(): BlogPost[] {
  if (typeof window === 'undefined') {
    return blogSeed;
  }

  const saved = window.localStorage.getItem(BLOG_STORAGE_KEY);
  if (!saved) {
    return blogSeed;
  }

  try {
    const parsed = JSON.parse(saved) as Array<Partial<BlogPost> & Pick<BlogPost, 'id' | 'title' | 'status' | 'keyword' | 'summary' | 'coverImage'>>;
    return parsed.map(normalizeLegacyBlogPost);
  } catch {
    return blogSeed;
  }
}

export function saveBlogPosts(posts: BlogPost[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(posts));
}

export async function syncBlogPostsFromApi(options: { fallback?: BlogPost[] } = {}) {
  if (!hasApiCredentials()) {
    return options.fallback ?? loadBlogPosts();
  }

  try {
    const settings = await fetchStoreSettings();
    if (!Array.isArray(settings.settings.blog_posts)) {
      return options.fallback ?? loadBlogPosts();
    }

    const posts = settings.settings.blog_posts.map(
      (post) => normalizeLegacyBlogPost(post as Partial<BlogPost> & Pick<BlogPost, 'id' | 'title' | 'status' | 'keyword' | 'summary' | 'coverImage'>),
    );
    saveBlogPosts(posts);
    return posts;
  } catch {
    return options.fallback ?? loadBlogPosts();
  }
}

export async function saveBlogPostsToApi(posts: BlogPost[]) {
  if (!hasApiCredentials()) {
    return posts;
  }

  await saveStoreSettings({ settings: { blog_posts: posts } });
  return posts;
}
