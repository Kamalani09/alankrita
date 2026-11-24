import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { brand } from '../../config/brand.js';
import { shopPath } from '../../utils/catalogue.js';
import { whatsappUrl } from '../../utils/whatsapp.js';
import { Logo } from './Logo.jsx';

const navigation = [
  ['Home', '/'],
  ['Shop', '/shop'],
  ['Categories', '/#categories'],
  ['How to Order', '/#how-to-order'],
  ['About', '/about'],
  ['Contact', '/contact'],
];

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22" fill="none">
      <path d="M20.8 11.7a8.8 8.8 0 0 1-13 7.7l-4.3 1.1 1.1-4.2a8.8 8.8 0 1 1 16.2-4.6Z" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
      <path d="M9 7.5c-.3-.6-.6-.6-.8-.6-.3 0-.6.1-.8.4s-.9.8-.9 2 .9 2.4 1 2.6c.1.2 1.7 2.7 4.2 3.7 2 .8 2.5.7 3 .7.4-.1 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.2l-.6-.3-1.7-.8c-.2-.1-.4-.2-.6.1l-.7.8c-.2.2-.4.3-.7.1-1.5-.6-2.3-1.4-2.9-2.5-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.4.1-.6L9 7.5Z" fill="currentColor" />
    </svg>
  );
}

export function WhatsAppLink({ number, message, children, className = 'button public-whatsapp', accessibleName, onClick }) {
  const href = whatsappUrl(number, message);
  if (!href) return null;
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" aria-label={accessibleName}
      onClick={onClick} onAuxClick={onClick && ((event) => { if (event.button === 1) onClick(event); })}>
      <WhatsAppIcon />{children}
    </a>
  );
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="1.7" /><path d="m15 15 5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

function Header({ settings }) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuId = useId();
  const searchId = useId();
  const menuButton = useRef(null);
  const searchButton = useRef(null);
  const searchInput = useRef(null);

  useEffect(() => {
    if (search) searchInput.current?.focus();
  }, [search]);

  function closePanels() {
    setMenu(false);
    setSearch(false);
  }

  function onSearch(event) {
    event.preventDefault();
    const term = new FormData(event.currentTarget).get('search').trim();
    closePanels();
    navigate(shopPath(term ? { search: term } : {}));
  }

  function onKeyDown(event) {
    if (event.key !== 'Escape') return;
    if (search) searchButton.current?.focus();
    if (menu) menuButton.current?.focus();
    closePanels();
  }

  return (
    <>
      {settings.announcementEnabled && settings.announcementText && <div className="public-announcement">{settings.announcementText}</div>}
      <header className="public-header" onKeyDown={onKeyDown}>
        <div className="container public-header-inner">
          <Link to="/" className="brand-link" onClick={closePanels}><Logo /></Link>
          <nav id={menuId} aria-label="Main navigation" className={menu ? 'public-nav is-open' : 'public-nav'}>
            {navigation.map(([label, to]) => <Link key={label} to={to} onClick={closePanels}
              aria-current={location.hash && to.endsWith(location.hash) ? 'location' : !location.hash && location.pathname === to ? 'page' : undefined}>{label}</Link>)}
          </nav>
          <div className="public-header-actions">
            <button ref={searchButton} type="button" className="public-icon-button" aria-label="Search products" aria-expanded={search} aria-controls={search ? searchId : undefined}
              onClick={() => { setSearch(!search); setMenu(false); }}><SearchIcon /></button>
            <WhatsAppLink className="button public-whatsapp public-header-whatsapp" number={settings.whatsappNumber}>WhatsApp</WhatsAppLink>
            <button ref={menuButton} type="button" className="public-icon-button public-menu-toggle" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} aria-controls={menuId}
              onClick={() => { setMenu(!menu); setSearch(false); }}>
              <svg viewBox="0 0 24 24" width="23" height="23" fill="none" aria-hidden="true">
                <path d={menu ? 'M6 6l12 12M18 6 6 18' : 'M4 6h16M4 12h16M4 18h16'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        {search && (
          <form id={searchId} className="container public-search" onSubmit={onSearch} role="search">
            <input ref={searchInput} aria-label="Product name, code or category" name="search" type="search" maxLength={100} placeholder="Search by name, code or category" />
            <button className="button button--primary">Search</button>
          </form>
        )}
      </header>
    </>
  );
}

export function instagramUrl(handle) {
  const username = handle?.replace(/^@/, '');
  return username && /^[a-z0-9_.]{1,30}$/i.test(username) ? 'https://www.instagram.com/' + username + '/' : null;
}

function Footer({ settings, categories }) {
  const instagram = instagramUrl(settings.instagramHandle);
  const contact = whatsappUrl(settings.whatsappNumber);
  return (
    <footer className="public-footer" id="contact" tabIndex={-1}>
      <div className="container">
        <div className="public-footer-grid">
          <div id="about" tabIndex={-1}>
            <Link className="brand-link" to="/"><Logo /></Link>
            <p>{brand.tagline}</p>
            <p className="public-about">{brand.subline}</p>
          </div>
          <nav aria-label="Footer navigation">
            <h2>Explore</h2>
            <ul>{navigation.slice(1).map(([label, to]) => <li key={label}><Link to={to}>{label}</Link></li>)}</ul>
          </nav>
          {categories.length > 0 && <nav aria-label="Category links">
            <h2>Categories</h2>
            <ul>{categories.map(({ name, slug }) => <li key={slug}><Link to={shopPath({ category: slug })}>{name}</Link></li>)}</ul>
          </nav>}
          <div>
            <h2>Contact</h2>
            <address>
              {settings.address && <p>{settings.address}</p>}
              {settings.workingHours && <p>{settings.workingHours}</p>}
              {settings.email && <a href={'mailto:' + settings.email}>{settings.email}</a>}
              {contact && <a href={contact} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>}
              {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
            </address>
          </div>
        </div>
        <p className="public-copyright">© {new Date().getFullYear()} {brand.wordmark}</p>
      </div>
    </footer>
  );
}

export function PublicLayout({ settings, categories, children }) {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    // The homepage keeps each navigation target mounted while catalogue requests complete.
    const target = document.getElementById(location.hash.slice(1));
    if (target) {
      target.scrollIntoView();
      if (location.hash !== '#main-content') target.focus({ preventScroll: true });
    }
  }, [location.key, location.hash]);

  return (
    <div className="public-layout">
      <a className="public-skip" href="#main-content">Skip to content</a>
      <Header key={location.key} settings={settings} />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <Footer settings={settings} categories={categories} />
      <WhatsAppLink number={settings.whatsappNumber} className="public-whatsapp public-float" accessibleName="Chat with Alankrita on WhatsApp" />
    </div>
  );
}
