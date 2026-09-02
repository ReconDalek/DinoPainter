# Cloudflare Pages + community gallery setup

The static site is served from the repo root. The community-designs API lives in
`functions/` (Cloudflare Pages Functions) and stores data in a D1 database.

Everything below is a one-time setup. After it's done, deploys happen automatically
on `git push` to `main`.

## 1. Create the Pages project

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → pick `ReconDalek/DinoPainter`.
2. Build settings:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `/` (repo root)
3. Deploy. You'll get a `*.pages.dev` URL.

## 2. Point the domain at Pages

DNS is already on Cloudflare, so in the Pages project → **Custom domains** → add
your domain. Cloudflare updates the DNS record automatically. Remove the old
GitHub Pages `CNAME`/records if any remain.

## 3. Create the D1 database

```bash
npm install
npx wrangler login
npx wrangler d1 create dinopainter
```

Copy the printed `database_id` into **`wrangler.toml`** (replace
`REPLACE_WITH_DATABASE_ID`), commit, and push.

Then in the Pages project → **Settings → Bindings → D1 database**:
add a binding named `DB` pointing at the `dinopainter` database (for both
Production and Preview).

Apply the schema to the live database:

```bash
npx wrangler d1 migrations apply dinopainter --remote
```

## 4. Set the secrets

In the Pages project → **Settings → Variables and Secrets** (Production), add:

| Name          | Value                                        |
|---------------|----------------------------------------------|
| `IP_SALT`     | any long random string (salts hashed IPs)    |
| `ADMIN_TOKEN` | any long random string (moderation login)    |

Generate values with `openssl rand -hex 32` or similar. Keep `ADMIN_TOKEN` private.

## 5. Moderate submissions

Go to `https://your-domain/admin.html`, paste the `ADMIN_TOKEN`, and approve or
reject pending designs. Approved designs appear in the gallery and get their own
`/design.html?id=…` page automatically.

`admin.html` is `noindex` and gated by the token. For extra safety you can also
put **Cloudflare Access** (Zero Trust → free for small teams) in front of
`/admin.html` and `/api/admin/*`, gated by your Google login.

## Local development

```bash
cp .dev.vars.example .dev.vars      # then edit the values
npm install
npx wrangler d1 migrations apply dinopainter --local
npm run dev                         # http://localhost:8788
```

## Abuse controls in place

- Submissions are stored as `pending` — nothing is public until approved.
- Server-side validation: creature must exist, 1–6 regions, colour IDs 1–255,
  text fields stripped of HTML and length-capped.
- Rate limit: 8 submissions per hour per hashed IP (raw IP never stored).
- Optional next step: add a Cloudflare **Turnstile** widget to the share modal
  and verify the token in `functions/api/designs/index.js`.

## Files

| Path | Purpose |
|------|---------|
| `wrangler.toml` | Pages + D1 config |
| `_routes.json` | scopes Functions to `/api/*` |
| `.assetsignore` | best-effort: keep config/build files out of static serving (no secrets live in them regardless — secrets are Pages env vars only) |
| `migrations/` | D1 schema |
| `functions/api/` | the API |
| `scripts/gen-dino-keys.mjs` | build step — extracts valid creature keys |
| `data/config.js` | `API_BASE` (empty = same origin) |
| `data/remote-gallery.js` | API client (fails soft) |
| `data/share.js` | "Share to Gallery" modal |
| `admin.html` | moderation UI |
