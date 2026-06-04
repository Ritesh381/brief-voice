import fs from "fs";
import path from "path";

export const UPLOAD_DIR = "uploads";

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, {
      recursive: true,
    });
  }
}

export function getFilePath(filename: string) {
  return path.join(
    UPLOAD_DIR,
    filename
  );
}