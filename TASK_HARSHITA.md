# 🎨 Task Assignment — Harshita Hirawat

**Role:** Frontend Lead  
**Email:** harshita.24bcs10044@sst.scaler.com  
**Project:** BriefVoice — AI Meeting Intelligence Platform  

---

## 🎯 Your Ownership

You are responsible for the **entire frontend experience** of BriefVoice — from the audio upload flow to the meeting dashboard, transcript viewer, action item checklist, and analytics UI. You own the `Frontend/` directory completely.

---

## ✅ Task Checklist

### Phase 1 — Project Setup

- [ ] **Initialize React + TypeScript + Vite**
  ```bash
  cd Frontend
  npm create vite@latest . -- --template react-ts
  npm install
  ```
- [ ] **Install core dependencies**
  ```bash
  npm install react-router-dom axios react-dropzone lucide-react
  npm install -D tailwindcss @types/node
  ```
- [ ] Set up folder structure (see below)
- [ ] Configure Vite proxy to point `http://localhost:5173/api` → `http://localhost:8000`
- [ ] Set up `.env` with `VITE_API_BASE_URL=http://localhost:8000`

---

### Phase 2 — Core Pages

- [ ] **App Shell** — Sidebar layout with navigation
  - [ ] Logo / branding
  - [ ] Navigation: Upload, Meetings, Search, Analytics
  - [ ] Responsive hamburger menu for mobile

- [ ] **Upload Page** (`/upload`)
  - [ ] Drag-and-drop audio file upload (using `react-dropzone`)
  - [ ] Support: `.mp3`, `.wav`, `.m4a`
  - [ ] Upload progress bar with percentage
  - [ ] File validation with error messages
  - [ ] Success state with redirect to meeting page
  - [ ] Processing status display (uploaded → processing → transcribed → processed)

- [ ] **Meetings Archive Page** (`/meetings`)
  - [ ] List all meetings as cards
  - [ ] Show: filename, date, status, duration
  - [ ] Status badge (color-coded: uploaded, processing, processed)
  - [ ] Click card → navigate to meeting detail
  - [ ] Search/filter bar for local filtering

- [ ] **Meeting Detail Page** (`/meetings/:id`)
  - [ ] Meeting title and metadata header
  - [ ] **Transcript Tab** — Scrollable transcript with speaker-labelled segments
    - [ ] Each segment shows: speaker name, timestamp, text
    - [ ] Click speaker label → open rename modal
    - [ ] Auto-scroll or jump-to-timestamp feature
  - [ ] **Summary Tab** — Display structured summary
    - [ ] Attendees list
    - [ ] Key Decisions (bullet list)
    - [ ] Discussion Points
    - [ ] Open Questions
    - [ ] Next Steps
  - [ ] **Action Items Tab** — Checkable task list
    - [ ] Checkbox to mark complete
    - [ ] Show: task, owner, deadline
    - [ ] Visual strike-through on completion
  - [ ] **Download PDF** button → trigger PDF export

---

### Phase 3 — Search & Analytics UI

- [ ] **Search Page** (`/search`)
  - [ ] Natural language search input
  - [ ] Real-time results as user types (debounced)
  - [ ] Result cards showing: meeting name, matched snippet, date
  - [ ] Click result → navigate to that meeting

- [ ] **Analytics Page** (`/analytics`) *(coordinate with Yatharth)*
  - [ ] Speaking time per speaker — horizontal bar chart
  - [ ] Meeting frequency over time — line chart
  - [ ] Action item completion rate — donut/pie chart
  - [ ] Recurring topics — tag cloud or frequency list

---

### Phase 4 — Polish

- [ ] Add loading skeletons for all data-fetching states
- [ ] Add error states with retry buttons
- [ ] Smooth page transitions using Framer Motion
- [ ] Dark mode toggle
- [ ] Responsive design — works on mobile, tablet, desktop
- [ ] Empty states (e.g., "No meetings yet — upload your first!")

