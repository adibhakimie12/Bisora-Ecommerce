import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlignLeft,
  ArrowLeft,
  Bold,
  CodeXml,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  GripVertical,
  Image as ImageIcon,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  MoreHorizontal,
  Palette,
  Pilcrow,
  Plus,
  Save,
  Search,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table2,
  Trash2,
  Type,
  Underline as UnderlineIcon,
  Video,
  X,
} from 'lucide-react';
import { categories, productKpiMetrics, products } from './data';
import { saveProductToApi, useStorefrontProducts } from '../storefront/productStore';
import { createCatalogApi } from '../../api/catalog';
import { uploadMediaFile } from '../../api/media';
import { ApiError } from '../../api/http';
import { shouldUseDemoData } from '../../liveDataMode';
import { ProductStatusBadge } from './ProductStatusBadge';
import {
  buildVariantOptionRepair,
  findClosestVariantKey,
  updateVariantOptionDraft as updateVariantOptionDraftState,
} from './variantEditorModel';
import type { Category, CategoryDetailTab, Product, ProductTab, StockState } from './types';

interface ProductsModuleProps {
  section?: string;
  id?: string;
  subSection?: string;
}

interface BannerState {
  title: string;
  description: string;
}

interface ActionDialogState {
  title: string;
  description: string;
  confirmLabel: string;
}

interface VariantOptionDraft {
  id: string;
  name: string;
  values: string[];
  pendingValue: string;
}

const productTabs: ProductTab[] = ['All Products', 'Inventory', 'Categories'];
const categoryDetailTabs: CategoryDetailTab[] = ['Category', 'Category Products', 'SEO'];

