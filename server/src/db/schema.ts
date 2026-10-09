import { db } from './sqlite.js';

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      indicative_price_inr INTEGER NOT NULL DEFAULT 0,
      visit_minutes INTEGER NOT NULL DEFAULT 60,
      step_free INTEGER NOT NULL DEFAULT 0,
      seating INTEGER NOT NULL DEFAULT 1,
      restroom INTEGER NOT NULL DEFAULT 1,
      hourly_crowd TEXT NOT NULL, -- JSON array of 24 numbers (0.0 to 1.0)
      opening_hours TEXT, -- NULL unless verified
      source_tag TEXT NOT NULL DEFAULT 'Demo',
      last_updated TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT 'Pune'
    );

    CREATE TABLE IF NOT EXISTS hazards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      radius_m INTEGER NOT NULL DEFAULT 150,
      date TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'Demo',
      confidence REAL NOT NULL DEFAULT 0.85,
      source_tag TEXT NOT NULL DEFAULT 'Demo',
      created_at TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT 'Pune'
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Under Review, Verified, Resolved, Rejected
      source_tag TEXT NOT NULL DEFAULT 'Community',
      session_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT 'Pune'
    );

    CREATE TABLE IF NOT EXISTS report_status_history (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      old_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      moderator_note TEXT,
      changed_at TEXT NOT NULL,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS report_media (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      media_type TEXT NOT NULL, -- photo or audio
      created_at TEXT NOT NULL,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      title TEXT NOT NULL,
      budget_inr INTEGER NOT NULL,
      travel_mode TEXT NOT NULL,
      pace TEXT NOT NULL,
      start_time TEXT NOT NULL,
      total_cost_inr INTEGER NOT NULL DEFAULT 0,
      total_duration_minutes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trip_stops (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      place_id TEXT NOT NULL,
      stop_order INTEGER NOT NULL,
      arrival_time TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      cost_inr INTEGER NOT NULL,
      why_this TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_places (
      session_id TEXT NOT NULL,
      place_id TEXT NOT NULL,
      saved_at TEXT NOT NULL,
      PRIMARY KEY (session_id, place_id),
      FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS data_sources (
      name TEXT PRIMARY KEY,
      provider_type TEXT NOT NULL, -- live or demo or fallback
      last_success TEXT,
      last_error TEXT,
      confidence REAL NOT NULL DEFAULT 1.0,
      status TEXT NOT NULL DEFAULT 'operational',
      description TEXT NOT NULL
    );

    -- Phase 2 & 4: Users and Urban Pulse Passports
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_passports (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      session_id TEXT,
      interests TEXT NOT NULL DEFAULT '["heritage","street food"]',
      budget_inr INTEGER NOT NULL DEFAULT 600,
      travel_mode TEXT NOT NULL DEFAULT 'foot-walking',
      pace TEXT NOT NULL DEFAULT 'moderate',
      accessibility TEXT NOT NULL DEFAULT '[]',
      crowd_preference TEXT NOT NULL DEFAULT 'peaceful',
      indoor_outdoor TEXT NOT NULL DEFAULT 'balanced',
      preferred_language TEXT NOT NULL DEFAULT 'en',
      default_city TEXT NOT NULL DEFAULT 'Pune',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
    CREATE INDEX IF NOT EXISTS idx_places_coords ON places(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_trips_session ON trips(session_id);
    CREATE INDEX IF NOT EXISTS idx_saved_session ON saved_places(session_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_passports_user ON user_passports(user_id);
    CREATE INDEX IF NOT EXISTS idx_passports_session ON user_passports(session_id);
  `);

  // Safe backwards-compatible column additions
  try { db.exec("ALTER TABLE places ADD COLUMN city TEXT NOT NULL DEFAULT 'Pune';"); } catch {}
  try { db.exec("ALTER TABLE hazards ADD COLUMN city TEXT NOT NULL DEFAULT 'Pune';"); } catch {}
  try { db.exec("ALTER TABLE reports ADD COLUMN city TEXT NOT NULL DEFAULT 'Pune';"); } catch {}
}
