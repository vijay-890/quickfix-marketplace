# QuickFix — project guide

## What each part does

- `frontend/src/main.jsx` starts the React app and adds routing, language, and sign-in state.
- `frontend/src/App.jsx` maps URLs to screens and protects signed-in or role-specific pages.
- `frontend/src/pages/` contains the visible screens: public pages, login, requests, dashboards, admin, and provider workspaces.
- `frontend/src/layouts/` contains the public website shell and the signed-in app shell.
- `frontend/src/components/` holds shared UI pieces such as buttons, form fields, loaders, and avatars.
- `frontend/src/context/` shares sign-in, language, notifications, and live socket state between screens.
- `frontend/src/services/api.js` sends browser requests to the API and resolves uploaded image URLs.
- `frontend/public/sw.js` handles service-worker installation and push-notification clicks.
- `backend/server.js` starts Express and Socket.IO, installs security middleware, and serves the production frontend.
- `backend/routes/index.js` lists the HTTP API endpoints and connects them to their handlers.
- `backend/controllers/` implements requests such as sign-in, job updates, uploads, reviews, and earnings.
- `backend/models/` defines the MongoDB records used by customers, providers, jobs, and messages.
- `backend/middleware/` checks sign-in, permissions, input, and API errors.
- `backend/services/` contains shared job workflow, notification, and real-time business logic.
- `backend/sockets/` handles authenticated chat and online-presence events.
- `backend/config/db.js` connects the API to the `quickfix` MongoDB database.
- `render.yaml` describes the Render API service and the static frontend deployment.

### Request flow

```text
React screen → frontend/src/services/api.js → Express route → controller → MongoDB
React sign-in → Socket.IO client → backend/sockets/ → live chat and notifications
```

## Commands

Run these from the project root in the VS Code terminal.

```powershell
# One-time setup: create the local settings file, then install packages.
Copy-Item .env.example .env
npm install

# Start the API and Vite website together for local work.
npm run dev

# Make a production frontend build.
npm run build

# Start the API (production hosting serves frontend/dist from this process).
npm start

# Add local demonstration accounts and sample jobs. Do not run against production data.
npm run seed

# Create web-push keys for local development; keep the private key secret.
npm run setup:vapid

# Check the project's consistent spacing and indentation.
npm run format
npm run format:check
```

Local website: <http://localhost:5173>  
Local API: <http://localhost:5000>  
Health check: <http://localhost:5000/api/health>

Use Node.js 20 or newer and start local MongoDB before using pages that load data. Keep `.env` out of Git. `npm run dev` is for local development; Render uses the `render.yaml` deployment setup.