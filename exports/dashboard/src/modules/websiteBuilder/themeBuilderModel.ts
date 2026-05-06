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
  checkoutNote: string;
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
    checkoutNote: 'Secure checkout with online banking, card, COD, and e-wallet options.',
  };
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
