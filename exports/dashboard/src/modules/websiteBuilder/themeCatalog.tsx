import type { ComponentType } from 'react';
import { luxuryMuslimahTemplate } from './luxuryMuslimahTemplate';
import { LuxuryMuslimahTemplatePreview, luxuryTemplateHeroImage, type LuxuryPreviewMode } from './LuxuryMuslimahTemplatePreview';
import { softFeminineTemplate } from './softFeminineTemplate';
import { SoftFeminineTemplatePreview, softFeminineHeroImage } from './SoftFeminineTemplatePreview';
import type { LuxuryMuslimahTemplate } from './luxuryMuslimahTemplate';
import type { ThemeDraftContent } from './themeBuilderModel';

export interface StorefrontTheme {
  id: string;
  name: string;
  badge: string;
  image: string;
  account: {
    loginPath: string;
    registerPath: string;
    dashboardPath: string;
  };
  template: LuxuryMuslimahTemplate;
  Preview: ComponentType<{
    mode?: LuxuryPreviewMode;
    draftContent?: ThemeDraftContent;
    focusSection?: string;
    editorPreview?: boolean;
  }>;
}

export const storefrontThemes: StorefrontTheme[] = [
  {
    id: luxuryMuslimahTemplate.id,
    name: luxuryMuslimahTemplate.name,
    badge: 'Luxury Editorial',
    image: luxuryTemplateHeroImage,
    account: {
      loginPath: `#/frontend/account-login/${luxuryMuslimahTemplate.id}`,
      registerPath: `#/frontend/account-register/${luxuryMuslimahTemplate.id}`,
      dashboardPath: `#/frontend/account/${luxuryMuslimahTemplate.id}`,
    },
    template: luxuryMuslimahTemplate,
    Preview: LuxuryMuslimahTemplatePreview,
  },
  {
    id: softFeminineTemplate.id,
    name: softFeminineTemplate.name,
    badge: 'Soft Feminine',
    image: softFeminineHeroImage,
    account: {
      loginPath: `#/frontend/account-login/${softFeminineTemplate.id}`,
      registerPath: `#/frontend/account-register/${softFeminineTemplate.id}`,
      dashboardPath: `#/frontend/account/${softFeminineTemplate.id}`,
    },
    template: softFeminineTemplate,
    Preview: SoftFeminineTemplatePreview,
  },
];

export function getStorefrontTheme(themeId?: string) {
  return storefrontThemes.find((theme) => theme.id === themeId) ?? storefrontThemes[0];
}
