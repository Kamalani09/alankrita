import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { FoundationPage } from './pages/public/FoundationPage.jsx';
import { HomePage } from './pages/public/HomePage.jsx';
import { Storefront } from './pages/public/Storefront.jsx';

const AdminApp = lazy(() => import('./pages/admin/AdminApp.jsx'));
const ShopPage = lazy(() => import('./pages/public/ShopPage.jsx'));
const ProductPage = lazy(() => import('./pages/public/ProductPage.jsx'));
const AboutPage = lazy(() => import('./pages/public/AboutPage.jsx'));
const ContactPage = lazy(() => import('./pages/public/ContactPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage.jsx'));

export default function App() {
  return (
    <Routes>
      <Route element={<Storefront />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<Suspense fallback={<p className="container" role="status">Loading shop…</p>}><ShopPage /></Suspense>} />
        <Route path="/product/:slug" element={<Suspense fallback={<p className="container" role="status">Loading product…</p>}><ProductPage /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<p className="container" role="status">Loading…</p>}><AboutPage /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<p className="container" role="status">Loading…</p>}><ContactPage /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<p className="container" role="status">Loading…</p>}><NotFoundPage /></Suspense>} />
      </Route>
      {import.meta.env.DEV && <Route path="/dev/health" element={<FoundationPage />} />}
      <Route path="/admin/*" element={<Suspense fallback={<p className="container" role="status">Loading…</p>}><AdminApp /></Suspense>} />
    </Routes>
  );
}
