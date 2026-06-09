# 📊 Task Assignment — Yatharth Khattri

**Role:** Analytics & DevOps  
**Email:** yatharth.24bcs10165@sst.scaler.com  
**Project:** BriefVoice — AI Meeting Intelligence Platform  

---

## 🎯 Your Ownership

You are responsible for **meeting analytics** and ensuring the project **runs reliably** for the demo. For the MVP, focus on getting basic analytics working and making sure the app is easy to run locally for everyone on the team.

---

## ✅ Task Checklist

### Phase 1 — MVP Analytics (Core Priority)

- [ ] **Speaking Time per Participant**
  - [ ] Use the `TranscriptSegment` data (from Ritesh) which has `startMs` and `endMs`
  - [ ] Calculate total speaking duration per speaker label
  - [ ] Create: `GET /analytics/meeting/:id` — Per-meeting breakdown

- [ ] **Meeting Overview Stats**
  - [ ] Total meetings count
  - [ ] Total action items and how many are completed
  - [ ] Create: `GET /analytics/overview` — Dashboard summary numbers

- [ ] **Action Item Completion Rate**
  - [ ] Use action items from Narendra's Prisma table
  - [ ] Compute: `completedCount / totalCount * 100`
  - [ ] Include in `GET /analytics/overview`

---

### Phase 2 — Dev Setup & Environment (Very Important for Team)

- [ ] **Write a proper local setup script** — So every team member can run the project in one shot
  - [ ] Create `setup.sh` in the root
    ```bash
    #!/bin/bash
    cd Backend
    npm install
    cp .env.example .env
    npx prisma generate
    npx prisma migrate dev --name init
    echo "✅ Setup complete. Run: npm run dev"
    ```
  - [ ] Test it on a fresh clone

- [ ] **Docker Compose** *(do this only if time allows after MVP is working)*
  - [ ] `Dockerfile` for the backend
  - [ ] `docker-compose.yml` with backend + ChromaDB services

---

### Phase 3 — Stretch Goals *(Only after MVP features work)*

- [ ] Recurring topics detection (use Narendra's topic extraction output)
- [ ] Meeting frequency tracking over time
- [ ] Simple bar chart data endpoint for the frontend

---

## 📁 Your Primary Files

```
Backend/
├── src/
│   ├── routes/
│   │   └── analytics.ts          ← Main ownership
│   └── services/
│       └── analytics.service.ts  ← Create this (new file)
│
BriefVoice/
└── setup.sh                      ← Create this for team setup
```

---

## 🛠️ Implementation Guide

### Analytics Service (MVP)

```typescript
// src/services/analytics.service.ts
import { prisma } from '../db/prisma';

// Speaking time per speaker for a single meeting
export async function getSpeakingTime(meetingId: string) {
  const segments = await prisma.transcriptSegment.findMany({
    where: { transcript: { meetingId } },
  });

  const speakerTime: Record<string, number> = {};
  for (const seg of segments) {
    const name = seg.speakerName || seg.speaker;
    speakerTime[name] = (speakerTime[name] || 0) + (seg.endMs - seg.startMs);
  }
  return speakerTime; // e.g. { "Ritesh": 45200, "Narendra": 31000 } (ms)
}

// Global overview stats
export async function getOverviewStats() {
  const [totalMeetings, totalActionItems, completedItems] = await Promise.all([
    prisma.meeting.count(),
    prisma.actionItem.count(),
    prisma.actionItem.count({ where: { completed: true } }),
  ]);

  return {
    totalMeetings,
    totalActionItems,
    completedItems,
    completionRate: totalActionItems > 0
      ? Math.round((completedItems / totalActionItems) * 100)
      : 0,
  };
}
```

### Analytics Routes

```typescript
// src/routes/analytics.ts
import { FastifyInstance } from 'fastify';
import { getSpeakingTime, getOverviewStats } from '../services/analytics.service';

export default async function analyticsRoutes(app: FastifyInstance) {
  // Dashboard overview
  app.get('/analytics/overview', async () => {
    return getOverviewStats();
  });

  // Per-meeting speaking time breakdown
  app.get('/analytics/meeting/:id', async (req) => {
    const { id } = req.params as { id: string };
    return getSpeakingTime(id);
  });
}
```

---

## 🔗 APIs You Own

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/overview` | Total meetings, action items, completion rate |
| `GET` | `/analytics/meeting/:id` | Speaking time per speaker for one meeting |

> **MVP scope** — just these two endpoints are enough for the demo.

---

## 🤝 Dependencies

- **Depends on:** Ritesh's `TranscriptSegment` table (needs `startMs`, `endMs`, `speaker`)
- **Depends on:** Narendra's `ActionItem` table
- **Feeds into:** Harshita's Analytics page (she'll display your numbers as charts)

---

## 📦 Resources

- [Prisma Aggregations](https://www.prisma.io/docs/orm/prisma-client/queries/aggregations-groupby-summarizing)
- [Fastify Route Params](https://fastify.dev/docs/latest/Reference/Routes/)

---

*Team BriefVoice — Scaler School of Technology, 2026*
