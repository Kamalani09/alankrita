import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { errorText, Field, RequestState, SaveActions, useToast } from '../../components/admin/AdminUI.jsx';
import { ImagePicker } from '../../components/admin/ImagePicker.jsx';
import { useAdmin } from '../../context/AdminSession.jsx';
import { useAdminData } from '../../hooks/useAdminData.js';
import { cleanImages, saveWithImages } from '../../utils/adminImages.js';

const stockOptions = { in_stock: 'In stock', low_stock: 'Low stock', sold_out: 'Sold out' };
const occasions = ['daily', 'party', 'bridal', 'festive'];
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export function Products() {
  const { request } = useAdmin();
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState('');
  const categories = useAdminData('/admin/categories');
  const page = Number(params.get('page')) || 1;
  const query = new URLSearchParams({ page: String(page) });
  for (const name of ['search', 'category', 'stock', 'published']) {
    if (params.get(name)) query.set(name, params.get(name));
  }
  const result = useAdminData('/admin/products?' + query);

  function filter(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (value.trim()) next.set(key, value.trim());
    }
    setParams(next);
  }

  async function mutate(product, stockStatus) {
    if (!stockStatus && !window.confirm(`Delete “${product.name}”? This removes it from the catalogue.`)) return;
    setBusy(product._id);
    try {
      const url = '/admin/products/' + product._id;
      if (stockStatus) {
        await request('PUT', url, { data: { stockStatus } });
        notify('Stock status updated.');
      } else {
        await request('DELETE', url);
        const failed = await cleanImages(request, product.images || []);
        notify(failed ? 'Product deleted. Some image cleanup could not be confirmed.' : 'Product deleted.', failed);
        if (result.data.items.length === 1 && page > 1) setParams({ ...Object.fromEntries(params), page: String(page - 1) });
      }
      result.reload();
    } catch (error) {
      notify(errorText(error), true);
      result.reload();
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      <div className="admin-heading"><h1>Products</h1><Link to="new" className="button button--primary">Add product</Link></div>
      <form className="admin-panel admin-filter" onSubmit={filter} key={query.toString().replace(/^page=\d+&?/, '')}>
        <Field label="Search"><input name="search" maxLength={100} defaultValue={params.get('search') || ''} placeholder="Name, code or category" /></Field>
        <Field label="Category">
          <select name="category" defaultValue={params.get('category') || ''} key={categories.data?.length ?? 'loading'}>
            <option value="">All categories</option>
            {categories.data?.map((item) => <option key={item._id} value={item.slug}>{item.name}</option>)}
          </select>
        </Field>
        <Field label="Stock"><select name="stock" defaultValue={params.get('stock') || ''}><option value="">All stock statuses</option>{Object.entries(stockOptions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
        <Field label="Visibility"><select name="published" defaultValue={params.get('published') || ''}><option value="">All products</option><option value="true">Published</option><option value="false">Draft</option></select></Field>
        <button className="button button--secondary">Apply filters</button>
        <Link className="admin-action-link" to="/admin/products">Clear</Link>
      </form>
      <RequestState {...categories} retry={categories.reload} />
      <RequestState {...result} retry={result.reload} />
      {result.data && (result.data.items.length ? (
        <div className="admin-table-wrap admin-panel">
          <table className="admin-table">
            <thead><tr><th scope="col">Product</th><th scope="col">Category</th><th scope="col">Price</th><th scope="col">Stock</th><th scope="col">Visibility</th><th scope="col">Actions</th></tr></thead>
            <tbody>{result.data.items.map((product) => (
              <tr key={product._id}>
                <td><strong>{product.name}</strong><small>{product.productCode}</small></td>
                <td>{product.category?.name || '—'}</td>
                <td>{money.format(product.price)}</td>
                <td><select aria-label={`Stock for ${product.name}`} value={product.stockStatus} disabled={Boolean(busy)} onChange={(event) => mutate(product, event.target.value)}>
                  {Object.entries(stockOptions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select></td>
                <td>{product.published ? 'Published' : 'Draft'}</td>
                <td><div className="admin-row-actions">
                  <Link to={`${product._id}/edit`}>Edit</Link>
                  <Link to={`new?duplicate=${product._id}`}>Duplicate</Link>
                  <button type="button" disabled={Boolean(busy)} onClick={() => mutate(product)}>Delete</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="admin-panel">No products match these filters.</p>)}
      {result.data && (result.data.totalPages > 1 || page > 1) && (
        <div className="admin-actions">
          <button type="button" className="button button--secondary" disabled={page <= 1} onClick={() => setParams({ ...Object.fromEntries(params), page: String(page - 1) })}>Previous</button>
          <span>Page {page} of {Math.max(1, result.data.totalPages)}</span>
          <button type="button" className="button button--secondary" disabled={page >= result.data.totalPages} onClick={() => setParams({ ...Object.fromEntries(params), page: String(page + 1) })}>Next</button>
        </div>
      )}
    </>
  );
}

export function ProductEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const duplicate = id ? null : params.get('duplicate');
  const source = id || duplicate;
  const product = useAdminData(source ? '/admin/products/' + source : null);
  const categories = useAdminData('/admin/categories');

  return (
    <>
      <div className="admin-heading"><h1>{id ? 'Edit product' : duplicate ? 'Duplicate product' : 'Add product'}</h1><Link className="admin-action-link" to="/admin/products">Back to products</Link></div>
      <RequestState {...categories} retry={categories.reload} />
      <RequestState {...product} retry={product.reload} />
      {categories.data && (!source || product.data) && (categories.data.length
        ? <ProductForm key={source || 'new'} product={product.data} id={id} duplicate={duplicate} categories={categories.data} />
        : <p className="admin-panel"><Link to="/admin/categories">Add a category</Link> before creating a product.</p>)}
    </>
  );
}

function ProductForm({ product = {}, id, duplicate, categories }) {
  const { request } = useAdmin();
  const notify = useToast();
  const navigate = useNavigate();
  const [images, setImages] = useState(product.images || []);
  const [details, setDetails] = useState(product.details || []);
  const [colors, setColors] = useState(product.colors || []);
  const [busy, setBusy] = useState(false);

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form);
    const price = Number(values.price);
    const originalPrice = values.originalPrice === '' ? null : Number(values.originalPrice);
    if (originalPrice !== null && originalPrice <= price) {
      notify('Original price must be greater than the current price.', true);
      return;
    }
    const data = { ...values, price, originalPrice, details: details.map((value) => value.trim()).filter(Boolean), colors };
    if (!data.slug.trim()) delete data.slug;
    if (!data.productCode.trim()) delete data.productCode;
    for (const flag of ['featured', 'newArrival', 'combo', 'published']) data[flag] = form.has(flag);
    setBusy(true);
    try {
      const { cleanupFailed } = await saveWithImages(request, images, id ? product.images || [] : [],
        (resolved) => request(id ? 'PUT' : 'POST', id ? '/admin/products/' + id : '/admin/products', { data: { ...data, images: resolved } }));
      notify(cleanupFailed ? 'Product saved. Some image cleanup could not be confirmed.' : 'Product saved.', cleanupFailed);
      navigate('/admin/products');
    } catch (error) {
      notify(errorText(error), true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-panel admin-form" onSubmit={save}>
      <fieldset disabled={busy} className="admin-form">
        <div className="admin-form-grid">
          <Field label="Product name"><input name="name" defaultValue={duplicate ? (product.name || '').slice(0, 113) + ' (copy)' : product.name} required maxLength={120} /></Field>
          <Field label="Product code"><input name="productCode" defaultValue={duplicate ? '' : product.productCode} placeholder="Generated if blank" maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9_\-]*" /></Field>
          <Field label="Slug"><input name="slug" defaultValue={duplicate ? '' : product.slug} placeholder="Generated from the name" maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></Field>
          <Field label="Category"><select name="category" required defaultValue={product.category?._id || ''}>
            <option value="">Select category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select></Field>
          <Field label="Occasion"><select name="occasion" defaultValue={product.occasion || ''} required>
            <option value="">Select occasion</option>{occasions.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
          </select></Field>
          <Field label="Stock status"><select name="stockStatus" defaultValue={product.stockStatus || 'in_stock'}>{Object.entries(stockOptions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
          <Field label="Price (₹)"><input name="price" type="number" min="0" max="10000000" step="0.01" defaultValue={product.price} required /></Field>
          <Field label="Original price (₹)"><input name="originalPrice" type="number" min="0" max="10000000" step="0.01" defaultValue={product.originalPrice ?? ''} /></Field>
        </div>
        <Field label="Description"><textarea name="description" rows={4} maxLength={5000} defaultValue={product.description} /></Field>
        <section className="admin-form"><h2>Details</h2>
          {details.map((detail, index) => <div className="admin-inline" key={index}>
            <input aria-label={`Detail ${index + 1}`} value={detail} maxLength={250} onChange={(event) => setDetails(details.map((value, at) => at === index ? event.target.value : value))} />
            <button type="button" onClick={() => setDetails(details.filter((_, at) => at !== index))}>Remove</button>
          </div>)}
          <button type="button" className="button button--secondary" disabled={details.length >= 30} onClick={() => setDetails([...details, ''])}>Add detail</button>
        </section>
        <ColorTags values={colors} setValues={setColors} />
        <section className="admin-form"><h2>Product images</h2><ImagePicker images={images} onChange={setImages} max={6} /></section>
        <div className="admin-checks">
          {Object.entries({ featured: 'Featured', newArrival: 'New arrival', combo: 'Combo', published: 'Published' }).map(([name, label]) =>
            <label key={name}><input type="checkbox" name={name} defaultChecked={duplicate && name === 'published' ? false : Boolean(product[name])} /> {label}</label>)}
        </div>
      </fieldset>
      <SaveActions busy={busy} onCancel={() => navigate('/admin/products')} label={id ? 'Save product' : 'Create product'} />
    </form>
  );
}

function ColorTags({ values, setValues }) {
  const [input, setInput] = useState('');
  function add() {
    const value = input.trim();
    if (!value || values.length >= 30 || values.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    setValues([...values, value]);
    setInput('');
  }

  return (
    <section className="admin-form">
      <h2>Colours</h2>
      <div className="admin-inline">
        <input aria-label="New colour" value={input} maxLength={60} onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} />
        <button type="button" disabled={values.length >= 30} onClick={add}>Add colour</button>
      </div>
      <div className="admin-checks">
        {values.map((value, index) => <button type="button" key={`${value}-${index}`} aria-label={`Remove colour ${value}`} onClick={() => setValues(values.filter((_, at) => index !== at))}>{value} ×</button>)}
      </div>
    </section>
  );
}
