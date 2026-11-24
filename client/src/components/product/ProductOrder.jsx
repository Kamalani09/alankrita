import { useState } from 'react';
import { api } from '../../api/client.js';
import { useStorefront } from '../../pages/public/Storefront.jsx';
import { orderMessage, whatsappUrl } from '../../utils/whatsapp.js';
import { WhatsAppLink } from '../layout/PublicLayout.jsx';

export function ProductOrder({ product, number, compact = false }) {
  const { settings } = useStorefront();
  const colors = product.colors ?? [];
  const [selectedColor, setColor] = useState('');
  const [quantity, setQuantity] = useState('1');
  const color = colors.includes(selectedColor) ? selectedColor : colors[0] ?? '';
  const count = Number(quantity);
  const validQuantity = Number.isInteger(count) && count >= 1 && count <= 99;
  const soldOut = product.stockStatus === 'sold_out';
  const label = soldOut ? 'Ask for similar' : product.combo ? 'Order combo on WhatsApp' : 'Order on WhatsApp';

  if (!whatsappUrl(number)) return null;

  function trackClick() {
    if (!settings.enquiryTrackingEnabled || !product._id) return;
    // The link opens normally. Tracking is best-effort and never controls navigation.
    void fetch(api.getUri({ url: '/enquiries' }), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: product._id }),
      keepalive: true,
    }).catch(() => {});
  }

  return (
    <div className={compact ? 'product-order product-order-compact' : 'product-order'}>
      <div className="product-order-options">
        {colors.length > 0 && (
          <label>
            <span>Colour</span>
            <select aria-label={`Colour for ${product.name}`} value={color} onChange={(event) => setColor(event.target.value)}>
              {colors.map((option, index) => <option key={`${option}-${index}`} value={option}>{option}</option>)}
            </select>
          </label>
        )}
        {!compact && !soldOut && (
          <label>
            <span>Quantity</span>
            <input type="number" min="1" max="99" step="1" inputMode="numeric" value={quantity}
              aria-invalid={!validQuantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>
        )}
      </div>
      {(validQuantity || soldOut) ? (
        <WhatsAppLink number={number}
          onClick={trackClick}
          message={orderMessage({ product, color, quantity: soldOut ? 1 : count, origin: window.location.origin })}
          accessibleName={soldOut ? `Ask for similar to ${product.name}` : `${label} for ${product.name}`}>
          {label}
        </WhatsAppLink>
      ) : <p className="product-order-error" role="status">Enter a quantity from 1 to 99.</p>}
    </div>
  );
}
