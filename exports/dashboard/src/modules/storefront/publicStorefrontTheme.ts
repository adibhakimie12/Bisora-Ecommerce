import type { ThemeLibraryPreset } from '../websiteBuilder/themeLibrary';
import type { PublicStorefrontViewModel } from './publicStorefrontViewModel';

export interface PublicStorefrontThemeRuntime {
  accent: string;
  shellClassName: string;
  headerClassName: string;
  logoClassName: string;
  heroClassName: string;
  heroGridClassName: string;
  eyebrowClassName: string;
  headingClassName: string;
  bodyClassName: string;
  buttonClassName: string;
  cardClassName: string;
  cartClassName: string;
  emptyCartClassName: string;
  imageClassName: string;
  collectionHeading: string;
  productEyebrow: string;
}

const profileStyles: Record<ThemeLibraryPreset['builderProfile'], Omit<PublicStorefrontThemeRuntime, 'accent' | 'collectionHeading' | 'productEyebrow'>> = {
  luxe: {
    shellClassName: 'min-h-screen bg-[#f7f3ed] text-[#201814]',
    headerClassName: 'sticky top-0 z-20 border-b border-[#8a7b6c]/20 bg-[#f7f3ed]/90 backdrop-blur',
    logoClassName: 'grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#201814] text-sm font-semibold text-white',
    heroClassName: 'overflow-hidden rounded-none border border-[#8a7b6c]/20 bg-[#fffaf4] shadow-sm',
    heroGridClassName: 'grid lg:grid-cols-[0.9fr_1.05fr]',
    eyebrowClassName: 'text-xs uppercase tracking-[0.32em] text-[#8a7b6c]',
    headingClassName: 'mt-4 max-w-2xl font-serif text-5xl font-semibold leading-tight sm:text-6xl',
    bodyClassName: 'mt-4 max-w-xl text-base leading-7 text-[#5f5147]',
    buttonClassName: 'inline-flex items-center gap-2 rounded-none px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60',
    cardClassName: 'overflow-hidden rounded-none border border-[#8a7b6c]/20 bg-[#fffaf4]',
    cartClassName: 'h-fit rounded-none border border-[#8a7b6c]/20 bg-[#fffaf4] p-5 lg:sticky lg:top-24',
    emptyCartClassName: 'rounded-none bg-[#efe6dc] p-4 text-sm text-[#6b5f55]',
    imageClassName: 'bg-[#efe6dc]',
  },
  editorial: {
    shellClassName: 'min-h-screen bg-[#fbfaf7] text-[#171412]',
    headerClassName: 'sticky top-0 z-20 border-b border-black/10 bg-[#fbfaf7]/90 backdrop-blur',
    logoClassName: 'grid h-10 w-10 shrink-0 place-items-center rounded bg-[#171412] text-sm font-semibold text-white',
    heroClassName: 'overflow-hidden border-y border-black/10 bg-white',
    heroGridClassName: 'grid lg:grid-cols-[0.82fr_1.18fr]',
    eyebrowClassName: 'text-xs uppercase tracking-[0.34em] text-[#6f6257]',
    headingClassName: 'mt-4 max-w-2xl font-serif text-5xl font-medium leading-[1.05] sm:text-7xl',
    bodyClassName: 'mt-5 max-w-lg text-base leading-8 text-[#5c5650]',
    buttonClassName: 'inline-flex items-center gap-2 rounded px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60',
    cardClassName: 'overflow-hidden border border-black/10 bg-white',
    cartClassName: 'h-fit border border-black/10 bg-white p-5 lg:sticky lg:top-24',
    emptyCartClassName: 'bg-[#f4f1ed] p-4 text-sm text-[#6f6257]',
    imageClassName: 'bg-[#f4f1ed]',
  },
  campaign: {
    shellClassName: 'min-h-screen bg-[#fff8eb] text-[#1f1608]',
    headerClassName: 'sticky top-0 z-20 border-b border-[#d49d4d]/30 bg-[#fff8eb]/90 backdrop-blur',
    logoClassName: 'grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1f1608] text-sm font-semibold text-white',
    heroClassName: 'overflow-hidden rounded-2xl border border-[#d49d4d]/30 bg-white shadow-sm',
    heroGridClassName: 'grid lg:grid-cols-[1fr_1fr]',
    eyebrowClassName: 'text-xs uppercase tracking-[0.28em] text-[#9a6720]',
    headingClassName: 'mt-4 max-w-2xl text-5xl font-black leading-tight sm:text-6xl',
    bodyClassName: 'mt-4 max-w-xl text-base leading-7 text-[#6f4b1d]',
    buttonClassName: 'inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60',
    cardClassName: 'overflow-hidden rounded-2xl border border-[#d49d4d]/25 bg-white shadow-sm',
    cartClassName: 'h-fit rounded-2xl border border-[#d49d4d]/25 bg-white p-5 shadow-sm lg:sticky lg:top-24',
    emptyCartClassName: 'rounded-xl bg-[#fff1d3] p-4 text-sm text-[#7a4f15]',
    imageClassName: 'bg-[#fff1d3]',
  },
  beauty: {
    shellClassName: 'min-h-screen bg-[#f4f6ef] text-[#182014]',
    headerClassName: 'sticky top-0 z-20 border-b border-[#55604a]/20 bg-[#f4f6ef]/90 backdrop-blur',
    logoClassName: 'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#55604a] text-sm font-semibold text-white',
    heroClassName: 'overflow-hidden rounded border border-[#55604a]/20 bg-white',
    heroGridClassName: 'grid lg:grid-cols-[1fr_0.9fr]',
    eyebrowClassName: 'text-xs uppercase tracking-[0.28em] text-[#55604a]',
    headingClassName: 'mt-4 max-w-2xl font-serif text-5xl font-semibold leading-tight sm:text-6xl',
    bodyClassName: 'mt-4 max-w-xl text-base leading-7 text-[#596451]',
    buttonClassName: 'inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60',
    cardClassName: 'overflow-hidden rounded border border-[#55604a]/20 bg-white',
    cartClassName: 'h-fit rounded border border-[#55604a]/20 bg-white p-5 lg:sticky lg:top-24',
    emptyCartClassName: 'rounded bg-[#e8eddf] p-4 text-sm text-[#596451]',
    imageClassName: 'bg-[#e8eddf]',
  },
};

export function buildPublicStorefrontThemeRuntime(
  theme: ThemeLibraryPreset,
  viewModel: PublicStorefrontViewModel,
): PublicStorefrontThemeRuntime {
  const styles = profileStyles[theme.builderProfile];

  return {
    ...styles,
    accent: theme.accent || viewModel.theme.primaryColor,
    collectionHeading: theme.preview.productRow.length > 0 ? 'Shop the collection' : 'Shop available products',
    productEyebrow: theme.preview.announcement || viewModel.brandName,
  };
}
