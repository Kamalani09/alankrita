import { Link } from 'react-router-dom';
import { productPath, stockLabels } from '../../utils/catalogue.js';
import { formatPrice } from '../../utils/format.js';
import { ProductOrder } from './ProductOrder.jsx';
import { CatalogueImage } from '../ui/CatalogueImage.jsx';

export function ProductCard({ product, number }) {
  const cover = product.images?.[0];
  const discount = product.originalPrice > product.price;
  const stock = product.stockStatus === 'in_stock' ? null : stockLabels[product.stockStatus];
  const path = productPath(product.slug);
  return (
    <article className="public-product">
      {cover?.url && <Link className="public-product-media" to={path} tabIndex={-1} aria-hidden="true">
        <CatalogueImage src={cover.url} usage="card" alt="" loading="lazy" decoding="async" />
      </Link>}
      <div className="public-product-info">
        {stock && <span className={'public-stock ' + product.stockStatus}>{stock}</span>}
        <h3><Link to={path}>{product.name}</Link></h3>
        <p className="public-product-type">Imitation jewellery</p>
        <p className="public-price">
          {formatPrice(product.price)}
          {discount && <del aria-label={'Original price ' + formatPrice(product.originalPrice)}>{formatPrice(product.originalPrice)}</del>}
        </p>
      </div>
      <ProductOrder product={product} number={number} compact />
    </article>
  );
}
