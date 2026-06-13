import { useState, useRef, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import { meetingsAPI } from "../api/client";

const ALLOWED = [".mp3", ".wav", ".m4a"];

export default function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setError(`Unsupported file type. Allowed: ${ALLOWED.join(", ")}`);
      return;
    }
    try {
      setProgress(0);
      const res = await meetingsAPI.upload(file, setProgress);
      navigate(`/meetings/${res.meetingId}`);
    } catch (e) {
      setError("Upload failed. Is the backend running?");
      setProgress(null);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <h1 className="page-title">Upload a meeting</h1>
      <p className="page-sub">
        Drop an audio recording to transcribe, summarize, and extract action items.
      </p>

      <div
        className={`dropzone${drag ? " drag" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{ cursor: "pointer" }}
      >
        <UploadCloud size={42} style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 17, fontWeight: 600 }}>
          Drag &amp; drop, or click to choose a file
        </div>
        <div style={{ marginTop: 6 }}>Supported: .mp3, .wav, .m4a</div>
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.m4a,audio/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {progress !== null && (
        <div className="progress" aria-label="upload progress">
          <div style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && (
        <p style={{ color: "var(--red)", marginTop: 16 }}>{error}</p>
      )}
    </div>
  );
}
