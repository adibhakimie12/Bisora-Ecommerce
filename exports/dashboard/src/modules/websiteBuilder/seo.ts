import { buildCanonicalUrl, syncCanonicalUrl } from '../seo/canonical';

export interface WebsiteBuilderPageSeoInput {
  id: string;
  title: string;
  purpose: string;
  pageType: string;
  heroHeading: string;
  subheading: string;
  cta: string;
  seoTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  slug: string;
  openGraphImage: string;
  slugManuallyEdited?: boolean;
}

export interface WebsiteBuilderResolvedSeoState {
  title: string;
  description: string;
  slug: string;
  url: string;
  openGraphImage: string;
}

type ValidationStatus = 'good' | 'warning';

export interface SeoValidationItem {
  status: ValidationStatus;
  message: string;
  recommendation: string;
}

export interface SeoValidationResult {
  title: SeoValidationItem;
  description: SeoValidationItem;
  keyword: SeoValidationItem;
  slug: SeoValidationItem;
  openGraphImage: SeoValidationItem;
  warnings: string[];
}

export interface KeywordUsageItem {
  status: ValidationStatus;
  note: string;
}

export interface KeywordInsights {
  primaryKeyword: string;
  relatedKeywords: string[];
  usage: {
    title: KeywordUsageItem;
    description: KeywordUsageItem;
    slug: KeywordUsageItem;
  };
}

export interface SeoWorkspaceState {
  label: 'Quick Win' | 'Needs Improvement' | 'Strong SEO Setup';
  note: string;
  tone: 'good' | 'warning' | 'strong';
}

export interface SeoRecommendationCard {
  title: string;
  body: string;
  action: string;
}

export type SeoAction =
  | 'title'
  | 'description'
  | 'improve'
  | 'clickable'
  | 'elegant'
  | 'brand'
  | 'conversion'
  | 'keyword'
  | 'shorten'
  | 'regenerate';

export function buildPageSeoDescription(...parts: Array<string | undefined>) {
  const source = parts
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!source) return '';
  return source.length > 160 ? `${source.slice(0, 157).trim()}...` : source;
}

