# Frontend-Only Demo Deploy

This project can be deployed as frontend-only and still keep the current demo behavior.

## What works without backend
- Full UI and flows
- Local state persistence (IndexedDB/localStorage)
- AI runtime/model info (frontend fallback)
- Task Converter AI analyze
- Prompt generation and regeneration

## Important limitation
- Data is stored in browser only (no shared server database).

## Deploy to Vercel
1. Push repository.
2. Import repo in Vercel.
3. Vercel will use `vercel.json` from repo root.
4. (Optional) set env var:
   - `VITE_REMOTE_AI_BASE_URL=https://text.pollinations.ai`
5. Deploy.

## Verify after deploy
1. Open app URL.
2. Create project/lead, refresh page -> data should persist in the same browser.
3. Run Task Converter -> AI analyze should return updates.
4. Open Prompt Generator -> generation/regeneration should return text.

