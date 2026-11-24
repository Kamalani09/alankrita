import { randomUUID } from 'node:crypto';

export function createSlug(name) {
  const slug = name.toLowerCase().normalize('NFKD').replace(/\p{Mark}/gu, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120).replace(/-$/, '');
  return slug || randomUUID();
}
