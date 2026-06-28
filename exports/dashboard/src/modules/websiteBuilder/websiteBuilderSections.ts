export type WebsiteBuilderSection =
  | 'overview'
  | 'installed-themes'
  | 'themes'
  | 'menus'
  | 'pages'
  | 'page-seo'
  | 'blog'
  | 'preferences'
  | 'metafields'
  | 'customize';

export const websiteBuilderTabs: Array<{ key: WebsiteBuilderSection; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'installed-themes', label: 'Installed Themes' },
  { key: 'themes', label: 'Themes' },
  { key: 'menus', label: 'Menus' },
  { key: 'pages', label: 'Pages' },
  { key: 'page-seo', label: 'SEO' },
  { key: 'blog', label: 'Blog' },
  { key: 'metafields', label: 'Metafields' },
  { key: 'preferences', label: 'Preferences' },
];

export function normalizeWebsiteBuilderSection(section?: string): WebsiteBuilderSection {
  if (
    section === 'installed-themes' ||
    section === 'themes' ||
    section === 'menus' ||
    section === 'pages' ||
    section === 'page-seo' ||
    section === 'blog' ||
    section === 'preferences' ||
    section === 'metafields' ||
    section === 'customize'
  ) {
    return section;
  }

  return 'overview';
}
