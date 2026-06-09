# 🔧 Task Assignment — Narendra Sirvi

**Role:** Backend Lead  
**Email:** narendra.24bcs10225@sst.scaler.com  
**Project:** BriefVoice — AI Meeting Intelligence Platform  

---

## 🎯 Your Ownership

You own the **core server infrastructure**: the Fastify API, Prisma database schema, file upload, and the processing pipeline that ties all other services together. Every other team member depends on your endpoints and data models.

---

## ✅ Task Checklist

### Phase 1 — Server Foundation ✅ (Already Done)

- [x] Initialize Fastify + TypeScript project
- [x] Configure Prisma ORM with SQLite
- [x] Set up Swagger UI at `/docs`
- [x] Create audio upload API (`POST /meetings/upload`)
- [x] Create meeting list API (`GET /meetings`)
- [x] Set up `.env.example`

---

### Phase 2 — Database Schema & Meeting Pipeline 🔄 (Your Main Task)

- [ ] **Expand Prisma Schema** — Add models for transcript data
  ```prisma
  model Meeting {
    id         String   @id @default(uuid())
    filename   String
    filePath   String
    status     String   @default("uploaded")
    createdAt  DateTime @default(now())
    transcript Transcript?
    actionItems ActionItem[]
    summary    MeetingSummary?
  }

  model Transcript {
    id        String              @id @default(uuid())
    meetingId String              @unique
    meeting   Meeting             @relation(fields: [meetingId], references: [id])
    fullText  String
    segments  TranscriptSegment[]
    createdAt DateTime            @default(now())
  }

  model TranscriptSegment {
    id           String     @id @default(uuid())
    transcriptId String
    transcript   Transcript @relation(fields: [transcriptId], references: [id])
    speaker      String
    speakerName  String?
    text         String
    startMs      Int
    endMs        Int
  }

  model MeetingSummary {
    id               String   @id @default(uuid())
    meetingId        String   @unique
    attendees        String
    keyDecisions     String
    discussionPoints String
    openQuestions    String
    nextSteps        String
    createdAt        DateTime @default(now())
  }

  model ActionItem {
    id        String   @id @default(uuid())
    meetingId String
    meeting   Meeting  @relation(fields: [meetingId], references: [id])
    task      String
    owner     String?
    deadline  String?
    completed Boolean  @default(false)
    createdAt DateTime @default(now())
  }
  ```
  - [ ] Run `npx prisma migrate dev --name add-transcript-models`

- [ ] **Meeting Processing Worker** — `workers/processMeeting.ts`
  - [ ] Called after upload — triggers Ritesh's transcription service
  - [ ] Updates meeting `status` through lifecycle:
    `uploaded → processing → transcribed → processed`
  - [ ] Stores transcript segments returned by Ritesh's service
  - [ ] Calls Ritesh's summary + action item service, stores results

- [ ] **Meeting Detail API**
  - [ ] `GET /meetings/:id` — Return meeting with all related data
    ```json
    {
      "id": "uuid",
      "filename": "standup.mp3",
      "status": "processed",
      "transcript": { "fullText": "...", "segments": [...] },
      "summary": { "attendees": [...], "keyDecisions": [...] },
      "actionItems": [{ "task": "...", "owner": "...", "completed": false }]
    }
    ```

- [ ] **Speaker Name Assignment**
  - [ ] `PUT /meetings/:id/speakers` — Let users rename `Speaker A` → `Narendra`
    ```json
    { "labels": { "Speaker A": "Narendra", "Speaker B": "Ritesh" } }
    ```

- [ ] **Action Item Toggle**
  - [ ] `PUT /meetings/:id/action-items/:itemId` — Mark complete/incomplete

---

### Phase 3 — Polish

- [ ] Add Zod request/response schemas to all routes
- [ ] File type + size validation on upload (mp3, wav, m4a only; max 100MB)
- [ ] Proper HTTP error codes (404, 400, 500) with descriptive messages
- [ ] Register `analyticsRoutes` and `searchRoutes` in `app.ts`

---

## 📁 Your Primary Files

```
Backend/
├── src/
│   ├── routes/
│   │   └── meetings.ts              ← Main ownership
│   ├── workers/
│   │   └── processMeeting.ts        ← Main ownership
│   ├── schemas/
│   │   └── meeting.ts               ← Main ownership
│   ├── utils/
│   │   └── file.ts                  ← Main ownership
│   └── app.ts                       ← Main ownership
└── prisma/
    └── schema.prisma                ← Main ownership
```

---

## ⚡ Quick Commands

```bash
cd Backend

# Run dev server
npm run dev

# Apply schema changes
npx prisma migrate dev --name <migration-name>

# View DB in GUI
npx prisma studio

# Regenerate Prisma client after schema changes
npx prisma generate
```

---

## 🔗 APIs You Own

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/meetings/upload` | Upload audio file |
| `GET` | `/meetings` | List all meetings |
| `GET` | `/meetings/:id` | Get full meeting detail |
| `PUT` | `/meetings/:id/speakers` | Assign real names to speakers |
| `PUT` | `/meetings/:id/action-items/:itemId` | Toggle action item completion |

---

## 🤝 Handoff to Other Members

- **→ Ritesh**: You call his `transcribeAudio()` and `generateSummary()` functions from your worker
- **→ Harshita**: Your API responses define the data contracts the frontend consumes
- **→ Mohit**: After processing, call his `indexMeeting()` from your worker
- **→ Yatharth**: Your `TranscriptSegment` and `ActionItem` tables power his analytics queries

---

*Team BriefVoice — Scaler School of Technology, 2026*
