export type BuilderShellItemId = 'header' | 'sections' | 'footer' | 'theme-settings';
export type LogoPosition = 'left' | 'center' | 'split';
export type BackgroundStyle = 'plain' | 'gradient' | 'image';
export type ImageFit = 'cover' | 'contain';
export type ImageFocus = 'top' | 'center' | 'bottom';
export type ImageShape = 'soft-rounded' | 'rounded' | 'sharp';

export const builderStudioShellItems = [
  { id: 'header' as const, title: 'Header', note: 'Logo, announcement, menu, and utility icons.' },
  { id: 'sections' as const, title: 'Sections', note: 'Reorder and manage homepage blocks.' },
  { id: 'footer' as const, title: 'Footer', note: 'Support links, newsletter, and trust.' },
  { id: 'theme-settings' as const, title: 'Theme Settings', note: 'Global storefront tone and layout defaults.' },
] as const;

export const logoPositionOptions: LogoPosition[] = ['left', 'center', 'split'];
export const backgroundStyleOptions: BackgroundStyle[] = ['plain', 'gradient', 'image'];
export const imageFitOptions: ImageFit[] = ['cover', 'contain'];
export const imageFocusOptions: ImageFocus[] = ['top', 'center', 'bottom'];
export const imageShapeOptions: ImageShape[] = ['soft-rounded', 'rounded', 'sharp'];

export const builderStudioThemeDefaults = {
  'luxe-atelier': {
    buttonShape: 'pill' as const,
    logoPosition: 'center' as const,
    sectionSpacing: 'comfortable' as const,
    pageWidth: 'contained' as const,
    cardRadius: 'soft-rounded' as const,
    backgroundStyle: 'plain' as const,
  },
  'editorial-veil': {
    buttonShape: 'sharp' as const,
    logoPosition: 'left' as const,
    sectionSpacing: 'airy' as const,
    pageWidth: 'wide' as const,
    cardRadius: 'rounded' as const,
    backgroundStyle: 'plain' as const,
  },
  'campaign-glow': {
    buttonShape: 'rounded' as const,
    logoPosition: 'split' as const,
    sectionSpacing: 'tight' as const,
    pageWidth: 'contained' as const,
    cardRadius: 'sharp' as const,
    backgroundStyle: 'gradient' as const,
  },
  'sage-ritual': {
    buttonShape: 'pill' as const,
    logoPosition: 'left' as const,
    sectionSpacing: 'comfortable' as const,
    pageWidth: 'contained' as const,
    cardRadius: 'soft-rounded' as const,
    backgroundStyle: 'plain' as const,
  },
} as const;
