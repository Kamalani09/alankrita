import { brand } from '../config/brand.js';
import { productPath } from './catalogue.js';

export const enquiryMessages = {
  general: `Hi ${brand.name}! I'd like to know more about your imitation jewellery collection.`,
  bulk: `Hi ${brand.name}! I'm looking for imitation jewellery sets for a bulk order or for gifting. Could you share the available options?`,
};

export function whatsappUrl(number, message = enquiryMessages.general) {
  if (!/^[1-9]\d{7,14}$/.test(number ?? '')) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function orderMessage({ product, color, quantity, origin }) {
  const link = new URL(productPath(product.slug), origin).href;
  const details = `*${product.name}* (${product.productCode})\nColour: ${color || 'Not specified'}\nQuantity: ${quantity}\nPrice: ₹${product.price}\nLink: ${link}`;
  if (product.stockStatus === 'sold_out') {
    return `Hi ${brand.name}! I saw this sold-out piece and would like to ask about similar options:\n\n${details}\n\nCould you share what is available?`;
  }
  const intro = product.combo ? "I'd like to order this combo:" : "I'd like to order:";
  return `Hi ${brand.name}! ${intro}\n\n${details}\n\nPlease confirm availability and delivery details.`;
}
