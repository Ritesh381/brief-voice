# 🔍 Task Assignment — Mohit Kumar

**Role:** RAG Engineer (Retrieval-Augmented Generation)  
**Email:** mohit.24bcs10222@sst.scaler.com  
**Project:** BriefVoice — AI Meeting Intelligence Platform  

---

## 🎯 Your Ownership

You are responsible for **semantic search** across the meeting archive. This means building the vector database pipeline: generating embeddings from transcripts and summaries, indexing them in ChromaDB, and powering natural language search queries like *"What was decided about the API design in last week's sprint meeting?"*

---

## ✅ Task Checklist

### Phase 1 — ChromaDB Setup

- [ ] **Install ChromaDB** (local server)
  ```bash
  pip install chromadb
  # Run the ChromaDB server
  chroma run --host localhost --port 8001
  ```
  OR use the in-process Python client, OR use the JS client:
  ```bash
  cd Backend
  npm install chromadb
  ```

- [ ] **Decide on embedding strategy** — Choose one:
  - Option A: Use Gemini Embeddings API (`models/text-embedding-004`)
  - Option B: Use OpenAI embeddings
  - Option C: Use `@xenova/transformers` for local embeddings (no API cost)

- [ ] **Initialize ChromaDB client** in `search.service.ts`
  - [ ] Connect to ChromaDB instance
  - [ ] Create collection: `briefvoice_meetings`
  - [ ] Add metadata filtering support by `meetingId`

---

### Phase 2 — Embedding Pipeline

- [ ] **Document chunking** — Split transcript into semantic chunks
  - [ ] Chunk by speaker segment (already split by AssemblyAI)
  - [ ] Or chunk by fixed token length (~200 tokens with 50 overlap)
  - [ ] Add metadata: `{ meetingId, chunkIndex, speaker, timestamp }`

- [ ] **Embedding generation**
  - [ ] Create: `generateEmbedding(text: string): Promise<number[]>`
  - [ ] Batch embed all chunks of a meeting

- [ ] **Index meeting** into ChromaDB
  - [ ] Create: `indexMeeting(meetingId: string): Promise<void>`
    - [ ] Fetch transcript from SQLite
    - [ ] Chunk the transcript
    - [ ] Generate embeddings for each chunk
    - [ ] Upsert into ChromaDB collection with metadata
  - [ ] Trigger `indexMeeting()` after a meeting is fully processed

- [ ] **Delete meeting embeddings** when a meeting is deleted
  - [ ] Create: `deleteMeetingEmbeddings(meetingId: string): Promise<void>`

---

### Phase 3 — Semantic Search API

- [ ] **Search implementation**
  - [ ] Create: `searchMeetings(query: string, limit?: number): Promise<SearchResult[]>`
    - [ ] Embed the user's query
    - [ ] Query ChromaDB for nearest neighbors
    - [ ] Return relevant chunks with meeting metadata
  
- [ ] **Build search endpoint** in `routes/search.ts`
  ```http
  GET /search?q=what+was+decided+about+the+API&limit=5
  ```
  Response:
  ```json
  [
    {
      "meetingId": "uuid",
      "meetingTitle": "Sprint Planning - June 3",
      "snippet": "Ritesh said we should migrate to Fastify...",
      "speaker": "Ritesh",
      "timestamp": "00:12:34",
      "relevanceScore": 0.92
    }
  ]
  ```

- [ ] **Meeting-scoped search** *(bonus)*
  ```http
  GET /meetings/:id/search?q=action+items+for+Narendra
  ```
  — Search within a single meeting's transcript.

---

### Phase 4 — Summary Indexing (Hybrid Search)

- [ ] **Index summaries too** — Not just transcripts
  - [ ] Store meeting summaries in ChromaDB with `type: "summary"` metadata
  - [ ] Allows searching by decisions, topics, attendees
  - [ ] Blend results from transcript + summary chunks

- [ ] **Metadata filtering**
  - [ ] Filter by date range: `?from=2026-06-01&to=2026-06-08`
  - [ ] Filter by speaker: `?speaker=Narendra`

---

## 📁 Your Primary Files

```
Backend/
├── src/
│   ├── services/
│   │   └── search.service.ts     ← Main ownership
│   ├── routes/
│   │   └── search.ts             ← Main ownership
│   └── schemas/
│       └── search.ts             ← Main ownership
```

