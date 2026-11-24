import { Link } from 'react-router-dom';
import { PageSeo } from '../../components/layout/PageSeo.jsx';
import { brand } from '../../config/brand.js';
import { useStorefront } from './Storefront.jsx';

const care = [
  'Keep pieces dry and remove them before bathing or swimming.',
  'Apply perfume and hairspray before putting on your jewellery.',
  'Wipe gently with a soft, dry cloth after wearing.',
  'Store each piece separately in a dry pouch to avoid scratches and tangles.',
];

export default function AboutPage() {
  const { settings } = useStorefront();
  return (
    <div className="container public-section public-info-page">
      <PageSeo path="/about" />
      <header className="shop-heading">
        <p className="eyebrow">Imitation jewellery</p>
        <h1>About Alankrita</h1>
        <p>{brand.tagline}</p>
      </header>
      <section aria-labelledby="our-story">
        <h2 id="our-story">Our story</h2>
        <p className="public-info-prose">{settings.aboutText || `Alankrita means “adorned”. ${brand.subline}.`}</p>
      </section>
      <section aria-labelledby="what-youll-find">
        <h2 id="what-youll-find">What you’ll find</h2>
        <div className="public-info-grid">
          <article><h3>Affordable designs</h3><p>Browse imitation jewellery by price to find pieces within your budget.</p></article>
          <article><h3>Trendy collections</h3><p>Explore pieces for everyday outfits, celebrations and gifting.</p></article>
          <article><h3>Careful packing</h3><p>Ask us about packing when you confirm your order on WhatsApp.</p></article>
        </div>
      </section>
      <section aria-labelledby="care-tips">
        <h2 id="care-tips">Caring for your imitation jewellery</h2>
        <ul>{care.map((tip) => <li key={tip}>{tip}</li>)}</ul>
      </section>
      <Link className="button button--primary" to="/shop">Browse the collection</Link>
    </div>
  );
}
