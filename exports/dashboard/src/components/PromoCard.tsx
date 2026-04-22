export function PromoCard() {
  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
      <p className="text-sm font-medium text-on-surface-variant">Featured Collection</p>
      <h2 className="mt-2 text-lg font-semibold text-on-surface">Noor Al-Sahar</h2>
      <p className="mt-2 text-sm text-on-surface-variant">Spring collection campaign is ready for storefront updates.</p>
      <a
        className="mt-5 inline-flex rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
        href="#/products/categories/cat-evening"
      >
        Edit Collection
      </a>
    </section>
  );
}
