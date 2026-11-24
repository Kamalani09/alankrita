import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageSeo } from '../../components/layout/PageSeo.jsx';
import { CatalogueError, ProductGrid, ProductSkeletons } from '../../components/product/ProductListing.jsx';
import { usePublicData } from '../../hooks/usePublicData.js';
import { budgets, catalogueParams, occasions, shopPath, stockLabels } from '../../utils/catalogue.js';
import { useStorefront } from './Storefront.jsx';

const priceOptions = [['Any price', {}], ...budgets, ['Custom range', {}]];

function selectedPrice(filters) {
  const min = filters.get('minPrice') ?? '';
  const max = filters.get('maxPrice') ?? '';
  const index = priceOptions.findIndex(([, range]) => (
    (range.minPrice ?? '') === min && (range.maxPrice ?? '') === max
  ));
  return String(index < 0 ? priceOptions.length - 1 : index);
}

function Filters({ filters, categories, onApply }) {
  const [budget, setBudget] = useState(() => selectedPrice(filters));
  const [error, setError] = useState('');
  const custom = budget === String(priceOptions.length - 1);
  const currentCategory = filters.get('category') ?? '';

  function apply(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ['search', 'category', 'occasion', 'color', 'stock', 'combo', 'featured', 'sort']) {
      const value = form.get(key)?.trim();
      if (value) next.set(key, value);
    }
    const range = custom ? { minPrice: form.get('minPrice'), maxPrice: form.get('maxPrice') } : priceOptions[Number(budget)][1];
    if (range.minPrice && range.maxPrice && Number(range.minPrice) > Number(range.maxPrice)) {
      setError('Minimum price must be less than or equal to maximum price.');
      return;
    }
    for (const [key, value] of Object.entries(range)) {
      if (value !== '' && value != null) next.set(key, value);
    }
    setError('');
    onApply(next);
  }

  return (
    <form className="shop-filters" onSubmit={apply} onReset={() => {
      setBudget('0');
      setError('');
      onApply(new URLSearchParams());
    }} role="search" aria-label="Shop products">
      <div className="shop-filter-grid">
        <label className="shop-filter-search"><span>Search</span>
          <input type="search" name="search" maxLength={100} defaultValue={filters.get('search') ?? ''} placeholder="Name, code or category" />
        </label>
        <label><span>Category</span><select name="category" defaultValue={currentCategory}>
          <option value="">All categories</option>
          {currentCategory && !categories.some((item) => item.slug === currentCategory) && (
            <option value={currentCategory}>{categories.find((item) => item._id === currentCategory)?.name || 'Selected category'}</option>
          )}
          {categories.map((item) => <option key={item._id} value={item.slug}>{item.name}</option>)}
        </select></label>
        <label><span>Price range</span><select value={budget} onChange={(event) => { setBudget(event.target.value); setError(''); }}>
          {priceOptions.map(([label], index) => <option key={label} value={index}>{label}</option>)}
        </select></label>
        {custom && <>
          <label><span>Minimum price (₹)</span><input name="minPrice" type="number" min="0" max="10000000" step="0.01" defaultValue={filters.get('minPrice') ?? ''} /></label>
          <label><span>Maximum price (₹)</span><input name="maxPrice" type="number" min="0" max="10000000" step="0.01" defaultValue={filters.get('maxPrice') ?? ''} /></label>
        </>}
        <label><span>Colour</span><input name="color" maxLength={60} defaultValue={filters.get('color') ?? ''} /></label>
        <label><span>Occasion</span><select name="occasion" defaultValue={filters.get('occasion') ?? ''}>
          <option value="">All occasions</option>
          {occasions.map(([label, value]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        <label><span>Availability</span><select name="stock" defaultValue={filters.get('stock') ?? ''}>
          <option value="">All stock statuses</option>
          {Object.entries(stockLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        <label><span>Sort by</span><select name="sort" defaultValue={filters.get('sort') ?? ''}>
          <option value="">Newest</option>
          <option value="price_asc">Price, low to high</option>
          <option value="price_desc">Price, high to low</option>
        </select></label>
      </div>
      <div className="shop-filter-actions">
        <label className="shop-checkbox"><input type="checkbox" name="combo" value="true" defaultChecked={filters.get('combo') === 'true'} /> Combos only</label>
        {filters.has('featured') && <input type="hidden" name="featured" value={filters.get('featured')} />}
        <button className="button button--primary">Apply filters</button>
        <button type="reset" className="public-inline-link shop-clear">Clear filters</button>
      </div>
      {error && <p className="product-order-error" role="alert">{error}</p>}
    </form>
  );
}

function Pagination({ data, filters }) {
  if (data.totalPages <= 1 && data.page === 1) return null;
  function pageLink(page) {
    const params = new URLSearchParams(filters);
    if (page === 1) params.delete('page');
    else params.set('page', String(page));
    return shopPath(params) + '#shop-results';
  }

  return (
    <nav className="shop-pagination" aria-label="Shop pages">
      {data.page > 1 && <Link className="button button--secondary" to={pageLink(data.page - 1)}>Previous</Link>}
      {data.page > data.totalPages && data.totalPages > 0
        ? <Link className="button button--secondary" to={pageLink(data.totalPages)}>Last available page</Link>
        : <span>Page {data.page} of {Math.max(data.totalPages, 1)}</span>}
      {data.page < data.totalPages && <Link className="button button--secondary" to={pageLink(data.page + 1)}>Next</Link>}
    </nav>
  );
}

export default function ShopPage() {
  const { settings, categories } = useStorefront();
  const [params, setParams] = useSearchParams();
  const filters = catalogueParams(params);
  const formKey = new URLSearchParams(filters);
  formKey.delete('page');
  const query = new URLSearchParams(filters);
  query.set('limit', '12');
  const products = usePublicData('/products?' + query.toString());

  return (
    <div className="container public-section shop-page">
      <PageSeo path="/shop" />
      <div className="shop-heading"><p className="eyebrow">Imitation jewellery</p><h1>Shop the collection</h1></div>
      <Filters key={formKey.toString()} filters={filters} categories={categories.data ?? []} onApply={setParams} />
      {categories.error && <CatalogueError retry={categories.retry}>Categories couldn’t be loaded.</CatalogueError>}
      <section className="shop-results" id="shop-results" tabIndex={-1} aria-label="Product results">
        {products.loading && <ProductSkeletons />}
        {products.error && (products.status === 400
          ? <p className="public-status" role="status">Some filters are invalid. <Link to="/shop">Clear filters</Link> and try again.</p>
          : <CatalogueError retry={products.retry}>Products couldn’t be loaded.</CatalogueError>)}
        {products.data && <>
          <p className="shop-count" role="status">{products.data.total} {products.data.total === 1 ? 'product' : 'products'}</p>
          {products.data.items.length
            ? <ProductGrid items={products.data.items} number={settings.whatsappNumber} />
            : <p className="public-status">{products.data.total ? 'There are no products on this page.' : 'No products match this selection.'}</p>}
          <Pagination data={products.data} filters={filters} />
        </>}
      </section>
    </div>
  );
}
