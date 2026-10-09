import { Router } from 'express';
import { db } from '../db/sqlite.js';
import { weatherProvider } from '../providers/weather.js';
import { registry } from '../providers/registry.js';

const router = Router();

router.get('/', async (req, res) => {
  const currentHour = new Date().getHours();

  // Calculate category crowd averages at current hour
  const places = db.prepare('SELECT category, hourly_crowd FROM places').all() as Array<{
    category: string;
    hourly_crowd: string;
  }>;

  const categoryCrowds: Record<string, { total: number; count: number }> = {};
  for (const p of places) {
    const crowds = JSON.parse(p.hourly_crowd) as number[];
    const crowdAtHour = crowds[currentHour] || 0.5;

    if (!categoryCrowds[p.category]) {
      categoryCrowds[p.category] = { total: 0, count: 0 };
    }
    categoryCrowds[p.category].total += crowdAtHour;
    categoryCrowds[p.category].count += 1;
  }

  const categoryAverages = Object.entries(categoryCrowds).map(([cat, data]) => ({
    category: cat,
    averageCrowd: Number((data.total / data.count).toFixed(2)),
    status: (data.total / data.count) < 0.4 ? 'Low Density' : (data.total / data.count) < 0.7 ? 'Moderate Buzz' : 'Peak Crowds',
  }));

  const hazardCount = db.prepare('SELECT count(*) as count FROM hazards').get() as { count: number };
  const verifiedReportCount = db.prepare(`SELECT count(*) as count FROM reports WHERE status = 'Verified'`).get() as { count: number };
  const weather = await weatherProvider.getWeather();
  const dataSources = registry.getAll();

  res.json({
    city: 'Pune',
    currentHour,
    hourlyPulseSummary: categoryAverages,
    activeHazardsCount: hazardCount ? hazardCount.count : 0,
    verifiedCommunityReportsCount: verifiedReportCount ? verifiedReportCount.count : 0,
    weather: {
      condition: weather.condition || 'Clear',
      temperature_c: weather.temperature_c,
      rain_summary: weather.rain_summary,
      available: weather.available,
    },
    dataFreshness: {
      sources: dataSources.map(s => ({
        name: s.name,
        confidence: s.confidence,
        provider_type: s.provider_type,
        status: s.status,
      })),
    },
    disclaimer: 'Hourly crowd estimates reflect typical modeled patterns, not live sensors. No reports in our data; not a safety guarantee.',
  });
});

export default router;
