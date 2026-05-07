export type LandingBlockType = 'columns' | 'button' | 'divider' | 'heading' | 'html' | 'image' | 'menu' | 'text' | 'timer' | 'video' | 'form';
export type LandingBlockAlign = 'left' | 'center' | 'right';
export type LandingBlockTone = 'white' | 'soft' | 'dark' | 'brand';
export type LandingButtonAction = 'url' | 'checkout' | 'whatsapp' | 'telegram' | 'leadForm';
export type LandingColumnKind = 'text' | 'image' | 'button';

export interface LandingColumnItem {
  kind: LandingColumnKind;
  title: string;
  body: string;
  imageName: string;
  imageSrc: string;
  buttonText: string;
  buttonTarget: string;
}

export interface LandingBlock {
  id: string;
  type: LandingBlockType;
  title: string;
  body: string;
  imageName: string;
  imageSrc: string;
  videoUrl: string;
  buttonText: string;
  buttonLink: string;
  buttonAction: LandingButtonAction;
  buttonTarget: string;
  html: string;
  timerEnd: string;
  columns: number;
  columnItems: LandingColumnItem[];
  formFields: string[];
  widthPercent: number;
  paddingY: number;
  backgroundColor: string;
  textColor: string;
  hideDesktop: boolean;
  hideMobile: boolean;
  align: LandingBlockAlign;
  tone: LandingBlockTone;
}

export interface LandingPageDraft {
  id: string;
  title: string;
  slug: string;
  status: 'Draft' | 'Published';
  updatedAt: string;
  blocks: LandingBlock[];
}

export const landingPageStorageKey = 'bisora.websiteBuilder.landingPageDraft';

const blockLabels: Record<LandingBlockType, string> = {
  columns: 'Columns',
  button: 'Button',
  divider: 'Divider',
  heading: 'Heading',
  html: 'HTML',
  image: 'Image',
  menu: 'Menu',
  text: 'Text',
  timer: 'Timer',
  video: 'Video',
  form: 'Lead Form',
};

export const landingBlockTypes: Array<{ type: LandingBlockType; label: string; description: string }> = [
  { type: 'columns', label: 'Columns', description: 'Create 1-4 content columns.' },
  { type: 'button', label: 'Button', description: 'CTA to checkout, WhatsApp, Telegram, or link.' },
  { type: 'divider', label: 'Divider', description: 'Separate page sections.' },
  { type: 'heading', label: 'Heading', description: 'Large sales page headline.' },
  { type: 'html', label: 'HTML', description: 'Embed forms or custom code.' },
  { type: 'image', label: 'Image', description: 'Single uploaded visual block.' },
  { type: 'menu', label: 'Menu', description: 'Simple landing page navigation.' },
  { type: 'text', label: 'Text', description: 'Paragraph, FAQ, or lead copy.' },
  { type: 'timer', label: 'Timer', description: 'Countdown for launches and promos.' },
  { type: 'video', label: 'Video', description: 'YouTube or Vimeo responsive embed.' },
  { type: 'form', label: 'Form', description: 'Lead capture for sales or waiting list.' },
];

export function createDefaultLandingPage(): LandingPageDraft {
  return {
    id: 'landing-default',
    title: 'New Landing Page',
    slug: 'new-landing-page',
    status: 'Draft',
    updatedAt: 'Today',
    blocks: [
      createLandingBlock('heading', 'block-heading'),
      createLandingBlock('text', 'block-text'),
      createLandingBlock('button', 'block-button'),
    ],
  };
}

export function createLandingBlock(type: LandingBlockType, id = createBlockId(type)): LandingBlock {
  return {
    id,
    type,
    title: getDefaultTitle(type),
    body: getDefaultBody(type),
    imageName: '',
    imageSrc: '',
    videoUrl: '',
    buttonText: type === 'button' ? 'Dapatkan Sekarang' : 'Shop now',
    buttonLink: '#',
    buttonAction: type === 'form' ? 'leadForm' : 'url',
    buttonTarget: type === 'button' ? '#' : '',
    html: '<strong>Hello, world!</strong>',
    timerEnd: '2026-12-31 23:59',
    columns: type === 'columns' ? 3 : 1,
    columnItems: createDefaultColumnItems(type === 'columns' ? 3 : 1),
    formFields: ['name', 'email', 'phone'],
    widthPercent: 100,
    paddingY: type === 'divider' ? 12 : 32,
    backgroundColor: type === 'timer' ? '#000000' : type === 'button' ? '#22aeca' : '',
    textColor: type === 'timer' || type === 'button' ? '#ffffff' : '',
    hideDesktop: false,
    hideMobile: false,
    align: type === 'heading' || type === 'button' || type === 'timer' ? 'center' : 'left',
    tone: type === 'heading' || type === 'button' ? 'brand' : 'white',
  };
}

