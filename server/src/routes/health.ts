import { Router } from 'express';
import { registry } from '../providers/registry.js';

const router = Router();

router.get('/', (req, res) => {
  const sources = registry.getAll();
  
  res.json({
    status: 'healthy',
    app: 'CITYPULSE AI',
    tagline: 'Plan around the city\'s pulse.',
    demo_city: 'Pune, India',
    currency: 'INR',
    timestamp: new Date().toISOString(),
    providers: sources,
  });
});

export default router;
