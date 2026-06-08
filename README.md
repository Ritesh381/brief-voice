# 🎙️ BriefVoice — AI Meeting Intelligence Platform

> **From meeting chaos to structured decisions — every call becomes a searchable knowledge asset.**

[![Assignment](https://img.shields.io/badge/Assignment-%233%20of%2015-blue)](#)
[![Category](https://img.shields.io/badge/Category-Voice%20%2B%20RAG-purple)](#)
[![Marks](https://img.shields.io/badge/Marks-15%20%2B%203%20Bonus-green)](#)
[![Team](https://img.shields.io/badge/Team-5%20Students-orange)](#)
[![Stack](https://img.shields.io/badge/Stack-Fastify%20%7C%20TypeScript%20%7C%20Prisma%20%7C%20AssemblyAI%20%7C%20Gemini-red)](#)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Core Features](#-core-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Team & Work Distribution](#-team--work-distribution)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Data Flow](#-data-flow)
- [Roadmap](#-roadmap)
- [Environment Variables](#-environment-variables)

---

## 🌟 Overview

**BriefVoice** is an end-to-end AI Meeting Intelligence Platform that transforms raw audio recordings into structured, searchable, and actionable knowledge assets. Upload a meeting recording and receive a speaker-labelled transcript, intelligent summary, action item checklist, and a fully searchable archive — all in under 2 minutes.

---

## 🎯 Problem Statement

Information loss in meetings costs teams real velocity:

- ❌ Follow-ups slip through the cracks
- ❌ Decisions cannot be traced back
- ❌ Onboarding requires replaying every context-setting conversation
- ❌ Insights buried in unstructured audio never surface

**BriefVoice solves this** by turning every meeting into a structured, searchable knowledge document automatically.

---

## ✨ Core Features

| Feature | Description | Status |
|---|---|---|
| 🎤 **Audio Transcription** | Transcribe uploaded audio files using AssemblyAI. Handles multiple speakers, background noise, and technical vocabulary | 🔄 In Progress |
| 👥 **Speaker Diarization** | Identify and label different speakers. Allow users to assign names to speaker labels post-processing | 🔄 In Progress |
| ✅ **Action Item Extraction** | Extract commitments with task, owner, and deadline. Present as a structured, checkable list | 🔄 In Progress |
| 📄 **Structured Summary** | Generate meeting summary with sections: attendees, key decisions, discussion points, open questions, next steps | 🔄 In Progress |
| 🔍 **Searchable Archive** | Index all transcripts and summaries. Support natural language queries across the full archive | 📅 Planned |
| 📊 **Meeting Analytics** | Track speaking time, meeting frequency, action item completion rate, and recurring topics | 📅 Planned |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BriefVoice Platform                       │
│                                                                   │
│  ┌──────────────┐     ┌──────────────────────────────────────┐  │
│  │   Frontend   │────▶│              Backend API              │  │
│  │  (React/TS)  │◀────│         (Fastify + TypeScript)        │  │
│  └──────────────┘     └──────────────────────────────────────┘  │
│                               │           │           │          │
│                    ┌──────────┘    ┌──────┘    ┌─────┘          │
│                    ▼               ▼            ▼                │
│             ┌─────────┐    ┌──────────┐  ┌──────────┐          │
│             │AssemblyAI│    │  Gemini  │  │ ChromaDB  │          │
│             │(Transcr.)│    │   LLM    │  │(Vector DB)│          │
│             └─────────┘    └──────────┘  └──────────┘          │
│                    │               │            │                │
│                    └───────────────┴────────────┘               │
│                                    │                             │
│                             ┌──────▼──────┐                     │
│                             │  SQLite DB   │                     │
│                             │  (Prisma ORM)│                     │
│                             └─────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Fastify** | High-performance HTTP framework |
| **TypeScript** | Type-safe development |
| **Prisma ORM** | Database access layer |
| **SQLite** | Local relational database |
| **Zod** | Runtime schema validation |

### AI & ML Services
| Service | Purpose |
|---|---|
| **AssemblyAI** | Audio transcription + Speaker diarization |
| **Google Gemini** | Summarization + Action item extraction |
| **ChromaDB** | Vector embeddings for semantic search |

### Frontend
| Technology | Purpose |
|---|---|
| **React** | UI framework |
| **TypeScript** | Type-safe frontend code |
| **Vite** | Build tool & dev server |

---

## 📁 Project Structure

```
BriefVoice/
├── Backend/
│   ├── prisma/
│   │   ├── migrations/          # Database migration history
│   │   └── schema.prisma        # Database schema
│   │
│   ├── src/
│   │   ├── routes/
│   │   │   ├── meetings.ts      # Upload, list, get meeting routes
│   │   │   ├── search.ts        # Semantic search routes
│   │   │   └── analytics.ts     # Analytics & stats routes
│   │   │
│   │   ├── services/
│   │   │   ├── assemblyai.service.ts   # Transcription + Diarization
│   │   │   ├── gemini.service.ts       # AI summaries + Action items
│   │   │   ├── search.service.ts       # ChromaDB vector search
│   │   │   └── pdf.service.ts          # PDF report generation
│   │   │
│   │   ├── db/
│   │   │   └── prisma.ts        # Prisma client instance
│   │   │
│   │   ├── workers/
│   │   │   └── processMeeting.ts  # Async meeting processing pipeline
│   │   │
│   │   ├── schemas/
│   │   │   ├── meeting.ts       # Zod validation schemas for meetings
│   │   │   └── search.ts        # Zod validation schemas for search
│   │   │
│   │   ├── utils/
│   │   │   └── file.ts          # File handling utilities
│   │   │
│   │   └── app.ts               # Fastify app entry point
│   │
│   ├── uploads/                 # Temporary audio file storage
│   ├── reports/                 # Generated PDF reports
│   ├── .env                     # Environment variables
│   ├── .env.example             # Environment variable template
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md                # Backend-specific README
│
├── Frontend/
│   └── README.md                # Frontend-specific README (Harshita)
│
└── README.md                    # ← You are here (Project Root README)
```

---

## 👥 Team & Work Distribution

> **Assignment #3 | Group Size: 5 | Marks: 15 + 3 Bonus**

| # | Name | Email | Role | Component |
|---|---|---|---|---|
| 1 | **Narendra Sirvi** | narendra.24bcs10225@sst.scaler.com | 🔧 Backend Lead | Core API + Database + Server Infrastructure |
| 2 | **Ritesh Prajapati** | ritesh.24bcs10088@sst.scaler.com | 🤖 AI/ML Engineer | AssemblyAI Transcription + Gemini LLM Integration |
| 3 | **Harshita Hirawat** | harshita.24bcs10044@sst.scaler.com | 🎨 Frontend Lead | React UI + Dashboard |
| 4 | **Mohit Kumar** | mohit.24bcs10222@sst.scaler.com | 🔍 RAG Engineer | Vector Search + ChromaDB |
| 5 | **Yatharth Khattri** | yatharth.24bcs10165@sst.scaler.com | 📊 Analytics + DevOps | Analytics + Deployment |

---

### 🔧 Ritesh Prajapati — Backend Lead

**Responsibilities:**
- Set up and maintain the Fastify + TypeScript server
- Design and implement the Prisma database schema
- Build the audio upload API and file management
- Integrate AssemblyAI for transcription and speaker diarization
- Implement the async meeting processing worker pipeline
- Write API documentation (Swagger)

**Deliverables:**
- ✅ Fastify server with Swagger docs at `/docs`
- ✅ Audio upload endpoint (`POST /meetings/upload`)
- ✅ Meeting list & detail endpoints
- 🔄 AssemblyAI transcription service
- 🔄 Speaker diarization with label assignment API
- 🔄 Prisma schema for meetings, transcripts, speakers

📂 **Primary files:** `Backend/src/routes/meetings.ts`, `Backend/src/services/assemblyai.service.ts`, `Backend/src/workers/processMeeting.ts`, `Backend/prisma/schema.prisma`

---

### 🤖 Narendra Sirvi — AI/LLM Engineer

**Responsibilities:**
- Integrate Google Gemini API for NLP tasks
- Build structured summary generation (attendees, decisions, discussion points, open questions, next steps)
- Implement action item extraction with task, owner, and deadline parsing
- Design prompts for consistent, structured AI output
- Build PDF report generation service

**Deliverables:**
- 🔄 `gemini.service.ts` — Full Gemini integration
- 🔄 Structured summary generation endpoint
- 🔄 Action item extraction with checkable list format
- 🔄 PDF export of meeting reports
- 📅 Topic extraction for analytics

📂 **Primary files:** `Backend/src/services/gemini.service.ts`, `Backend/src/services/pdf.service.ts`, `Backend/src/routes/meetings.ts` (summary endpoints)

---

### 🎨 Harshita Hirawat — Frontend Lead

**Responsibilities:**
- Set up React + TypeScript + Vite frontend project
- Build audio upload UI with drag-and-drop
- Design and implement the meeting dashboard
- Build transcript viewer with speaker-labelled segments
- Build action item checklist UI
- Build structured summary display
- Ensure responsive design across devices

**Deliverables:**
- 📅 React app scaffold with routing
- 📅 Audio upload page with progress tracking
- 📅 Meeting list / archive page
- 📅 Meeting detail page (transcript + summary + action items)
- 📅 Speaker label assignment UI
- 📅 Responsive mobile-friendly layout

📂 **Primary files:** `Frontend/` (full ownership)

---

### 🔍 Mohit Kumar — RAG Engineer

**Responsibilities:**
- Integrate ChromaDB as the vector database
- Build embedding pipeline (generate embeddings for transcripts + summaries)
- Implement semantic search across all meetings
- Build natural language query interface
- Optimize retrieval relevance and search performance

**Deliverables:**
- 📅 ChromaDB setup and integration
- 📅 `search.service.ts` — Embedding generation + semantic search
- 📅 `GET /search?q=...` natural language search endpoint
- 📅 Relevant meeting snippet retrieval
- 📅 Search results ranking and display

📂 **Primary files:** `Backend/src/services/search.service.ts`, `Backend/src/routes/search.ts`, `Backend/src/schemas/search.ts`

---

### 📊 Yatharth Khattri — Analytics & DevOps

**Responsibilities:**
- Build the meeting analytics engine
- Track: speaking time per participant, meeting frequency, action item completion rate, recurring topics
- Build analytics API endpoints
- Set up CI/CD pipeline and deployment configuration
- Write integration and end-to-end tests
- Manage Docker containerization for deployment

**Deliverables:**
- 📅 `analytics.ts` — Analytics routes
- 📅 Speaking time calculation from transcript segments
- 📅 Action item completion tracking
- 📅 Recurring topics detection
- 📅 Docker + docker-compose setup
- 📅 Deployment documentation

📂 **Primary files:** `Backend/src/routes/analytics.ts`, `Backend/src/services/analytics.service.ts` (new), deployment configs

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **AssemblyAI API Key** — [Get one free](https://www.assemblyai.com/)
- **Google Gemini API Key** — [Get one free](https://aistudio.google.com/)

### 1. Clone the Repository

```bash
git clone <repo-url>
cd BriefVoice
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your API keys
```

```env
DATABASE_URL="file:./briefvoice.db"
ASSEMBLYAI_API_KEY=your_assemblyai_key_here
GEMINI_API_KEY=your_gemini_key_here
```

### 4. Initialize Database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Run the Development Server

```bash
npm run dev
```

The server will start at:
- **API:** `http://localhost:8000`
- **Swagger Docs:** `http://localhost:8000/docs`

### 6. Frontend Setup *(Coming Soon)*

```bash
cd ../Frontend
npm install
npm run dev
```

---

## 📡 API Reference

### Health Check
```http
GET /
```
```json
{ "status": "running", "service": "BriefVoice" }
```

---

### Upload Meeting Audio
```http
POST /meetings/upload
Content-Type: multipart/form-data

Body: file (audio/mpeg, audio/wav, audio/m4a)
```
```json
{
  "meetingId": "uuid",
  "filename": "meeting.mp3",
  "status": "uploaded"
}
```
**Supported formats:** `.mp3`, `.wav`, `.m4a`

---

### List All Meetings
```http
GET /meetings
```
```json
[
  {
    "id": "uuid",
    "filename": "team-standup.mp3",
    "status": "processed",
    "createdAt": "2026-06-08T14:00:00Z"
  }
]
```

---

### Get Meeting Details *(Planned)*
```http
GET /meetings/:id
```
Returns full transcript, speaker segments, summary, and action items.

---

### Semantic Search *(Planned)*
```http
GET /search?q=what+was+decided+about+the+API+design
```
Returns relevant transcript snippets from across all meetings.

---

### Analytics *(Planned)*
```http
GET /analytics/overview
GET /analytics/meeting/:id
```

---

## 🔄 Data Flow

```
1. User uploads audio file
       ↓
2. File saved to /uploads
       ↓
3. Meeting record created in SQLite (status: uploaded)
       ↓
4. Async worker triggers AssemblyAI transcription
       ↓
5. Transcription + Speaker Diarization returned
       ↓
6. Transcript stored, speakers labelled
       ↓
7. Gemini generates: Summary + Action Items + Topics
       ↓
8. Results stored in database (status: processed)
       ↓
9. Embeddings generated & indexed in ChromaDB
       ↓
10. Meeting ready for search & analytics
```

---

## 📅 Roadmap

| Day | Date | Milestone | Owner |
|---|---|---|---|
| Day 1 | Jun 8 (Today) | ✅ Server running, Upload API, DB schema finalized | Narendra |
| Day 2 | Jun 9 | AssemblyAI transcription + speaker diarization working | Ritesh |
| Day 3 | Jun 10 | Gemini summaries + action item extraction | Ritesh |
| Day 3 | Jun 10 | Frontend scaffold + Upload page + Meeting list | Harshita |
| Day 4 | Jun 11 | Meeting detail page (transcript + summary + action items) | Harshita |
| Day 4 | Jun 11 | ChromaDB setup + semantic search endpoint | Mohit |
| Day 5 | Jun 12 | Analytics endpoints (speaking time + action item stats) | Yatharth |
| Day 5 | Jun 12 | Frontend search page + analytics charts | Harshita |
| Day 6 | Jun 13 | Full integration testing + bug fixes | All |
| Day 7 | Jun 14 | Polish, PDF export, demo prep | All |

---

## 🔐 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | SQLite database path | ✅ Yes |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key for transcription | ✅ Yes |
| `GEMINI_API_KEY` | Google Gemini API key for summaries | ✅ Yes |
| `PORT` | Server port (default: 8000) | ❌ Optional |
| `CHROMA_HOST` | ChromaDB host URL | 📅 Planned |

---

## 👨‍💻 Individual Task READMEs

Each team member has a dedicated task file:

| Member | Task File |
|---|---|
| Ritesh Prajapati | [`TASK_RITESH.md`](./TASK_RITESH.md) |
| Narendra Sirvi | [`TASK_NARENDRA.md`](./TASK_NARENDRA.md) |
| Harshita Hirawat | [`TASK_HARSHITA.md`](./TASK_HARSHITA.md) |
| Mohit Kumar | [`TASK_MOHIT.md`](./TASK_MOHIT.md) |
| Yatharth Khattri | [`TASK_YATHARTH.md`](./TASK_YATHARTH.md) |

---

## 📄 License

This project is built for academic purposes as part of the Gen AI Assignment Series at **Scaler School of Technology**.

---

*Built with ❤️ by Team BriefVoice — Scaler School of Technology, 2026*
