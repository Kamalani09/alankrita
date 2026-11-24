import { brand } from '../../config/brand.js';

export function Logo() {
  return (
    <span className="brand">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="56" fill="none" stroke="#7A1E3A" strokeWidth="2"/>
        <circle cx="60" cy="60" r="51" fill="none" stroke="#B8893A" strokeWidth="1" strokeDasharray="1 4" strokeLinecap="round"/>
        <path d="M36 90 L60 30 L84 90" fill="none" stroke="#7A1E3A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M44 70 Q60 84 76 70" fill="none" stroke="#B8893A" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="60" cy="78" r="4.5" fill="#B8893A"/>
        <circle cx="60" cy="23" r="3.5" fill="#B8893A"/>
      </svg>
      <span className="brand__wordmark">{brand.wordmark}</span>
    </span>
  );
}