export function ProductsModule({ section, id, subSection }: ProductsModuleProps) {
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);
  const [productRecords, setProductRecords] = useStorefrontProducts();
  const [categoryRecords, setCategoryRecords] = useState<Category[]>(() => (shouldUseDemoData() ? categories : []));

  useEffect(() => {
    if (!banner) return undefined;
    const timeout = window.setTimeout(() => setBanner(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  useEffect(() => {
    let isMounted = true;
    createCatalogApi()
      .listCategories()
      .then((records) => {
        if (isMounted) {
          setCategoryRecords(records);
        }
      })
      .catch(() => {
        // Keep bundled categories usable when backend credentials are not ready.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const showBanner = (title: string, description: string) => setBanner({ title, description });
  const showDialog = (title: string, description: string, confirmLabel = 'Close') =>
    setDialog({ title, description, confirmLabel });

  let content: ReactNode;

  if (section === 'edit') {
    const product = id === 'new' ? createEmptyProductDraft() : productRecords.find((item) => item.id === id) ?? productRecords[0];
    if (!product) {
      return null;
    }
    content = (
      <EditProductStudio
        categoryOptions={categoryRecords}
        product={product}
        onDuplicate={() => showBanner('Product duplicated', `${product.title} was cloned into a new draft product.`)}
        onPreview={() => showDialog('Preview prepared', `${product.title} preview is ready for storefront checking.`)}
        productRecords={productRecords}
        onSave={(record, isNewProduct) => {
          const previousRecords = productRecords;
          setProductRecords((current) => {
            const nextRecords = isNewProduct
              ? [record, ...current.filter((item) => item.id !== record.id)]
              : current.map((item) => (item.id === record.id ? record : item));
            return nextRecords;
          });
          void saveProductToApi(record, isNewProduct)
            .then((savedRecord) => {
              setProductRecords((current) =>
                current.map((item) => (item.id === record.id ? savedRecord : item)),
              );
            })
            .catch((error: unknown) => {
              setProductRecords(previousRecords);
              const message = error instanceof ApiError ? error.message : 'Product could not be saved to backend.';
              showDialog('Product save blocked', message, 'Review package');
            });
          showBanner('Product saved', `${record.title} SEO, slug, and product changes were saved.`);
          if (isNewProduct) {
            window.location.hash = `/products/edit/${record.id}`;
          }
        }}
      />
    );
  } else if (section === 'inventory') {
    content = (
      <ProductsShell activeTab="Inventory" banner={banner} onCreateProduct={() => (window.location.hash = '/products/edit/new')}>
        <InventoryPage
          categories={categoryRecords}
          products={productRecords}
          onBulkAction={(action) => showBanner(action, `Inventory ${action.toLowerCase()} completed for selected variants in the current mock flow.`)}
          onRowAction={(title, description) => showBanner(title, description)}
          onSaveInventory={(nextProducts) => {
            const previousRecords = productRecords;
            setProductRecords(nextProducts);
            void Promise.all(nextProducts.map((product) => saveProductToApi(product)))
              .then(() => showBanner('Inventory saved', 'Variant stock changes were saved to backend.'))
              .catch((error: unknown) => {
                setProductRecords(previousRecords);
                showDialog('Inventory save failed', error instanceof ApiError ? error.message : 'Inventory changes could not be saved to backend.');
              });
          }}
        />
      </ProductsShell>
    );
  } else if (section === 'categories' && id) {
    const category = categoryRecords.find((item) => item.id === id) ?? categoryRecords[0];
    if (!category) {
      return null;
    }
    const activeTab = normalizeCategoryTab(subSection);
    content = (
      <CategoryDetailPage
        activeTab={activeTab}
        category={category}
        products={productRecords}
        onAddProduct={() => {
          const availableProduct = productRecords.find((productItem) => !category.productIds.includes(productItem.id));
          if (!availableProduct) {
            showDialog('No products available', `${category.name} already includes every product in the current mock catalog.`);
            return;
          }

          setCategoryRecords((current) =>
            current.map((item) =>
              item.id === category.id
                ? { ...item, productIds: [...item.productIds, availableProduct.id] }
                : item,
            ),
          );
          const nextProduct = { ...availableProduct, categoryId: category.id, categoryName: category.name };
          setProductRecords((current) =>
            current.map((productItem) => (productItem.id === availableProduct.id ? nextProduct : productItem)),
          );
          void saveProductToApi(nextProduct).catch((error: unknown) => {
            showDialog('Add product failed', error instanceof ApiError ? error.message : `${availableProduct.title} could not be added to backend category.`);
          });
          showBanner('Product added', `${availableProduct.title} was added to ${category.name}.`);
        }}
        onChangeCoverImage={() => showDialog('Cover image manager', `${category.name} cover image upload will connect during the storage/backend phase.`)}
        onDelete={() => {
          setCategoryRecords((current) => current.filter((item) => item.id !== category.id));
          void createCatalogApi()
            .deleteCategory(category.id)
            .catch(() => {
              setCategoryRecords((current) => [category, ...current]);
              showDialog('Delete category failed', `${category.name} could not be deleted from backend.`);
            });
          showBanner('Category deleted', `${category.name} was removed from catalog.`);
          window.location.hash = '/products/categories';
        }}
        onPreview={() => showDialog('Category preview', `${category.name} preview is ready for collection page review.`)}
        onRemoveProduct={(product) => {
          setCategoryRecords((current) =>
            current.map((item) =>
              item.id === category.id
                ? { ...item, productIds: item.productIds.filter((productId) => productId !== product.id) }
                : item,
            ),
          );
          const nextProduct = { ...product, categoryId: '', categoryName: 'Uncategorized' };
          setProductRecords((current) =>
            current.map((productItem) => (productItem.id === product.id ? nextProduct : productItem)),
          );
          void saveProductToApi(nextProduct).catch((error: unknown) => {
            showDialog('Remove product failed', error instanceof ApiError ? error.message : `${product.title} could not be removed from backend category.`);
          });
          showBanner('Product removed', `${product.title} was removed from ${category.name}.`);
        }}
        onSave={(nextCategory) => {
          const previousRecords = categoryRecords;
          setCategoryRecords((current) =>
            current.map((item) => (item.id === nextCategory.id ? nextCategory : item)),
          );
          void createCatalogApi()
            .saveCategory(nextCategory)
            .then((savedCategory) => {
              setCategoryRecords((current) =>
                current.map((item) => (item.id === nextCategory.id ? savedCategory : item)),
              );
            })
            .catch((error: unknown) => {
              setCategoryRecords(previousRecords);
              showDialog('Category save blocked', error instanceof ApiError ? error.message : `${category.name} could not be saved to backend.`);
            });
          showBanner('Category saved', `${nextCategory.name} settings were saved.`);
        }}
      />
    );
  } else if (section === 'categories') {
    content = (
      <ProductsShell activeTab="Categories" banner={banner} onCreateProduct={() => (window.location.hash = '/products/edit/new')}>
        <CategoriesPage
          categories={categoryRecords}
          onCreateCategory={(category) => {
            setCategoryRecords((current) => [category, ...current]);
            void createCatalogApi()
              .saveCategory(category)
              .then((savedCategory) => {
                setCategoryRecords((current) =>
                  current.map((item) => (item.id === category.id ? savedCategory : item)),
                );
                window.location.hash = `/products/categories/${savedCategory.id}`;
              })
              .catch((error: unknown) => {
                setCategoryRecords((current) => current.filter((item) => item.id !== category.id));
                showDialog('Category create blocked', error instanceof ApiError ? error.message : `${category.name} could not be created in backend.`);
              });
            showBanner('Category created', `${category.name} was added and is ready for detail editing.`);
          }}
          onViewAnalytics={() => showDialog('Category analytics', 'Merchandising analytics will plug into Reports after backend analytics is connected.')}
        />
      </ProductsShell>
    );
  } else {
    content = (
      <ProductsShell activeTab="All Products" banner={banner} onCreateProduct={() => (window.location.hash = '/products/edit/new')}>
        <AllProductsPage
          categories={categoryRecords}
          products={productRecords}
          onArchive={(product) => {
            const nextProduct = { ...product, status: 'Hidden' as const };
            setProductRecords((current) =>
              current.map((item) => (item.id === product.id ? nextProduct : item)),
            );
            void saveProductToApi(nextProduct).catch((error: unknown) => {
              showDialog('Archive failed', error instanceof ApiError ? error.message : `${product.title} could not be archived in backend.`);
            });
            showBanner('Product archived', `${product.title} was moved to Hidden status.`);
          }}
          onDelete={(product) => {
            setProductRecords((current) => current.filter((item) => item.id !== product.id));
            void createCatalogApi().deleteProduct(product.id).catch((error: unknown) => {
              setProductRecords((current) => [product, ...current]);
              showDialog('Product delete failed', error instanceof ApiError ? error.message : `${product.title} could not be deleted in backend.`);
            });
            showBanner('Product deleted', `${product.title} was removed from product listing.`);
          }}
          onDuplicate={(product) => {
            const duplicated = duplicateProduct(product);
            setProductRecords((current) => [duplicated, ...current]);
            void saveProductToApi(duplicated, true)
              .then((savedRecord) => {
                setProductRecords((current) =>
                  current.map((item) => (item.id === duplicated.id ? savedRecord : item)),
                );
              })
              .catch((error: unknown) => {
                setProductRecords((current) => current.filter((item) => item.id !== duplicated.id));
                showDialog('Duplicate failed', error instanceof ApiError ? error.message : `${product.title} could not be duplicated in backend.`);
              });
            showBanner('Product duplicated', `${product.title} was duplicated as ${duplicated.title}.`);
          }}
        />
      </ProductsShell>
    );
  }

  return (
    <>
      {content}
      {dialog && (
        <ActionDialog
          confirmLabel={dialog.confirmLabel}
          description={dialog.description}
          onClose={() => setDialog(null)}
          title={dialog.title}
        />
      )}
    </>
  );
}

function ProductsShell({
  activeTab,
  banner,
  children,
  onCreateProduct,
}: {
  activeTab: ProductTab;
  banner: BannerState | null;
  children: ReactNode;
  onCreateProduct: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm text-on-surface-variant">Products Module</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Products</h1>
          <p className="mt-2 text-sm text-on-surface-variant">Manage your catalog, stock, and category structure.</p>
        </div>
        <button
          className="inline-flex w-fit items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
          onClick={onCreateProduct}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {banner && <InlineBanner title={banner.title} description={banner.description} />}

      <div className="flex gap-2 overflow-x-auto border-b border-outline-variant/20">
        {productTabs.map((tab) => (
          <button
            key={tab}
            className={`min-w-max border-b-2 px-3 py-3 text-sm font-medium ${
              tab === activeTab
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => {
              if (tab === 'All Products') window.location.hash = '/products';
              if (tab === 'Inventory') window.location.hash = '/products/inventory';
              if (tab === 'Categories') window.location.hash = '/products/categories';
            }}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {children}
    </div>
  );
}

function AllProductsPage({
  products,
  categories,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  products: Product[];
  categories: Category[];
  onDuplicate: (product: Product) => void;
  onArchive: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<'All' | Product['status']>('All');
  const [stockFilter, setStockFilter] = useState<'All Stock' | 'Low Stock' | 'Out of Stock' | 'High Stock'>('All Stock');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [query, setQuery] = useState('');
  const publishedCount = products.filter((product) => product.status === 'Active').length;
  const summaryMetrics = useMemo(
    () =>
      productKpiMetrics.map((metric) => {
        if (metric.label === 'Total Products') return { ...metric, value: String(products.length) };
        if (metric.label === 'Low Stock') return { ...metric, value: String(products.filter((product) => product.stockState === 'Low Stock').length) };
        if (metric.label === 'Categories') return { ...metric, value: String(categories.length) };
        if (metric.label === 'Variants') return { ...metric, value: String(products.flatMap((product) => product.variants).length) };
        return metric;
      }),
    [categories.length, products],
  );
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchStatus = statusFilter === 'All' ? true : product.status === statusFilter;
        const matchStock = stockFilter === 'All Stock' ? true : product.stockState === stockFilter;
        const matchCategory = categoryFilter === 'All Categories' ? true : product.categoryName === categoryFilter;
        const q = query.trim().toLowerCase();
        const matchSearch = !q
          ? true
          : product.title.toLowerCase().includes(q) ||
            product.sku.toLowerCase().includes(q) ||
            product.categoryName.toLowerCase().includes(q);
        return matchStatus && matchStock && matchCategory && matchSearch;
      }),
    [products, statusFilter, stockFilter, categoryFilter, query],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Product summary">
        {summaryMetrics.map((metric) => (
          <article key={metric.label} className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-on-surface-variant">{metric.label}</p>
                <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded bg-surface-low text-primary">
                <metric.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3 rounded border border-outline-variant/20 bg-surface-lowest p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</span>
              <FilterChip active={statusFilter === 'All'} label="All" onClick={() => setStatusFilter('All')} />
              <FilterChip active={statusFilter === 'Active'} label="Active" helper={`${publishedCount}`} onClick={() => setStatusFilter('Active')} />
              <FilterChip active={statusFilter === 'Unpublished'} label="Unpublished" onClick={() => setStatusFilter('Unpublished')} />
              <FilterChip active={statusFilter === 'Hidden'} label="Hidden" onClick={() => setStatusFilter('Hidden')} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Stock</span>
              <FilterChip active={stockFilter === 'All Stock'} label="All Stock" onClick={() => setStockFilter('All Stock')} />
              <FilterChip active={stockFilter === 'Low Stock'} label="Low Stock" onClick={() => setStockFilter('Low Stock')} />
              <FilterChip active={stockFilter === 'Out of Stock'} label="Out of Stock" onClick={() => setStockFilter('Out of Stock')} />
              <FilterChip active={stockFilter === 'High Stock'} label="High Stock" onClick={() => setStockFilter('High Stock')} />
            </div>
          </div>
          <select className="h-9 rounded border border-outline-variant/30 bg-surface px-3 text-sm" onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
            <option>All Categories</option>
            {categories.map((category) => <option key={category.id}>{category.name}</option>)}
          </select>
        </div>
        <label className="relative block max-w-md">
          <span className="sr-only">Search product name</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input className="h-10 w-full rounded border border-outline-variant/30 bg-surface px-9 text-sm outline-none focus:border-primary" onChange={(event) => setQuery(event.target.value)} placeholder="Search product name..." value={query} />
        </label>
      </section>

      <ProductsTable products={filteredProducts} onArchive={onArchive} onDelete={onDelete} onDuplicate={onDuplicate} />
    </div>
  );
}

function ProductsTable({
  products,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  products: Product[];
  onDuplicate: (product: Product) => void;
  onArchive: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const [actionMenu, setActionMenu] = useState<{ productId: string; x: number; y: number } | null>(null);
  const activeMenuProduct = products.find((product) => product.id === actionMenu?.productId);
  const closeActionMenu = () => setActionMenu(null);
  const openActionMenu = (product: Product, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setActionMenu((current) =>
      current?.productId === product.id
        ? null
        : { productId: product.id, x: rect.right, y: rect.bottom },
    );
  };

  return (
    <section className="relative rounded border border-outline-variant/20 bg-surface-lowest">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-surface-low text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-surface-low">
                <td className="px-4 py-4">
                  <button className="flex items-center gap-3 text-left" onClick={() => (window.location.hash = `/products/edit/${product.id}`)} type="button">
                    <img alt="" className="h-12 w-12 rounded object-cover" referrerPolicy="no-referrer" src={product.thumbnailUrl} />
                    <span>
                      <span className="block text-sm font-semibold text-primary">{product.title}</span>
                      <span className="block text-xs text-on-surface-variant">{product.sku}</span>
                    </span>
                  </button>
                </td>
                <td className="px-4 py-4 text-sm text-on-surface-variant">{product.categoryName}</td>
                <td className="px-4 py-4 text-sm font-semibold">{formatCurrency(product.price)}</td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{product.stock} in stock</p>
                    <ProductStatusBadge status={product.stockState} />
                  </div>
                </td>
                <td className="px-4 py-4"><ProductStatusBadge status={product.status} /></td>
                <td className="px-4 py-4 text-right">
                  <div className="relative inline-flex items-center gap-2">
                    <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => (window.location.hash = `/products/edit/${product.id}`)} type="button">
                      Edit Product
                    </button>
                    <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onDuplicate(product)} type="button">
                      Duplicate
                    </button>
                    <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onArchive(product)} type="button">
                      Archive
                    </button>
                    <button className="rounded border border-error/30 px-3 py-1.5 text-xs text-error hover:bg-error/5" onClick={() => onDelete(product)} type="button">
                      Delete
                    </button>
                    <button className="grid h-8 w-8 place-items-center rounded text-on-surface-variant hover:bg-surface-low hover:text-primary" onClick={(event) => openActionMenu(product, event)} type="button">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeMenuProduct && actionMenu && (
        <div
          className="fixed z-50 min-w-44 rounded border border-outline-variant/20 bg-surface-lowest p-1 text-left shadow-lg"
          style={{ left: Math.max(12, actionMenu.x - 176), top: actionMenu.y + 8 }}
        >
          <button className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-surface-low" onClick={() => { closeActionMenu(); window.location.hash = `/products/edit/${activeMenuProduct.id}`; }} type="button">Quick Edit</button>
          <button className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-surface-low" onClick={() => { closeActionMenu(); onDuplicate(activeMenuProduct); }} type="button">Duplicate Product</button>
          <button className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-surface-low" onClick={() => { closeActionMenu(); onArchive(activeMenuProduct); }} type="button">Move to Hidden</button>
          <button className="block w-full rounded px-3 py-2 text-left text-xs text-error hover:bg-error/5" onClick={() => { closeActionMenu(); onDelete(activeMenuProduct); }} type="button">Delete Product</button>
        </div>
      )}
    </section>
  );
}

function InventoryPage({
  products,
  categories,
  onBulkAction,
  onRowAction,
  onSaveInventory,
}: {
  products: Product[];
  categories: Category[];
  onBulkAction: (action: string) => void;
  onRowAction: (title: string, description: string) => void;
  onSaveInventory: (products: Product[]) => void;
}) {
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [],
  );
  const inventoryRows = useMemo(
    () => products.flatMap((product) => product.variants.map((variant) => ({ product, variant }))),
    [products],
  );
  const [stockDraft, setStockDraft] = useState(
    inventoryRows.map(({ variant }) => [variant.id, String(variant.stock)] as const),
  );
  const [lastUpdatedDraft, setLastUpdatedDraft] = useState(
    inventoryRows.map(({ variant }) => [variant.id, variant.lastUpdated] as const),
  );
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([inventoryRows[1]?.variant.id ?? '']);
  const [stockFilter, setStockFilter] = useState('All Stock');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [inventoryView, setInventoryView] = useState<'Grouped' | 'Flat'>('Grouped');
  const [collapsedProductIds, setCollapsedProductIds] = useState<string[]>([]);
  const [activeVariantMenuId, setActiveVariantMenuId] = useState<string | null>(null);
  const stockMap = new Map(stockDraft);
  const lastUpdatedMap = new Map(lastUpdatedDraft);

  useEffect(() => {
    setStockDraft(inventoryRows.map(({ variant }) => [variant.id, String(variant.stock)] as const));
    setLastUpdatedDraft(inventoryRows.map(({ variant }) => [variant.id, variant.lastUpdated] as const));
  }, [inventoryRows]);

  useEffect(() => {
    setSelectedVariantIds((current) =>
      current.filter((variantId) => !deletedVariantIds.includes(variantId)),
    );
  }, [deletedVariantIds]);

  const updateStock = (variantId: string, stock: string) => {
    const normalizedStock = String(Math.max(Number(stock || 0), 0));
    setStockDraft((current) => current.map((entry) => (entry[0] === variantId ? [variantId, normalizedStock] : entry)));
    setLastUpdatedDraft((current) => current.map((entry) => (entry[0] === variantId ? [variantId, todayLabel] : entry)));
  };

  const toggleVariant = (variantId: string) => {
    setSelectedVariantIds((current) =>
      current.includes(variantId) ? current.filter((id) => id !== variantId) : [...current, variantId],
    );
  };

  const availableRows = inventoryRows.filter(({ variant }) => !deletedVariantIds.includes(variant.id));
  const filteredRows = availableRows.filter(({ product, variant }) => {
    const currentQty = Number(stockMap.get(variant.id) ?? variant.stock);
    const currentStockState = deriveStockState(currentQty);
    const matchStock = stockFilter === 'All Stock' ? true : currentStockState === stockFilter;
    const matchStatus = statusFilter === 'All Status' ? true : product.status === statusFilter;
    const matchCategory = categoryFilter === 'All Categories' ? true : product.categoryName === categoryFilter;
    return matchStock && matchStatus && matchCategory;
  });
  const groupedStockByProduct = filteredRows.reduce<Record<string, number>>((acc, row) => {
    const quantity = Number(stockMap.get(row.variant.id) ?? row.variant.stock);
    acc[row.product.id] = (acc[row.product.id] ?? 0) + quantity;
    return acc;
  }, {});
  const groupedProductIds = filteredRows.reduce<string[]>((acc, row) => {
    if (!acc.includes(row.product.id)) {
      acc.push(row.product.id);
    }
    return acc;
  }, []);

  const toggleProductCollapse = (productId: string) => {
    setCollapsedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  const applyToSelectedVariants = (updateFn: (currentQty: number) => number) => {
    if (selectedVariantIds.length === 0) return;
    setStockDraft((current) =>
      current.map((entry) =>
        selectedVariantIds.includes(entry[0])
          ? [entry[0], String(Math.max(updateFn(Number(entry[1])), 0))]
          : entry,
      ),
    );
    setLastUpdatedDraft((current) =>
      current.map((entry) =>
        selectedVariantIds.includes(entry[0]) ? [entry[0], todayLabel] : entry,
      ),
    );
  };

  const handleBulkUpdateStock = () => {
    applyToSelectedVariants((qty) => qty + 1);
    onRowAction('Inventory updated', `${selectedVariantIds.length} selected variants increased by +1.`);
    onBulkAction('Update Stock');
  };

  const handleMarkInStock = () => {
    applyToSelectedVariants((qty) => (qty <= 0 ? 1 : qty));
    onRowAction('Inventory updated', `${selectedVariantIds.length} selected variants marked as In Stock.`);
    onBulkAction('Mark In Stock');
  };

  const handleMarkOutOfStock = () => {
    applyToSelectedVariants(() => 0);
    onRowAction('Inventory updated', `${selectedVariantIds.length} selected variants marked as Out of Stock.`);
    onBulkAction('Mark Out of Stock');
  };

  const handleDeleteSelected = () => {
    if (selectedVariantIds.length === 0) return;
    setDeletedVariantIds((current) => [...new Set([...current, ...selectedVariantIds])]);
    onRowAction('Variants deleted', `${selectedVariantIds.length} selected variants removed from inventory view.`);
    setSelectedVariantIds([]);
    onBulkAction('Delete');
  };

  const handleSaveInventoryChanges = () => {
    const nextProducts = products.map((product) => {
      const nextVariants = product.variants
        .filter((variant) => !deletedVariantIds.includes(variant.id))
        .map((variant) => {
          const stock = Number(stockMap.get(variant.id) ?? variant.stock);
          return {
            ...variant,
            stock,
            stockState: deriveStockState(stock),
            lastUpdated: lastUpdatedMap.get(variant.id) ?? variant.lastUpdated,
          };
        });
      const stock = nextVariants.reduce((sum, variant) => sum + variant.stock, 0);

      return {
        ...product,
        variants: nextVariants,
        stock,
        stockState: deriveStockState(stock),
      };
    });

    onSaveInventory(nextProducts);
    setDeletedVariantIds([]);
    onRowAction('Inventory saved', 'Inventory changes were queued for backend save.');
    onBulkAction('Save inventory changes');
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center gap-3 rounded border border-outline-variant/20 bg-surface-lowest p-4">
        <select className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setStockFilter(event.target.value)} value={stockFilter}>
          <option>All Stock</option>
          <option>In Stock</option>
          <option>Low Stock</option>
          <option>Out of Stock</option>
          <option>High Stock</option>
        </select>
        <select className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
          <option>All Status</option>
          <option>Active</option>
          <option>Unpublished</option>
          <option>Hidden</option>
          <option>Draft</option>
        </select>
        <select className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
          <option>All Categories</option>
          {categories.map((category) => (
            <option key={category.id}>{category.name}</option>
          ))}
        </select>
        <div className="ml-auto inline-flex items-center gap-3">
          {inventoryView === 'Grouped' && groupedProductIds.length > 0 && (
            <button
              className="rounded border border-outline-variant/30 px-2 py-1 text-xs text-on-surface-variant hover:bg-surface-low hover:text-on-surface"
              onClick={() =>
                setCollapsedProductIds(
                  collapsedProductIds.length === groupedProductIds.length ? [] : groupedProductIds,
                )
              }
              type="button"
            >
              {collapsedProductIds.length === groupedProductIds.length ? 'Expand All' : 'Collapse All'}
            </button>
          )}
          <div className="inline-flex rounded border border-outline-variant/30 p-1 text-xs">
            <button
              className={`rounded px-2 py-1 ${inventoryView === 'Grouped' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              onClick={() => setInventoryView('Grouped')}
              type="button"
            >
              Grouped
            </button>
            <button
              className={`rounded px-2 py-1 ${inventoryView === 'Flat' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              onClick={() => setInventoryView('Flat')}
              type="button"
            >
              Flat
            </button>
          </div>
          <span className="text-sm text-on-surface-variant">
            {filteredRows.length === 0 ? 'Showing 0 of' : `Showing 1-${filteredRows.length} of`} {availableRows.length} items
          </span>
        </div>
      </section>

      <section className="overflow-hidden rounded border border-outline-variant/20 bg-surface-lowest">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-surface-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Variant</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Last Updated</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredRows.map(({ product, variant }, index) => {
                const isFirstVariantForProduct = index === 0 || filteredRows[index - 1].product.id !== product.id;
                const shouldShowGroupHeader = inventoryView === 'Grouped' && isFirstVariantForProduct;
                const isCollapsed = collapsedProductIds.includes(product.id);
                return (
                <Fragment key={variant.id}>
                {shouldShowGroupHeader && (
                  <tr className="bg-surface-low">
                    <td className="px-4 py-3" colSpan={8}>
                      <div className="flex items-center justify-between gap-3">
                        <button className="flex items-center gap-3 text-left" onClick={() => toggleProductCollapse(product.id)} type="button">
                          {isCollapsed ? <ChevronRight className="h-4 w-4 text-on-surface-variant" /> : <ChevronDown className="h-4 w-4 text-on-surface-variant" />}
                          <img alt="" className="h-9 w-9 rounded object-cover" referrerPolicy="no-referrer" src={product.thumbnailUrl} />
                          <div>
                            <p className="text-sm font-semibold">{product.title}</p>
                            <p className="text-xs text-on-surface-variant">{product.categoryName}</p>
                          </div>
                        </button>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Product Total Stock</p>
                          <p className="text-sm font-semibold">{groupedStockByProduct[product.id] ?? 0} units</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {(inventoryView === 'Flat' || !isCollapsed) && (
                <tr key={variant.id} className={selectedVariantIds.includes(variant.id) ? 'bg-primary/5' : 'hover:bg-surface-low'}>
                  <td className="px-4 py-4">
                    <input checked={selectedVariantIds.includes(variant.id)} onChange={() => toggleVariant(variant.id)} type="checkbox" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img alt="" className="h-12 w-12 rounded object-cover" referrerPolicy="no-referrer" src={product.thumbnailUrl} />
                      <div>
                        <p className="text-sm font-semibold">{product.title}</p>
                        <p className="text-xs text-on-surface-variant">{product.categoryName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{variant.name}</td>
                  <td className="px-4 py-4 font-mono text-sm">{variant.sku}</td>
                  <td className="px-4 py-4">
                    <div className="inline-flex items-center rounded border border-outline-variant/30">
                      <button className="px-3 py-2 text-sm hover:bg-surface-low" onClick={() => updateStock(variant.id, String(Math.max(Number(stockMap.get(variant.id) ?? variant.stock) - 1, 0)))} type="button">-</button>
                      <input
                        className="w-16 border-x border-outline-variant/30 bg-surface px-2 py-2 text-center text-sm"
                        onChange={(event) => updateStock(variant.id, event.target.value)}
                        type="number"
                        value={stockMap.get(variant.id) ?? String(variant.stock)}
                      />
                      <button className="px-3 py-2 text-sm hover:bg-surface-low" onClick={() => updateStock(variant.id, String(Number(stockMap.get(variant.id) ?? variant.stock) + 1))} type="button">+</button>
                    </div>
                  </td>
                  <td className="px-4 py-4"><ProductStatusBadge status={deriveStockState(Number(stockMap.get(variant.id) ?? variant.stock))} /></td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{lastUpdatedMap.get(variant.id) ?? variant.lastUpdated}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="relative inline-flex">
                      <button className="grid h-8 w-8 place-items-center rounded text-on-surface-variant hover:bg-surface-low hover:text-primary" onClick={() => setActiveVariantMenuId((current) => (current === variant.id ? null : variant.id))} type="button">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {activeVariantMenuId === variant.id && (
                        <div className="absolute right-0 top-10 z-10 min-w-44 rounded border border-outline-variant/20 bg-surface-lowest p-1 shadow-lg">
                          <button className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-surface-low" onClick={() => (window.location.hash = `/products/edit/${product.id}`)} type="button">Open Product</button>
                          <button className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-surface-low" onClick={() => {
                            updateStock(variant.id, '0');
                            onRowAction('Variant updated', `${variant.sku} was set to Out of Stock.`);
                            setActiveVariantMenuId(null);
                          }} type="button">Set Out of Stock</button>
                          <button className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-surface-low" onClick={() => {
                            const currentQty = Number(stockMap.get(variant.id) ?? variant.stock);
                            updateStock(variant.id, String(currentQty + 5));
                            onRowAction('Variant updated', `${variant.sku} quantity increased by 5.`);
                            setActiveVariantMenuId(null);
                          }} type="button">Add +5 Quantity</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                )}
                </Fragment>
              )})}
            </tbody>
          </table>
        </div>
      </section>

      {selectedVariantIds.length > 0 && (
        <section className="flex flex-col gap-3 rounded border border-primary/30 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-medium text-primary">{selectedVariantIds.length} items selected</p>
          <div className="flex flex-wrap gap-2">
            <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={handleBulkUpdateStock} type="button">Update Stock</button>
            <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={handleMarkInStock} type="button">Mark In Stock</button>
            <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={handleMarkOutOfStock} type="button">Mark Out of Stock</button>
            <button className="rounded border border-error/30 px-3 py-2 text-sm text-error hover:bg-error/5" onClick={handleDeleteSelected} type="button">Delete</button>
            <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={handleSaveInventoryChanges} type="button">Save Inventory Changes</button>
          </div>
        </section>
      )}
    </div>
  );
}

function CategoriesPage({
  categories,
  onCreateCategory,
  onViewAnalytics,
}: {
  categories: Category[];
  onCreateCategory: (category: Category) => void;
  onViewAnalytics: () => void;
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    status: 'Published' as Category['status'],
    coverUrl: '',
  });
  const publishedCategories = categories.filter((category) => category.status === 'Published').length;
  const updateDraft = (field: keyof typeof draft, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));
  const canCreate = draft.name.trim().length > 1;

  const createCategory = () => {
    if (!canCreate) {
      return;
    }

    const slug = slugify(draft.name.trim());
    onCreateCategory({
      id: `cat-${slug}-${Date.now().toString().slice(-4)}`,
      name: draft.name.trim(),
      description: draft.description.trim() || 'New category draft ready for merchandising.',
      status: draft.status,
      productIds: [],
      coverUrl: draft.coverUrl.trim() || `https://picsum.photos/seed/category-${slug}/480/240`,
      seoTitle: `${draft.name.trim()} | Bisora`,
      seoDescription: draft.description.trim() || `Shop ${draft.name.trim()} collection from Bisora.`,
      slug,
      health: 'Needs Products',
    });
    setShowCreateModal(false);
    setDraft({
      name: '',
      description: '',
      status: 'Published',
      coverUrl: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => setShowCreateModal(true)} type="button">
          <Plus className="h-4 w-4" />
          Create Category
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total Categories" value={String(categories.length)} helper={`${publishedCategories} active collections`} />
        <MetricCard label="Catalog Health" value="98%" helper="Ready for storefront browsing" />
        <MetricCard label="Top Performing" value='"Abayas & Modest Wear"' helper="Highest traffic category" />
      </section>

      <section className="overflow-hidden rounded border border-outline-variant/20 bg-surface-lowest">
        <table className="w-full text-left">
          <thead className="bg-surface-low text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Category Name</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-surface-low">
                <td className="px-4 py-4">
                  <button className="flex items-center gap-3 text-left" onClick={() => (window.location.hash = `/products/categories/${category.id}`)} type="button">
                    <img alt="" className="h-12 w-12 rounded object-cover" referrerPolicy="no-referrer" src={category.coverUrl} />
                    <span>
                      <span className="block text-sm font-semibold text-primary">{category.name}</span>
                      <span className="block text-xs text-on-surface-variant">{category.description}</span>
                    </span>
                  </button>
                </td>
                <td className="px-4 py-4 text-sm">{category.productIds.length} items</td>
                <td className="px-4 py-4"><ProductStatusBadge status={category.status} /></td>
                <td className="px-4 py-4 text-sm text-on-surface-variant">Oct 12, 2023</td>
                <td className="px-4 py-4 text-right">
                  <button className="text-sm font-medium text-primary hover:underline" onClick={() => (window.location.hash = `/products/categories/${category.id}`)} type="button">
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-6 rounded border border-outline-variant/20 bg-primary/90 p-6 text-on-primary lg:grid-cols-[minmax(0,1fr)_200px]">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-on-primary/70">Pro Tip</p>
          <h2 className="mt-3 text-2xl font-semibold">Optimize your categories for editorial discovery.</h2>
          <p className="mt-3 max-w-xl text-sm text-on-primary/80">Consider grouping products by collections to create a more narrative shopping experience for your clientele.</p>
        </div>
        <div className="flex items-center justify-start lg:justify-end">
          <button className="rounded border border-white/30 px-4 py-2 text-sm hover:bg-white/10" onClick={onViewAnalytics} type="button">
            View Analytics
          </button>
        </div>
      </section>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <section className="w-full max-w-lg rounded bg-surface-lowest p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Create Category</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Create a new collection category for products and storefront discovery.</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded text-on-surface-variant hover:bg-surface-low" onClick={() => setShowCreateModal(false)} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Category Name" onChange={(value) => updateDraft('name', value)} value={draft.name} />
              <label className="block space-y-2 text-sm font-medium">
                <span>Description</span>
                <textarea className="min-h-24 w-full rounded border border-outline-variant/30 bg-surface px-3 py-2" onChange={(event) => updateDraft('description', event.target.value)} value={draft.description} />
              </label>
              <Field label="Cover Image URL (optional)" onChange={(value) => updateDraft('coverUrl', value)} value={draft.coverUrl} />
              <label className="block space-y-2 text-sm font-medium">
                <span>Status</span>
                <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2" onChange={(event) => updateDraft('status', event.target.value)} value={draft.status}>
                  <option value="Published">Published</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={() => setShowCreateModal(false)} type="button">
                Cancel
              </button>
              <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60" disabled={!canCreate} onClick={createCategory} type="button">
                Create Category
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function EditProductStudio({
  categoryOptions,
  productRecords,
  product,
  onPreview,
  onDuplicate,
  onSave,
}: {
  categoryOptions: Category[];
  productRecords: Product[];
  product: Product;
  onPreview: () => void;
  onDuplicate: () => void;
  onSave: (record: Product, isNewProduct: boolean) => void;
}) {
  const productEditorTabs = ['Item', 'Options', 'Variants', 'Images', 'Shipping', 'Categories', 'SEO'] as const;
  const isNewProduct = product.id === 'prod-new-draft';
  const [form, setForm] = useState({
    title: product.title,
    description: product.description,
    status: product.status,
    price: String(product.price),
    compareAt: String(product.compareAtPrice ?? product.price + 70),
    costPerItem: '120',
    sku: product.sku,
    quantity: String(product.stock),
    categoryName: product.categoryName,
    tags: product.tags.join(', '),
    vendor: product.vendor,
    thumbnailUrl: product.thumbnailUrl,
    imageUrls: product.imageUrls?.length ? product.imageUrls : product.thumbnailUrl ? [product.thumbnailUrl] : [],
    slug: product.slug,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    weightKg: String(product.weightKg ?? 0),
    packageProfile: product.packageProfile ?? 'Pouch',
  });
  const [taxable, setTaxable] = useState(product.taxable ?? true);
  const [manageStock, setManageStock] = useState(product.manageStock ?? true);
  const [hasSku, setHasSku] = useState(product.hasSku ?? true);
  const [isPhysical, setIsPhysical] = useState(product.isPhysical ?? true);
  const [activeEditorTab, setActiveEditorTab] =
    useState<(typeof productEditorTabs)[number]>('Item');
  const [showVariantBuilder, setShowVariantBuilder] = useState(product.variants.length > 1);
  const [variantOptionDrafts, setVariantOptionDrafts] = useState<VariantOptionDraft[]>(
    deriveVariantOptionDrafts(product),
  );
  const [variantStockDraft, setVariantStockDraft] = useState(
    product.variants.map((variant) => [variant.name, String(variant.stock)] as const),
  );
  const [variantPriceDraft, setVariantPriceDraft] = useState(
    product.variants.map((variant) => [variant.name, String(variant.price)] as const),
  );
  const [variantSkuDraft, setVariantSkuDraft] = useState(
    product.variants.map((variant) => [variant.name, variant.sku] as const),
  );
  const [variantWeightDraft, setVariantWeightDraft] = useState(
    product.variants.map((variant) => [variant.name, String(product.weightKg ?? 0)] as const),
  );
  const [variantImageDraft, setVariantImageDraft] = useState(
    product.variants.map((variant) => [
      variant.name,
      uniqueImageUrls([variant.imageUrl ?? '', ...(variant.imageUrls ?? []), product.thumbnailUrl]),
    ] as const),
  );
  const [selectedVariantName, setSelectedVariantName] = useState(product.variants[0]?.name ?? 'Default');
  const [mediaUploadTarget, setMediaUploadTarget] = useState<{ type: 'product' } | { type: 'variant'; variantName: string }>({ type: 'product' });
  const [descriptionHtmlMode, setDescriptionHtmlMode] = useState(false);
  const [openDescriptionMenu, setOpenDescriptionMenu] = useState<null | 'format' | 'table' | 'link' | 'align' | 'color' | 'size'>(null);
  const [pendingLinkUrl, setPendingLinkUrl] = useState('');
  const [pendingLinkLabel, setPendingLinkLabel] = useState('');
  const [pendingImageUrl, setPendingImageUrl] = useState('');
  const [pendingVideoUrl, setPendingVideoUrl] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionSelectionRef = useRef<Range | null>(null);
  const descriptionToolbarRef = useRef<HTMLDivElement | null>(null);
  const [selectedTextColor, setSelectedTextColor] = useState('#000000');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugNotice, setSlugNotice] = useState('');
  const [mediaUploadStatus, setMediaUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle');

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const plainDescription = useMemo(() => stripHtml(form.description), [form.description]);
  const generatedSeoTitle = useMemo(
    () => (form.seoTitle.trim() ? form.seoTitle.trim() : form.title.trim() || 'New Product'),
    [form.seoTitle, form.title],
  );
  const generatedSeoDescription = useMemo(
    () => buildSeoDescription(form.seoDescription, plainDescription, form.title),
    [form.seoDescription, plainDescription, form.title],
  );
  const generatedSlug = useMemo(() => {
    const base = sanitizeSlug(form.title) || 'new-product';
    return ensureUniqueSlug(
      base,
      productRecords.map((item) => ({ id: item.id, slug: item.slug })),
      product.id,
    );
  }, [form.title, product.id, productRecords]);
  const safeSlug = useMemo(() => {
    const source = form.slug.trim() || generatedSlug;
    return ensureUniqueSlug(
      sanitizeSlug(source) || generatedSlug,
      productRecords.map((item) => ({ id: item.id, slug: item.slug })),
      product.id,
    );
  }, [form.slug, generatedSlug, product.id, productRecords]);
  const seoTitleValidation = getSeoTitleValidation(generatedSeoTitle);
  const seoDescriptionValidation = getSeoDescriptionValidation(generatedSeoDescription);
  const variantStockMap = new Map(variantStockDraft);
  const variantPriceMap = new Map(variantPriceDraft);
  const variantSkuMap = new Map(variantSkuDraft);
  const variantWeightMap = new Map(variantWeightDraft);
  const variantImageMap = new Map<string, string[]>(variantImageDraft);
  const variantOptionRepair = useMemo(
    () => buildVariantOptionRepair(variantOptionDrafts),
    [variantOptionDrafts],
  );
  const builtVariantRows = useMemo(() => {
    const activeOptions = variantOptionDrafts.filter(
      (option) => option.name.trim() && option.values.length > 0,
    );

    if (activeOptions.length === 0) {
      return product.variants.map((variant, index) => ({
        id: variant.id,
        name: variant.name,
        sku: getVariantDraftValue(variant.name, variantSkuMap, product.variants, (item) => item.sku, variant.sku),
        price: Number(getVariantDraftValue(variant.name, variantPriceMap, product.variants, (item) => String(item.price), String(variant.price))),
        stock: Number(getVariantDraftValue(variant.name, variantStockMap, product.variants, (item) => String(item.stock), String(variant.stock))),
        imageUrls: getVariantImages(variant.name, variantImageMap, product.variants, product.thumbnailUrl),
        imageUrl: firstImageUrl(getVariantImages(variant.name, variantImageMap, product.variants, product.thumbnailUrl)) ?? product.thumbnailUrl,
        sortIndex: index,
      }));
    }

    const existingVariantMap = new Map(product.variants.map((variant) => [variant.name, variant] as const));
    const combinations = activeOptions.reduce<string[][]>(
      (accumulator, option) => {
        if (accumulator.length === 0) {
          return option.values.map((value) => [value]);
        }
        return accumulator.flatMap((entry) => option.values.map((value) => [...entry, value]));
      },
      [],
    );

    return combinations.map((parts, index) => {
      const name = parts.join(' / ');
      const existing = existingVariantMap.get(name);
      const safeBaseSku = (form.sku || product.sku || 'NEW-SKU-001')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '-');
      const generatedSuffix = parts
        .map((part) => part.trim().slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, ''))
        .join('-');

      return {
        id: existing?.id ?? `generated-${index}-${generatedSuffix || 'VAR'}`,
        name,
        sku: getVariantDraftValue(name, variantSkuMap, product.variants, (item) => item.sku, existing?.sku ?? `${safeBaseSku}-${generatedSuffix || index + 1}`),
        price: Number(getVariantDraftValue(name, variantPriceMap, product.variants, (item) => String(item.price), String(existing?.price ?? Number(form.price || product.price || 0)))),
        stock: Number(getVariantDraftValue(name, variantStockMap, product.variants, (item) => String(item.stock), String(existing?.stock ?? 0))),
        imageUrls: getVariantImages(name, variantImageMap, product.variants, product.thumbnailUrl),
        imageUrl: firstImageUrl(getVariantImages(name, variantImageMap, product.variants, product.thumbnailUrl)) ?? existing?.imageUrl ?? product.thumbnailUrl,
        sortIndex: index,
      };
    });
  }, [form.price, form.sku, product.price, product.sku, product.thumbnailUrl, product.variants, variantOptionDrafts, variantStockMap, variantPriceMap, variantSkuMap, variantImageMap]);

  const totalVariantQuantity = useMemo(
    () => builtVariantRows.reduce((sum, variant) => sum + Number(variant.stock), 0),
    [builtVariantRows],
  );
  const displayQuantity = manageStock ? totalVariantQuantity : Number(form.quantity) || 0;
  const hasSelectedCategory = categoryOptions.some((category) => category.name === form.categoryName);
  const displayCategoryName = hasSelectedCategory ? form.categoryName : 'Uncategorized';

  useEffect(() => {
    updateForm('quantity', String(totalVariantQuantity));
  }, [totalVariantQuantity]);

  useEffect(() => {
    if (!variantOptionRepair) return;
    setShowVariantBuilder(true);
    setVariantOptionDrafts(variantOptionRepair.options);
    setSelectedVariantName(
      `${variantOptionRepair.colorValues[0]}${
        variantOptionRepair.sharedValues.length ? ` / ${variantOptionRepair.sharedValues[0]}` : ''
      }`,
    );
  }, [variantOptionRepair]);

  useEffect(() => {
    if (!slugManuallyEdited) {
      setForm((current) => (current.slug === generatedSlug ? current : { ...current, slug: generatedSlug }));
    }
  }, [generatedSlug, slugManuallyEdited]);

  const updateVariantStock = (variantName: string, quantity: string) => {
    const nextQuantity = String(Math.max(0, Number(quantity) || 0));
    setVariantStockDraft((current) =>
      current.some((entry) => entry[0] === variantName)
        ? current.map((entry) => (entry[0] === variantName ? [variantName, nextQuantity] : entry))
        : [...current, [variantName, nextQuantity] as const],
    );
    setForm((current) =>
      ({
        ...current,
        quantity: String(
          builtVariantRows.reduce(
            (sum, variant) =>
              sum + Number(variant.name === variantName ? nextQuantity : variantStockMap.get(variant.name) ?? variant.stock ?? 0),
            0,
          ),
        ),
      }),
    );
  };
  const updateVariantOptionDraft = (index: number, field: 'name' | 'pendingValue', value: string) => {
    setVariantOptionDrafts((current) => updateVariantOptionDraftState(current, index, field, value));
  };
  const addVariantOptionValue = (index: number) => {
    setVariantOptionDrafts((current) =>
      current.map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;
        const nextValue = entry.pendingValue.trim();
        if (!nextValue || entry.values.includes(nextValue)) return entry;
        return { ...entry, values: [...entry.values, nextValue], pendingValue: '' };
      }),
    );
  };
  const removeVariantOptionValue = (index: number, value: string) => {
    setVariantOptionDrafts((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, values: entry.values.filter((item) => item !== value) } : entry,
      ),
    );
  };
  const addVariantOption = () => {
    setShowVariantBuilder(true);
    setVariantOptionDrafts((current) => [...current, { id: `option-${Date.now()}-${current.length}`, name: '', values: [], pendingValue: '' }]);
  };
  const removeVariantOption = (index: number) => {
    setVariantOptionDrafts((current) => current.filter((_, entryIndex) => entryIndex !== index));
  };
  const updateVariantPrice = (variantName: string, price: string) => {
    setVariantPriceDraft((current) =>
      current.some((entry) => entry[0] === variantName)
        ? current.map((entry) => (entry[0] === variantName ? [variantName, price] : entry))
        : [...current, [variantName, price] as const],
    );
  };
  const updateVariantSku = (variantName: string, sku: string) => {
    setVariantSkuDraft((current) =>
      current.some((entry) => entry[0] === variantName)
        ? current.map((entry) => (entry[0] === variantName ? [variantName, sku] : entry))
        : [...current, [variantName, sku] as const],
    );
  };
  const updateVariantWeight = (variantName: string, weight: string) => {
    setVariantWeightDraft((current) =>
      current.some((entry) => entry[0] === variantName)
        ? current.map((entry) => (entry[0] === variantName ? [variantName, weight] : entry))
        : [...current, [variantName, weight] as const],
    );
  };
  const syncDescriptionFromEditor = () => {
    if (!descriptionRef.current) return;
    setForm((current) => ({ ...current, description: descriptionRef.current?.innerHTML ?? current.description }));
  };
  const saveDescriptionSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!isDescriptionRange(range, descriptionRef.current) || range.collapsed) {
      descriptionSelectionRef.current = null;
      return;
    }
    descriptionSelectionRef.current = range.cloneRange();
  };
  const restoreDescriptionSelection = () => {
    const selection = window.getSelection();
    if (!selection || !descriptionSelectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(descriptionSelectionRef.current);
  };
  const focusDescriptionEditor = () => {
    descriptionRef.current?.focus();
    restoreDescriptionSelection();
  };
  const runDescriptionCommand = (command: string, value?: string) => {
    focusDescriptionEditor();
    document.execCommand(command, false, value);
    syncDescriptionFromEditor();
    saveDescriptionSelection();
  };
  const toggleDescriptionBold = () => {
    const range = getActiveDescriptionRange(descriptionRef.current, descriptionSelectionRef.current);
    if (!range) return;

    const selection = window.getSelection();
    if (!selection) return;
    descriptionRef.current?.focus();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('bold', false);
    syncDescriptionFromEditor();
    saveDescriptionSelection();
  };
  const insertDescriptionHtml = (html: string) => {
    focusDescriptionEditor();
    document.execCommand('insertHTML', false, html);
    syncDescriptionFromEditor();
    saveDescriptionSelection();
  };
  const wrapDescriptionSelectionWithStyle = (style: string, fallback: string) => {
    focusDescriptionEditor();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString() || fallback;
    const fragment = range.createContextualFragment(`<span style="${style}">${selectedText}</span>`);
    range.deleteContents();
    range.insertNode(fragment);
    syncDescriptionFromEditor();
    saveDescriptionSelection();
  };
  const updateDescriptionHtml = (value: string) => {
    setForm((current) => ({ ...current, description: value }));
    if (descriptionRef.current && descriptionRef.current.innerHTML !== value) {
      descriptionRef.current.innerHTML = value;
    }
  };
  const findTableContext = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    while (node && node instanceof HTMLElement) {
      if (node.tagName === 'TD' || node.tagName === 'TH') {
        const cell = node as HTMLTableCellElement;
        const row = cell.parentElement as HTMLTableRowElement | null;
        const table = row?.closest('table') as HTMLTableElement | null;
        return row && table ? { cell, row, table } : null;
      }
      node = node.parentNode;
    }
    return null;
  };
  const getTableColumnCount = (row: HTMLTableRowElement) => Math.max(row.cells.length, 1);
  const buildTableRow = (columnCount: number, cellTag: 'td' | 'th' = 'td') =>
    `<tr>${Array.from({ length: columnCount }, () => `<${cellTag}>Cell</${cellTag}>`).join('')}</tr>`;
  const toggleDescriptionDivider = () => {
    focusDescriptionEditor();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      insertDescriptionHtml('<hr />');
      return;
    }

    const range = selection.getRangeAt(0);
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;

    const getNearbyHr = (target: Node | null): HTMLHRElement | null => {
      if (!target || !(target instanceof HTMLElement)) return null;
      if (target.tagName === 'HR') return target as HTMLHRElement;
      if (target.previousElementSibling?.tagName === 'HR') return target.previousElementSibling as HTMLHRElement;
      if (target.nextElementSibling?.tagName === 'HR') return target.nextElementSibling as HTMLHRElement;
      return target.querySelector('hr');
    };

    const hr = getNearbyHr(node);
    if (hr) {
      hr.remove();
      syncDescriptionFromEditor();
      saveDescriptionSelection();
      return;
    }

    insertDescriptionHtml('<hr />');
  };
  const applyDescriptionTextColor = (color: string) => {
    setSelectedTextColor(color);
    focusDescriptionEditor();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, color);
    syncDescriptionFromEditor();
    saveDescriptionSelection();
    setOpenDescriptionMenu(null);
  };
  const handleInsertLink = () => {
    focusDescriptionEditor();
    const href = pendingLinkUrl.trim() || 'https://';
    const label = pendingLinkLabel.trim() || window.getSelection()?.toString().trim() || href;
    insertDescriptionHtml(`<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    syncDescriptionFromEditor();
    saveDescriptionSelection();
    setPendingLinkUrl('');
    setPendingLinkLabel('');
    setOpenDescriptionMenu(null);
  };
  const handleInsertImage = () => {
    insertDescriptionHtml(`<img src="${pendingImageUrl || 'https://'}" alt="Product image" />`);
    setPendingImageUrl('');
    setShowImageModal(false);
  };
  const setVariantMainImage = (variantName: string, imageUrl: string) => {
    const nextImageUrl = imageUrl.trim();
    if (!nextImageUrl) return;
    setVariantImageDraft((current) =>
      current.some((entry) => entry[0] === variantName)
        ? current.map((entry) => (entry[0] === variantName ? [variantName, uniqueImageUrls([nextImageUrl, ...entry[1]])] : entry))
        : [...current, [variantName, [nextImageUrl]] as const],
    );
  };
  const addVariantImages = (variantName: string, imageUrls: string[]) => {
    setVariantImageDraft((current) =>
      current.some((entry) => entry[0] === variantName)
        ? current.map((entry) => (entry[0] === variantName ? [variantName, uniqueImageUrls([...entry[1], ...imageUrls])] : entry))
        : [...current, [variantName, uniqueImageUrls(imageUrls)] as const],
    );
  };
  const removeVariantImage = (variantName: string, imageUrl: string) => {
    setVariantImageDraft((current) =>
      current.map((entry) => (entry[0] === variantName ? [variantName, entry[1].filter((url) => url !== imageUrl)] : entry)),
    );
  };
  const handleMediaFileChange = async (files?: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0 || mediaUploadStatus === 'uploading') {
      return;
    }

    setMediaUploadStatus('uploading');

    try {
      const uploadedFiles = await Promise.all(
        selectedFiles.map((file) =>
          uploadMediaFile(file, {
            ownerType: 'product',
            ownerId: /^\d+$/.test(product.id) ? product.id : undefined,
          }),
        ),
      );
      const publicUrls = uploadedFiles.map((file) => file.publicUrl).filter((url): url is string => Boolean(url));

      if (publicUrls.length === 0) {
        throw new Error('Uploaded media did not return a public URL.');
      }

      const firstUrl = publicUrls[0];
      if (mediaUploadTarget.type === 'variant') {
        addVariantImages(mediaUploadTarget.variantName, publicUrls);
      } else {
        setForm((current) => ({
          ...current,
          thumbnailUrl: firstUrl,
          imageUrls: uniqueImageUrls([...current.imageUrls, ...publicUrls]),
        }));
      }
      setPendingImageUrl(firstUrl);
      setMediaUploadStatus('idle');
    } catch {
      setMediaUploadStatus('error');
    }
  };
  const onUploadMedia = (target: { type: 'product' } | { type: 'variant'; variantName: string } = { type: 'product' }) => {
    setMediaUploadTarget(target);
    mediaInputRef.current?.click();
  };
  const handleInsertVideo = () => {
    insertDescriptionHtml(`<iframe src="${pendingVideoUrl || 'https://'}" title="Product video"></iframe>`);
    setPendingVideoUrl('');
    setShowVideoModal(false);
  };
  const handleSlugChange = (value: string) => {
    const normalized = sanitizeSlug(value);
    const unique = ensureUniqueSlug(
      normalized || generatedSlug,
      productRecords.map((item) => ({ id: item.id, slug: item.slug })),
      product.id,
    );
    setSlugManuallyEdited(true);
    setSlugNotice(unique !== normalized && normalized ? 'Slug adjusted to stay unique.' : '');
    setForm((current) => ({ ...current, slug: unique }));
  };
  const handleSaveProduct = () => {
    const nextTitle = form.title.trim() || 'New Product';
    const nextSlug = safeSlug;
    const numericPrice = Number(form.price) || 0;
    const numericCompareAt = Number(form.compareAt) || 0;
    const numericWeight = Number(form.weightKg) || 0;
    const selectedCategory = categoryOptions.find((category) => category.name === form.categoryName);
    const nextId =
      isNewProduct
        ? `prod-${nextSlug}-${Date.now().toString().slice(-4)}`
        : product.id;
    const variantRows = builtVariantRows.map((variant, index) => ({
      id: variant.id.startsWith('generated-') || variant.id === 'var-new-1' ? `${nextId}-variant-${index + 1}` : variant.id,
      name: variant.name,
      sku: variantSkuMap.get(variant.name) ?? variant.sku,
      price: Number(variantPriceMap.get(variant.name) ?? variant.price) || numericPrice,
      stock: Number(variantStockMap.get(variant.name) ?? variant.stock) || 0,
      stockState: deriveStockState(Number(variantStockMap.get(variant.name) ?? variant.stock) || 0),
      lastUpdated: 'Today',
      imageUrls: variantImageMap.get(variant.name) ?? uniqueImageUrls([variant.imageUrl ?? '', ...(variant.imageUrls ?? []), form.thumbnailUrl]),
      imageUrl: firstImageUrl(variantImageMap.get(variant.name)) ?? variant.imageUrl ?? form.thumbnailUrl,
    }));
    const numericStock = manageStock
      ? variantRows.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
      : Number(form.quantity) || 0;
    const nextCategoryName = selectedCategory?.name ?? 'Uncategorized';
    const nextRecord: Product = {
      ...product,
      id: nextId,
      title: nextTitle,
      description: form.description,
      status: form.status as Product['status'],
      price: numericPrice,
      compareAtPrice: numericCompareAt,
      stock: numericStock,
      stockState: deriveStockState(numericStock),
      sku: form.sku.trim() || `${nextSlug.toUpperCase()}-001`,
      categoryId: selectedCategory?.id ?? '',
      categoryName: nextCategoryName,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      vendor: form.vendor.trim() || 'Bisora',
      thumbnailUrl: form.thumbnailUrl || form.imageUrls[0] || '',
      imageUrls: uniqueImageUrls(form.imageUrls.length > 0 ? form.imageUrls : [form.thumbnailUrl]),
      slug: nextSlug,
      seoTitle: generatedSeoTitle,
      seoDescription: generatedSeoDescription,
      taxable,
      manageStock,
      hasSku,
      isPhysical,
      weightKg: numericWeight,
      packageProfile: form.packageProfile as Product['packageProfile'],
      variants: variantRows,
    };

    onSave(nextRecord, isNewProduct);
  };

  useEffect(() => {
    if (!descriptionHtmlMode && descriptionRef.current && descriptionRef.current.innerHTML !== form.description) {
      descriptionRef.current.innerHTML = form.description;
    }
  }, [descriptionHtmlMode, form.description]);

  useEffect(() => {
    const handleOutsideToolbarClick = (event: MouseEvent) => {
      if (!descriptionToolbarRef.current) return;
      if (descriptionToolbarRef.current.contains(event.target as Node)) return;
      setOpenDescriptionMenu(null);
    };

    document.addEventListener('mousedown', handleOutsideToolbarClick);
    return () => document.removeEventListener('mousedown', handleOutsideToolbarClick);
  }, []);

  useEffect(() => {
    if (!builtVariantRows.some((variant) => variant.name === selectedVariantName) && builtVariantRows[0]) {
      setSelectedVariantName(builtVariantRows[0].name);
    }
  }, [builtVariantRows, selectedVariantName]);

  const selectedVariant =
    builtVariantRows.find((variant) => variant.name === selectedVariantName) ?? builtVariantRows[0];
  return (
    <div className="space-y-6">
      <button className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" onClick={() => (window.location.hash = '/products')} type="button">
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </button>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm text-on-surface-variant">Products</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {isNewProduct ? 'Create product' : form.title || 'New Product'}
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            {isNewProduct
              ? 'Start with the core product details first. Save the product, then open deeper variant and tab-level setup.'
              : 'Product workspace for catalog, media, inventory, shipping, categories, and SEO.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onPreview} type="button">Preview</button>
          <button className="inline-flex items-center gap-2 rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onDuplicate} type="button">
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
          <button className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={handleSaveProduct} type="button">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>

      {!isNewProduct && (
        <div className="flex gap-2 overflow-x-auto border-b border-outline-variant/20">
          {productEditorTabs.map((tab) => (
            <button
              key={tab}
              className={`min-w-max border-b-2 px-3 py-3 text-sm font-medium ${
                tab === activeEditorTab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setActiveEditorTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_320px]">
        <div className="space-y-6">
          <section className="rounded border border-outline-variant/20 bg-surface-lowest p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded border border-success/20 bg-success/5 p-4">
                <p className="text-sm font-semibold text-success">Live editor controls</p>
                <p className="mt-2 text-xs text-on-surface-variant">
                  Product text, gallery images, variant rows, variant images, stock-by-variant, pricing, shipping basics,
                  categories, and SEO fields save through the live product flow.
                </p>
              </div>
              <div className="rounded border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">External integrations later</p>
                <p className="mt-2 text-xs text-on-surface-variant">
                  Courier rates, provider waybills, payment settlement, and inventory history logs will connect as the next backend integrations.
                </p>
              </div>
            </div>
          </section>

          {(isNewProduct || activeEditorTab === 'Item') && (
          <Panel title="Basic Information">
            <div className="space-y-4">
              <Field label="Product name" value={form.title} onChange={(value) => updateForm('title', value)} />
              <div className="block space-y-2 text-sm font-medium">
                <span>Description</span>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2" ref={descriptionToolbarRef}>
                    <ToolbarButton icon={<Bold className="h-4 w-4" />} title="Bold" onClick={toggleDescriptionBold} />
                    <ToolbarButton icon={<Italic className="h-4 w-4" />} title="Italic" onClick={() => runDescriptionCommand('italic')} />
                    <ToolbarButton icon={<Strikethrough className="h-4 w-4" />} title="Strikethrough" onClick={() => runDescriptionCommand('strikeThrough')} />
                    <ToolbarDropdown
                      active={openDescriptionMenu === 'format'}
                      icon={<Pilcrow className="h-4 w-4" />}
                      title="Format"
                      onToggle={() => setOpenDescriptionMenu((current) => (current === 'format' ? null : 'format'))}
                    >
                      {openDescriptionMenu === 'format' && (
                      <ToolbarMenu>
                        <ToolbarMenuButton label="Normal text" onClick={() => { runDescriptionCommand('formatBlock', 'P'); setOpenDescriptionMenu(null); }} />
                        <ToolbarMenuButton label="Quote" onClick={() => { runDescriptionCommand('formatBlock', 'BLOCKQUOTE'); setOpenDescriptionMenu(null); }} />
                        <ToolbarMenuButton label="Code" onClick={() => { insertDescriptionHtml('<pre><code>Code snippet</code></pre>'); setOpenDescriptionMenu(null); }} />
                        {[1, 2, 3, 4, 5, 6].map((level) => (
                          <ToolbarMenuButton
                            key={level}
                            label={`Heading ${level}`}
                            onClick={() => {
                              runDescriptionCommand('formatBlock', `H${level}`);
                              setOpenDescriptionMenu(null);
                            }}
                          />
                        ))}
                      </ToolbarMenu>
                      )}
                    </ToolbarDropdown>
                    <ToolbarButton icon={<Minus className="h-4 w-4" />} title="Line" onClick={toggleDescriptionDivider} />
                    <ToolbarButton icon={<UnderlineIcon className="h-4 w-4" />} title="Underline" onClick={() => runDescriptionCommand('underline')} />
                    <ToolbarButton icon={<ListOrdered className="h-4 w-4" />} title="Numbers" onClick={() => runDescriptionCommand('insertOrderedList')} />
                    <ToolbarButton icon={<List className="h-4 w-4" />} title="Bullets" onClick={() => runDescriptionCommand('insertUnorderedList')} />
                    <ToolbarButton icon={<SuperscriptIcon className="h-4 w-4" />} title="Superscript" onClick={() => runDescriptionCommand('superscript')} />
                    <ToolbarButton icon={<SubscriptIcon className="h-4 w-4" />} title="Subscript" onClick={() => runDescriptionCommand('subscript')} />
                    <ToolbarButton icon={<ImageIcon className="h-4 w-4" />} title="Image" onClick={() => setShowImageModal(true)} />
                    <ToolbarButton icon={<Video className="h-4 w-4" />} title="Video" onClick={() => setShowVideoModal(true)} />
                    <ToolbarDropdown
                      active={openDescriptionMenu === 'table'}
                      icon={<Table2 className="h-4 w-4" />}
                      title="Table"
                      onToggle={() => setOpenDescriptionMenu((current) => (current === 'table' ? null : 'table'))}
                    >
                      {openDescriptionMenu === 'table' && (
                      <ToolbarMenu>
                        <ToolbarMenuButton label="Insert table" onClick={() => { insertDescriptionHtml('<table border=\"1\" style=\"width:100%;border-collapse:collapse;\"><tr><td>Column 1</td><td>Column 2</td></tr><tr><td>Value</td><td>Value</td></tr></table>'); setOpenDescriptionMenu(null); }} />
                        <ToolbarMenuButton label="Insert row above" onClick={() => {
                          const context = findTableContext();
                          if (context) {
                            context.row.insertAdjacentHTML('beforebegin', buildTableRow(getTableColumnCount(context.row)));
                            syncDescriptionFromEditor();
                          }
                          setOpenDescriptionMenu(null);
                        }} />
                        <ToolbarMenuButton label="Insert row below" onClick={() => {
                          const context = findTableContext();
                          if (context) {
                            context.row.insertAdjacentHTML('afterend', buildTableRow(getTableColumnCount(context.row)));
                            syncDescriptionFromEditor();
                          }
                          setOpenDescriptionMenu(null);
                        }} />
                        <ToolbarMenuButton label="Insert column left" onClick={() => {
                          const context = findTableContext();
                          if (context) {
                            const index = context.cell.cellIndex;
                            Array.from(context.table.rows).forEach((row) => {
                              const tag = row.parentElement?.tagName === 'THEAD' ? 'th' : 'td';
                              const cell = row.insertCell(index);
                              cell.outerHTML = `<${tag}>Cell</${tag}>`;
                            });
                            syncDescriptionFromEditor();
                          }
                          setOpenDescriptionMenu(null);
                        }} />
                        <ToolbarMenuButton label="Insert column right" onClick={() => {
                          const context = findTableContext();
                          if (context) {
                            const index = context.cell.cellIndex + 1;
                            Array.from(context.table.rows).forEach((row) => {
                              const tag = row.parentElement?.tagName === 'THEAD' ? 'th' : 'td';
                              const cell = row.insertCell(index);
                              cell.outerHTML = `<${tag}>Cell</${tag}>`;
                            });
                            syncDescriptionFromEditor();
                          }
                          setOpenDescriptionMenu(null);
                        }} />
                        <ToolbarMenuButton label="Add head" onClick={() => {
                          const context = findTableContext();
                          if (context && !context.table.tHead) {
                            const thead = context.table.createTHead();
                            thead.innerHTML = buildTableRow(getTableColumnCount(context.row), 'th');
                            syncDescriptionFromEditor();
                          }
                          setOpenDescriptionMenu(null);
                        }} />
                        <ToolbarMenuButton label="Delete head" onClick={() => {
                          const context = findTableContext();
                          context?.table.tHead?.remove();
                          syncDescriptionFromEditor();
                          setOpenDescriptionMenu(null);
                        }} />
                        <ToolbarMenuButton label="Delete column" onClick={() => {
                          const context = findTableContext();
                          if (context) {
                            const index = context.cell.cellIndex;
                            Array.from(context.table.rows).forEach((row) => {
                              if (row.cells[index]) row.deleteCell(index);
                            });
                            syncDescriptionFromEditor();
                          }
                          setOpenDescriptionMenu(null);
                        }} />
                        <ToolbarMenuButton label="Delete row" onClick={() => {
                          const context = findTableContext();
                          context?.row.remove();
                          syncDescriptionFromEditor();
                          setOpenDescriptionMenu(null);
                        }} />
                        <ToolbarMenuButton label="Delete table" onClick={() => {
                          const context = findTableContext();
                          context?.table.remove();
                          syncDescriptionFromEditor();
                          setOpenDescriptionMenu(null);
                        }} />
                      </ToolbarMenu>
                      )}
                    </ToolbarDropdown>
                    <ToolbarDropdown
                      active={openDescriptionMenu === 'link'}
                      icon={<Link2 className="h-4 w-4" />}
                      title="Link"
                      onToggle={() => setOpenDescriptionMenu((current) => (current === 'link' ? null : 'link'))}
                    >
                      {openDescriptionMenu === 'link' && (
                      <ToolbarMenu className="w-72 space-y-3">
                        <label className="block space-y-1 text-xs font-medium">
                          <span>Link label</span>
                          <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setPendingLinkLabel(event.target.value)} value={pendingLinkLabel} />
                        </label>
                        <label className="block space-y-1 text-xs font-medium">
                          <span>URL</span>
                          <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setPendingLinkUrl(event.target.value)} value={pendingLinkUrl} />
                        </label>
                        <div className="flex gap-2">
                          <button className="rounded bg-primary px-3 py-2 text-xs font-medium text-on-primary" onClick={handleInsertLink} type="button">Insert link</button>
                          <button className="rounded border border-outline-variant/30 px-3 py-2 text-xs" onClick={() => { runDescriptionCommand('unlink'); setOpenDescriptionMenu(null); }} type="button">Unlink</button>
                        </div>
                      </ToolbarMenu>
                      )}
                    </ToolbarDropdown>
                    <ToolbarButton icon={<CodeXml className="h-4 w-4" />} title="HTML" onClick={() => setDescriptionHtmlMode((current) => !current)} active={descriptionHtmlMode} />
                    <ToolbarDropdown
                      active={openDescriptionMenu === 'align'}
                      icon={<AlignLeft className="h-4 w-4" />}
                      title="Align"
                      onToggle={() => setOpenDescriptionMenu((current) => (current === 'align' ? null : 'align'))}
                    >
                      {openDescriptionMenu === 'align' && (
                      <ToolbarMenu>
                        {[
                          ['Align Left', 'left'],
                          ['Align Center', 'center'],
                          ['Align Right', 'right'],
                          ['Align Justify', 'justify'],
                        ].map(([label, value]) => (
                          <ToolbarMenuButton
                            key={value}
                            label={label}
                            onClick={() => {
                              runDescriptionCommand(
                                value === 'left'
                                  ? 'justifyLeft'
                                  : value === 'center'
                                    ? 'justifyCenter'
                                    : value === 'right'
                                      ? 'justifyRight'
                                      : 'justifyFull',
                              );
                              setOpenDescriptionMenu(null);
                            }}
                          />
                        ))}
                      </ToolbarMenu>
                      )}
                    </ToolbarDropdown>
                    <ToolbarDropdown
                      active={openDescriptionMenu === 'color'}
                      icon={<Palette className="h-4 w-4" />}
                      title="Text Color"
                      onToggle={() => setOpenDescriptionMenu((current) => (current === 'color' ? null : 'color'))}
                    >
                      {openDescriptionMenu === 'color' && (
                      <ToolbarMenu className="w-72 space-y-3">
                        <div className="rounded border border-outline-variant/20 bg-surface p-3">
                          <div className="flex items-center gap-3">
                            <button
                              className="h-12 w-12 rounded border border-outline-variant/20"
                              onMouseDown={preventToolbarMouseDown}
                              style={{ backgroundColor: selectedTextColor }}
                              type="button"
                            />
                            <input
                              className="h-10 w-full rounded border border-outline-variant/30 bg-surface"
                              onChange={(event) => setSelectedTextColor(event.target.value)}
                              type="color"
                              value={selectedTextColor}
                            />
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {['R', 'G', 'B'].map((channel, index) => (
                              <label key={channel} className="block space-y-1 text-[11px] font-medium">
                                <span>{channel}</span>
                                <input
                                  className="w-full rounded border border-outline-variant/30 bg-surface px-2 py-1 text-xs"
                                  onChange={(event) => {
                                    const numeric = Math.max(0, Math.min(255, Number(event.target.value) || 0));
                                    const rgb = hexToRgb(selectedTextColor);
                                    const next = index === 0 ? { ...rgb, r: numeric } : index === 1 ? { ...rgb, g: numeric } : { ...rgb, b: numeric };
                                    setSelectedTextColor(rgbToHex(next.r, next.g, next.b));
                                  }}
                                  type="number"
                                  value={index === 0 ? hexToRgb(selectedTextColor).r : index === 1 ? hexToRgb(selectedTextColor).g : hexToRgb(selectedTextColor).b}
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {['#000000', '#7d6651', '#b9966f', '#757f8f', '#3769de', '#16a34a', '#ef2b2d', '#f59e0b', '#7c3aed', '#e64997', '#1f8a82', '#ffffff'].map((color) => (
                            <button
                              key={color}
                              className="h-8 rounded border border-outline-variant/20"
                              onMouseDown={preventToolbarMouseDown}
                              onClick={() => applyDescriptionTextColor(color)}
                              style={{ backgroundColor: color }}
                              type="button"
                            />
                          ))}
                        </div>
                      </ToolbarMenu>
                      )}
                    </ToolbarDropdown>
                    <ToolbarDropdown
                      active={openDescriptionMenu === 'size'}
                      icon={<Type className="h-4 w-4" />}
                      title="Size"
                      onToggle={() => setOpenDescriptionMenu((current) => (current === 'size' ? null : 'size'))}
                    >
                      {openDescriptionMenu === 'size' && (
                      <ToolbarMenu>
                        {['10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '30px'].map((size) => (
                          <ToolbarMenuButton
                            key={size}
                            label={size}
                            onClick={() => {
                              wrapDescriptionSelectionWithStyle(`font-size:${size};`, 'Sized text');
                              setOpenDescriptionMenu(null);
                            }}
                          />
                        ))}
                        <ToolbarMenuButton label="Remove Font Size" onClick={() => { runDescriptionCommand('removeFormat'); setOpenDescriptionMenu(null); }} />
                      </ToolbarMenu>
                      )}
                    </ToolbarDropdown>
                  </div>

                  {descriptionHtmlMode ? (
                    <textarea
                      className="min-h-40 w-full rounded border border-outline-variant/30 bg-neutral-900 px-3 py-2 font-mono text-surface"
                      onChange={(event) => updateDescriptionHtml(event.target.value)}
                      value={form.description}
                    />
                  ) : (
                    <div
                      ref={descriptionRef}
                      className="min-h-40 w-full rounded border border-outline-variant/30 bg-surface-low px-3 py-2 outline-none"
                      contentEditable
                      onBlur={() => {
                        syncDescriptionFromEditor();
                        saveDescriptionSelection();
                      }}
                      onFocus={() => {
                        if (window.getSelection()?.toString()) return;
                        descriptionSelectionRef.current = null;
                      }}
                      onInput={syncDescriptionFromEditor}
                      onKeyUp={saveDescriptionSelection}
                      onMouseUp={saveDescriptionSelection}
                      suppressContentEditableWarning
                    />
                  )}
                  <p className="text-xs text-on-surface-variant">
                    Create product kekal simple. Rich description tools di sini guna insert/wrap snippets supaya seller boleh sediakan content awal sebelum save dan pergi edit workspace.
                  </p>
                </div>
              </div>
            </div>
          </Panel>
          )}

          {(isNewProduct || activeEditorTab === 'Item' || activeEditorTab === 'Images') && (
          <Panel title="Media">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Product gallery</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  These images represent the product generally. The image marked Main is used for product cards, search, and default storefront preview.
                </p>
              </div>
              <p className="text-xs text-on-surface-variant">
                Upload product images into storage. Large JPG, PNG, and WebP files are compressed before upload, with a 5MB safety limit.
              </p>
              <input
                ref={mediaInputRef}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                multiple
                onChange={(event) => {
                  void handleMediaFileChange(event.target.files);
                  event.currentTarget.value = '';
                }}
                type="file"
              />
              <div className="grid gap-3 sm:grid-cols-4">
              {uniqueImageUrls(form.imageUrls.length ? form.imageUrls : [form.thumbnailUrl]).map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  className={`relative h-32 overflow-hidden rounded border ${form.thumbnailUrl === imageUrl ? 'border-primary' : 'border-outline-variant/20'}`}
                  onClick={() => updateForm('thumbnailUrl', imageUrl)}
                  type="button"
                >
                  <img alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" src={imageUrl} />
                  {form.thumbnailUrl === imageUrl && <span className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-[10px] font-semibold text-on-primary">Main</span>}
                </button>
              ))}
              <button className="grid h-32 place-items-center rounded border border-dashed border-outline-variant/40 bg-surface-low text-sm text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-60" disabled={mediaUploadStatus === 'uploading'} onClick={() => onUploadMedia()} type="button">
                <span className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> {mediaUploadStatus === 'uploading' ? 'Uploading...' : 'Add Images'}</span>
              </button>
              </div>
              {mediaUploadStatus === 'error' && <p className="text-xs text-error">Image upload failed. Use JPG, PNG, WebP, or GIF and keep each file under 5MB after compression.</p>}
            </div>
          </Panel>
          )}

          {(isNewProduct || activeEditorTab === 'Options' || activeEditorTab === 'Variants') && (
          <Panel title="Variants">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded border border-outline-variant/20 bg-surface-low p-4">
                <div>
                  <p className="text-sm font-medium">Variant options</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Option name is the group, for example Color or Size. Add values like Pink, Brown, S, M, or 5 inside that group.
                  </p>
                </div>
                <button
                  className={`rounded px-3 py-2 text-sm font-medium ${
                    showVariantBuilder ? 'bg-primary text-on-primary' : 'border border-outline-variant/30 hover:bg-surface-lowest'
                  }`}
                  onClick={() => setShowVariantBuilder((current) => !current)}
                  type="button"
                >
                  {showVariantBuilder ? 'Hide options' : 'Add options'}
                </button>
              </div>

              {showVariantBuilder ? (
                <div className="space-y-3 rounded border border-outline-variant/20 p-4">
                  {variantOptionDrafts.map((option, optionIndex) => (
                    <div key={option.id} className="space-y-3 rounded border border-outline-variant/20 bg-surface-low p-4">
                      <div className="flex items-center justify-between gap-3">
                        <Field
                          label={`Option ${optionIndex + 1} name`}
                          value={option.name}
                          onChange={(value) => updateVariantOptionDraft(optionIndex, 'name', value)}
                        />
                        <button
                          className="mt-6 grid h-9 w-9 place-items-center rounded border border-outline-variant/30 text-on-surface-variant hover:bg-surface-lowest"
                          onClick={() => removeVariantOption(optionIndex)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <p className="w-full text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                          Option values, not stock quantity
                        </p>
                        {option.values.map((value) => (
                          <button
                            key={value}
                            className="inline-flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface px-3 py-1 text-xs"
                            onClick={() => removeVariantOptionValue(optionIndex, value)}
                            type="button"
                          >
                            {value}
                            <X className="h-3 w-3" />
                          </button>
                        ))}
                        {option.values.length === 0 && (
                          <p className="text-xs text-on-surface-variant">No values added yet.</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          className="h-10 flex-1 rounded border border-outline-variant/30 bg-surface px-3 text-sm outline-none focus:border-primary"
                          onChange={(event) => updateVariantOptionDraft(optionIndex, 'pendingValue', event.target.value)}
                          placeholder={option.name.toLowerCase().includes('color') || option.name.toLowerCase().includes('colour') ? 'Add color value, e.g. Red' : 'Add value, e.g. M or 5'}
                          value={option.pendingValue}
                        />
                        <button
                          className="rounded border border-outline-variant/30 px-4 py-2 text-sm font-medium hover:bg-surface-lowest"
                          onClick={() => addVariantOptionValue(optionIndex)}
                          type="button"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    onClick={addVariantOption}
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    Add another option
                  </button>
                </div>
              ) : (
                <div className="rounded border border-dashed border-outline-variant/30 bg-surface-low p-6 text-sm text-on-surface-variant">
                  Keep one simple product if you do not need size or color choices yet. Turn on options only when this
                  product needs variants.
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="bg-surface-low text-xs uppercase tracking-wider text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-3">Variant</th>
                      {hasSku && <th className="px-4 py-3">SKU</th>}
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Stock quantity</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {builtVariantRows.map((variant) => (
                      <tr
                        key={variant.id}
                        className={`cursor-pointer ${selectedVariantName === variant.name ? 'bg-primary/5' : ''}`}
                        onClick={() => setSelectedVariantName(variant.name)}
                      >
                        <td className="px-4 py-3 text-sm font-medium">{variant.name}</td>
                        {hasSku && <td className="px-4 py-3 font-mono text-sm">{variant.sku}</td>}
                        <td className="px-4 py-3 text-sm">{formatCurrency(variant.price)}</td>
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center rounded border border-outline-variant/30">
                            <button
                              className="px-3 py-2 text-sm hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={!manageStock}
                              onClick={() =>
                                updateVariantStock(
                                  variant.name,
                                  String(Math.max(Number(variantStockMap.get(variant.name) ?? variant.stock) - 1, 0)),
                                )
                              }
                              type="button"
                            >
                              -
                            </button>
                            <input
                              className="w-16 border-x border-outline-variant/30 bg-surface px-2 py-2 text-center text-sm disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={!manageStock}
                              onChange={(event) => updateVariantStock(variant.name, event.target.value)}
                              type="number"
                              value={variantStockMap.get(variant.name) ?? String(variant.stock)}
                            />
                            <button
                              className="px-3 py-2 text-sm hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={!manageStock}
                              onClick={() =>
                                updateVariantStock(
                                  variant.name,
                                  String(Number(variantStockMap.get(variant.name) ?? variant.stock) + 1),
                                )
                              }
                              type="button"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3"><ProductStatusBadge status={deriveStockState(Number(variantStockMap.get(variant.name) ?? variant.stock))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-on-surface-variant">
                Stock is the number field above. Option values only create choices like Color and Size.
              </p>
            </div>
          </Panel>
          )}

          {(!isNewProduct && activeEditorTab === 'Variants') && selectedVariant && (
          <Panel title="Variant Detail">
            <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
              <div className="space-y-2 rounded border border-outline-variant/20 bg-surface-low p-3">
                {builtVariantRows.map((variant) => (
                  <button
                    key={variant.id}
                    className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm ${
                      selectedVariantName === variant.name ? 'bg-primary text-on-primary' : 'hover:bg-surface-lowest'
                    }`}
                    onClick={() => setSelectedVariantName(variant.name)}
                    type="button"
                  >
                    <img alt="" className="h-10 w-10 rounded object-cover" referrerPolicy="no-referrer" src={selectedVariantImageUrl(variant, form.thumbnailUrl)} />
                    <span>{variant.name}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded border border-outline-variant/20 p-4">
                    <p className="text-sm font-medium">Variant images</p>
                    <div className="flex flex-wrap gap-3">
                      {uniqueImageUrls(selectedVariant.imageUrls?.length ? selectedVariant.imageUrls : [selectedVariant.imageUrl ?? form.thumbnailUrl]).map((imageUrl) => (
                        <button
                          key={imageUrl}
                          className={`relative h-16 w-16 overflow-hidden rounded border ${selectedVariant.imageUrl === imageUrl ? 'border-primary' : 'border-outline-variant/30'}`}
                          onClick={() => setVariantMainImage(selectedVariant.name, imageUrl)}
                          type="button"
                        >
                          <img alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" src={imageUrl} />
                          {selectedVariant.imageUrl === imageUrl && <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-on-primary">Main</span>}
                        </button>
                      ))}
                      <button className="grid h-16 w-16 place-items-center rounded border border-dashed border-outline-variant/40 bg-surface-low text-sm text-on-surface-variant" onClick={() => onUploadMedia({ type: 'variant', variantName: selectedVariant.name })} type="button">
                        +
                      </button>
                    </div>
                    <Field
                      label="Main variant image URL"
                      value={selectedVariant.imageUrl ?? form.thumbnailUrl}
                      onChange={(value) => setVariantMainImage(selectedVariant.name, value)}
                    />
                  </div>
                  <div className="space-y-3 rounded border border-outline-variant/20 p-4">
                    <p className="text-sm font-medium">Options</p>
                    <div className="text-sm text-on-surface-variant">
                      {selectedVariant.name.split(' / ').map((part) => (
                        <p key={part}>{part}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4 rounded border border-outline-variant/20 p-4">
                    <p className="text-sm font-medium">Pricing</p>
                    <Field
                      label="Variant price"
                      value={variantPriceMap.get(selectedVariant.name) ?? String(selectedVariant.price)}
                      onChange={(value) => updateVariantPrice(selectedVariant.name, value)}
                    />
                    <label className="flex items-center justify-between rounded border border-outline-variant/20 p-3 text-sm">
                      <span>Charge tax on this variant</span>
                      <input checked={taxable} onChange={() => setTaxable((current) => !current)} type="checkbox" />
                    </label>
                  </div>
                  <div className="space-y-4 rounded border border-outline-variant/20 p-4">
                    <p className="text-sm font-medium">Inventory</p>
                    <label className="flex items-center justify-between rounded border border-outline-variant/20 p-3 text-sm">
                      <span>Manage stock</span>
                      <input checked={manageStock} onChange={() => setManageStock((current) => !current)} type="checkbox" />
                    </label>
                    {hasSku && (
                      <Field
                        label="SKU"
                        value={variantSkuMap.get(selectedVariant.name) ?? selectedVariant.sku}
                        onChange={(value) => updateVariantSku(selectedVariant.name, value)}
                      />
                    )}
                    <Field
                      label="Quantity"
                      value={variantStockMap.get(selectedVariant.name) ?? String(selectedVariant.stock)}
                      onChange={(value) => updateVariantStock(selectedVariant.name, value)}
                    />
                  </div>
                </div>

                <div className="rounded border border-outline-variant/20 p-4">
                  <p className="text-sm font-medium">Shipping</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field
                      label="Weight (kg)"
                      value={variantWeightMap.get(selectedVariant.name) ?? form.weightKg}
                      onChange={(value) => updateVariantWeight(selectedVariant.name, value)}
                    />
                    <label className="block space-y-2 text-sm font-medium">
                      <span>Package profile</span>
                      <select
                        className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2"
                        onChange={(event) => updateForm('packageProfile', event.target.value)}
                        value={form.packageProfile}
                      >
                        <option>Pouch</option>
                        <option>Box</option>
                        <option>Large Box</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
          )}

          {(isNewProduct || activeEditorTab === 'Images' || activeEditorTab === 'Variants') && (
          <Panel title="Variant Images">
            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant">
                These images belong to a specific variant. Example: Pink uses pink photos, Brown uses brown photos. Click an image to make it the main image for that variant.
              </p>
              {builtVariantRows.map((variant) => {
                const imageUrls = uniqueImageUrls(variant.imageUrls?.length ? variant.imageUrls : [variant.imageUrl ?? form.thumbnailUrl]);
                return (
                <div key={variant.id} className="space-y-2 rounded border border-outline-variant/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{variant.name}</p>
                    <span className="text-xs text-on-surface-variant">{variant.stock} in stock</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {imageUrls.map((imageUrl) => (
                      <div key={imageUrl} className="group relative">
                        <button
                          className={`relative h-20 w-20 overflow-hidden rounded border ${variant.imageUrl === imageUrl ? 'border-primary' : 'border-outline-variant/30'}`}
                          onClick={() => setVariantMainImage(variant.name, imageUrl)}
                          type="button"
                        >
                          <img alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" src={imageUrl} />
                          {variant.imageUrl === imageUrl && <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-on-primary">Main</span>}
                        </button>
                        <button
                          className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-outline-variant/30 bg-surface-lowest text-on-surface-variant opacity-0 shadow group-hover:opacity-100"
                          onClick={() => removeVariantImage(variant.name, imageUrl)}
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button className="grid h-20 w-20 place-items-center rounded border border-dashed border-outline-variant/40 bg-surface-low text-sm text-on-surface-variant" onClick={() => onUploadMedia({ type: 'variant', variantName: variant.name })} type="button">
                      +
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </Panel>
          )}

          {(!isNewProduct && activeEditorTab === 'Shipping') && (
          <Panel title="Shipping Setup">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <label className="flex items-center justify-between rounded border border-outline-variant/20 p-3 text-sm">
                  <span>This is a physical product</span>
                  <input checked={isPhysical} onChange={() => setIsPhysical((current) => !current)} type="checkbox" />
                </label>
                {isPhysical ? (
                  <>
                    <Field label="Weight (kg)" value={form.weightKg} onChange={(value) => updateForm('weightKg', value)} />
                    <label className="block space-y-2 text-sm font-medium">
                      <span>Package profile</span>
                      <select
                        className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2"
                        onChange={(event) => updateForm('packageProfile', event.target.value)}
                        value={form.packageProfile}
                      >
                        <option>Pouch</option>
                        <option>Box</option>
                        <option>Large Box</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <p className="rounded border border-outline-variant/20 bg-surface-low p-4 text-sm text-on-surface-variant">
                    Digital or service products do not need packing weight, courier, or package profile.
                  </p>
                )}
              </div>
              <div className="rounded border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">Courier integration status</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Basic shipping fields save now. Courier rate API, waybill creation, and fulfillment automation will be wired in the shipping integration phase.
                </p>
              </div>
            </div>
          </Panel>
          )}

          {(!isNewProduct && activeEditorTab === 'Categories') && (
          <Panel title="Category & Organization">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <label className="block space-y-2 text-sm font-medium">
                  <span>Product Category</span>
                  <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2" onChange={(event) => updateForm('categoryName', event.target.value)} value={displayCategoryName}>
                    <option>Uncategorized</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <Field label="Tags" value={form.tags} onChange={(value) => updateForm('tags', value)} />
                <Field label="Vendor" value={form.vendor} onChange={(value) => updateForm('vendor', value)} />
              </div>
              <div className="rounded border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">{categoryOptions.length === 0 ? 'No categories yet' : `${categoryOptions.length} categories available`}</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {categoryOptions.length === 0
                    ? 'Save this product as Uncategorized first, then create collections from Products > Categories.'
                    : 'Choose one category here so storefront collection pages and filters can group this product correctly.'}
                </p>
                <button
                  className="mt-4 rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-lowest"
                  onClick={() => (window.location.hash = '/products/categories')}
                  type="button"
                >
                  Open Categories
                </button>
              </div>
            </div>
          </Panel>
          )}

          {(isNewProduct || activeEditorTab === 'SEO') && (
          <Panel title="Search Engine Listing">
            <div className="space-y-4">
              <Field label="SEO title" value={form.seoTitle} onChange={(value) => updateForm('seoTitle', value)} />
              <div className="space-y-2">
                <Field label="URL slug" value={form.slug} onChange={handleSlugChange} />
                <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant">
                  <span>{`Actual route: /products/${safeSlug}`}</span>
                  {!slugManuallyEdited && <span>Auto-generated from product name.</span>}
                  {slugNotice && <span className="text-primary">{slugNotice}</span>}
                </div>
              </div>
              <label className="block space-y-2 text-sm font-medium">
                <span>Meta description</span>
                <textarea className="min-h-24 w-full rounded border border-outline-variant/30 bg-surface px-3 py-2" onChange={(event) => updateForm('seoDescription', event.target.value)} value={form.seoDescription} />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <SeoValidationCard
                  label="Title length"
                  length={generatedSeoTitle.length}
                  recommendation="Recommended 50–60 characters."
                  status={seoTitleValidation}
                />
                <SeoValidationCard
                  label="Description length"
                  length={generatedSeoDescription.length}
                  recommendation="Recommended 140–160 characters."
                  status={seoDescriptionValidation}
                />
              </div>
              <div className="rounded border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold">Google Search Preview</p>
                <div className="mt-4 space-y-2 rounded border border-outline-variant/20 bg-white p-4">
                  <p className="text-xs text-success">{`bisora.com/products/${safeSlug}`}</p>
                  <h3 className="text-lg font-semibold text-primary">{generatedSeoTitle}</h3>
                  <p className="text-sm leading-6 text-on-surface-variant">{generatedSeoDescription}</p>
                </div>
                <p className="mt-3 text-xs text-on-surface-variant">
                  If SEO title or description stays empty, Bisora will fall back to product title and generated content summary.
                </p>
              </div>
            </div>
          </Panel>
          )}
        </div>

        <aside className="space-y-6">
          <Panel title="Live Preview">
            <div className="space-y-4 rounded border border-outline-variant/20 p-4">
              <img alt="" className="h-40 w-full rounded object-cover" referrerPolicy="no-referrer" src={form.thumbnailUrl} />
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{form.title || 'New Product'}</p>
                    <p className="text-sm text-on-surface-variant">/{form.slug || 'new-product'}</p>
                  </div>
                  <ProductStatusBadge status={form.status as Product['status']} />
                </div>
                <div
                  className="prose prose-sm max-w-none text-on-surface-variant line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: form.description || 'Product description preview will appear here as you type.' }}
                />
              </div>
              <div className="rounded bg-surface-low p-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold">{formatCurrency(Number(form.price) || 0)}</span>
                  {!!Number(form.compareAt) && Number(form.compareAt) > Number(form.price || 0) && (
                    <span className="text-sm text-on-surface-variant line-through">{formatCurrency(Number(form.compareAt) || 0)}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {deriveStockState(displayQuantity)} · {displayQuantity} units · {displayCategoryName}
                </p>
                {hasSku && <p className="mt-1 text-xs text-on-surface-variant">SKU: {form.sku || 'NEW-SKU-001'}</p>}
                {isPhysical && (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Shipping: {form.weightKg || '0'} kg · {form.packageProfile}
                  </p>
                )}
              </div>
              <div className="text-xs text-on-surface-variant">
                <p>Vendor: {form.vendor || 'Bisora'}</p>
                <p>Tags: {form.tags || 'No tags yet'}</p>
              </div>
            </div>
          </Panel>

          <Panel title="Status">
            <div className="space-y-4">
              <label className="block space-y-2 text-sm font-medium">
                <span>Product status</span>
                <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2" onChange={(event) => updateForm('status', event.target.value)} value={form.status}>
                  <option>Active</option>
                  <option>Draft</option>
                  <option>Unpublished</option>
                  <option>Hidden</option>
                </select>
              </label>
              <SummaryRow label="Live preview"><ProductStatusBadge status={form.status as Product['status']} /></SummaryRow>
            </div>
          </Panel>

          <Panel title="Pricing">
            <div className="space-y-4">
              <Field label="Price" value={form.price} onChange={(value) => updateForm('price', value)} />
              <Field label="Compare At" value={form.compareAt} onChange={(value) => updateForm('compareAt', value)} />
              <Field label="Cost per Item" value={form.costPerItem} onChange={(value) => updateForm('costPerItem', value)} />
              <label className="flex items-center justify-between rounded border border-outline-variant/20 p-3 text-sm">
                <span>Charge tax on this product</span>
                <input checked={taxable} onChange={() => setTaxable((current) => !current)} type="checkbox" />
              </label>
              <p className="text-xs text-on-surface-variant">These values will later feed storefront pricing, compare-at display, and margin reporting.</p>
            </div>
          </Panel>

          <Panel title="Inventory">
            <div className="space-y-4">
              <label className="flex items-center justify-between rounded border border-outline-variant/20 p-3 text-sm">
                <span>Manage stock</span>
                <input checked={manageStock} onChange={() => setManageStock((current) => !current)} type="checkbox" />
              </label>
              <label className="flex items-center justify-between rounded border border-outline-variant/20 p-3 text-sm">
                <span>This product has a SKU</span>
                <input checked={hasSku} onChange={() => setHasSku((current) => !current)} type="checkbox" />
              </label>
              {hasSku && <Field label="SKU" value={form.sku} onChange={(value) => updateForm('sku', value)} />}
              <Field label="Quantity Available (Auto from variants)" readOnly value={String(displayQuantity)} />
              <SummaryRow label="Inventory state">
                <ProductStatusBadge status={deriveStockState(displayQuantity)} />
              </SummaryRow>
              <p className="text-xs text-on-surface-variant">
                Quantity is calculated from all variant stocks above. Update stock per size/color in the Variants table when stock management is enabled.
              </p>
            </div>
          </Panel>

          {(isNewProduct || activeEditorTab === 'Item') && (
          <Panel title="Shipping">
            <div className="space-y-4">
              <label className="flex items-center justify-between rounded border border-outline-variant/20 p-3 text-sm">
                <span>This is a physical product</span>
                <input checked={isPhysical} onChange={() => setIsPhysical((current) => !current)} type="checkbox" />
              </label>
              {isPhysical ? (
                <>
                  <Field label="Weight (kg)" value={form.weightKg} onChange={(value) => updateForm('weightKg', value)} />
                  <label className="block space-y-2 text-sm font-medium">
                    <span>Package profile</span>
                    <select
                      className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2"
                      onChange={(event) => updateForm('packageProfile', event.target.value)}
                      value={form.packageProfile}
                    >
                      <option>Pouch</option>
                      <option>Box</option>
                      <option>Large Box</option>
                    </select>
                  </label>
                  <p className="text-xs text-on-surface-variant">
                    These values help shipping rates, courier assignment, and provider waybill creation later in the order flow.
                  </p>
                </>
              ) : (
                <p className="text-xs text-on-surface-variant">
                  Turn this on only when the product needs packing, courier handling, and delivery charges.
                </p>
              )}
            </div>
          </Panel>
          )}

          {(isNewProduct || activeEditorTab === 'Item') && (
          <Panel title="Organization">
            <div className="space-y-4">
              <label className="block space-y-2 text-sm font-medium">
                <span>Product Category</span>
                <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2" onChange={(event) => updateForm('categoryName', event.target.value)} value={displayCategoryName}>
                  <option>Uncategorized</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              {categoryOptions.length === 0 && (
                <p className="text-xs text-on-surface-variant">
                  No live categories yet. This product can save as Uncategorized first; create categories later from Products &gt; Categories.
                </p>
              )}
              <Field label="Tags" value={form.tags} onChange={(value) => updateForm('tags', value)} />
              <Field label="Vendor" value={form.vendor} onChange={(value) => updateForm('vendor', value)} />
            </div>
          </Panel>
          )}
        </aside>
      </section>

      {showImageModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <section className="w-full max-w-2xl rounded bg-surface-lowest p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Image</h2>
                <p className="mt-2 text-sm text-on-surface-variant">Insert an image URL into the product description.</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded text-on-surface-variant hover:bg-surface-low" onClick={() => setShowImageModal(false)} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block space-y-2 text-sm font-medium">
                <span>Image URL</span>
                <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2" onChange={(event) => setPendingImageUrl(event.target.value)} placeholder="https://example.com/image.jpg" value={pendingImageUrl} />
              </label>
              <div className="grid min-h-48 place-items-center rounded border-2 border-dashed border-primary/20 bg-surface-low text-sm text-on-surface-variant">
                Drop files here or click upload in the real storage phase.
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={() => setShowImageModal(false)} type="button">Cancel</button>
              <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={handleInsertImage} type="button">Insert</button>
            </div>
          </section>
        </div>
      )}

      {showVideoModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <section className="w-full max-w-2xl rounded bg-surface-lowest p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Video</h2>
                <p className="mt-2 text-sm text-on-surface-variant">Paste a video embed code or Youtube/Vimeo link.</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded text-on-surface-variant hover:bg-surface-low" onClick={() => setShowVideoModal(false)} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6">
              <label className="block space-y-2 text-sm font-medium">
                <span>Video embed code or URL</span>
                <textarea className="min-h-40 w-full rounded border border-outline-variant/30 bg-surface px-3 py-2" onChange={(event) => setPendingVideoUrl(event.target.value)} value={pendingVideoUrl} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={() => setShowVideoModal(false)} type="button">Cancel</button>
              <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={handleInsertVideo} type="button">Insert</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function CategoryDetailPage({
  category,
  products,
  activeTab,
  onAddProduct,
  onChangeCoverImage,
  onPreview,
  onDelete,
  onRemoveProduct,
  onSave,
}: {
  category: Category;
  products: Product[];
  activeTab: CategoryDetailTab;
  onAddProduct: () => void;
  onChangeCoverImage: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onRemoveProduct: (product: Product) => void;
  onSave: (category: Category) => void;
}) {
  const [draft, setDraft] = useState(category);

  useEffect(() => {
    setDraft(category);
  }, [category]);

  const updateDraft = <K extends keyof Category>(key: K, value: Category[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <button className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" onClick={() => (window.location.hash = '/products/categories')} type="button">
        <ArrowLeft className="h-4 w-4" />
        Back to categories
      </button>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm text-on-surface-variant">Products / Categories</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{draft.name}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">Manage category settings and product arrangement.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onPreview} type="button">Preview</button>
          <button className="inline-flex items-center gap-2 rounded border border-error/30 px-4 py-2 text-sm text-error hover:bg-error/5" onClick={onDelete} type="button">
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <button className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => onSave(draft)} type="button">
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-outline-variant/20">
        {categoryDetailTabs.map((tab) => (
          <button
            key={tab}
            className={`min-w-max border-b-2 px-3 py-3 text-sm font-medium ${
              tab === activeTab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => {
              const tabSlug = tab === 'Category' ? '' : `/${slugify(tab)}`;
              window.location.hash = `/products/categories/${draft.id}${tabSlug}`;
            }}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Category' && <CategorySettingsTab category={draft} onChange={updateDraft} onChangeCoverImage={onChangeCoverImage} />}
      {activeTab === 'Category Products' && <CategoryProductsTab category={draft} products={products} onAddProduct={onAddProduct} onRemoveProduct={onRemoveProduct} />}
      {activeTab === 'SEO' && <CategorySeoTab category={draft} onChange={updateDraft} />}
    </div>
  );
}

function CategorySettingsTab({
  category,
  onChange,
  onChangeCoverImage,
}: {
  category: Category;
  onChange: <K extends keyof Category>(key: K, value: Category[K]) => void;
  onChangeCoverImage: () => void;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Panel title="General Information">
        <div className="space-y-4">
          <Field label="Category name" onChange={(value) => onChange('name', value)} value={category.name} />
          <label className="block space-y-2 text-sm font-medium">
            <span>Description</span>
            <textarea className="min-h-32 w-full rounded border border-outline-variant/30 bg-surface px-3 py-2" onChange={(event) => onChange('description', event.target.value)} value={category.description} />
          </label>
        </div>
      </Panel>

      <aside className="space-y-6">
        <Panel title="Visibility">
          <div className="space-y-4">
            <label className="flex items-center justify-between rounded border border-outline-variant/20 p-4 text-sm">
              <span>Published</span>
              <input checked={category.status === 'Published'} onChange={() => onChange('status', 'Published')} type="checkbox" />
            </label>
            <label className="flex items-center justify-between rounded border border-outline-variant/20 p-4 text-sm">
              <span>Hidden</span>
              <input checked={category.status === 'Hidden'} onChange={() => onChange('status', 'Hidden')} type="checkbox" />
            </label>
          </div>
        </Panel>
        <Panel title="Category Preview">
          <img alt="" className="h-56 w-full rounded object-cover" referrerPolicy="no-referrer" src={category.coverUrl} />
          <button className="mt-4 w-full rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onChangeCoverImage} type="button">
            Change Cover Image
          </button>
        </Panel>
      </aside>
    </section>
  );
}

function CategoryProductsTab({
  category,
  products,
  onAddProduct,
  onRemoveProduct,
}: {
  category: Category;
  products: Product[];
  onAddProduct: () => void;
  onRemoveProduct: (product: Product) => void;
}) {
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState('Manual');
  const categoryProducts = useMemo(() => {
    const baseProducts = products.filter((product) => category.productIds.includes(product.id));
    const normalizedQuery = query.trim().toLowerCase();
    const searchedProducts = normalizedQuery
      ? baseProducts.filter((product) =>
          [product.title, product.sku, product.categoryName].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          ),
        )
      : baseProducts;

    if (sortMode === 'Price High to Low') {
      return [...searchedProducts].sort((a, b) => b.price - a.price);
    }
    if (sortMode === 'Price Low to High') {
      return [...searchedProducts].sort((a, b) => a.price - b.price);
    }
    if (sortMode === 'Stock High to Low') {
      return [...searchedProducts].sort((a, b) => b.stock - a.stock);
    }

    return searchedProducts;
  }, [category.productIds, query, sortMode]);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 rounded border border-outline-variant/20 bg-surface-lowest p-4 lg:grid-cols-[minmax(260px,1fr)_180px]">
        <label className="relative">
          <span className="sr-only">Search products to add</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            className="w-full rounded border border-outline-variant/30 bg-surface px-9 py-2 text-sm outline-none focus:border-primary"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products to add..."
            value={query}
          />
        </label>
        <select className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setSortMode(event.target.value)} value={sortMode}>
          <option>Manual</option>
          <option>Price High to Low</option>
          <option>Price Low to High</option>
          <option>Stock High to Low</option>
        </select>
      </section>

      <Panel title="Products in this category">
        <div className="space-y-3">
          {categoryProducts.length === 0 && (
            <div className="rounded border border-dashed border-outline-variant/30 bg-surface-lowest p-6 text-sm text-on-surface-variant">
              No products match the current search in this category.
            </div>
          )}
          {categoryProducts.map((product) => (
            <div key={product.id} className="flex items-center gap-4 rounded border border-outline-variant/20 p-4">
              <GripVertical className="h-4 w-4 text-on-surface-variant" />
              <img alt="" className="h-12 w-12 rounded object-cover" referrerPolicy="no-referrer" src={product.thumbnailUrl} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{product.title}</p>
                <p className="text-xs text-on-surface-variant">{product.sku}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatCurrency(product.price)}</p>
                <p className="text-xs text-on-surface-variant">{product.stock} in stock</p>
              </div>
              <button className="grid h-8 w-8 place-items-center rounded text-on-surface-variant hover:bg-surface-low" onClick={() => onRemoveProduct(product)} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <section className="grid place-items-center rounded border border-dashed border-outline-variant/30 bg-surface-lowest p-10 text-center">
        <div className="space-y-4">
          <p className="text-lg font-semibold">Build your collection</p>
          <p className="max-w-md text-sm text-on-surface-variant">Add more products to this category to help customers find the perfect match.</p>
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onAddProduct} type="button">
            Add Product
          </button>
        </div>
      </section>
    </div>
  );
}

function CategorySeoTab({
  category,
  onChange,
}: {
  category: Category;
  onChange: <K extends keyof Category>(key: K, value: Category[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <Panel title="Search Engine Optimization">
        <div className="space-y-4">
          <Field label="Meta Title" onChange={(value) => onChange('seoTitle', value)} value={category.seoTitle} />
          <label className="block space-y-2 text-sm font-medium">
            <span>Meta Description</span>
            <textarea className="min-h-28 w-full rounded border border-outline-variant/30 bg-surface px-3 py-2" onChange={(event) => onChange('seoDescription', event.target.value)} value={category.seoDescription} />
          </label>
          <Field label="URL Slug" onChange={(value) => onChange('slug', slugify(value))} value={category.slug} />
        </div>
      </Panel>

      <Panel title="Search Engine Preview">
        <div className="rounded border border-outline-variant/20 p-4">
          <p className="text-xs text-on-surface-variant">bisora.com / collections / {category.slug}</p>
          <h3 className="mt-2 text-lg font-semibold text-primary">{category.seoTitle}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">{category.seoDescription}</p>
        </div>
      </Panel>

      <Panel title="SEO Best Practices">
        <p className="text-sm text-on-surface-variant">Keep meta titles under 60 characters and descriptions under 160 characters to improve search visibility for collection pages.</p>
      </Panel>
    </div>
  );
}

function ActionDialog({
  title,
  description,
  confirmLabel,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <section className="w-full max-w-md rounded bg-surface-lowest p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-on-surface-variant">{description}</p>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded text-on-surface-variant hover:bg-surface-low" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onClose} type="button">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function InlineBanner({ title, description }: { title: string; description: string }) {
  return (
    <section className="flex items-start gap-3 rounded border border-success/30 bg-success/5 p-4">
      <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
      <div>
        <p className="text-sm font-semibold text-success">{title}</p>
        <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
      </div>
    </section>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
      <p className="text-sm text-on-surface-variant">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-on-surface-variant">{helper}</p>
    </article>
  );
}

function FilterChip({
  label,
  active = false,
  helper,
  onClick,
}: {
  label: string;
  active?: boolean;
  helper?: string;
  onClick?: () => void;
}) {
  return (
    <button
      className={`rounded border px-2.5 py-1 text-xs font-medium ${
        active
          ? 'border-primary bg-primary text-on-primary'
          : 'border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/50 hover:bg-surface-low'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
      {helper ? ` ${helper}` : ''}
    </button>
  );
}

function ToolbarButton({
  icon,
  title,
  onClick,
  active,
}: {
  icon: ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      className={`rounded border border-outline-variant/30 px-3 py-2 text-xs font-semibold ${
        active ? 'bg-primary text-on-primary' : 'bg-surface hover:bg-surface-low'
      }`}
      onMouseDown={preventToolbarMouseDown}
      onClick={onClick}
      title={title}
      type="button"
    >
      {icon}
    </button>
  );
}

function ToolbarDropdown({
  icon,
  title,
  onToggle,
  active,
  children,
}: {
  icon: ReactNode;
  title: string;
  onToggle: () => void;
  active?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="relative">
      <ToolbarButton active={active} icon={icon} onClick={onToggle} title={title} />
      {children}
    </div>
  );
}

function ToolbarMenu({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`absolute left-1/2 top-full z-10 mt-2 min-w-52 -translate-x-1/2 rounded border border-outline-variant/20 bg-surface-lowest p-2 shadow-lg ${className}`}>
      {children}
    </div>
  );
}

function ToolbarMenuButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-low"
      onMouseDown={preventToolbarMouseDown}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function SeoValidationCard({
  label,
  length,
  recommendation,
  status,
}: {
  label: string;
  length: number;
  recommendation: string;
  status: 'good' | 'warn' | 'danger';
}) {
  const styles =
    status === 'good'
      ? 'border-success/20 bg-success/5 text-success'
      : status === 'warn'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-error/20 bg-error/5 text-error';

  return (
    <div className={`rounded border p-4 ${styles}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{length}</p>
      <p className="mt-2 text-xs">{recommendation}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  const isReadOnly = readOnly || !onChange;
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 read-only:cursor-not-allowed read-only:bg-surface-low" onChange={(event) => onChange?.(event.target.value)} readOnly={isReadOnly} value={value} />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function preventToolbarMouseDown(event: React.MouseEvent) {
  event.preventDefault();
}

function getActiveDescriptionRange(root: HTMLElement | null, savedRange: Range | null) {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const currentRange = selection.getRangeAt(0);
    if (isDescriptionRange(currentRange, root) && !currentRange.collapsed) {
      return currentRange.cloneRange();
    }
  }

  if (savedRange && isDescriptionRange(savedRange, root) && !savedRange.collapsed) {
    return savedRange.cloneRange();
  }

  return null;
}

function isDescriptionRange(range: Range, root: HTMLElement | null) {
  return Boolean(root && root.contains(range.commonAncestorContainer));
}

function normalizeCategoryTab(subSection?: string): CategoryDetailTab {
  if (subSection === 'category-products') return 'Category Products';
  if (subSection === 'seo') return 'SEO';
  return 'Category';
}

function slugify(value: string) {
  return sanitizeSlug(value);
}

function deriveStockState(quantity: number): StockState {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= 5) return 'Low Stock';
  if (quantity >= 20) return 'High Stock';
  return 'In Stock';
}

function formatCurrency(value: string | number) {
  const numeric = Number(value);
  const amount = Number.isFinite(numeric) ? numeric : 0;
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function uniqueImageUrls(urls: string[]) {
  return Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)));
}

function firstImageUrl(urls?: string[]) {
  return uniqueImageUrls(urls ?? [])[0];
}

function getVariantDraftValue<T>(
  variantName: string,
  draftMap: Map<string, T>,
  existingVariants: Product['variants'],
  getExistingValue: (variant: Product['variants'][number]) => T | undefined,
  fallback: T,
) {
  if (draftMap.has(variantName)) return draftMap.get(variantName) ?? fallback;

  const closestDraftKey = findClosestVariantKey(variantName, Array.from(draftMap.keys()));
  if (closestDraftKey && draftMap.has(closestDraftKey)) return draftMap.get(closestDraftKey) ?? fallback;

  const closestVariantKey = findClosestVariantKey(variantName, existingVariants.map((variant) => variant.name));
  const closestVariant = existingVariants.find((variant) => variant.name === closestVariantKey);
  return closestVariant ? getExistingValue(closestVariant) ?? fallback : fallback;
}

function getVariantImages(
  variantName: string,
  draftMap: Map<string, string[]>,
  existingVariants: Product['variants'],
  fallbackImageUrl: string,
) {
  const draftImages = getVariantDraftValue(
    variantName,
    draftMap,
    existingVariants,
    (variant) => uniqueImageUrls([variant.imageUrl ?? '', ...(variant.imageUrls ?? [])]),
    [],
  );
  return uniqueImageUrls(draftImages.length ? draftImages : [fallbackImageUrl]);
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function ensureUniqueSlug(value: string, records: Array<{ id: string; slug: string }>, currentId: string) {
  const base = sanitizeSlug(value) || 'item';
  let candidate = base;
  let counter = 2;

  while (
    records.some(
      (record) => record.id !== currentId && sanitizeSlug(record.slug) === candidate,
    )
  ) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function buildSeoDescription(seoDescription: string, description: string, title: string) {
  const manual = seoDescription.trim();
  if (manual) {
    return manual.length > 160 ? `${manual.slice(0, 157).trim()}...` : manual;
  }

  const content = description.trim() || `Shop ${title || 'this product'} from Bisora.`;
  return content.length > 160 ? `${content.slice(0, 157).trim()}...` : content;
}

function getSeoTitleValidation(title: string): 'good' | 'warn' | 'danger' {
  if (!title.trim()) return 'danger';
  if (title.length < 30 || title.length > 65) return 'warn';
  return 'good';
}

function getSeoDescriptionValidation(description: string): 'good' | 'warn' | 'danger' {
  if (!description.trim()) return 'danger';
  if (description.length < 120 || description.length > 165) return 'warn';
  return 'good';
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').padEnd(6, '0').slice(0, 6);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toPart = (value: number) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
  return `#${toPart(r)}${toPart(g)}${toPart(b)}`;
}

function deriveVariantOptionDrafts(product: Product): VariantOptionDraft[] {
  const partsMatrix = product.variants.map((variant) => variant.name.split('/').map((part) => part.trim()));
  const maxParts = Math.max(...partsMatrix.map((parts) => parts.length), 1);
  const fallbackNames = ['Color', 'Size', 'Material'];

  return Array.from({ length: maxParts }, (_, index) => {
    const values = Array.from(
      new Set(
        partsMatrix
          .map((parts) => parts[index])
          .filter((value): value is string => Boolean(value)),
      ),
    );

    return {
      id: `option-${index}-${fallbackNames[index] ?? index}`,
      name: fallbackNames[index] ?? `Option ${index + 1}`,
      values,
      pendingValue: '',
    };
  });
}

function selectedVariantImageUrl(variant: { imageUrl?: string; imageUrls?: string[] }, fallback: string) {
  return variant.imageUrl || firstImageUrl(variant.imageUrls) || fallback;
}

function duplicateProduct(product: Product): Product {
  const suffix = Date.now().toString().slice(-4);
  const newId = `${product.id}-copy-${suffix}`;
  return {
    ...product,
    id: newId,
    title: `${product.title} (Copy)`,
    sku: `${product.sku}-COPY-${suffix}`,
    slug: `${product.slug}-copy-${suffix}`,
    status: 'Draft',
    variants: product.variants.map((variant) => ({
      ...variant,
      id: `${variant.id}-copy-${suffix}`,
      sku: `${variant.sku}-COPY-${suffix}`,
    })),
  };
}

function createEmptyProductDraft(): Product {
  return {
    id: 'prod-new-draft',
    title: 'New Product Draft',
    sku: 'NEW-SKU-001',
    categoryId: 'cat-evening',
    categoryName: 'Evening Collection',
    price: 0,
    stock: 0,
    status: 'Draft',
    stockState: 'Out of Stock',
    thumbnailUrl: 'https://picsum.photos/seed/product-new/120/120',
    description: '',
    vendor: 'Bisora',
    productType: 'Product',
    tags: ['new'],
    seoTitle: 'New Product | Bisora',
    seoDescription: '',
    slug: 'new-product',
    compareAtPrice: 0,
    taxable: true,
    manageStock: true,
    hasSku: true,
    isPhysical: true,
    weightKg: 0,
    packageProfile: 'Pouch',
    variants: [
      { id: 'var-new-1', name: 'Default', sku: 'NEW-SKU-001-DFT', price: 0, stock: 0, stockState: 'Out of Stock', lastUpdated: 'Today', imageUrl: 'https://picsum.photos/seed/product-new/120/120' },
    ],
  };
}
