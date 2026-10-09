import { db } from '../db/sqlite.js';

export interface DataSourceStatus {
  name: string;
  provider_type: 'live' | 'demo' | 'fallback';
  last_success: string | null;
  last_error: string | null;
  confidence: number;
  status: 'operational' | 'degraded' | 'offline';
  description: string;
}

export const registry = {
  recordSuccess(name: string, type: 'live' | 'demo' | 'fallback' = 'live'): void {
    try {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE data_sources
        SET last_success = ?, status = 'operational', provider_type = ?
        WHERE name = ?
      `).run(now, type, name);
    } catch {
      // ignore registry persistence errors
    }
  },

  recordError(name: string, error: string): void {
    try {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE data_sources
        SET last_error = ?, status = 'degraded'
        WHERE name = ?
      `).run(`${now}: ${error}`, name);
    } catch {
      // ignore
    }
  },

  getAll(): DataSourceStatus[] {
    try {
      const rows = db.prepare('SELECT * FROM data_sources').all() as unknown as DataSourceStatus[];
      return rows;
    } catch {
      return [];
    }
  },
};
