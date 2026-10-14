# Breakpoint Social — frontend

The public website. React + Vite, prerendered to static HTML, deployed on Vercel.

WordPress is the content store and lives on a separate host. It renders no public
HTML: this app reads everything from its `bps/v1` REST API, and the WordPress
front end redirects visitors here.

---

## Configuration

Two variables. On Vercel they are **Environment Variables**; locally they go in
`frontend/.env`, which is gitignored.

| Name | What it is |
|---|---|
| `VITE_API_BASE` | The API root the **browser** calls. Must be reachable by visitors, so never a localhost URL in production. |
| `SITE_URL` | The public address of this site. Used for canonical tags, `og:url` and `sitemap.xml`. No trailing slash. |

`VITE_API_BASE` has to match the permalink style on the WordPress host:

```
pretty permalinks on    https://example.com/wp-json/
pretty permalinks off   https://example.com/index.php?rest_route=
```

Both forms work; the code detects which one it was given. There is no default:
a missing value fails the build rather than quietly pointing at a developer's
machine.

---

## Local development

```bash
npm install
npm run dev          # http://127.0.0.1:5173
```

Needs WordPress running. From the project root:

```powershell
..\tools\start-breakpoint-social.ps1
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Client bundle plus the SSR bundle used by the prerender |
| `npm run build:static` | `build`, then prerender every route to HTML |
| `npm run build:release` | Validates the configuration, then `build:static` |
| `npm run check:env` | Validates the configuration on its own |

---

## How the build works

1. `vite build` produces the client bundle.
2. `vite build --ssr` produces a server bundle sharing the same module graph, so
   the static HTML and the hydrated page can never drift apart.
3. `prerender.js` reads `/bps/v1/snapshot` once and writes one HTML file per
   route, with per-page canonical, Open Graph and JSON-LD tags, plus
   `sitemap.xml` and `robots.txt`.

The snapshot is inlined into each page, so a visitor's first paint needs no
network call and a crawler sees the full content rather than an empty root.

**The build reads live content, so WordPress must be up when it runs.** If the
API is unreachable the build fails with a checklist instead of shipping an empty
shell, which is the exact outcome prerendering exists to prevent.

---

## Deploying

Vercel builds from source on every push to `main`. `vercel.json` already sets the
build command, output directory and headers, so the only setup is the two
environment variables above.

Build output is **not** committed. Vercel generates it.

Order matters for the first deploy: host WordPress, activate the Headless CMS
plugin, publish at least one page, then deploy.

Full detail, including the WordPress side, is in `Documents/DEPLOY-RUNBOOK.md`
in the parent project.

---

## Editing content

Nothing on this site is edited here. Every page, section, service, case study,
testimonial and post is managed in **Headless CMS** inside wp-admin. After a
content change, redeploy so the static HTML is regenerated — content reaches the
API immediately, but the prerendered pages only update on a build.
