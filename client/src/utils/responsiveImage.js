const catalogueSizes = '(max-width: 640px) calc(50vw - 1.4rem), (max-width: 1024px) calc(33vw - 1.6rem), (max-width: 1232px) calc(25vw - 1.5rem), 285px';
const largeSizes = '(max-width: 640px) calc(100vw - 2rem), (max-width: 1232px) calc(50vw - 2rem), 560px';

const presets = {
  card: { widths: [180, 240, 320, 480, 640, 800], sizes: catalogueSizes, fallback: 480 },
  hero: { widths: [400, 640, 800, 1040, 1280], sizes: largeSizes, fallback: 640 },
  detail: { widths: [400, 640, 800, 1040, 1280], sizes: largeSizes, fallback: 640 },
  thumbnail: { widths: [64, 128], sizes: '48px', fallback: 64 },
  zoom: { widths: [640, 960, 1280, 1600], sizes: '(max-width: 1024px) 88vw, 960px', fallback: 960 },
};

export function responsiveImage(source, usage) {
  const original = { src: source };
  const preset = presets[usage];
  if (!preset) return original;

  let url;
  try {
    url = new URL(source);
  } catch {
    return original;
  }
  if (url.origin !== 'https://res.cloudinary.com' || url.username || url.password || url.search || url.hash) return original;

  // Only rewrite ordinary versioned uploads. Preserve signed or pre-transformed URLs.
  const match = /^(\/[^/]+\/image\/upload\/)(v\d+\/.+)$/.exec(url.pathname);
  if (!match) return original;

  const variant = (width) => `${url.origin}${match[1]}c_limit,w_${width},f_auto,q_auto/${match[2]}`;
  return {
    src: variant(preset.fallback),
    srcSet: preset.widths.map((width) => `${variant(width)} ${width}w`).join(', '),
    sizes: preset.sizes,
  };
}
