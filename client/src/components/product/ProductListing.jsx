import { ProductCard } from './ProductCard.jsx';

export function ProductGrid({ items, number }) {
  return (
    <div className="public-product-grid">
      {items.map((product) => <ProductCard key={product._id} product={product} number={number} />)}
    </div>
  );
}

export function ProductSkeletons() {
  return (
    <div role="status" aria-live="polite">
      <p className="public-status">Loading products…</p>
      <div className="public-product-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="shop-skeleton" />)}
      </div>
    </div>
  );
}

export function CatalogueError({ retry, children }) {
  return (
    <div className="public-status" role="status">
      <p>{children}</p>
      <button className="button button--secondary" type="button" onClick={retry}>Try again</button>
    </div>
  );
}