export function sanitizePageSlug(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/[^\w\s/-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/-+/g, '-')
    .replace(/\/-/g, '/')
    .replace(/-\//g, '/')
    .replace(/\/$/, '');

  if (!normalized) return '/pages/new-page';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export function createAutoPageSlug(page: Pick<WebsiteBuilderPageSeoInput, 'title' | 'heroHeading'>) {
  const source = page.title.trim() || page.heroHeading.trim() || 'new-page';
  return sanitizePageSlug(source);
}

export function ensurePageSlug(
  value: string,
  pages: Array<{ id: string; slug: string }>,
  currentId: string,
) {
  const cleaned = sanitizePageSlug(value);
  if (cleaned === '/') return '/';

  const segments = cleaned.split('/');
  const tail = segments[segments.length - 1] || 'page';
  const prefix = segments.slice(0, -1).join('/') || '';

  let candidate = cleaned;
  let counter = 2;

  while (pages.some((page) => page.id !== currentId && sanitizePageSlug(page.slug) === candidate)) {
    candidate = `${prefix ? `${prefix}/` : '/'}${tail}-${counter}`.replace(/\/+/g, '/');
    counter += 1;
  }

  return candidate;
}

export function generatePageSeoTitle(page: Pick<WebsiteBuilderPageSeoInput, 'title' | 'heroHeading' | 'primaryKeyword' | 'pageType'>) {
  const keyword = page.primaryKeyword.trim();
  const headline = page.heroHeading.trim() || page.title.trim() || page.pageType.trim();
  const title = keyword ? `${headline} | ${keyword}` : `${headline} | ${page.pageType}`;
  return shortenCopy(title, 60);
}

export function generatePageSeoDescription(
  page: Pick<WebsiteBuilderPageSeoInput, 'title' | 'heroHeading' | 'subheading' | 'purpose' | 'cta' | 'primaryKeyword' | 'pageType'>,
) {
  const bits = [
    page.primaryKeyword && `${page.primaryKeyword}.`,
    page.purpose,
    page.subheading,
    page.heroHeading || page.title,
    page.cta && `Action: ${page.cta}.`,
    `${page.pageType} page.`,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return shortenCopy(bits, 155);
}

export function improveSeoTitle(value: string, keyword: string) {
  const cleaned = value.trim();
  if (!cleaned) return keyword ? `${keyword} | Premium Page` : 'Premium Page';
  const withKeyword = keyword && !cleaned.toLowerCase().includes(keyword.toLowerCase()) ? `${cleaned} | ${keyword}` : cleaned;
  return shortenCopy(withKeyword, 60);
}

export function improveSeoDescription(value: string, keyword: string) {
  const cleaned = value.trim();
  const next =
    keyword && !cleaned.toLowerCase().includes(keyword.toLowerCase())
      ? `${cleaned} Discover ${keyword} with a clearer buyer-focused message.`
      : cleaned;
  return shortenCopy(next, 155);
}

export function makeSeoTitleClickable(value: string) {
  const cleaned = value.trim().replace(/\.+$/, '');
  const result = /discover|shop|explore|guide/i.test(cleaned) ? cleaned : `Discover ${cleaned}`;
  return shortenCopy(result, 60);
}

export function makeSeoDescriptionClickable(value: string) {
  const cleaned = value.trim();
  const result = /discover|shop|explore|learn/i.test(cleaned)
    ? cleaned
    : `${cleaned} Discover more and click through for the full page experience.`;
  return shortenCopy(result, 155);
}

export function insertKeywordNaturally(value: string, keyword: string) {
  const cleaned = value.trim();
  const normalizedKeyword = keyword.trim();
  if (!normalizedKeyword) return cleaned;
  if (cleaned.toLowerCase().includes(normalizedKeyword.toLowerCase())) return cleaned;
  return `${cleaned} ${normalizedKeyword}`.trim();
}

export function shortenCopy(value: string, limit: number) {
  const cleaned = value.trim();
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 3).trim()}...`;
}

export function resolvePageSeoState(
  page: WebsiteBuilderPageSeoInput,
  pages: Array<Pick<WebsiteBuilderPageSeoInput, 'id' | 'slug' | 'title' | 'heroHeading'>>,
  siteOrigin = 'https://bisora.com',
): WebsiteBuilderResolvedSeoState {
  const title = page.seoTitle.trim() || page.title.trim() || page.heroHeading.trim() || page.pageType.trim();
  const description =
    page.metaDescription.trim() ||
    buildPageSeoDescription(page.purpose, page.subheading, page.heroHeading, page.cta && `Action: ${page.cta}.`);
  const baseSlug = page.slugManuallyEdited ? page.slug.trim() || createAutoPageSlug(page) : createAutoPageSlug(page);
  const slug = ensurePageSlug(baseSlug, pages.map(({ id, slug: rawSlug = '' }) => ({ id, slug: rawSlug })), page.id);

  return {
    title,
    description,
    slug,
    url: buildCanonicalUrl(slug, siteOrigin),
    openGraphImage: page.openGraphImage.trim(),
  };
}

function buildValidationItem(status: ValidationStatus, message: string, recommendation: string): SeoValidationItem {
  return { status, message, recommendation };
}

export function buildSeoValidation(
  page: WebsiteBuilderPageSeoInput,
  resolved: WebsiteBuilderResolvedSeoState,
): SeoValidationResult {
  const rawTitle = page.seoTitle.trim() || resolved.title;
  const rawDescription = page.metaDescription.trim() || resolved.description;
  const keyword = page.primaryKeyword.trim().toLowerCase();
  const keywordPresent =
    !!keyword &&
    (resolved.title.toLowerCase().includes(keyword) || resolved.description.toLowerCase().includes(keyword));
  const slugInput = page.slug.trim();
  const slugLooksClean =
    !!slugInput &&
    slugInput === slugInput.toLowerCase() &&
    !/\s/.test(slugInput) &&
    sanitizePageSlug(slugInput) === resolved.slug;

  const title =
    rawTitle.length >= 50 && rawTitle.length <= 60
      ? buildValidationItem('good', 'Title length is in the recommended range.', 'Keep this title focused on one main keyword.')
      : buildValidationItem('warning', 'Title is outside the ideal 50-60 character range.', 'Aim for a title around 50-60 characters so it is easier to read in Google.');

  const description =
    rawDescription.length >= 140 && rawDescription.length <= 160
      ? buildValidationItem('good', 'Description length is search-friendly.', 'Keep the value proposition and keyword near the front.')
      : buildValidationItem('warning', 'Description is outside the ideal 140-160 character range.', 'Expand or trim the description so search engines show a cleaner snippet.');

  const keywordItem = keywordPresent
    ? buildValidationItem('good', 'Primary keyword appears in the visible search copy.', 'Keep using the keyword naturally, not repeatedly.')
    : buildValidationItem('warning', 'Primary keyword is missing from the search snippet.', 'Add the keyword once in the title or description so beginners know what the page ranks for.');

  const slug = slugLooksClean
    ? buildValidationItem('good', 'Slug format looks clean.', 'Keep lowercase words separated by hyphens.')
    : buildValidationItem('warning', 'Slug needs cleanup before publishing.', 'Use lowercase words with hyphens only, and avoid spaces or special characters.');

  const openGraphImage = page.openGraphImage.trim()
    ? buildValidationItem('good', 'Social share image is ready.', 'Use a branded image so shared links look consistent.')
    : buildValidationItem('warning', 'Open Graph image is missing.', 'Upload an image so WhatsApp, Facebook, and X have a visual card to show.');

  const warnings = [title, description, keywordItem, slug, openGraphImage]
    .filter((item) => item.status === 'warning')
    .map((item) => item.message);

  return { title, description, keyword: keywordItem, slug, openGraphImage, warnings };
}

function tokenizeKeywordSource(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function buildKeywordPhrase(tokens: string[], fallback: string) {
  const filtered = tokens.filter((token) => !STOP_WORDS.has(token));
  const deduped = Array.from(new Set(filtered));
  if (!deduped.length) return fallback;
  return deduped.slice(0, Math.min(3, deduped.length)).join(' ');
}

function keywordUsageNote(keyword: string, target: string, surface: 'title' | 'description' | 'slug'): KeywordUsageItem {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const normalizedTarget = target.trim().toLowerCase();
  const present = !!normalizedKeyword && normalizedTarget.includes(normalizedKeyword);

  if (present) {
    const positiveNotes = {
      title: 'Keyword appears naturally in title.',
      description: 'Keyword appears naturally in description.',
      slug: 'Keyword appears naturally in slug.',
    } as const;
    return { status: 'good', note: positiveNotes[surface] };
  }

  const warningNotes = {
    title: 'Primary keyword is missing from title.',
    description: 'Primary keyword is missing from description.',
    slug: 'Slug can be improved with the primary keyword.',
  } as const;
  return { status: 'warning', note: warningNotes[surface] };
}

export function suggestKeywordInsights(
  page: WebsiteBuilderPageSeoInput,
  resolved?: WebsiteBuilderResolvedSeoState,
): KeywordInsights {
  const keywordSource = [page.title, page.heroHeading, page.purpose, page.subheading, page.cta]
    .filter(Boolean)
    .join(' ');
  const sourceTokens = tokenizeKeywordSource(keywordSource);
  const fallbackKeyword = page.title.trim().toLowerCase() || page.pageType.trim().toLowerCase() || 'store page';
  const primaryKeyword = page.primaryKeyword.trim() || buildKeywordPhrase(sourceTokens, fallbackKeyword);
  const dedupedTokens = Array.from(new Set(sourceTokens.filter((token) => !STOP_WORDS.has(token))));
  const relatedCandidates = Array.from(
    new Set(
      [
        buildKeywordPhrase([...sourceTokens, 'online'], primaryKeyword),
        buildKeywordPhrase([...sourceTokens, 'shop'], primaryKeyword),
        buildKeywordPhrase([...sourceTokens, 'guide'], primaryKeyword),
        `${primaryKeyword} online`,
        `${primaryKeyword} shop`,
        `${primaryKeyword} guide`,
        dedupedTokens.slice(1, 4).join(' '),
        dedupedTokens.slice(0, 2).join(' '),
      ]
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword && keyword.toLowerCase() !== primaryKeyword.toLowerCase()),
    ),
  );
  const relatedKeywords = relatedCandidates.slice(0, Math.max(3, Math.min(5, relatedCandidates.length)));

  const seoState =
    resolved ??
    resolvePageSeoState(page, [
      {
        id: page.id,
        slug: page.slug,
        title: page.title,
        heroHeading: page.heroHeading,
      },
    ]);

  return {
    primaryKeyword,
    relatedKeywords,
    usage: {
      title: keywordUsageNote(primaryKeyword, seoState.title, 'title'),
      description: keywordUsageNote(primaryKeyword, seoState.description, 'description'),
      slug: keywordUsageNote(primaryKeyword, seoState.slug, 'slug'),
    },
  };
}

export function computePageSeoScore(validation: SeoValidationResult) {
  const items = [validation.title, validation.description, validation.keyword, validation.slug, validation.openGraphImage];
  const points = items.filter((item) => item.status === 'good').length;
  const label = points <= 1 ? 'Poor' : points <= 2 ? 'Fair' : points <= 4 ? 'Good' : 'Strong';
  return { points, label };
}

export function getSeoWorkspaceState(scoreLabel: string): SeoWorkspaceState {
  if (scoreLabel === 'Strong') {
    return {
      label: 'Strong SEO Setup',
      note: 'Your snippet is in a strong place. Use AI refinements only if you want to sharpen brand feel or clicks.',
      tone: 'strong',
    };
  }

  if (scoreLabel === 'Good') {
    return {
      label: 'Quick Win',
      note: 'A few focused improvements can make this page more clickable and polished.',
      tone: 'good',
    };
  }

  return {
    label: 'Needs Improvement',
    note: 'This page needs a few SEO basics before it is ready to perform well in search and social sharing.',
    tone: 'warning',
  };
}

export function buildSeoRecommendations(
  page: WebsiteBuilderPageSeoInput,
  resolved: WebsiteBuilderResolvedSeoState,
  validation: SeoValidationResult,
  keywordInsights: KeywordInsights,
): SeoRecommendationCard[] {
  const cards: SeoRecommendationCard[] = [];

  if (resolved.title.length < 45) {
    cards.push({
      title: 'Improve title clarity',
      body: 'Make the title more specific so buyers instantly understand what this page offers.',
      action: 'More Clickable',
    });
  } else if (resolved.title.length > 60) {
    cards.push({
      title: 'Shorten title length',
      body: 'Trim the title so Google shows the full message more consistently.',
      action: 'Shorter Version',
    });
  }

  if (keywordInsights.usage.description.status === 'warning') {
    cards.push({
      title: 'Add keyword to description',
      body: 'Place the main keyword naturally in the description so the page focus is clearer.',
      action: 'Insert Keyword',
    });
  }

  if (validation.description.status === 'warning') {
    cards.push({
      title: 'Rewrite description for better clicks',
      body: 'A sharper description can make the result feel more compelling and conversion-aware.',
      action: 'More Conversion-Focused',
    });
  }

  if (validation.openGraphImage.status === 'warning') {
    cards.push({
      title: 'Add Open Graph image for stronger sharing',
      body: 'A branded image helps shared links feel more premium in WhatsApp and social previews.',
      action: 'Upload Image',
    });
  }

  if (!cards.length) {
    cards.push({
      title: 'Refine the brand tone',
      body: 'Your SEO basics are healthy. Try a tone chip if you want the snippet to feel more premium or more persuasive.',
      action: 'More Brand-Led',
    });
  }

  return cards.slice(0, 5);
}

export function buildPageSeoChecklist(
  page: WebsiteBuilderPageSeoInput,
  resolved: WebsiteBuilderResolvedSeoState,
  validation: SeoValidationResult,
) {
  return [
    { label: 'SEO title ready', done: !!resolved.title.trim(), help: validation.title.recommendation },
    { label: 'Meta description ready', done: !!resolved.description.trim(), help: validation.description.recommendation },
    { label: 'URL slug ready', done: validation.slug.status === 'good', help: validation.slug.recommendation },
    { label: 'Primary keyword included', done: validation.keyword.status === 'good', help: validation.keyword.recommendation },
    { label: 'Open Graph image added', done: validation.openGraphImage.status === 'good', help: validation.openGraphImage.recommendation },
    { label: 'Fallbacks covered', done: !!page.title.trim() || !!page.heroHeading.trim() || !!page.purpose.trim(), help: 'If a field is left blank, page title, hero copy, and summary still power the SEO output.' },
  ];
}

export function getSeoLengthTone(length: number, min: number, max: number) {
  if (length >= min && length <= max) return 'good';
  if ((length >= min - 20 && length < min) || (length > max && length <= max + 20)) return 'fair';
  return 'poor';
}

export function applySeoAction(page: WebsiteBuilderPageSeoInput, action: SeoAction) {
  const generatedTitle = generatePageSeoTitle(page);
  const generatedDescription = generatePageSeoDescription(page);

  if (action === 'title') return { ...page, seoTitle: generatedTitle };
  if (action === 'description') return { ...page, metaDescription: generatedDescription };

  if (action === 'improve') {
    return {
      ...page,
      seoTitle: page.seoTitle.trim() ? improveSeoTitle(page.seoTitle, page.primaryKeyword) : generatedTitle,
      metaDescription: page.metaDescription.trim() ? improveSeoDescription(page.metaDescription, page.primaryKeyword) : generatedDescription,
    };
  }

  if (action === 'clickable') {
    return {
      ...page,
      seoTitle: makeSeoTitleClickable(page.seoTitle || generatedTitle),
      metaDescription: makeSeoDescriptionClickable(page.metaDescription || generatedDescription),
    };
  }

  if (action === 'elegant') {
    return {
      ...page,
      seoTitle: shortenCopy(`Refined ${page.seoTitle || generatedTitle} Atelier`, 60),
      metaDescription: shortenCopy(`Discover a refined, elegant edit shaped by ${page.title.toLowerCase()} and a premium brand experience.`, 155),
    };
  }

  if (action === 'brand') {
    return {
      ...page,
      seoTitle: shortenCopy(`${page.title} | Signature Brand Story`, 60),
      metaDescription: shortenCopy(`Explore the signature story, values, and brand perspective behind ${page.title.toLowerCase()}.`, 155),
    };
  }

  if (action === 'conversion') {
    return {
      ...page,
      seoTitle: makeSeoTitleClickable(page.seoTitle || generatedTitle),
      metaDescription: shortenCopy(`Discover ${page.title.toLowerCase()} and explore the page built to guide buyers toward the next click.`, 155),
    };
  }

  if (action === 'keyword') {
    return {
      ...page,
      seoTitle: insertKeywordNaturally(page.seoTitle || generatedTitle, page.primaryKeyword),
      metaDescription: insertKeywordNaturally(page.metaDescription || generatedDescription, page.primaryKeyword),
    };
  }

  if (action === 'shorten') {
    return {
      ...page,
      seoTitle: shortenCopy(page.seoTitle || generatedTitle, 60),
      metaDescription: shortenCopy(page.metaDescription || generatedDescription, 155),
    };
  }

  return {
    ...page,
    seoTitle: `${generatedTitle.replace(/ \| .+$/, '')} | ${page.pageType}`.trim(),
    metaDescription: generatedDescription,
  };
}

function ensureMetaTag(attribute: 'name' | 'property', key: string) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  return element;
}

export function syncDocumentSeo(resolved: WebsiteBuilderResolvedSeoState) {
  if (typeof document === 'undefined') return;

  const canonicalUrl = buildCanonicalUrl(resolved.url);

  document.title = resolved.title;
  ensureMetaTag('name', 'description').content = resolved.description;
  ensureMetaTag('property', 'og:title').content = resolved.title;
  ensureMetaTag('property', 'og:description').content = resolved.description;
  ensureMetaTag('property', 'og:type').content = 'website';
  ensureMetaTag('property', 'og:url').content = canonicalUrl;
  ensureMetaTag('property', 'og:image').content = resolved.openGraphImage;
  ensureMetaTag('name', 'twitter:card').content = resolved.openGraphImage ? 'summary_large_image' : 'summary';
  ensureMetaTag('name', 'twitter:title').content = resolved.title;
  ensureMetaTag('name', 'twitter:description').content = resolved.description;
  ensureMetaTag('name', 'twitter:image').content = resolved.openGraphImage;
  syncCanonicalUrl(canonicalUrl);
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'before',
  'by',
  'for',
  'from',
  'help',
  'how',
  'in',
  'into',
  'is',
  'it',
  'less',
  'more',
  'of',
  'on',
  'or',
  'our',
  'the',
  'this',
  'to',
  'use',
  'with',
  'your',
]);
