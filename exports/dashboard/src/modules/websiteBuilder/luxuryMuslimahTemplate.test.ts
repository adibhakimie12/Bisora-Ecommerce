import assert from 'node:assert/strict';
import { luxuryMuslimahTemplate, getEditableFieldKeys } from './luxuryMuslimahTemplate';
import { getPreviewModeFromAction, normalizePreviewMode } from './LuxuryMuslimahTemplatePreview';
import { storefrontThemes, getStorefrontTheme } from './themeCatalog';
import { resolveBuilderView } from './WebsiteBuilderModule';
import {
  createDefaultThemeWorkspace,
  installTheme,
  publishTheme,
  saveDraftChange,
  getCustomizeSections,
  getBuilderDevices,
} from './themeBuilderModel';

assert.equal(luxuryMuslimahTemplate.id, 'luxury-muslimah-editorial');
assert.equal(luxuryMuslimahTemplate.niche, 'Muslimah fashion and feminine luxury products');
assert.ok(luxuryMuslimahTemplate.sections.includes('hero'));
assert.ok(luxuryMuslimahTemplate.sections.includes('checkout'));
assert.ok(luxuryMuslimahTemplate.sections.includes('customerAccount'));
assert.deepEqual(getEditableFieldKeys(luxuryMuslimahTemplate).slice(0, 5), [
  'logoText',
  'announcementText',
  'heroHeading',
  'heroSubtitle',
  'heroImage',
]);
assert.deepEqual(resolveBuilderView('themes'), { tab: 'themes' });
assert.deepEqual(resolveBuilderView('customize', luxuryMuslimahTemplate.id), {
  tab: 'customize',
  themeId: luxuryMuslimahTemplate.id,
});
assert.equal(normalizePreviewMode('account'), 'account');
assert.equal(normalizePreviewMode('cart'), 'cart');
assert.equal(normalizePreviewMode('thankYou'), 'thankYou');
assert.equal(normalizePreviewMode('random-value'), 'storefront');
assert.equal(getPreviewModeFromAction('account'), 'account');
assert.equal(getPreviewModeFromAction('logo'), 'storefront');
assert.equal(getPreviewModeFromAction('buy-now'), 'checkout');
const defaultWorkspace = createDefaultThemeWorkspace();
assert.equal(defaultWorkspace.installedThemeId, null);
assert.equal(defaultWorkspace.liveThemeId, null);
assert.equal(defaultWorkspace.draftDirty, false);

const installedWorkspace = installTheme(defaultWorkspace, luxuryMuslimahTemplate.id);
assert.equal(installedWorkspace.installedThemeId, luxuryMuslimahTemplate.id);
assert.equal(installedWorkspace.liveThemeId, null);
assert.equal(installedWorkspace.status, 'Installed draft');

const dirtyWorkspace = saveDraftChange(installedWorkspace, 'Header');
assert.equal(dirtyWorkspace.draftDirty, true);
assert.equal(dirtyWorkspace.lastEditedSection, 'Header');
assert.equal(dirtyWorkspace.liveThemeId, null);

const publishedWorkspace = publishTheme(dirtyWorkspace);
assert.equal(publishedWorkspace.liveThemeId, luxuryMuslimahTemplate.id);
assert.equal(publishedWorkspace.draftDirty, false);
assert.equal(publishedWorkspace.status, 'Live');

assert.deepEqual(getCustomizeSections().slice(0, 4).map((section) => section.key), [
  'themeSettings',
  'header',
  'announcement',
  'homepage',
]);
assert.equal(getCustomizeSections().find((section) => section.key === 'productPage')?.previewMode, 'product');
assert.equal(getCustomizeSections().find((section) => section.key === 'cartDrawer')?.previewMode, 'cart');
assert.equal(getCustomizeSections().find((section) => section.key === 'thankYou')?.previewMode, 'thankYou');
assert.deepEqual(getBuilderDevices().map((device) => device.key), ['mobile', 'tablet', 'desktop']);
assert.ok((getBuilderDevices().find((device) => device.key === 'desktop')?.width ?? 0) > 1000);
assert.deepEqual(storefrontThemes.map((theme) => theme.id), ['luxury-muslimah-editorial', 'soft-feminine-luxe']);
assert.equal(getStorefrontTheme('soft-feminine-luxe')?.name, 'Aurelia Muse');
assert.equal(getStorefrontTheme('missing-theme')?.id, 'luxury-muslimah-editorial');
assert.equal(getStorefrontTheme('soft-feminine-luxe')?.account.loginPath, '#/frontend/account-login/soft-feminine-luxe');
assert.equal(getStorefrontTheme('luxury-muslimah-editorial')?.account.dashboardPath, '#/frontend/account/luxury-muslimah-editorial');

console.log('luxuryMuslimahTemplate tests passed');
