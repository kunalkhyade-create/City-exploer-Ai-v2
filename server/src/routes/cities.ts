import { Router } from 'express';
import { db } from '../db/sqlite.js';

const router = Router();

export interface SupportedCity {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  currency: string;
  currencySymbol: string;
  tagline: string;
  coverage: {
    liveWeather: boolean;
    liveRouting: boolean;
    liveGeocoding: boolean;
    curatedDataset: boolean;
    citizenWatch: boolean;
  };
}

export const SUPPORTED_CITIES: SupportedCity[] = [
  {
    id: 'pune',
    name: 'Pune',
    country: 'India',
    lat: 18.5204,
    lng: 73.8567,
    currency: 'INR',
    currencySymbol: '₹',
    tagline: 'Cultural capital of Maharashtra & Oxford of the East',
    coverage: {
      liveWeather: true,
      liveRouting: true,
      liveGeocoding: true,
      curatedDataset: true,
      citizenWatch: true,
    },
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    lat: 19.0760,
    lng: 72.8777,
    currency: 'INR',
    currencySymbol: '₹',
    tagline: 'City of dreams, coastal promenades & midnight street feasts',
    coverage: {
      liveWeather: true,
      liveRouting: true,
      liveGeocoding: true,
      curatedDataset: true,
      citizenWatch: true,
    },
  },
  {
    id: 'delhi',
    name: 'Delhi',
    country: 'India',
    lat: 28.6139,
    lng: 77.2090,
    currency: 'INR',
    currencySymbol: '₹',
    tagline: 'Mughal bastions, grand avenues & Old Delhi bazaars',
    coverage: {
      liveWeather: true,
      liveRouting: true,
      liveGeocoding: true,
      curatedDataset: true,
      citizenWatch: true,
    },
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    country: 'India',
    lat: 12.9716,
    lng: 77.5946,
    currency: 'INR',
    currencySymbol: '₹',
    tagline: 'Lush botanical gardens, craft breweries & innovation hubs',
    coverage: {
      liveWeather: true,
      liveRouting: true,
      liveGeocoding: true,
      curatedDataset: true,
      citizenWatch: true,
    },
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    country: 'India',
    lat: 26.9124,
    lng: 75.7873,
    currency: 'INR',
    currencySymbol: '₹',
    tagline: 'Pink City royal palaces, hill forts & gemstone heritage',
    coverage: {
      liveWeather: true,
      liveRouting: true,
      liveGeocoding: true,
      curatedDataset: true,
      citizenWatch: true,
    },
  },
  {
    id: 'goa',
    name: 'Goa',
    country: 'India',
    lat: 15.2993,
    lng: 74.1240,
    currency: 'INR',
    currencySymbol: '₹',
    tagline: 'Sunlit coastline, Portuguese churches & relaxed beach shacks',
    coverage: {
      liveWeather: true,
      liveRouting: true,
      liveGeocoding: true,
      curatedDataset: false,
      citizenWatch: true,
    },
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    lat: 51.5074,
    lng: -0.1278,
    currency: 'GBP',
    currencySymbol: '£',
    tagline: 'Historic Thames, West End theaters & global cultural tapestry',
    coverage: {
      liveWeather: true,
      liveRouting: true,
      liveGeocoding: true,
      curatedDataset: false,
      citizenWatch: true,
    },
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lng: 139.6503,
    currency: 'JPY',
    currencySymbol: '¥',
    tagline: 'Neon-lit skyscrapers, tranquil Shinto shrines & culinary perfection',
    coverage: {
      liveWeather: true,
      liveRouting: true,
      liveGeocoding: true,
      curatedDataset: false,
      citizenWatch: true,
    },
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    lat: 48.8566,
    lng: 2.3522,
    currency: 'EUR',
    currencySymbol: '€',
    tagline: 'Artistic boulevards, cafe culture & romantic riverbanks',
    coverage: {
      liveWeather: true,
      liveRouting: true,
      liveGeocoding: true,
      curatedDataset: false,
      citizenWatch: true,
    },
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'United States',
    lat: 40.7128,
    lng: -74.0060,
    currency: 'USD',
    currencySymbol: '$',
    tagline: 'Iconic skyline, Broadway rhythms & relentless urban energy',
    coverage: {
      liveWeather: true,
      liveRouting: true,
      liveGeocoding: true,
      curatedDataset: false,
      citizenWatch: true,
    },
  },
];

router.get('/', (req, res) => {
  // Check places counts per city
  const counts = db.prepare(`
    SELECT city, count(*) as count FROM places GROUP BY city
  `).all() as Array<{ city: string; count: number }>;

  const countMap = new Map<string, number>();
  counts.forEach(c => countMap.set(c.city.toLowerCase(), c.count));

  const items = SUPPORTED_CITIES.map(c => ({
    ...c,
    placeCount: countMap.get(c.name.toLowerCase()) || 0,
  }));

  res.json({
    items,
    total: items.length,
  });
});

export default router;
