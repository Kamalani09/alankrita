import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { AdminFeedback, errorText, Field } from '../../components/admin/AdminUI.jsx';
import { Logo } from '../../components/layout/Logo.jsx';
import { AdminSession, useAdmin } from '../../context/AdminSession.jsx';
import { Dashboard } from './Dashboard.jsx';
import { Enquiries } from './Enquiries.jsx';
import { Products, ProductEditor } from './Products.jsx';
import { Categories } from './Categories.jsx';
import { Settings } from './Settings.jsx';
import '../../styles/admin.css';

function Login() {
  const { session, signIn } = useAdmin();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (session) return <Navigate to="/admin" replace />;

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await signIn(form.get('email'), form.get('password'));
      navigate('/admin', { replace: true });
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login">
      <Link to="/" className="brand-link"><Logo /></Link>
      <section className="admin-panel">
        <h1>Admin sign-in</h1>
        <form className="admin-form" onSubmit={submit}>
          <Field label="Email"><input name="email" type="email" autoComplete="username" required /></Field>
          <Field label="Password"><input name="password" type="password" autoComplete="current-password" required /></Field>
          {error && <p role="alert" className="admin-error">{error}</p>}
          <button className="button button--primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  );
}

function Layout() {
  const { session, signOut } = useAdmin();
  if (!session) return <Navigate to="/admin/login" replace />;
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/admin" className="brand-link"><Logo /></Link>
        <nav aria-label="Admin navigation">
          <NavLink end to="/admin">Dashboard</NavLink>
          <NavLink to="/admin/products">Products</NavLink>
          <NavLink to="/admin/categories">Categories</NavLink>
          <NavLink to="/admin/settings">Site settings</NavLink>
        </nav>
        <button type="button" className="button button--secondary" onClick={signOut}>Sign out</button>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}

export default function AdminApp() {
  return (
    <AdminSession>
      <Helmet><title>ALANKRITA Admin</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <AdminFeedback>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductEditor key="new" />} />
            <Route path="products/:id/edit" element={<ProductEditor />} />
            <Route path="categories" element={<Categories />} />
            <Route path="settings" element={<Settings />} />
            <Route path="enquiries" element={<Enquiries />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminFeedback>
    </AdminSession>
  );
}
