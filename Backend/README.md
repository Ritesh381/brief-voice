# BriefVoice Backend

AI-powered Meeting Intelligence Platform.

BriefVoice transforms meeting recordings into structured knowledge by generating transcripts, speaker labels, summaries, action items, and searchable meeting archives.

---

##  Tech Stack

### Backend

- Fastify
- TypeScript
- Prisma ORM
- SQLite

### AI Services

- AssemblyAI (Transcription + Speaker Diarization)
- Gemini (Summaries + Action Items)

### Future Additions

- ChromaDB (Semantic Search)
- PDF Reports
- Analytics Dashboard

---

##  Project Structure

```text
backend/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── routes/
│   │   ├── meetings.ts
│   │   ├── search.ts
│   │   └── analytics.ts
│   │
│   ├── services/
│   │   ├── assemblyai.service.ts
│   │   ├── gemini.service.ts
│   │   ├── search.service.ts
│   │   └── pdf.service.ts
│   │
│   ├── db/
│   │   └── prisma.ts
│   │
│   ├── workers/
│   │   └── processMeeting.ts
│   │
│   ├── schemas/
│   │   ├── meeting.ts
│   │   └── search.ts
│   │
│   ├── utils/
│   │   └── file.ts
│   │
│   └── app.ts
│
├── uploads/
├── reports/
│
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

---

## Setup

### Clone Repository

```bash
git clone <repo-url>
cd backend
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create `.env`

```env
DATABASE_URL="file:./briefvoice.db"

ASSEMBLYAI_API_KEY=

GEMINI_API_KEY=
```

---

## 🗄️ Database

Generate Prisma Client

```bash
npx prisma generate
```

Run Migration

```bash
npx prisma migrate dev --name init
```

---

## ▶️ Run Development Server

```bash
npm run dev
```

Server:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

---

## 📌 Current Features

### Health Check

```http
GET /
```

Response

```json
{
  "status": "running",
  "service": "BriefVoice"
}
```

---

### Upload Meeting Audio

```http
POST /meetings/upload
```

Supported formats:

- mp3
- wav
- m4a

Response

```json
{
  "meetingId": "uuid",
  "filename": "meeting.mp3",
  "status": "uploaded"
}
```

---

### List Meetings

```http
GET /meetings
```

Response

```json
[
  {
    "id": "uuid",
    "filename": "meeting.mp3",
    "status": "uploaded"
  }
]
```

---

## 🛣️ Roadmap

### Day 1 ✅

- Fastify Setup
- TypeScript Setup
- Prisma Setup
- SQLite Setup
- Swagger Integration
- Audio Upload API

### Day 2

- AssemblyAI Integration
- Transcript Storage
- Speaker Labels

### Day 3

- Gemini Summaries
- Action Item Extraction
- Topic Extraction

### Day 4

- Meeting Archive APIs
- Meeting Details API

### Day 5

- ChromaDB Integration
- Embedding Generation

### Day 6

- Semantic Search

### Day 7

- Analytics APIs

### Day 8

- PDF Report Generation

### Day 9

- Frontend Integration

### Day 10

- Testing
- Optimization
- Demo Preparation

---

##  Project Goal

Convert meeting recordings into searchable knowledge:

```text
Audio
  ↓
Transcription
  ↓
Speaker Labels
  ↓
Summary
  ↓
Action Items
  ↓
Semantic Search
  ↓
Knowledge Archive
```

---
