import type { SeoRecommendationCard } from './seo';

export interface SeoHelpQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface SeoGuideItem {
  label: string;
  text: string;
}

export interface SimplifiedSeoState {
  label: 'Needs Fixing' | 'Almost Ready' | 'Ready';
  note: string;
  tone: 'warning' | 'good' | 'strong';
}

export function getSimplifiedSeoState(scoreLabel: string): SimplifiedSeoState {
  if (scoreLabel === 'Strong') {
    return {
      label: 'Ready',
      note: 'Your page is in good shape for Google and link sharing.',
      tone: 'strong',
    };
  }

  if (scoreLabel === 'Good') {
    return {
      label: 'Almost Ready',
      note: 'A few small improvements can make this page clearer before publish.',
      tone: 'good',
    };
  }

  return {
    label: 'Needs Fixing',
    note: 'Focus on the basics first: title, description, slug, and sharing image.',
    tone: 'warning',
  };
}

export function buildSeoHelpQuestions(scope: 'pages' | 'products'): SeoHelpQuestion[] {
  const subject = scope === 'pages' ? 'page' : 'product';
  const modeAnswer =
    scope === 'pages'
      ? 'Use Pages for homepage, about page, contact page, size guide, and other normal storefront pages.'
      : 'Use Products for the items you sell, so each product can have its own search title, description, and share preview.';

  return [
    {
      id: 'seo-basics',
      question: 'SEO ni untuk apa?',
      answer: 'SEO helps Google understand your website, products, and pages so people can discover your store from search results.',
    },
    {
      id: 'pages-vs-products',
      question: 'Apa beza Pages dan Products?',
      answer: modeAnswer,
    },
    {
      id: 'seo-title',
      question: 'What is SEO title?',
      answer: `This is the main title Google usually shows for your ${subject}. Keep it short and clear.`,
    },
    {
      id: 'meta-description',
      question: 'What is meta description?',
      answer: `This is the short summary under the title in search results. It helps people decide whether to click your ${subject}.`,
    },
    {
      id: 'slug',
      question: 'What is slug?',
      answer: `Slug is the link part of the URL. A clean slug makes your ${subject} easier to understand and share.`,
    },
    {
      id: 'share-image',
      question: 'Upload image ni untuk apa?',
      answer: 'This is the share image shown when your link is shared on WhatsApp, Facebook, Telegram, or other social apps.',
    },
    {
      id: 'blog-only',
      question: 'Blog sahaja cukup ke untuk SEO?',
      answer: 'No. Blog helps bring traffic, but products and pages also need SEO so Google can understand what you sell and what each page is about.',
    },
    {
      id: 'indexing',
      question: 'Why is my page not on Google yet?',
      answer: 'Google usually needs time to crawl and index new content. A connected domain and submitted sitemap help discovery.',
    },
  ];
}

export function getTopSeoRecommendations(cards: SeoRecommendationCard[], limit = 3) {
  return cards.slice(0, limit);
}

export function buildSeoGuideItems(): SeoGuideItem[] {
  return [
    {
      label: 'Pages',
      text: 'Use this for homepage, about, contact, size guide, and other normal storefront pages.',
    },
    {
      label: 'Products',
      text: 'Use this for the items you sell so each product has its own Google title, description, and link preview.',
    },
    {
      label: 'Blog',
      text: 'Blog helps bring traffic from Google, but it is only one part of SEO, not the whole thing.',
    },
    {
      label: 'Share Image',
      text: 'This is the image people see when your link is shared on WhatsApp or social media.',
    },
  ];
}
