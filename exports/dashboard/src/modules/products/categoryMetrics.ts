import type { Category, Product } from './types';

export interface CategoryMetrics {
  catalogHealth: string;
  catalogHealthHelper: string;
  topCategoryName: string;
  topCategoryHelper: string;
}

export function buildCategoryMetrics(categories: Category[], products: Product[]): CategoryMetrics {
  if (categories.length === 0) {
    return {
      catalogHealth: '0%',
      catalogHealthHelper: 'Create categories first',
      topCategoryName: 'No category data yet',
      topCategoryHelper: 'Create a category',
    };
  }

  const categoryScores = categories.map((category) => {
    const assignedProducts = products.filter((product) => product.categoryId === category.id || category.productIds.includes(product.id));
    const seoReady = Boolean(category.seoTitle.trim() && category.seoDescription.trim() && category.slug.trim());
    const coverReady = Boolean(category.coverUrl.trim());
    const score =
      (category.status === 'Published' ? 25 : 0) +
      (assignedProducts.length > 0 ? 30 : 0) +
      (seoReady ? 30 : 0) +
      (coverReady ? 15 : 0);

    return {
      category,
      assignedProducts,
      score,
    };
  });

  const catalogHealthValue = Math.round(categoryScores.reduce((total, item) => total + item.score, 0) / categoryScores.length);
  const topCategory = [...categoryScores].sort((a, b) => b.assignedProducts.length - a.assignedProducts.length)[0];

  return {
    catalogHealth: `${catalogHealthValue}%`,
    catalogHealthHelper: catalogHealthValue >= 80 ? 'Ready for storefront browsing' : 'Needs products, cover, or SEO',
    topCategoryName: topCategory?.assignedProducts.length ? topCategory.category.name : 'No product data yet',
    topCategoryHelper: topCategory?.assignedProducts.length
      ? `${topCategory.assignedProducts.length} products assigned`
      : 'Assign products to categories',
  };
}
