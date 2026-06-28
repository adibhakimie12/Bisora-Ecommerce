export type SeoWorkspaceScope = 'pages' | 'products';

export const seoWorkspaceModes: Array<{
  key: SeoWorkspaceScope;
  label: string;
  note: string;
}> = [
  {
    key: 'pages',
    label: 'Pages',
    note: 'Homepage, brand pages, support pages, and other storefront content.',
  },
  {
    key: 'products',
    label: 'Products',
    note: 'Catalog item search snippets, sharing previews, and product-level SEO.',
  },
];
