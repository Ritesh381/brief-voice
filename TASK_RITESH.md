# 🤖 Task Assignment — Ritesh Prajapati

**Role:** AI/ML Engineer  
**Email:** ritesh.24bcs10088@sst.scaler.com  
**Project:** BriefVoice — AI Meeting Intelligence Platform  

---

## 🎯 Your Ownership

You own all **AI and ML integrations**: transcribing audio with AssemblyAI, identifying speakers with diarization, and using Google Gemini to generate structured summaries, extract action items, and produce PDF reports.

---

## ✅ Task Checklist

### Phase 1 — AssemblyAI Transcription + Diarization 🔄 (Start Here)

- [ ] **Install AssemblyAI SDK** (already in `package.json`, just verify)
  ```bash
  cd Backend
  npm install
  ```

- [ ] **Complete `assemblyai.service.ts`**
  - [ ] Initialize client with `process.env.ASSEMBLYAI_API_KEY`
  - [ ] Upload local audio file to AssemblyAI (get a remote URL)
  - [ ] Submit for transcription with speaker diarization enabled
  - [ ] Poll until complete, return structured result

  ```typescript
  // src/services/assemblyai.service.ts
  import { AssemblyAI } from 'assemblyai';
  import fs from 'fs';

  const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

  export async function transcribeAudio(localFilePath: string) {
    // Upload file and transcribe with speaker diarization
    const transcript = await client.transcripts.transcribe({
      audio: fs.createReadStream(localFilePath),
      speaker_labels: true,      // Enable speaker diarization
      speakers_expected: 5,      // Max speakers in a meeting
    });

    if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }

    // Return normalized segments
    return {
      fullText: transcript.text || '',
      segments: (transcript.utterances || []).map(u => ({
        speaker: u.speaker,      // e.g. "A", "B", "C"
        text: u.text,
        startMs: u.start,
        endMs: u.end,
      })),
    };
  }
  ```

---

### Phase 2 — Gemini Summaries + Action Items 🔄

- [ ] **Install Gemini SDK**
  ```bash
  cd Backend
  npm install @google/generative-ai
  ```

- [ ] **Complete `gemini.service.ts`**

  - [ ] **`generateSummary(transcript, speakers)`** — Returns structured JSON:
    ```json
    {
      "attendees": ["Narendra", "Ritesh"],
      "keyDecisions": ["Migrate to Fastify", "Use SQLite for MVP"],
      "discussionPoints": ["API design", "Database choice"],
      "openQuestions": ["When to add ChromaDB?"],
      "nextSteps": ["Narendra sets up Prisma schema by Friday"]
    }
    ```

  - [ ] **`extractActionItems(transcript)`** — Returns array:
    ```json
    [
      { "task": "Set up Prisma schema", "owner": "Narendra", "deadline": "Friday", "completed": false },
      { "task": "Integrate AssemblyAI", "owner": "Ritesh", "deadline": null, "completed": false }
    ]
    ```

  ```typescript
  // src/services/gemini.service.ts
  import { GoogleGenerativeAI } from '@google/generative-ai';

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  export async function generateSummary(transcript: string, speakers: string[]) {
    const prompt = `
  You are a professional meeting analyst.
  Speakers: ${speakers.join(', ')}
  Transcript:
  """${transcript}"""

  Return ONLY valid JSON:
  {
    "attendees": [],
    "keyDecisions": [],
    "discussionPoints": [],
    "openQuestions": [],
    "nextSteps": []
  }`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }

  export async function extractActionItems(transcript: string) {
    const prompt = `
  Extract all action items from this meeting transcript.
  """${transcript}"""

  Return ONLY a valid JSON array:
  [{ "task": "...", "owner": "... or null", "deadline": "... or null", "completed": false }]`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
  ```

---

### Phase 3 — PDF Report Generation *(if time allows)*

- [ ] **Install PDFKit**
  ```bash
  npm install pdfkit @types/pdfkit
  ```
- [ ] **Complete `pdf.service.ts`** — Generate a report with:
  - Meeting name + date
  - Attendees list
  - Key Decisions
  - Action Items checklist
  - (Optionally) Full transcript
- [ ] Expose via `GET /meetings/:id/report` — Returns downloadable PDF

---

## 📁 Your Primary Files

```
Backend/
├── src/
│   ├── services/
│   │   ├── assemblyai.service.ts    ← Main ownership
│   │   ├── gemini.service.ts        ← Main ownership
│   │   └── pdf.service.ts           ← Main ownership
```

> You are writing **service functions only** — no routes. Narendra calls your functions from his worker (`processMeeting.ts`). Coordinate with him on the exact function signatures.

---

## 🔗 Functions You Export

| Function | Called by | Description |
|---|---|---|
| `transcribeAudio(filePath)` | Narendra's worker | Transcribe + diarize audio |
| `generateSummary(text, speakers)` | Narendra's worker | Gemini structured summary |
| `extractActionItems(text)` | Narendra's worker | Gemini action item list |
| `generatePDFReport(meetingId)` | Narendra's route | PDF export |

---

## 💡 Prompt Engineering Tips

1. **Always request JSON output** — Add `"Return ONLY valid JSON"` to every prompt
2. **Validate output** — Always wrap `JSON.parse()` in a `try/catch`
3. **Handle nulls** — `owner` and `deadline` will often be `null` — that's fine
4. **Use `gemini-1.5-flash`** — It's fast and cheap for MVP
5. **Set low temperature** — For structured data, consistent output is more important than creativity

---

## 📦 Resources

- [AssemblyAI Node.js SDK](https://www.assemblyai.com/docs/getting-started/transcribe-an-audio-file/nodejs)
- [AssemblyAI Speaker Diarization](https://www.assemblyai.com/docs/speech-to-text/speaker-diarization)
- [Google Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [`@google/generative-ai` NPM](https://www.npmjs.com/package/@google/generative-ai)

---

## 🤝 Dependencies

- **Depends on:** Narendra's `processMeeting.ts` worker to call your functions
- **Coordinate with Narendra on:** Exact TypeScript types returned by your functions (he stores them in Prisma)
- **Feeds into:**
  - Harshita's frontend display (summary + action items)
  - Mohit's ChromaDB indexing (transcript text)
  - Yatharth's analytics (action items, speaker segments)

---

*Team BriefVoice — Scaler School of Technology, 2026*
