import { Helmet } from 'react-helmet-async';
import { makeSeo } from '../../../../shared/storefrontSeo.mjs';

export function PageSeo({ path, product, heroImage, unavailable }) {
  const siteOrigin = import.meta.env.VITE_SITE_URL || window.location.origin;
  const seo = makeSeo(path, { siteOrigin, product, heroImage, unavailable });

  return (
    <Helmet htmlAttributes={{ lang: 'en-IN' }}>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {seo.noindex && <meta name="robots" content="noindex, follow" />}
      {seo.url && <link rel="canonical" href={seo.url} />}
      <meta property="og:type" content={seo.type} />
      <meta property="og:site_name" content="Alankrita" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      {seo.url && <meta property="og:url" content={seo.url} />}
      {seo.image && <meta property="og:image" content={seo.image} />}
      {seo.image && <meta property="og:image:alt" content={product ? product.name : 'Alankrita imitation jewellery collection'} />}
      <meta name="twitter:card" content={seo.image ? 'summary_large_image' : 'summary'} />
    </Helmet>
  );
}
