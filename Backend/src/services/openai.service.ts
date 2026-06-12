// Backend/src/services/openai.service.ts

import "dotenv/config";
import OpenAI from "openai";

let openrouter: OpenAI | null = null;

function getOpenRouterClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  openrouter ??= new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:8000",
      "X-Title": process.env.OPENROUTER_APP_NAME ?? "BriefVoice Platform",
    },
  });

  return openrouter;
}

// Since we are using OpenRouter, you can use any model available on their gateway!
// Examples: "openai/gpt-4o-mini", "anthropic/claude-3-5-sonnet", or "google/gemini-2.5-flash"
const modelName = "openai/gpt-4o-mini";

// --- 1. SCHEMAS FOR OPENROUTER STRUCTURED JSON OUTPUTS ---
// We keep strict: true and define explicit schemas so OpenRouter's supported endpoints
// force 100% deterministic JSON execution records that map cleanly to our Prisma DB.

const summaryJsonSchema = {
  name: "meeting_summary",
  strict: true,
  schema: {
    type: "object",
    properties: {
      attendees: {
        type: "array",
        description: "List of people present or identified by name in the meeting.",
        items: { type: "string" },
      },
      keyDecisions: {
        type: "array",
        description: "Critical decisions, architectural sign-offs, or strategic conclusions reached.",
        items: { type: "string" },
      },
      discussionPoints: {
        type: "array",
        description: "Main topics, technical obstacles, debates, or core themes discussed.",
        items: { type: "string" },
      },
      openQuestions: {
        type: "array",
        description: "Unresolved issues, blockers, or questions raised that need later answers.",
        items: { type: "string" },
      },
      nextSteps: {
        type: "array",
        description: "General future roadmap action tracks or directions discussed.",
        items: { type: "string" },
      },
    },
    required: ["attendees", "keyDecisions", "discussionPoints", "openQuestions", "nextSteps"],
    additionalProperties: false,
  },
};

const actionItemsJsonSchema = {
  name: "action_items_list",
  strict: true,
  schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "List of explicit commitments, assignments, or tasks extracted.",
        items: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "Clear, descriptive explanation of what needs to be done.",
            },
            owner: {
              type: "string",
              description: "The specific individual name assigned to this task. Use an empty string if unassigned.",
            },
            deadline: {
              type: "string",
              description: "The explicitly stated deadline window. Use an empty string if not mentioned.",
            },
          },
          required: ["task", "owner", "deadline"],
          additionalProperties: false,
        },
      },
    },
    required: ["items"],
    additionalProperties: false,
  },
};

// --- 2. EXPORT INTERFACES ---

export interface OpenAISummaryOutput {
  attendees: string[];
  keyDecisions: string[];
  discussionPoints: string[];
  openQuestions: string[];
  nextSteps: string[];
}

export interface OpenAIActionItemOutput {
  task: string;
  owner: string | null;
  deadline: string | null;
}

/**
 * Parses a conversation transcript using OpenRouter to generate a structured summary.
 */
export async function generateSummary(transcriptText: string, identifiedSpeakers: string[]): Promise<OpenAISummaryOutput> {
  try {
    const response = await getOpenRouterClient().chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content: "You are an expert technical meeting intelligence analyst. Synthesize transcripts into clean, accurate summaries matching the schema exactly.",
        },
        {
          role: "user",
          content: `Identified Speaker Labels:\n${identifiedSpeakers.join(", ")}\n\nTranscript:\n"""\n${transcriptText}\n"""`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: summaryJsonSchema,
      },
      temperature: 0.1, 
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Received empty response from OpenRouter gateway.");
    
    return JSON.parse(content) as OpenAISummaryOutput;
  } catch (error) {
    console.error("[OpenRouter Service] Error generating summary:", error);
    return {
      attendees: [],
      keyDecisions: ["Failed to synthesize summary due to an execution proxy error."],
      discussionPoints: [],
      openQuestions: [],
      nextSteps: [],
    };
  }
}

/**
 * Extracts discrete action items, parsing out owners and deadlines via OpenRouter gateway models.
 */
export async function extractActionItems(transcriptText: string): Promise<OpenAIActionItemOutput[]> {
  try {
    const response = await getOpenRouterClient().chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content: "Extract all explicit action items, commitments, and follow-ups made by participants in the transcript.",
        },
        {
          role: "user",
          content: `Transcript:\n"""\n${transcriptText}\n"""`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: actionItemsJsonSchema,
      },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Received empty response from OpenRouter gateway.");

    const parsed = JSON.parse(content) as { items: Array<{ task: string; owner: string; deadline: string }> };
    
    // Normalize empty strings back to null values to match our relational Prisma schema layout
    return parsed.items.map((item) => ({
      task: item.task,
      owner: item.owner.trim() === "" ? null : item.owner,
      deadline: item.deadline.trim() === "" ? null : item.deadline,
    }));
  } catch (error) {
    console.error("[OpenRouter Service] Error extracting action items:", error);
    return [];
  }
}
