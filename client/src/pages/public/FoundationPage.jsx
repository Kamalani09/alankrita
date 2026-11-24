import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Logo } from '../../components/layout/Logo.jsx';
import { brand } from '../../config/brand.js';

export function FoundationPage() {
  const [checking, setChecking] = useState(false);
  const [health, setHealth] = useState('');
  const [failed, setFailed] = useState(false);

  async function checkHealth() {
    setChecking(true);
    setFailed(false);
    setHealth('Checking the API…');
    try {
      const { data } = await api.get('/health');
      if (data?.success !== true || data.data?.status !== 'ok') {
        throw new Error('Unexpected health response');
      }

      setHealth(data.data.database === 'connected'
        ? 'API is running. MongoDB is connected.'
        : 'API is running. MongoDB is disconnected.');
    } catch {
      setFailed(true);
      setHealth('The API health check failed. Check that the server is running.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="foundation">
      <Helmet>
        <title>{brand.name} | Imitation Jewellery</title>
        <meta name="description" content={brand.subline} />
      </Helmet>
      <header className="site-header">
        <nav className="container" aria-label="Main navigation">
          <Link to="/" className="brand-link"><Logo /></Link>
        </nav>
      </header>
      <main className="container foundation-main">
        <section className="foundation-intro" aria-labelledby="intro-title">
          <p className="eyebrow">Imitation jewellery</p>
          <h1 id="intro-title">{brand.tagline}</h1>
          <p>{brand.subline}</p>
        </section>
        {import.meta.env.DEV && (
          <section className="health-panel" aria-labelledby="health-title">
            <h2 id="health-title">API health</h2>
            <button className="button button--primary" type="button" onClick={checkHealth} disabled={checking}>
              Check API
            </button>
            <p className={failed ? 'health-error' : undefined} role="status">{health}</p>
          </section>
        )}
      </main>
      <footer className="site-footer">
        <div className="container"><Logo /></div>
      </footer>
    </div>
  );
}
