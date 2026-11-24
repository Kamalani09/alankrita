import { instagramUrl, WhatsAppLink } from '../../components/layout/PublicLayout.jsx';
import { PageSeo } from '../../components/layout/PageSeo.jsx';
import { CatalogueError } from '../../components/product/ProductListing.jsx';
import { enquiryMessages } from '../../utils/whatsapp.js';
import { useStorefront } from './Storefront.jsx';

export default function ContactPage() {
  const { settings, settingsResult } = useStorefront();
  const instagram = instagramUrl(settings.instagramHandle);
  const faqs = settings.faqItems ?? [];

  return (
    <div className="container public-section public-info-page">
      <PageSeo path="/contact" />
      <header className="shop-heading"><h1>Contact Alankrita</h1><p>Ask us about availability, delivery or an order.</p></header>
      {settingsResult.error && <CatalogueError retry={settingsResult.retry}>Couldn’t load the latest contact details.</CatalogueError>}
      <section className="public-contact-panel" aria-label="Contact details">
        <div className="public-actions">
          <WhatsAppLink number={settings.whatsappNumber}>Chat on WhatsApp</WhatsAppLink>
          {instagram && <a className="button button--secondary" href={instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
        </div>
        <address>
          {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
          {settings.address && <p>{settings.address}</p>}
          {settings.workingHours && <p>{settings.workingHours}</p>}
        </address>
      </section>
      {faqs.length > 0 && <section aria-labelledby="faq-title">
        <h2 id="faq-title">Frequently asked questions</h2>
        <div className="public-faq">
          {faqs.map(({ question, answer }, index) => (
            <details key={index}><summary>{question}</summary><p>{answer}</p></details>
          ))}
        </div>
      </section>}
      {settings.whatsappNumber && <section aria-labelledby="bulk-title">
        <h2 id="bulk-title">Bulk orders and gifting</h2>
        <WhatsAppLink number={settings.whatsappNumber} message={enquiryMessages.bulk}>Ask about bulk orders</WhatsAppLink>
      </section>}
    </div>
  );
}
