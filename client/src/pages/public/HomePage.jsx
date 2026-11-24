import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { instagramUrl, WhatsAppLink } from '../../components/layout/PublicLayout.jsx';
import { PageSeo } from '../../components/layout/PageSeo.jsx';
import { ProductGrid } from '../../components/product/ProductListing.jsx';
import { CatalogueImage } from '../../components/ui/CatalogueImage.jsx';
import { usePublicData } from '../../hooks/usePublicData.js';
import { budgets, catalogueParams, occasions, shopPath } from '../../utils/catalogue.js';
import { enquiryMessages, whatsappUrl } from '../../utils/whatsapp.js';
import { useStorefront } from './Storefront.jsx';
const orderSteps = [
  ['Browse the collection', 'Find an imitation jewellery style you like.'],
  ['Tap Order on WhatsApp', 'Tell us which piece you’d like to order.'],
  ['Confirm details and pay in chat', 'We’ll confirm availability, delivery charges and payment details.'],
  ['Doorstep delivery', 'We’ll arrange delivery to the address you confirm.'],
];

function SectionTitle({ children, eyebrow }) {
  return (
    <div className="public-section-title">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{children}</h2>
    </div>
  );
}

function CatalogueState({ result, label }) {
  if (result.loading) return <p className="public-status" role="status">Loading {label}…</p>;
  if (!result.error) return null;
  return (
    <div className="public-status" role="status">
      <p>We couldn’t load {label}.</p>
      <button className="button button--secondary" type="button" onClick={result.retry}>Try again</button>
    </div>
  );
}

function ProductSection({ result, title, eyebrow, id, number }) {
  const items = result.data?.items ?? [];
  if (!items.length && !result.loading && !result.error) return null;
  return (
    <section id={id} className="public-section container" tabIndex={id ? -1 : undefined}>
      <SectionTitle eyebrow={eyebrow}>{title}</SectionTitle>
      <CatalogueState result={result} label={title.toLowerCase()} />
      {items.length > 0 && <ProductGrid items={items} number={number} />}
    </section>
  );
}

function Hero({ settings }) {
  const image = settings.heroImage?.url;
  return (
    <section className="public-hero">
      <div className={'container public-hero-inner' + (image ? ' has-image' : '')}>
        <div className="public-hero-copy">
          <p className="eyebrow">Imitation jewellery</p>
          <h1>{settings.heroHeading}</h1>
          <p className="public-hero-subline">{settings.heroSubtext}</p>
          <div className="public-actions">
            <Link className="button button--primary" to="/shop">Shop Collection</Link>
            <WhatsAppLink number={settings.whatsappNumber}>Order on WhatsApp</WhatsAppLink>
          </div>
        </div>
        {image && <CatalogueImage className="public-hero-image" src={image} usage="hero" alt="Alankrita imitation jewellery collection" fetchPriority="high" />}
      </div>
    </section>
  );
}

function Categories({ result, items }) {
  return (
    <section id="categories" className="public-section container" tabIndex={-1}>
      <SectionTitle eyebrow="Explore the collection">Shop by Category</SectionTitle>
      <CatalogueState result={result} label="categories" />
      {result.data && (items.length ? (
        <div className="public-category-grid">
          {items.map((category) => (
            <Link className="public-category" key={category._id} to={shopPath({ category: category.slug })}>
              {category.image?.url && <CatalogueImage src={category.image.url} usage="card" alt="" loading="lazy" decoding="async" />}
              <span>{category.name}<span aria-hidden="true">↗</span></span>
            </Link>
          ))}
        </div>
      ) : <p className="public-status">Categories will appear here as the collection grows.</p>)}
    </section>
  );
}

function Collection({ result, latest, number }) {
  const items = result.data?.items ?? [];
  const latestItems = latest.data?.items ?? [];
  return (
    <section id="collection" className="public-section container" tabIndex={-1}>
      <SectionTitle eyebrow="Imitation jewellery">Featured Products</SectionTitle>
      <CatalogueState result={result} label="featured products" />
      {items.length > 0 && <ProductGrid items={items} number={number} />}
      {result.data && !items.length && (latestItems.length
          ? <Link className="public-inline-link" to="#new-arrivals">Browse New Arrivals</Link>
          : <p className="public-status">Featured pieces will appear here when available.</p>)}
    </section>
  );
}

