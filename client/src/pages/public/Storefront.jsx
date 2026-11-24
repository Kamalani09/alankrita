import { Outlet, useOutletContext } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout.jsx';
import { brand } from '../../config/brand.js';
import { usePublicData } from '../../hooks/usePublicData.js';
import '../../styles/public.css';
import '../../styles/shop.css';

const defaults = {
  heroHeading: brand.tagline,
  heroSubtext: brand.subline,
  whatsappNumber: brand.whatsappNumber,
  instagramHandle: brand.instagramHandle,
  email: brand.email,
  address: brand.location,
  workingHours: brand.workingHours,
  trustStripItems: [],
};

export function Storefront() {
  const settingsResult = usePublicData('/settings');
  const categories = usePublicData('/categories');
  const settings = { ...defaults, ...settingsResult.data };

  return (
    <PublicLayout settings={settings} categories={categories.data ?? []}>
      <Outlet context={{ settings, settingsResult, categories }} />
    </PublicLayout>
  );
}

export function useStorefront() {
  return useOutletContext();
}