---

## 📁 Your Project Structure

```
Frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   └── client.ts          # Axios instance & API functions
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── meetings/
│   │   │   ├── MeetingCard.tsx
│   │   │   ├── TranscriptViewer.tsx
│   │   │   ├── SummaryView.tsx
│   │   │   └── ActionItemList.tsx
│   │   ├── upload/
│   │   │   └── AudioDropzone.tsx
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Skeleton.tsx
│   │       └── ProgressBar.tsx
│   ├── pages/
│   │   ├── UploadPage.tsx
│   │   ├── MeetingsPage.tsx
│   │   ├── MeetingDetailPage.tsx
│   │   ├── SearchPage.tsx
│   │   └── AnalyticsPage.tsx
│   ├── hooks/
│   │   ├── useMeetings.ts
│   │   ├── useMeeting.ts
│   │   └── useSearch.ts
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces (Meeting, Transcript, etc.)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🛠️ Implementation Guide

### API Client Setup

```typescript
// src/api/client.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
});

export const meetingsAPI = {
  list: () => api.get('/meetings'),
  get: (id: string) => api.get(`/meetings/${id}`),
  upload: (file: File, onProgress: (p: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/meetings/upload', form, {
      onUploadProgress: (e) => onProgress(Math.round((e.loaded * 100) / e.total!)),
    });
  },
  getSummary: (id: string) => api.get(`/meetings/${id}/summary`),
  getActionItems: (id: string) => api.get(`/meetings/${id}/action-items`),
  toggleActionItem: (meetingId: string, itemId: string, completed: boolean) =>
    api.put(`/meetings/${meetingId}/action-items/${itemId}`, { completed }),
};
```

### TypeScript Interfaces

```typescript
// src/types/index.ts
export interface Meeting {
  id: string;
  filename: string;
  title?: string;
  status: 'uploaded' | 'processing' | 'transcribed' | 'processed';
  createdAt: string;
}

export interface TranscriptSegment {
  id: string;
  speaker: string;
  speakerName?: string;
  text: string;
  startMs: number;
  endMs: number;
}

export interface MeetingSummary {
  attendees: string[];
  keyDecisions: string[];
  discussionPoints: string[];
  openQuestions: string[];
  nextSteps: string[];
}

export interface ActionItem {
  id: string;
  task: string;
  owner?: string;
  deadline?: string;
  completed: boolean;
}
```

---

## 🎨 Design Guidelines

**Color Palette:**
- Primary: `#6366f1` (Indigo)
- Secondary: `#8b5cf6` (Violet)
- Background: `#0f0f1a` (Dark navy)
- Surface: `#1a1a2e` (Dark card)
- Text: `#e2e8f0` (Light gray)
- Accent: `#10b981` (Emerald green for success)

**Typography:** Use `Inter` from Google Fonts

**Status Colors:**
- Uploaded: `#f59e0b` (Amber)
- Processing: `#3b82f6` (Blue)
- Processed: `#10b981` (Green)
- Error: `#ef4444` (Red)

---

## 📦 Recommended Libraries

```bash
npm install react-router-dom        # Routing
npm install axios                    # API calls
npm install react-dropzone           # Drag-and-drop upload
npm install lucide-react             # Icons
npm install recharts                 # Charts for analytics
npm install framer-motion            # Animations
npm install clsx                     # Conditional classnames
```

---

## 🤝 Dependencies

- **Depends on:** Ritesh's REST API (endpoints and response shapes)
- **Depends on:** Narendra's summary/action-items API responses
- **Depends on:** Mohit's search API (`GET /search?q=...`)
- **Depends on:** Yatharth's analytics API responses for charts

**Tip:** Ask Ritesh for the `.env.example` to know what URLs to hit. If the backend isn't ready, mock the API responses locally first!

---

*Team BriefVoice — Scaler School of Technology, 2026*
