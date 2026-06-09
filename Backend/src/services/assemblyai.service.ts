// Backend/src/services/assemblyai.service.ts

import { AssemblyAI } from "assemblyai";
import { execFileSync } from "child_process";
import path from "path";
import fs from "fs";

// Initialize client with your environment variable
const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

interface TranscriptSegment {
  speaker: string;
  text: string;
  startMs: number;
  endMs: number;
}

interface TranscriptionResult {
  fullText: string;
  segments: TranscriptSegment[];
}

/**
 * Transcribes a local audio file by converting it to WAV format and sending it to AssemblyAI.
 * @param localFilePath Path to the file stored on disk (e.g., .mp3, .m4a)
 */
export async function transcribeAudio(localFilePath: string): Promise<TranscriptionResult> {
  let wavPath: string | null = null;
  try {
    const absolutePath = path.resolve(localFilePath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Audio file not found at path: ${absolutePath}`);
    }

    // Convert the incoming file (mp3, m4a, etc.) into a standardized voice-optimized WAV file
    console.log(`[AssemblyAI Service] Converting input file to voice-optimized WAV...`);
    wavPath = convertToStandardWav(absolutePath);
    console.log(`[AssemblyAI Service] Conversion complete: ${path.basename(wavPath)}`);

    console.log(`[AssemblyAI Service] Uploading streaming binary to AssemblyAI staging...`);
    const fileStream = fs.createReadStream(wavPath);
    const uploadUrl = await client.files.upload(fileStream);

    console.log(`[AssemblyAI Service] Upload successful. Starting diarization pipeline...`);
    const transcript = await client.transcripts.transcribe({
      audio: uploadUrl,
      speaker_labels: true, // Crucial for parsing separate meeting attendees
    });

    if (transcript.status === "error") {
      throw new Error(`AssemblyAI execution failed: ${transcript.error}`);
    }

    const fullText = transcript.text || "";
    console.log(fullText)
    const segments = (transcript.utterances || []).map((u) => ({
      speaker: `Speaker ${u.speaker}`, // Normalizes "A" -> "Speaker A"
      text: u.text,
      startMs: u.start,
      endMs: u.end,
    }));
    console.log(segments)


    return { fullText, segments };
  } catch (error) {
    console.error("Error in assemblyai.service.ts:", error);
    throw error;
  } finally {
    // ALWAYS clean up the temporary transcoded WAV file from disk to save storage space
    if (wavPath && fs.existsSync(wavPath)) {
      try {
        fs.unlinkSync(wavPath);
        console.log(`[AssemblyAI Service] Cleaned up temporary WAV file: ${path.basename(wavPath)}`);
      } catch (err) {
        console.error(`[AssemblyAI Service] Failed to remove temporary WAV file:`, err);
      }
    }
  }
}

/**
 * Uses system FFmpeg to convert any audio container to a unified 16kHz Mono WAV file.
 * Bypasses container packet faults and matches speech recognition input parameters perfectly.
 * @param inputAbsolutePath Absolute path to source file
 * @returns Absolute path to generated temporary WAV file
 */
function convertToStandardWav(inputAbsolutePath: string): string {
  const dir = path.dirname(inputAbsolutePath);
  const ext = path.extname(inputAbsolutePath);
  const baseName = path.basename(inputAbsolutePath, ext);
  
  // Create a predictable temporary path ending with .wav
  const outputWavPath = path.join(dir, `${baseName}_transcoded.wav`);

  const args = [
    "-y",                       // Overwrite destination file if it already exists
    "-i", inputAbsolutePath,     // Input audio file path (e.g. .mp3)
    "-vn",                      // Disable video streams (just in case an mp4 format container hits the endpoint)
    "-acodec", "pcm_s16le",     // Transcode to standard uncompressed 16-bit signed PCM WAV
    "-ar", "16000",             // Downsample to 16kHz (the optimal sampling sweet-spot for voice AI pipelines)
    "-ac", "1",                 // Downmix stereo to 1 channel (mono) to save disk space and upload times
    outputWavPath               // Destination WAV file path target
  ];

  try {
    execFileSync("ffmpeg", args, { stdio: "ignore" });
    return outputWavPath;
  } catch (ffmpegError) {
    console.error("[AssemblyAI Service] FFmpeg conversion to WAV failed. Details:", ffmpegError);
    throw new Error("FFmpeg failed to convert input audio file to standard WAV format.");
  }
}