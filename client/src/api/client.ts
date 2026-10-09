import {
  Place,
  Hazard,
  WeatherData,
  GeneratedPlan,
  ReplanResult,
  DataSourceStatus,
  ReportItem,
  User,
  UserPassport,
  CityInfo,
} from '../types';

export const api = {
  async getHealth(): Promise<{ providers: DataSourceStatus[] }> {
    const res = await fetch('/api/health');
    return res.json();
  },

  async getCities(): Promise<{ items: CityInfo[] }> {
    const res = await fetch('/api/cities');
    return res.json();
  },

  async getGeminiStatus(): Promise<{ isConfigured: boolean; model: string }> {
    const res = await fetch('/api/settings/gemini-key');
    return res.json();
  },

  async saveGeminiKey(apiKey: string, model?: string): Promise<{ ok: boolean; message: string; model?: string }> {
    const res = await fetch('/api/settings/gemini-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, model }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Failed to verify Gemini API key');
    }
    return data;
  },

  async getMe(): Promise<{ user: User | null; passport: UserPassport | null }> {
    const res = await fetch('/api/auth/me');
    return res.json();
  },

  async register(email: string, password: string, name?: string): Promise<{ user: User }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Registration failed');
    }
    return res.json();
  },

  async login(email: string, password: string): Promise<{ user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Login failed');
    }
    return res.json();
  },

  async logout(): Promise<{ ok: boolean }> {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
    });
    return res.json();
  },

  async getPassport(): Promise<{ passport: UserPassport | null }> {
    const res = await fetch('/api/passport');
    return res.json();
  },

  async savePassport(passport: Partial<UserPassport>): Promise<{ passport: UserPassport }> {
    const res = await fetch('/api/passport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passport),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to save passport');
    }
    return res.json();
  },

  async getPlaces(params: { q?: string; category?: string; step_free?: boolean; city?: string; page?: number; pageSize?: number } = {}): Promise<{ items: Place[]; total: number }> {
    const search = new URLSearchParams();
    if (params.q) search.set('q', params.q);
    if (params.category && params.category !== 'all') search.set('category', params.category);
    if (params.step_free) search.set('step_free', 'true');
    if (params.city) search.set('city', params.city);
    if (params.page) search.set('page', String(params.page));
    if (params.pageSize) search.set('pageSize', String(params.pageSize));

    const res = await fetch(`/api/places?${search.toString()}`);
    return res.json();
  },

  async getHazards(city?: string): Promise<{ items: Hazard[]; disclaimer: string }> {
    const q = city ? `?city=${encodeURIComponent(city)}` : '';
    const res = await fetch(`/api/hazards${q}`);
    return res.json();
  },

  async getWeather(lat?: number, lng?: number): Promise<WeatherData> {
    const q = (lat !== undefined && lng !== undefined) ? `?lat=${lat}&lng=${lng}` : '';
    const res = await fetch(`/api/weather${q}`);
    return res.json();
  },

  async parsePrompt(text: string): Promise<{ constraints: GeneratedPlan['constraintsUsed']; source: 'gemini' | 'local'; model_note?: string }> {
    const res = await fetch('/api/plan/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Failed to parse prompt');
    return res.json();
  },

  async generatePlan(payload: {
    constraints: GeneratedPlan['constraintsUsed'];
    lang: 'en' | 'hi' | 'mr';
    startTime: string;
  }): Promise<GeneratedPlan> {
    const res = await fetch('/api/plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Plan generation failed');
    return res.json();
  },

  async replan(payload: {
    plan: GeneratedPlan;
    strategy: 'avoid_crowds' | 'budget_saver' | 'alternative_stops';
    lang: 'en' | 'hi' | 'mr';
  }): Promise<ReplanResult> {
    const res = await fetch('/api/plan/replan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Replan failed');
    return res.json();
  },

  async comparePlaces(placeIdA: string, placeIdB: string, currentHour: number): Promise<any> {
    const res = await fetch('/api/plan/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeIdA, placeIdB, currentHour }),
    });
    return res.json();
  },

  async getReports(city?: string): Promise<{ items: ReportItem[] }> {
    const q = city ? `?city=${encodeURIComponent(city)}` : '';
    const res = await fetch(`/api/reports${q}`);
    return res.json();
  },

  async submitReport(formData: FormData): Promise<any> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Report submission failed');
    }
    return res.json();
  },

  async getAdminReports(token: string): Promise<{ items: any[] }> {
    const res = await fetch('/api/admin/reports', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Invalid Admin Token or unauthorized');
    return res.json();
  },

  async updateReportStatus(token: string, reportId: string, status: string, note: string): Promise<any> {
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, note }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async getSavedPlaces(): Promise<{ items: Place[] }> {
    const res = await fetch('/api/saved');
    return res.json();
  },

  async toggleSavePlace(placeId: string, isSaved: boolean): Promise<void> {
    if (isSaved) {
      await fetch(`/api/saved/${placeId}`, { method: 'DELETE' });
    } else {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: placeId }),
      });
    }
  },

  async shareWhatsApp(payload: any): Promise<{ formattedText: string; whatsAppUrl: string }> {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
