import assert from 'node:assert/strict';
import { luxuryMuslimahTemplate, getEditableFieldKeys } from './luxuryMuslimahTemplate';
import { getPreviewModeFromAction, normalizePreviewMode } from './LuxuryMuslimahTemplatePreview';
import { storefrontThemes, getStorefrontTheme } from './themeCatalog';
import { resolveBuilderView } from './WebsiteBuilderModule';
import {
  createDefaultThemeWorkspace,
  createDefaultThemeDraft,
  installTheme,
  moveSectionSetting,
  publishTheme,
  saveDraftChange,
  setSectionLayout,
  toggleSectionVisibility,
  getCustomizeSections,
  getBuilderDevices,
} from './themeBuilderModel';
import {
  addLandingBlock,
  canViewPublishedLandingPage,
  createDefaultLandingPage,
  getLandingPageLiveHref,
  getLandingPagePreviewHref,
  deleteLandingBlock,
  duplicateLandingBlock,
  moveLandingBlock,
  updateLandingBlock,
  updateLandingPageMeta,
  validateLandingPageForPublish,
} from './pageBuilderModel';

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
const defaultDraft = createDefaultThemeDraft();
assert.deepEqual(defaultDraft.sections.map((section) => section.key).slice(0, 4), ['hero', 'collections', 'bestSellers', 'reviews']);
assert.equal(defaultDraft.sections.every((section) => section.visible), true);
assert.equal(setSectionLayout(defaultDraft, 'hero', 'centered').sections.find((section) => section.key === 'hero')?.layout, 'centered');
assert.equal(toggleSectionVisibility(defaultDraft, 'reviews').sections.find((section) => section.key === 'reviews')?.visible, false);
assert.deepEqual(moveSectionSetting(defaultDraft, 'bestSellers', 'up').sections.map((section) => section.key).slice(0, 3), ['hero', 'bestSellers', 'collections']);
assert.deepEqual(moveSectionSetting(defaultDraft, 'hero', 'up').sections.map((section) => section.key).slice(0, 3), ['hero', 'collections', 'bestSellers']);
assert.deepEqual(storefrontThemes.map((theme) => theme.id), ['luxury-muslimah-editorial', 'soft-feminine-luxe', 'modern-conversion-luxe']);
assert.equal(getStorefrontTheme('soft-feminine-luxe')?.name, 'Aurelia Muse');
assert.equal(getStorefrontTheme('modern-conversion-luxe')?.name, 'Lumiere Momentum');
assert.equal(getStorefrontTheme('missing-theme')?.id, 'luxury-muslimah-editorial');
assert.equal(getStorefrontTheme('soft-feminine-luxe')?.account.loginPath, '#/frontend/account-login/soft-feminine-luxe');
assert.equal(getStorefrontTheme('modern-conversion-luxe')?.account.loginPath, '#/frontend/account-login/modern-conversion-luxe');
assert.equal(getStorefrontTheme('luxury-muslimah-editorial')?.account.dashboardPath, '#/frontend/account/luxury-muslimah-editorial');
const landingPage = createDefaultLandingPage();
assert.equal(landingPage.title, 'New Landing Page');
assert.deepEqual(landingPage.blocks.map((block) => block.type), ['heading', 'text', 'button']);
assert.ok(landingPage.blocks.every((block) => block.widthPercent === 100));
assert.ok(landingPage.blocks.every((block) => block.hideMobile === false));
const withImageBlock = addLandingBlock(landingPage, 'image');
assert.equal(withImageBlock.blocks.at(-1)?.type, 'image');
const withVideoAtTop = addLandingBlock(withImageBlock, 'video', undefined, 0);
assert.equal(withVideoAtTop.blocks[0].type, 'video');
const withFormBlock = addLandingBlock(landingPage, 'form');
assert.equal(withFormBlock.blocks.at(-1)?.type, 'form');
assert.deepEqual(withFormBlock.blocks.at(-1)?.formFields, ['name', 'email', 'phone']);
const movedImageBlock = moveLandingBlock(withImageBlock, withImageBlock.blocks.at(-1)?.id ?? '', 'up');
assert.equal(movedImageBlock.blocks.at(-2)?.type, 'image');
assert.equal(moveLandingBlock(withImageBlock, withImageBlock.blocks.at(-1)?.id ?? '', 0).blocks[0].type, 'image');
const duplicatedImageBlock = duplicateLandingBlock(movedImageBlock, movedImageBlock.blocks.at(-2)?.id ?? '');
assert.equal(duplicatedImageBlock.blocks.filter((block) => block.type === 'image').length, 2);
const imageReadyBlock = duplicatedImageBlock.blocks.reduce(
  (page, block) => (block.type === 'image' ? updateLandingBlock(page, block.id, { imageName: 'bundle-standard.png' }) : page),
  duplicatedImageBlock,
);
const updatedHeroBlock = updateLandingBlock(imageReadyBlock, imageReadyBlock.blocks[0].id, { title: 'Raya Sale Landing' });
assert.equal(updatedHeroBlock.blocks[0].title, 'Raya Sale Landing');
const styledBlock = updateLandingBlock(updatedHeroBlock, updatedHeroBlock.blocks[0].id, {
  widthPercent: 72,
  paddingY: 48,
  backgroundColor: '#111111',
  textColor: '#ffffff',
  hideMobile: true,
});
assert.equal(styledBlock.blocks[0].widthPercent, 72);
assert.equal(styledBlock.blocks[0].paddingY, 48);
assert.equal(styledBlock.blocks[0].backgroundColor, '#111111');
assert.equal(styledBlock.blocks[0].hideMobile, true);
const buttonBlock = styledBlock.blocks.find((block) => block.type === 'button');
assert.ok(buttonBlock);
const invalidPublish = validateLandingPageForPublish(updateLandingBlock(styledBlock, buttonBlock?.id ?? '', { buttonAction: 'whatsapp', buttonTarget: '' }));
assert.equal(invalidPublish.ready, false);
assert.ok(invalidPublish.issues.some((issue) => issue.includes('WhatsApp')));
const validPublish = validateLandingPageForPublish(updateLandingBlock(styledBlock, buttonBlock?.id ?? '', { buttonAction: 'whatsapp', buttonTarget: '60123456789' }));
assert.equal(validPublish.ready, true);
assert.equal(getLandingPagePreviewHref(styledBlock), '#/frontend/landing-page-preview/new-landing-page');
assert.equal(getLandingPageLiveHref(styledBlock), '#/frontend/landing-page/new-landing-page');
assert.equal(canViewPublishedLandingPage(styledBlock), false);
assert.equal(canViewPublishedLandingPage(updateLandingPageMeta(styledBlock, { status: 'Published' })), true);
const deletedHeroBlock = deleteLandingBlock(updatedHeroBlock, updatedHeroBlock.blocks[0].id);
assert.equal(deletedHeroBlock.blocks.some((block) => block.title === 'Raya Sale Landing'), false);
const themeImageSources = storefrontThemes.map((theme) => theme.image.split('?')[0]);
assert.equal(new Set(themeImageSources).size, storefrontThemes.length);
for (const theme of storefrontThemes) {
  const sampleImages = [
    theme.image,
    ...theme.template.bestSellers.map((product) => product.image),
    ...theme.template.trending.map((product) => product.image),
  ];
  assert.equal(sampleImages.length, 9);
  assert.ok(sampleImages.every((image) => image.startsWith('https://images.unsplash.com/')));
  assert.equal(new Set(sampleImages.map((image) => image.split('?')[0])).size, sampleImages.length);
}

console.log('luxuryMuslimahTemplate tests passed');
