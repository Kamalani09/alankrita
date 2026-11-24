import { useId, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageSeo } from '../../components/layout/PageSeo.jsx';
import { CatalogueError, ProductGrid } from '../../components/product/ProductListing.jsx';
import { ProductOrder } from '../../components/product/ProductOrder.jsx';
import { CatalogueImage } from '../../components/ui/CatalogueImage.jsx';
import { usePublicData } from '../../hooks/usePublicData.js';
import { productPath, shopPath, stockLabels } from '../../utils/catalogue.js';
import { formatPrice } from '../../utils/format.js';
import { useStorefront } from './Storefront.jsx';

function Gallery({ images, name }) {
  const [current, setCurrent] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const dialog = useRef(null);
  const zoomButton = useRef(null);
  const titleId = useId();

  if (!images.length) return null;

  const image = images[current];
  const alt = `${name}, image ${current + 1} of ${images.length}`;

  function openZoom() {
    setZoomed(true);
    dialog.current.showModal();
  }

  function closeZoom() {
    setZoomed(false);
    zoomButton.current?.focus();
  }

  return (
    <div className="detail-gallery">
      <button ref={zoomButton} className="detail-hero-image" type="button" onClick={openZoom} aria-label={`Zoom image ${current + 1}`}>
        <CatalogueImage src={image.url} usage="detail" alt={alt} fetchPriority="high" />
        <span>Zoom image</span>
      </button>
      {images.length > 1 && (
        <div className="detail-thumbnails" aria-label="Product images" role="group">
          {images.map((item, index) => (
            <button key={`${item.url}-${index}`} type="button" aria-label={`Show image ${index + 1}`}
              aria-pressed={index === current} onClick={() => setCurrent(index)}>
              <CatalogueImage src={item.url} usage="thumbnail" alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
      <dialog ref={dialog} className="detail-zoom" aria-labelledby={titleId} onClose={closeZoom}
        onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}>
        <div className="detail-zoom-inner">
          <div><h2 id={titleId}>Product photo</h2><button className="button button--secondary" autoFocus type="button" onClick={() => dialog.current.close()}>Close</button></div>
          {zoomed && <CatalogueImage src={image.url} usage="zoom" alt={alt} />}
        </div>
      </dialog>
    </div>
  );
}

function ShareLink({ slug }) {
  const [status, setStatus] = useState('');
  const [showLink, setShowLink] = useState(false);
  const url = new URL(productPath(slug), window.location.origin).href;

  async function share() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Product link copied.');
      setShowLink(false);
    } catch {
      setShowLink(true);
      setStatus('Select and copy the link below.');
    }
  }

  return (
    <div className="detail-share">
      <button className="button button--secondary" type="button" onClick={share}>Copy product link</button>
      {status && <p role="status">{status}</p>}
      {showLink && <label><span>Product link</span><input readOnly value={url} onFocus={(event) => event.target.select()} /></label>}
    </div>
  );
}

function ProductDetail({ product, number }) {
  const images = (product.images ?? []).filter((image) => image.url).slice(0, 6);
  const discounted = product.originalPrice > product.price;
  const percent = discounted ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const category = product.category;
  const stock = stockLabels[product.stockStatus];
  const related = usePublicData(category?.slug ? '/products?' + new URLSearchParams({ category: category.slug, limit: '5' }) : null);
  const relatedItems = related.data?.items?.filter((item) => item._id !== product._id).slice(0, 4) ?? [];

  return (
    <>
      <PageSeo path={productPath(product.slug)} product={product} />
      <div className={'detail-grid' + (images.length ? '' : ' without-image')}>
        <Gallery images={images} name={product.name} />
        <section className="detail-summary" aria-labelledby="product-title">
          <p className="eyebrow">Imitation jewellery</p>
          <h1 id="product-title">{product.name}</h1>
          <div className="detail-identifiers">
            <span>Product code {product.productCode}</span>
            {stock && <span className={`public-stock detail-stock ${product.stockStatus}`}>{stock}</span>}
          </div>
          <p className="detail-price">
            {formatPrice(product.price)}
            {discounted && <del aria-label={'Original price ' + formatPrice(product.originalPrice)}>{formatPrice(product.originalPrice)}</del>}
            {percent > 0 && <span>{percent}% off</span>}
          </p>
          {product.description && <p className="detail-description">{product.description}</p>}
          {product.details?.length > 0 && (
            <section className="detail-information">
              <h2>Details</h2>
              <ul>{product.details.map((item, index) => <li key={index}>{item}</li>)}</ul>
            </section>
          )}
          <ProductOrder product={product} number={number} />
          <ShareLink slug={product.slug} />
        </section>
      </div>
      {relatedItems.length > 0 && <section className="detail-related" aria-labelledby="related-title">
        <div className="detail-related-header"><h2 id="related-title">Related products</h2><Link to={shopPath({ category: category.slug })}>Browse {category.name}</Link></div>
        <ProductGrid items={relatedItems} number={number} />
      </section>}
      {related.error && <div className="detail-related"><CatalogueError retry={related.retry}>Related products couldn’t be loaded.</CatalogueError></div>}
    </>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const { settings } = useStorefront();
  const product = usePublicData('/products/' + encodeURIComponent(slug));
  const unavailable = product.status === 404 || product.status === 400;

  return (
    <div className="container public-section detail-page">
      <Link className="public-inline-link" to="/shop"><span aria-hidden="true">←&nbsp;</span>Back to Shop</Link>
      {product.loading && <p className="public-status" role="status">Loading product…</p>}
      {unavailable && <>
        <PageSeo path={productPath(slug)} unavailable />
        <div className="shop-heading"><h1>Product unavailable</h1><p>This product could not be found in the published collection.</p></div>
      </>}
      {product.error && !unavailable && <CatalogueError retry={product.retry}>This product couldn’t be loaded.</CatalogueError>}
      {product.data && <ProductDetail key={product.data._id} product={product.data} number={settings.whatsappNumber} />}
    </div>
  );
}