export function addLandingBlock(page: LandingPageDraft, type: LandingBlockType, afterBlockId?: string, insertAt?: number): LandingPageDraft {
  const nextBlock = createLandingBlock(type);
  const insertIndex = typeof insertAt === 'number' ? insertAt : afterBlockId ? page.blocks.findIndex((block) => block.id === afterBlockId) + 1 : page.blocks.length;
  const nextBlocks = [...page.blocks];
  nextBlocks.splice(Math.max(0, Math.min(insertIndex > -1 ? insertIndex : page.blocks.length, page.blocks.length)), 0, nextBlock);
  return touchPage({ ...page, blocks: nextBlocks });
}

export function moveLandingBlock(page: LandingPageDraft, blockId: string, direction: 'up' | 'down' | number): LandingPageDraft {
  const currentIndex = page.blocks.findIndex((block) => block.id === blockId);
  const nextIndex = typeof direction === 'number' ? direction : direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= page.blocks.length) {
    return page;
  }
  const nextBlocks = [...page.blocks];
  const [block] = nextBlocks.splice(currentIndex, 1);
  nextBlocks.splice(nextIndex, 0, block);
  return touchPage({ ...page, blocks: nextBlocks });
}

export function duplicateLandingBlock(page: LandingPageDraft, blockId: string): LandingPageDraft {
  const currentIndex = page.blocks.findIndex((block) => block.id === blockId);
  if (currentIndex < 0) return page;
  const currentBlock = page.blocks[currentIndex];
  const nextBlock = { ...currentBlock, id: createBlockId(currentBlock.type), title: `${currentBlock.title} Copy` };
  const nextBlocks = [...page.blocks];
  nextBlocks.splice(currentIndex + 1, 0, nextBlock);
  return touchPage({ ...page, blocks: nextBlocks });
}

export function deleteLandingBlock(page: LandingPageDraft, blockId: string): LandingPageDraft {
  if (page.blocks.length <= 1) return page;
  return touchPage({ ...page, blocks: page.blocks.filter((block) => block.id !== blockId) });
}

export function updateLandingBlock(page: LandingPageDraft, blockId: string, patch: Partial<LandingBlock>): LandingPageDraft {
  return touchPage({
    ...page,
    blocks: page.blocks.map((block) => {
      if (block.id !== blockId) return block;
      const nextBlock = { ...block, ...patch, id: block.id, type: block.type };
      if (block.type === 'columns' && typeof patch.columns === 'number') {
        nextBlock.columnItems = resizeColumnItems(block.columnItems, patch.columns);
      }
      return nextBlock;
    }),
  });
}

export function updateLandingColumn(page: LandingPageDraft, blockId: string, columnIndex: number, patch: Partial<LandingColumnItem>): LandingPageDraft {
  return touchPage({
    ...page,
    blocks: page.blocks.map((block) => {
      if (block.id !== blockId || block.type !== 'columns') return block;
      const columnItems = resizeColumnItems(block.columnItems, block.columns).map((item, index) => (index === columnIndex ? { ...item, ...patch } : item));
      return { ...block, columnItems };
    }),
  });
}

export function normalizeLandingPage(page: LandingPageDraft): LandingPageDraft {
  const defaultPage = createDefaultLandingPage();
  const rawBlocks = Array.isArray(page.blocks) ? page.blocks : [];
  const blocks = rawBlocks.map((block) => {
    const type = normalizeBlockType(block.type);
    const normalizedBlock = { ...createLandingBlock(type, block.id), ...block, type };
    if (type === 'columns') {
      normalizedBlock.columnItems = resizeColumnItems(normalizedBlock.columnItems, normalizedBlock.columns);
    }
    return normalizedBlock;
  });

  return {
    ...defaultPage,
    ...page,
    blocks: blocks.length ? blocks : defaultPage.blocks,
  };
}

