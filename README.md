# Breakpoint Social frontend

React + Vite frontend for the local WordPress site. WordPress remains the content backend; the Field Notes section reads published posts through the REST API.

## Run locally

Install dependencies once, then use the workspace launcher to start WordPress and React together:

```powershell
cd frontend
npm install
cd ..
.\tools\start-breakpoint-social.ps1
```

Open <http://localhost:5173> for the React frontend. WordPress and its admin remain at <http://localhost:8887>. The Vite development server proxies `/wp-api/*` to the WordPress REST query route.

Stop the local stack with `tools/stop-breakpoint-social.ps1`. MySQL is shared by Laragon, so stopping it also takes other database-backed Laragon sites offline.

Use `npm run build` to create the production bundle in `frontend/dist`. A deployed frontend needs a WordPress REST API URL and an appropriate same-origin or CORS setup.
