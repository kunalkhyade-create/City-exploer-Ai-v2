import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const shareSchema = z.object({
  title: z.string().default('Pune CityPulse Itinerary'),
  startTime: z.string().default('10:00'),
  endTime: z.string().default('15:00'),
  totalCostInr: z.number().default(450),
  stops: z.array(z.object({
    name: z.string(),
    arrivalTime: z.string(),
    costInr: z.number(),
    whyThis: z.string().optional(),
  })),
  tagline: z.string().default('Plan around the city\'s pulse.'),
});

router.post('/', (req, res, next) => {
  try {
    const data = shareSchema.parse(req.body);

    let text = `⚡ *CITYPULSE AI — ${data.title}* ⚡\n`;
    text += `"${data.tagline}"\n`;
    text += `📍 Demo City: Pune, India | 💰 Est. Cost: ₹${data.totalCostInr}\n`;
    text += `⏱️ Window: ${data.startTime} — ${data.endTime}\n\n`;
    text += `*Planned Stops:*\n`;

    data.stops.forEach((stop, index) => {
      text += `${index + 1}. *${stop.name}* (Arrival: ${stop.arrivalTime})\n`;
      text += `   💵 ₹${stop.costInr}\n`;
      if (stop.whyThis) {
        text += `   💡 ${stop.whyThis}\n`;
      }
      text += `\n`;
    });

    text += `_Generated with CityPulse AI — Plan around the city's pulse._`;

    const encodedWhatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    res.json({
      formattedText: text,
      whatsAppUrl: encodedWhatsAppUrl,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
