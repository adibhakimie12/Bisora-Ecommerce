import { categories } from '../products/data';

export interface BlogPost {
  id: string;
  title: string;
  status: 'Draft' | 'Published';
  keyword: string;
  summary: string;
  coverImage: string;
  coverImagePreview?: string;
}

const BLOG_STORAGE_KEY = 'bisora-storefront-blog-posts';

export const blogSeed: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'How to Choose a Premium Abaya for Daily Elegance',
    status: 'Published',
    keyword: 'premium abaya malaysia',
    summary: 'SEO article meant to attract search traffic while naturally guiding visitors into the signature collection.',
    coverImage: 'Editorial cover image',
    coverImagePreview: categories[0]?.coverUrl,
  },
  {
    id: 'blog-2',
    title: 'Styling a Hijab Capsule Wardrobe for Work and Raya',
    status: 'Draft',
    keyword: 'hijab capsule wardrobe',
    summary: 'Content piece designed for organic search and remarketing support.',
    coverImage: 'Styling article cover',
    coverImagePreview: categories[1]?.coverUrl,
  },
];

export function loadBlogPosts(): BlogPost[] {
  if (typeof window === 'undefined') {
    return blogSeed;
  }

  const saved = window.localStorage.getItem(BLOG_STORAGE_KEY);
  if (!saved) {
    return blogSeed;
  }

  try {
    return JSON.parse(saved) as BlogPost[];
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
