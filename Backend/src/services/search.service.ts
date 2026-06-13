// Backend/src/services/search.service.ts
//
// Semantic search over the meeting archive.
//
// Embeddings are generated locally with @xenova/transformers
// (all-MiniLM-L6-v2, 384-dim, normalized) so no external API key or vector
// server is required. Vectors are stored in SQLite as JSON and ranked with
// cosine similarity in the application layer.

import { prisma } from "../db/prisma";

const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

// The transformers pipeline is loaded lazily on first use (the model is
// downloaded and cached once) and reused across calls.
let extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    // Dynamic import keeps the heavy ESM dependency out of server startup.
    extractorPromise = import("@xenova/transformers").then(({ pipeline }) =>
      pipeline("feature-extraction", EMBEDDING_MODEL)
    );
  }
  return extractorPromise;
}

/** Embed a single piece of text into a normalized 384-dim vector. */
export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

/** Dot product of two equal-length normalized vectors == cosine similarity. */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return dot;
}

interface Chunk {
  chunkType: "transcript" | "summary";
  speaker: string | null;
  startMs: number | null;
  text: string;
}

/**
 * Index a fully-processed meeting: embed each transcript segment plus the
 * summary sections and upsert them into the Embedding table. Re-indexing is
 * safe — existing embeddings for the meeting are cleared first.
 */
export async function indexMeeting(meetingId: string): Promise<void> {
  const transcript = await prisma.transcript.findUnique({
    where: { meetingId },
    include: { segments: { orderBy: { startMs: "asc" } } },
  });
  const summary = await prisma.meetingSummary.findUnique({ where: { meetingId } });

  const chunks: Chunk[] = [];

  // One chunk per diarized segment (already semantically scoped).
  for (const seg of transcript?.segments ?? []) {
    if (seg.text.trim().length === 0) continue;
    chunks.push({
      chunkType: "transcript",
      speaker: seg.speakerName || seg.speaker,
      startMs: seg.startMs,
      text: seg.text,
    });
  }

  // Index summary sections so queries can match decisions/topics directly.
  if (summary) {
    const summaryParts: Array<[string, string]> = [
      ["Key decisions", summary.keyDecisions],
      ["Discussion points", summary.discussionPoints],
      ["Open questions", summary.openQuestions],
      ["Next steps", summary.nextSteps],
    ];
    for (const [label, json] of summaryParts) {
      let items: string[] = [];
      try {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) items = parsed;
      } catch {
        /* ignore malformed summary JSON */
      }
      if (items.length > 0) {
        chunks.push({
          chunkType: "summary",
          speaker: null,
          startMs: null,
          text: `${label}: ${items.join("; ")}`,
        });
      }
    }
  }

  // Clear any prior index for this meeting, then insert fresh embeddings.
  await prisma.embedding.deleteMany({ where: { meetingId } });
  if (chunks.length === 0) return;

  const rows = [];
  for (const chunk of chunks) {
    const vector = await generateEmbedding(chunk.text);
    rows.push({
      meetingId,
      chunkType: chunk.chunkType,
      speaker: chunk.speaker,
      startMs: chunk.startMs,
      text: chunk.text,
      vector: JSON.stringify(vector),
    });
  }

  await prisma.embedding.createMany({ data: rows });
}

/** Remove all of a meeting's embeddings from the vector store. */
export async function deleteMeetingEmbeddings(meetingId: string): Promise<void> {
  await prisma.embedding.deleteMany({ where: { meetingId } });
}

export interface SearchResult {
  meetingId: string;
  meetingTitle: string;
  snippet: string;
  speaker: string | null;
  startMs: number | null;
  chunkType: string;
  relevanceScore: number;
}

/**
 * Semantic search across all indexed meetings. Embeds the query, scores it
 * against every stored chunk by cosine similarity, and returns the top matches
 * joined with their meeting title.
 */
export async function searchMeetings(query: string, limit = 5): Promise<SearchResult[]> {
  const queryVector = await generateEmbedding(query);

  const embeddings = await prisma.embedding.findMany({
    include: { meeting: { select: { filename: true } } },
  });
  if (embeddings.length === 0) return [];

  const scored = embeddings.map((e) => {
    let vec: number[] = [];
    try {
      vec = JSON.parse(e.vector);
    } catch {
      /* skip malformed vector */
    }
    return {
      meetingId: e.meetingId,
      meetingTitle: e.meeting.filename,
      snippet: e.text,
      speaker: e.speaker,
      startMs: e.startMs,
      chunkType: e.chunkType,
      relevanceScore: vec.length ? cosineSimilarity(queryVector, vec) : -1,
    };
  });

  return scored
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}