---

## 🛠️ Implementation Guide

### Install ChromaDB JS Client

```bash
cd Backend
npm install chromadb
```

### Search Service Structure

```typescript
// src/services/search.service.ts
import { ChromaClient, GoogleGenerativeAiEmbeddingFunction } from 'chromadb';

const client = new ChromaClient({ path: 'http://localhost:8001' });

const embedder = new GoogleGenerativeAiEmbeddingFunction({
  googleApiKey: process.env.GEMINI_API_KEY!,
  model: 'models/text-embedding-004',
});

const COLLECTION_NAME = 'briefvoice_meetings';

async function getCollection() {
  return client.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: embedder,
  });
}

// ─── INDEX A MEETING ──────────────────────────────────
export async function indexMeeting(
  meetingId: string,
  segments: Array<{ id: string; speaker: string; text: string; startMs: number }>
) {
  const collection = await getCollection();

  const documents = segments.map(s => s.text);
  const ids = segments.map(s => `${meetingId}__${s.id}`);
  const metadatas = segments.map(s => ({
    meetingId,
    speaker: s.speaker,
    startMs: s.startMs,
    chunkType: 'transcript',
  }));

  await collection.add({ ids, documents, metadatas });
}

// ─── SEARCH MEETINGS ──────────────────────────────────
export async function searchMeetings(query: string, limit = 5) {
  const collection = await getCollection();

  const results = await collection.query({
    queryTexts: [query],
    nResults: limit,
  });

  return results.documents[0].map((doc, i) => ({
    text: doc,
    meetingId: results.metadatas[0][i]?.meetingId,
    speaker: results.metadatas[0][i]?.speaker,
    distance: results.distances?.[0]?.[i],
  }));
}

// ─── DELETE MEETING EMBEDDINGS ─────────────────────────
export async function deleteMeetingEmbeddings(meetingId: string) {
  const collection = await getCollection();
  await collection.delete({ where: { meetingId } });
}
```

### Search Route

```typescript
// src/routes/search.ts
import { FastifyInstance } from 'fastify';
import { searchMeetings } from '../services/search.service';

export default async function searchRoutes(app: FastifyInstance) {
  app.get('/search', async (req, reply) => {
    const { q, limit } = req.query as { q: string; limit?: string };
    
    if (!q) {
      return reply.status(400).send({ error: 'Query parameter q is required' });
    }

    const results = await searchMeetings(q, limit ? parseInt(limit) : 5);
    return results;
  });
}
```

### Zod Schema

```typescript
// src/schemas/search.ts
import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(500),
  limit: z.coerce.number().min(1).max(20).default(5),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  speaker: z.string().optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
```

---

## 🔗 APIs You Own

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/search?q=...` | Semantic search across all meetings |
| `GET` | `/meetings/:id/search?q=...` | Search within a single meeting |
| `POST` | `/meetings/:id/index` | (Re)index a meeting into ChromaDB |
| `DELETE` | `/meetings/:id/index` | Remove meeting from search index |

---

## 📦 Resources

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [ChromaDB JS Client](https://www.npmjs.com/package/chromadb)
- [Google Gemini Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)
- [Understanding RAG](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Text Chunking Strategies](https://www.pinecone.io/learn/chunking-strategies/)

---

## 💡 RAG Tips

1. **Chunk size matters** — Too large = noise, too small = loses context. Aim for 150–250 tokens per chunk
2. **Always store metadata** — `meetingId`, `speaker`, `timestamp` make results actionable
3. **Hybrid search** — Combine vector similarity with keyword matching for better results
4. **Re-ranking** — After ChromaDB returns top-K, re-rank with Gemini for even better relevance
5. **Test with real queries** — Search for things like *"who is responsible for the database"* or *"what did we decide about authentication"*

---

## 🤝 Dependencies

- **Depends on:** Ritesh's `TranscriptSegment[]` to generate embeddings
- **Depends on:** Narendra's summary data for summary-level indexing
- **Feeds into:** Harshita's search UI (your `/search` endpoint)
- **Feeds into:** Yatharth's recurring topics (you have the semantic clustering data)

---

*Team BriefVoice — Scaler School of Technology, 2026*
