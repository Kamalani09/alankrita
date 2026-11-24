// Everything exposed through VITE_ is public browser configuration.
export const brand = {
  name: 'Alankrita',
  wordmark: 'ALANKRITA',
  tagline: 'Premium Look, Pocket-Friendly Price',
  subline: 'Trendy imitation jewellery for every occasion',
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER,
  instagramHandle: import.meta.env.VITE_INSTAGRAM_HANDLE,
  email: import.meta.env.VITE_CONTACT_EMAIL,
  location: import.meta.env.VITE_LOCATION,
  workingHours: import.meta.env.VITE_WORKING_HOURS,
};
