import { db } from '../db/sqlite.js';

export interface Place {
  id: string;
  name: string;
  category: 'heritage' | 'street food' | 'nature' | 'shopping' | 'culture';
  description: string;
  lat: number;
  lng: number;
  indicative_price_inr: number;
  visit_minutes: number;
  step_free: boolean;
  seating: boolean;
  restroom: boolean;
  hourly_crowd: number[];
  opening_hours: string | null;
  source_tag: string;
  last_updated: string;
}

export interface PlaceFilter {
  q?: string;
  category?: string;
  step_free?: boolean;
  hour?: number;
  lat?: number;
  lng?: number;
  page?: number;
  pageSize?: number;
}

export const placesProvider = {
  getAll(filter: PlaceFilter = {}): { items: Place[]; total: number; page: number; pageSize: number } {
    let query = 'SELECT * FROM places WHERE 1=1';
    const params: (string | number)[] = [];

    if (filter.q) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filter.q}%`, `%${filter.q}%`);
    }

    if (filter.category && filter.category !== 'all') {
      query += ' AND category = ?';
      params.push(filter.category);
    }

    if (filter.step_free) {
      query += ' AND step_free = 1';
    }

    // Get total count
    const countSql = query.replace('SELECT *', 'SELECT count(*) as count');
    const totalRow = db.prepare(countSql).get(...(params as any[])) as { count: number } | undefined;
    const total = totalRow ? totalRow.count : 0;

    const page = Math.max(1, filter.page || 1);
    const pageSize = Math.max(1, Math.min(100, filter.pageSize || 30));
    const offset = (page - 1) * pageSize;

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const rows = db.prepare(query).all(...(params as any[])) as Array<{
      id: string;
      name: string;
      category: 'heritage' | 'street food' | 'nature' | 'shopping' | 'culture';
      description: string;
      lat: number;
      lng: number;
      indicative_price_inr: number;
      visit_minutes: number;
      step_free: number;
      seating: number;
      restroom: number;
      hourly_crowd: string;
      opening_hours: string | null;
      source_tag: string;
      last_updated: string;
    }>;

    const items: Place[] = rows.map(r => ({
      ...r,
      step_free: Boolean(r.step_free),
      seating: Boolean(r.seating),
      restroom: Boolean(r.restroom),
      hourly_crowd: JSON.parse(r.hourly_crowd),
    }));

    return { items, total, page, pageSize };
  },

  getById(id: string): Place | null {
    const r = db.prepare('SELECT * FROM places WHERE id = ?').get(id) as {
      id: string;
      name: string;
      category: 'heritage' | 'street food' | 'nature' | 'shopping' | 'culture';
      description: string;
      lat: number;
      lng: number;
      indicative_price_inr: number;
      visit_minutes: number;
      step_free: number;
      seating: number;
      restroom: number;
      hourly_crowd: string;
      opening_hours: string | null;
      source_tag: string;
      last_updated: string;
    } | undefined;

    if (!r) return null;

    return {
      ...r,
      step_free: Boolean(r.step_free),
      seating: Boolean(r.seating),
      restroom: Boolean(r.restroom),
      hourly_crowd: JSON.parse(r.hourly_crowd),
    };
  },
};