function ChoiceSection({ title, eyebrow, items, variant }) {
  return (
    <section className={variant === 'budget' ? 'public-section public-band' : 'public-section'}>
      <div className="container">
        <SectionTitle eyebrow={eyebrow}>{title}</SectionTitle>
        <div className={`public-choice-grid ${variant}`}>
          {items.map(([label, filters]) => <Link key={label} to={shopPath(filters)}>{label}<span aria-hidden="true">↗</span></Link>)}
        </div>
      </div>
    </section>
  );
}

function HowToOrder({ number }) {
  return (
    <section id="how-to-order" className="public-section public-band" tabIndex={-1}>
      <div className="container">
        <SectionTitle eyebrow="WhatsApp ordering">How to Order</SectionTitle>
        <ol className="public-steps">
          {orderSteps.map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}
        </ol>
        <WhatsAppLink number={number}>Order on WhatsApp</WhatsAppLink>
      </div>
    </section>
  );
}

export function HomePage() {
  const [params] = useSearchParams();
  const legacyFilters = catalogueParams(params);
  if (legacyFilters.size) return <Navigate to={shopPath(legacyFilters)} replace />;
  return <HomeContent />;
}

function HomeContent() {
  const { settings, settingsResult, categories } = useStorefront();
  const featured = usePublicData('/products?featured=true&limit=8');
  const latest = usePublicData('/products?sort=newest&limit=8');
  const combos = usePublicData('/products?combo=true&limit=8');
  const categoryItems = categories.data ?? [];
  const instagram = instagramUrl(settings.instagramHandle);

  return (
    <>
      <PageSeo path="/" heroImage={settings.heroImage?.url} />
      <Hero settings={settings} />
      {settingsResult.error && <div className="container"><CatalogueState result={settingsResult} label="store details" /></div>}
      {settings.trustStripItems.length > 0 && (
        <div className="public-trust"><ul className="container">{settings.trustStripItems.map((item, index) => <li key={index}>{item}</li>)}</ul></div>
      )}
      <Categories result={categories} items={categoryItems} />
      <Collection result={featured} latest={latest} number={settings.whatsappNumber} />
      <ChoiceSection title="Shop by Budget" eyebrow="Find your price range" items={budgets} variant="budget" />
      <ProductSection id="new-arrivals" result={latest} title="New Arrivals" eyebrow="Recently added" number={settings.whatsappNumber} />
      <ProductSection result={combos} title="Combo Offers" eyebrow="Matching sets" number={settings.whatsappNumber} />
      <ChoiceSection title="Shop by Occasion" eyebrow="Find your style" items={occasions.map(([label, occasion]) => [label, { occasion }])} variant="occasion" />
      <HowToOrder number={settings.whatsappNumber} />
      {whatsappUrl(settings.whatsappNumber) && (
        <section className="public-section container">
          <div className="public-bulk">
            <div><SectionTitle eyebrow="Bulk and gifting">Need sets for a wedding, function or return gifts?</SectionTitle></div>
            <WhatsAppLink number={settings.whatsappNumber} message={enquiryMessages.bulk}>Ask about bulk orders</WhatsAppLink>
          </div>
        </section>
      )}
      {instagram && (
        <section className="public-section container public-instagram">
          <SectionTitle eyebrow={settings.instagramHandle}>Find us on Instagram</SectionTitle>
          <a className="button button--secondary" href={instagram} target="_blank" rel="noopener noreferrer">Follow on Instagram</a>
        </section>
      )}
      <section className="public-final">
        <div className="container">
          <h2>Find something for your next occasion</h2>
          <div className="public-actions">
            <Link className="button button--secondary" to="/shop">Explore the collection</Link>
            <WhatsAppLink number={settings.whatsappNumber}>Chat on WhatsApp</WhatsAppLink>
          </div>
        </div>
      </section>
    </>
  );
}

