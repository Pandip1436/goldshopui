# Iniya Jewellers — storefront and admin

React 19 + Vite + Tailwind storefront and admin panel for the Iniya Jewellers online store. The API lives
in its own repository (`goldshop`) and runs separately (Render / Cloud Run).

On Cloudflare Pages, `functions/[[path]].ts` forwards `/api/*`, `/uploads/*`, `/sitemap.xml` and
`/robots.txt` to the API and adds each page's SEO tags, so the site and the API share one domain
(sign-in cookies and the CSRF check depend on that). The browser code has no build-time settings.

## Deploy on Cloudflare Pages

**From GitHub:** Workers & Pages → Create → Pages → Connect to Git → this repository.

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(leave empty)* |
| Variables and secrets | `API_ORIGIN` = the API's address (e.g. `https://goldshop-5nm6.onrender.com`), `PROXY_SECRET` (secret) = the API's `PROXY_SECRET` |

Node 22 comes from `.node-version`. `functions/` is picked up automatically. After the first deploy, set the
API's `PUBLIC_URL` to this site's address (`https://<project>.pages.dev` or your own domain).

**From this computer:**

```bash
npm ci
npm run build
npx wrangler pages deploy dist --project-name <project> --branch main
```

## Local development

Inside the full project (`D:\Gold Shop`) use `npm run dev` at the project root. Vite forwards `/api` to
`API_URL` from `.env` (default `http://localhost:4000`). To try the Pages function, copy
`.dev.vars.example` to `.dev.vars`, then run `npm run build` and `npx wrangler pages dev dist`.

## `shared/` is a copy

`shared/` is the code shared with the API (validation, rupee and PIN helpers, types). It is copied from
`../shared` by `scripts/sync-shared.mjs` before every build inside the full project. **Edit `../shared`,
never this copy.** Commit the refreshed copy together with your changes.