export function validateLandingPageForPublish(page: LandingPageDraft): { ready: boolean; issues: string[] } {
  const normalizedPage = normalizeLandingPage(page);
  const issues: string[] = [];

  if (!normalizedPage.title.trim()) issues.push('Page title is required.');
  if (!normalizedPage.slug.trim()) issues.push('Page slug is required.');
  if (normalizedPage.blocks.length === 0) issues.push('Add at least one block before publishing.');

  normalizedPage.blocks.forEach((block, index) => {
    const label = `${index + 1}. ${blockLabels[block.type]}`;
    if (block.type === 'button') {
      if (block.buttonAction === 'url' && !block.buttonTarget.trim() && !block.buttonLink.trim()) issues.push(`${label}: Button URL is required.`);
      if (block.buttonAction === 'whatsapp' && !block.buttonTarget.trim()) issues.push(`${label}: WhatsApp number is required.`);
      if (block.buttonAction === 'telegram' && !block.buttonTarget.trim()) issues.push(`${label}: Telegram link is required.`);
      if (block.buttonAction === 'checkout' && !block.buttonTarget.trim()) issues.push(`${label}: Checkout product or offer target is required.`);
    }
    if (block.type === 'form' && block.formFields.length === 0) issues.push(`${label}: Lead form needs at least one field.`);
    if (block.type === 'video' && !block.videoUrl.trim()) issues.push(`${label}: Video URL is empty.`);
    if (block.type === 'image' && !block.imageName.trim() && !block.imageSrc.trim()) issues.push(`${label}: Image is empty.`);
  });

  return { ready: issues.length === 0, issues };
}

export function updateLandingPageMeta(page: LandingPageDraft, patch: Partial<Pick<LandingPageDraft, 'title' | 'slug' | 'status'>>): LandingPageDraft {
  return touchPage({ ...page, ...patch });
}

export function getLandingPagePreviewHref(page: LandingPageDraft): string {
  return `#/frontend/landing-page-preview/${encodeURIComponent(page.slug || 'draft')}`;
}

export function getLandingPageLiveHref(page: LandingPageDraft): string {
  return `#/frontend/landing-page/${encodeURIComponent(page.slug || 'landing-page')}`;
}

export function canViewPublishedLandingPage(page: LandingPageDraft): boolean {
  return page.status === 'Published' && validateLandingPageForPublish(page).ready;
}

function touchPage(page: LandingPageDraft): LandingPageDraft {
  return { ...page, updatedAt: 'Today' };
}

function createBlockId(type: LandingBlockType) {
  return `${type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function createDefaultColumnItems(count: number): LandingColumnItem[] {
  return Array.from({ length: count }).map((_, index) => ({
    kind: 'text',
    title: `Column ${index + 1}`,
    body: 'Add text, image, or CTA here.',
    imageName: '',
    imageSrc: '',
    buttonText: 'Learn more',
    buttonTarget: '#',
  }));
}

function resizeColumnItems(items: LandingColumnItem[] | undefined, count: number): LandingColumnItem[] {
  const safeItems = Array.isArray(items) ? items : [];
  const defaults = createDefaultColumnItems(count);
  return defaults.map((defaultItem, index) => ({ ...defaultItem, ...safeItems[index] }));
}

function normalizeBlockType(type: unknown): LandingBlockType {
  if (typeof type === 'string' && type in blockLabels) {
    return type as LandingBlockType;
  }

  const legacyTypeMap: Record<string, LandingBlockType> = {
    hero: 'heading',
    cta: 'button',
    box: 'text',
    imageText: 'image',
    faq: 'text',
    spacer: 'divider',
  };

  return typeof type === 'string' && legacyTypeMap[type] ? legacyTypeMap[type] : 'text';
}

function getDefaultTitle(type: LandingBlockType) {
  return `${blockLabels[type]} block`;
}

function getDefaultBody(type: LandingBlockType) {
  const bodyMap: Record<LandingBlockType, string> = {
    columns: 'No content here. Drag content into each column.',
    button: 'Send visitors to checkout, WhatsApp, Telegram, or another page.',
    divider: '',
    heading: 'Hello, world!',
    html: 'Paste embed code for Calendly, Google Form, email provider, or custom HTML.',
    image: 'Upload an image and add a short caption if needed.',
    menu: 'Home | Details | FAQ | Checkout',
    text: 'Add paragraph copy, campaign details, or CMS content manually.',
    timer: 'Countdown timer for launch, promo, or closing cart.',
    video: 'Paste a video URL and write a short intro.',
    form: 'Collect leads for launch, waiting list, consultation, or promo follow-up.',
  };
  return bodyMap[type];
}
