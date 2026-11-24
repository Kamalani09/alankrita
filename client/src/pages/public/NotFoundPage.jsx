import { Link } from 'react-router-dom';
import { PageSeo } from '../../components/layout/PageSeo.jsx';

export default function NotFoundPage() {
  return (
    <div className="container public-section public-info-page public-missing">
      <PageSeo path="/not-found" />
      <div className="shop-heading">
        <h1>Page not found</h1>
        <p>We couldn’t find that page. You can still browse the collection.</p>
      </div>
      <Link className="button button--primary" to="/shop">Back to Shop</Link>
    </div>
  );
}
