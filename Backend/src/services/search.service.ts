// Backend/src/services/search.service.ts
//
// Semantic search over the meeting archive.
// Full embedding + retrieval implementation lands in Checkpoint 4.
// These stubs exist so the meeting routes / worker can wire in the hooks now.

interface IndexSegment {
  id: string;
  speaker: string;
  text: string;
  startMs: number;
}

/** Index a meeting's transcript (and summary) into the vector store. */
export async function indexMeeting(
  _meetingId: string,
  _segments: IndexSegment[]
): Promise<void> {
  // Implemented in Checkpoint 4.
}

/** Remove all of a meeting's embeddings from the vector store. */
export async function deleteMeetingEmbeddings(_meetingId: string): Promise<void> {
  // Implemented in Checkpoint 4.
}

export interface SearchResult {
  meetingId: string;
  meetingTitle: string;
  snippet: string;
  speaker: string;
  startMs: number;
  relevanceScore: number;
}

/** Semantic search across all indexed meetings. */
export async function searchMeetings(
  _query: string,
  _limit = 5
): Promise<SearchResult[]> {
  // Implemented in Checkpoint 4.
  return [];
}
