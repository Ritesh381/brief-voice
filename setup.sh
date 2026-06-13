#!/bin/bash
# BriefVoice one-shot local setup.
# Installs backend + frontend deps, prepares env files, and syncs the database.
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Setting up BriefVoice backend..."
cd "$ROOT/Backend"
npm install
[ -f .env ] || cp .env.example .env
npx prisma generate
npx prisma db push

echo "▶ Setting up BriefVoice frontend..."
cd "$ROOT/Frontend"
npm install
[ -f .env ] || echo "VITE_API_BASE_URL=http://localhost:8000" > .env

echo ""
echo "✅ Setup complete."
echo "   1. Add your ASSEMBLYAI_API_KEY and OPENROUTER_API_KEY to Backend/.env"
echo "   2. Backend:  cd Backend  && npm run dev   (http://localhost:8000, docs at /docs)"
echo "   3. Frontend: cd Frontend && npm run dev   (http://localhost:5173)"
echo ""
echo "   Note: ffmpeg must be installed for audio transcoding (brew install ffmpeg)."
