import { useState } from 'react';
import { responsiveImage } from '../../utils/responsiveImage.js';

export function CatalogueImage({ src, usage, ...imageProps }) {
  const [failedVariant, setFailedVariant] = useState('');
  const image = failedVariant === src ? { src } : responsiveImage(src, usage);
  return (
    <img {...imageProps} {...image}
      onError={image.srcSet ? () => setFailedVariant(src) : undefined} />
  );
}
