# CITYPULSE AI — REST API Documentation

**Tagline**: "Plan around the city's pulse."  
**Demo City**: Pune, India  
**Currency**: INR (₹)

---

## Conventions & Standards

- **Error Shape**: All error responses return:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human readable explanation",
      "details": []
    }
  }
  ```
- **Pagination Shape**:
  ```json
  {
    "items": [],
    "page": 1,
    "pageSize": 30,
    "total": 30
  }
  ```
- **Session Identification**: Scoped anonymously through the `cp_sid` HTTP-only SameSite cookie.
- **Admin Endpoints**: Require `Authorization: Bearer <ADMIN_TOKEN>` with constant-time verification.

---

## Endpoints

### 1. Provider Health & Data Registry
`GET /api/health`

**Response (`200 OK`)**:
```json
{
  "status": "healthy",
  "app": "CITYPULSE AI",
  "tagline": "Plan around the city's pulse.",
  "demo_city": "Pune, India",
  "currency": "INR",
  "timestamp": "2026-10-09T08:00:00.000Z",
  "providers": [
    {
      "name": "AIProvider (Gemini)",
      "provider_type": "live",
      "last_success": "2026-10-09T08:00:00.000Z",
      "last_error": null,
      "confidence": 0.95,
      "status": "operational",
      "description": "Gemini natural language constraint parsing and contextual multilingual explanations"
    },
    {
      "name": "WeatherProvider (Open-Meteo)",
      "provider_type": "live",
      "last_success": "2026-10-09T08:00:00.000Z",
      "last_error": null,
      "confidence": 0.98,
      "status": "operational",
      "description": "Pune real-time meteorological conditions and 12-hour precipitation forecast"
    }
  ]
}
```

---

### 2. Places Discovery
`GET /api/places?q=food&category=street+food&step_free=true&page=1&pageSize=10`

**Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "place_fc_road_street_food",
      "name": "FC Road Street Food Hub",
      "category": "street food",
      "description": "Youthful cultural artery packed with snack stalls...",
      "lat": 18.5283,
      "lng": 73.8409,
      "indicative_price_inr": 120,
      "visit_minutes": 60,
      "step_free": true,
      "seating": false,
      "restroom": false,
      "hourly_crowd": [0, 0, 0.1, 0.4, 0.8, 0.95],
      "opening_hours": "11:00 - 23:00 (Verified)",
      "source_tag": "Demo",
      "last_updated": "2026-10-09T08:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 1
}
```

---

### 3. Place Details
`GET /api/places/:id`

**Response (`200 OK`)**:
```json
{
  "id": "place_shaniwar_wada",
  "name": "Shaniwar Wada",
  "category": "heritage",
  "description": "Iconic 18th-century fortification of the Maratha Empire Peshwas...",
  "lat": 18.5196,
  "lng": 73.8553,
  "indicative_price_inr": 25,
  "visit_minutes": 75,
  "step_free": false,
  "seating": true,
  "restroom": true,
  "hourly_crowd": [0, 0, 0, 0, 0.2, 0.5, 0.85],
  "opening_hours": "08:00 - 18:30 (Verified)",
  "source_tag": "Demo",
  "last_updated": "2026-10-09T08:00:00Z"
}
```

---

### 4. Active Hazards
`GET /api/hazards`

**Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "hazard_jm_road_metro",
      "title": "JM Road Metro Underground Excavation & Lane Restriction",
      "description": "Heavy construction barricades restricting traffic to a single lane...",
      "category": "road work",
      "lat": 18.5245,
      "lng": 73.849,
      "radius_m": 200,
      "date": "2026-10-09",
      "verification_status": "Demo",
      "confidence": 0.9,
      "source_tag": "Demo",
      "created_at": "2026-10-09T07:30:00Z"
    }
  ],
  "total": 6,
  "notice": "Simulated community alerts (DEMO DATA). Do not rely for life safety.",
  "disclaimer": "No reports in our data; not a safety guarantee."
}
```

---

### 5. Weather Conditions
`GET /api/weather`

**Response (`200 OK`)**:
```json
{
  "available": true,
  "temperature_c": 28,
  "humidity_percent": 54,
  "condition": "Mainly Clear / Partly Cloudy",
  "wind_speed_kmh": 11,
  "rain_probability_12h": [10, 15, 20, 25, 15, 10, 5, 0, 0, 0, 0, 0],
  "rain_summary": "Dry conditions expected across Pune",
  "cached_at": "2026-10-09T08:00:00.000Z",
  "source": "open-meteo"
}
```

---

### 6. Forward Geocoding
`POST /api/geocode`

**Request**:
```json
{
  "query": "FC Road, Deccan"
}
```

**Response (`200 OK`)**:
```json
{
  "query": "FC Road, Deccan",
  "lat": 18.5283,
  "lng": 73.8409,
  "displayName": "Fergusson College Road, Deccan Gymkhana, Pune, Maharashtra",
  "source": "nominatim"
}
```

---

### 7. Natural Prompt Parsing
`POST /api/plan/parse`

**Request**:
```json
{
  "text": "Plan my afternoon in Pune for ₹600 near FC Road with street food and walking"
}
```

**Response (`200 OK`)**:
```json
{
  "constraints": {
    "budget_inr": 600,
    "hours": 4,
    "interests": ["street food"],
    "travel_mode": "foot-walking",
    "pace": "moderate",
    "accessibility": [],
    "mood": "exploratory",
    "group_size": 1,
    "start_location": "FC Road, Deccan"
  },
  "source": "gemini"
}
```

---

### 8. Itinerary Generation
`POST /api/plan/generate`

**Request**:
```json
{
  "constraints": {
    "budget_inr": 500,
    "hours": 4,
    "interests": ["heritage", "street food"],
    "travel_mode": "foot-walking",
    "pace": "moderate",
    "accessibility": [],
    "mood": "exploratory",
    "group_size": 1,
    "start_location": "FC Road, Deccan"
  },
  "lang": "en",
  "startTime": "10:00"
}
```

**Response (`200 OK`)**:
```json
{
  "id": "plan_1728461234_abcde",
  "title": "Heritage & Street Food Journey",
  "tagline": "Plan around the city's pulse.",
  "city": "Pune",
  "currency": "INR",
  "startTime": "10:00",
  "endTime": "13:45",
  "totalDurationMinutes": 225,
  "totalCostInr": 295,
  "remainingBudgetInr": 205,
  "stops": [
    {
      "stopOrder": 1,
      "place": {
        "id": "place_fc_road_street_food",
        "name": "FC Road Street Food Hub",
        "indicative_price_inr": 120
      },
      "arrivalTime": "10:03",
      "departureTime": "11:03",
      "durationMinutes": 60,
      "costInr": 120,
      "whyThis": "Selected for its high street food score, optimal morning crowd, and convenient ~3 min walk.",
      "score": 0.892,
      "travelFromPrev": {
        "distanceMeters": 210,
        "durationMinutes": 3,
        "mode": "foot-walking",
        "routeLabel": "Estimated, not a real route"
      }
    }
  ],
  "weatherSummary": "Mainly Clear / Partly Cloudy, 28°C",
  "aiSource": "gemini",
  "createdAt": "2026-10-09T08:00:00Z"
}
```

---

### 9. Plan B Replanning
`POST /api/plan/replan`

**Request**:
```json
{
  "plan": { "id": "plan_1728461234_abcde", "stops": [] },
  "strategy": "avoid_crowds",
  "lang": "en"
}
```

**Response (`200 OK`)**:
```json
{
  "originalPlan": {},
  "planB": {},
  "diff": {
    "planAId": "plan_1728461234_abcde",
    "planBId": "plan_1728461234_xyz89",
    "addedStops": [],
    "removedStops": [],
    "costDifferenceInr": -80,
    "durationDifferenceMinutes": 15,
    "reason": "Plan B optimizes for lower crowd densities and serene alternative stops."
  }
}
```

---

### 10. Place Side-by-Side Comparison
`POST /api/compare`

**Request**:
```json
{
  "placeIdA": "place_fc_road_street_food",
  "placeIdB": "place_vaishali_restaurant",
  "currentHour": 16
}
```

**Response (`200 OK`)**:
```json
{
  "comparison": {
    "hour": 16,
    "placeA": {
      "name": "FC Road Street Food Hub",
      "indicative_price_inr": 120,
      "currentHourCrowd": 0.6,
      "crowdStatus": "Moderate Crowd"
    },
    "placeB": {
      "name": "Vaishali Restaurant",
      "indicative_price_inr": 220,
      "currentHourCrowd": 0.75,
      "crowdStatus": "Peak Buzz"
    },
    "priceDifferenceInr": -100,
    "recommendation": "FC Road Street Food Hub is quieter right now."
  }
}
```

---

### 11. Citizen Reports
`POST /api/reports` (Multipart form-data: `title`, `description`, `category`, `lat`, `lng`, optional `files`)

**Response (`201 Created`)**:
```json
{
  "message": "Report submitted for moderation",
  "id": "rep_9a8b7c6d",
  "category": "waterlogging",
  "piiRedacted": true,
  "redactedCounts": { "emails": 1, "phones": 1 },
  "mediaFilesSaved": 1,
  "status": "Pending",
  "source_tag": "Community"
}
```

`GET /api/reports`
- Returns verified/resolved reports with descriptions.
- Unverified/pending items return `description: "[Description withheld until community verification]"`.

---

### 12. Admin Moderation
`GET /api/admin/reports` (Requires `Authorization: Bearer <ADMIN_TOKEN>`)  
`PATCH /api/admin/reports/:id`

**Request**:
```json
{
  "status": "Verified",
  "note": "Confirmed by traffic warden patrol on JM Road"
}
```

**Response (`200 OK`)**:
```json
{
  "message": "Report status updated to Verified",
  "reportId": "rep_9a8b7c6d",
  "oldStatus": "Pending",
  "newStatus": "Verified",
  "moderatorNote": "Confirmed by traffic warden patrol on JM Road"
}
```

---

### 13. City Pulse Insights
`GET /api/insights`

**Response (`200 OK`)**:
```json
{
  "city": "Pune",
  "currentHour": 14,
  "hourlyPulseSummary": [
    { "category": "street food", "averageCrowd": 0.58, "status": "Moderate Buzz" },
    { "category": "heritage", "averageCrowd": 0.64, "status": "Moderate Buzz" }
  ],
  "activeHazardsCount": 6,
  "verifiedCommunityReportsCount": 0,
  "weather": { "condition": "Mainly Clear / Partly Cloudy", "temperature_c": 28, "available": true },
  "disclaimer": "Hourly crowd estimates reflect typical modeled patterns, not live sensors. No reports in our data; not a safety guarantee."
}
```

---

### 14. WhatsApp Share Generator
`POST /api/share`

**Request**:
```json
{
  "title": "Heritage & Street Food Journey",
  "startTime": "10:00",
  "endTime": "14:00",
  "totalCostInr": 295,
  "stops": [
    { "name": "FC Road Food Hub", "arrivalTime": "10:05", "costInr": 120 }
  ]
}
```

**Response (`200 OK`)**:
```json
{
  "formattedText": "⚡ *CITYPULSE AI — Heritage & Street Food Journey* ⚡\n...",
  "whatsAppUrl": "https://api.whatsapp.com/send?text=..."
}
```
