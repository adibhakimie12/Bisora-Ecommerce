export type ThemeWorkspaceStatus = 'Not installed' | 'Installed draft' | 'Live';

export interface ThemeWorkspace {
  installedThemeId: string | null;
  liveThemeId: string | null;
  status: ThemeWorkspaceStatus;
  draftDirty: boolean;
  lastEditedSection: string | null;
}

export interface CustomizeSection {
  key: string;
  label: string;
  group: 'Global' | 'Storefront' | 'Buyer Flow';
  previewMode: 'storefront' | 'product' | 'cart' | 'checkout' | 'thankYou' | 'account';
}

export interface ThemeDraftContent {
  logoText: string;
  logoImageName: string;
  announcementText: string;
  heroHeading: string;
  heroSubtitle: string;
  heroImageName: string;
  collections: string[];
  sections: ThemeSectionSetting[];
  checkoutNote: string;
}

export type ThemeSectionLayout = 'default' | 'centered' | 'imageFirst' | 'compactGrid' | 'featureGrid';

export interface ThemeSectionSetting {
  key: string;
  label: string;
  visible: boolean;
  layout: ThemeSectionLayout;
}

export type BuilderDevice = 'mobile' | 'tablet' | 'desktop';

export interface BuilderDevicePreview {
  key: BuilderDevice;
  label: string;
  width: number;
  scale: number;
}

export function createDefaultThemeWorkspace(): ThemeWorkspace {
  return {
    installedThemeId: null,
    liveThemeId: null,
    status: 'Not installed',
    draftDirty: false,
    lastEditedSection: null,
  };
}

export function createDefaultThemeDraft(): ThemeDraftContent {
  return {
    logoText: 'Maison Noor',
    logoImageName: '',
    announcementText: 'Ramadan capsule now live',
    heroHeading: 'Luxury Muslimah Fashion',
    heroSubtitle: 'Editorial modestwear, perfume, beauty and feminine rituals composed for soft luxury living.',
    heroImageName: '',
    collections: ['Abaya', 'Tudung', 'Dresses', 'Perfume', 'Lipmatte', 'New Arrivals'],
    sections: createDefaultSectionSettings(),
    checkoutNote: 'Secure checkout with online banking, card, COD, and e-wallet options.',
  };
}

export function createDefaultSectionSettings(): ThemeSectionSetting[] {
  return [
    { key: 'hero', label: 'Hero', visible: true, layout: 'default' },
    { key: 'collections', label: 'Categories', visible: true, layout: 'default' },
    { key: 'bestSellers', label: 'Best Sellers', visible: true, layout: 'default' },
    { key: 'reviews', label: 'Reviews', visible: true, layout: 'default' },
    { key: 'newsletter', label: 'Newsletter', visible: true, layout: 'default' },
  ];
}

export function normalizeSectionSettings(sections?: ThemeSectionSetting[]): ThemeSectionSetting[] {
  const savedByKey = new Map((sections ?? []).map((section) => [section.key, section]));
  const defaults = createDefaultSectionSettings();
  const merged = defaults.map((section) => ({ ...section, ...savedByKey.get(section.key), key: section.key, label: section.label }));
  const knownKeys = new Set(defaults.map((section) => section.key));
  const savedOrder = (sections ?? []).map((section) => section.key).filter((key) => knownKeys.has(key));
  return [
    ...savedOrder.map((key) => merged.find((section) => section.key === key)).filter((section): section is ThemeSectionSetting => Boolean(section)),
    ...merged.filter((section) => !savedOrder.includes(section.key)),
  ];
}

export function setSectionLayout(draft: ThemeDraftContent, sectionKey: string, layout: ThemeSectionLayout): ThemeDraftContent {
  return {
    ...draft,
    sections: normalizeSectionSettings(draft.sections).map((section) => (section.key === sectionKey ? { ...section, layout } : section)),
  };
}

export function toggleSectionVisibility(draft: ThemeDraftContent, sectionKey: string): ThemeDraftContent {
  return {
    ...draft,
    sections: normalizeSectionSettings(draft.sections).map((section) => (section.key === sectionKey ? { ...section, visible: !section.visible } : section)),
  };
}

export function moveSectionSetting(draft: ThemeDraftContent, sectionKey: string, direction: 'up' | 'down'): ThemeDraftContent {
  const sections = normalizeSectionSettings(draft.sections);
  const currentIndex = sections.findIndex((section) => section.key === sectionKey);
  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sections.length) {
    return { ...draft, sections };
  }

  const nextSections = [...sections];
  [nextSections[currentIndex], nextSections[nextIndex]] = [nextSections[nextIndex], nextSections[currentIndex]];
  return { ...draft, sections: nextSections };
}

export function installTheme(workspace: ThemeWorkspace, themeId: string): ThemeWorkspace {
  return {
    ...workspace,
    installedThemeId: themeId,
    status: workspace.liveThemeId === themeId ? 'Live' : 'Installed draft',
  };
}

export function saveDraftChange(workspace: ThemeWorkspace, sectionLabel: string): ThemeWorkspace {
  return {
    ...workspace,
    draftDirty: true,
    lastEditedSection: sectionLabel,
    status: workspace.liveThemeId === workspace.installedThemeId && workspace.installedThemeId ? 'Live' : workspace.status,
  };
}

export function publishTheme(workspace: ThemeWorkspace): ThemeWorkspace {
  if (!workspace.installedThemeId) {
    return workspace;
  }

  return {
    ...workspace,
    liveThemeId: workspace.installedThemeId,
    status: 'Live',
    draftDirty: false,
  };
}

export function getCustomizeSections(): CustomizeSection[] {
  return [
    { key: 'themeSettings', label: 'Theme Settings', group: 'Global', previewMode: 'storefront' },
    { key: 'header', label: 'Header', group: 'Global', previewMode: 'storefront' },
    { key: 'announcement', label: 'Announcement Bar', group: 'Global', previewMode: 'storefront' },
    { key: 'homepage', label: 'Homepage', group: 'Storefront', previewMode: 'storefront' },
    { key: 'collections', label: 'Collections', group: 'Storefront', previewMode: 'storefront' },
    { key: 'productPage', label: 'Product Page', group: 'Buyer Flow', previewMode: 'product' },
    { key: 'cartDrawer', label: 'Cart Drawer', group: 'Buyer Flow', previewMode: 'cart' },
    { key: 'checkout', label: 'Checkout', group: 'Buyer Flow', previewMode: 'checkout' },
    { key: 'thankYou', label: 'Thank You', group: 'Buyer Flow', previewMode: 'thankYou' },
    { key: 'account', label: 'Account', group: 'Buyer Flow', previewMode: 'account' },
    { key: 'footer', label: 'Footer', group: 'Global', previewMode: 'storefront' },
  ];
}

export function getBuilderDevices(): BuilderDevicePreview[] {
  return [
    { key: 'mobile', label: 'Mobile', width: 390, scale: 0.9 },
    { key: 'tablet', label: 'iPad', width: 820, scale: 0.82 },
    { key: 'desktop', label: 'Desktop', width: 1200, scale: 0.78 },
  ];
}
