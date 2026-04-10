# Deploy to Render (Public URL)

This repo supports Render Blueprint deploy via `render.yaml`.

## 1) Push repository
Push current branch to GitHub/GitLab/Bitbucket.

## 2) Create Blueprint
Open:
- https://render.com/deploy

Select this repository. Render will create:
- Web service: `project-passport-react`
- Postgres: `project-passport-db`

## 3) AI configuration
Service uses remote AI URL:
- `REMOTE_AI_BASE_URL=https://text.pollinations.ai`

## 4) Deploy
Render build/start sequence:
- install deps
- generate Prisma client
- apply Prisma migrations
- build frontend
- start unified web server (`npm run web:serve`)

## 5) Verify
- `https://<your-service>.onrender.com/health` should return `{ "ok": true, ... }`
- Open main URL and check UI + AI actions
