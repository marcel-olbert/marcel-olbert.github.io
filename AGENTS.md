# marcelolbert.com — personal academic website of Prof. Marcel Olbert

Relaunch of Marcel's personal site (previously WordPress at https://marcelolbert.com/, still
live there until DNS cutover). Goal: generate leads for public speaking and policy advice,
and raise Marcel's and University of Mannheim's international visibility. Built July 2026
with Claude Code; full original plan in `~/.claude/plans/you-know-i-am-shiny-whisper.md`.

Marcel is Professor of Taxation, Accounting, and Finance at University of Mannheim
(formerly London Business School). Strong in Stata, comfortable in R, basic Python —
explain web-stack things briefly when they matter; don't assume JS/Astro knowledge.

## Stack & operations

- **Astro** static site, content lives in `src/data/*.yaml` — content edits are YAML edits,
  never hardcode content into pages.
- **Deploy**: `git push` to `main` → GitHub Actions (`.github/workflows/deploy.yml`, Node 24)
  → GitHub Pages. Live preview: **https://marcel-olbert.github.io/** (~1–2 min after push).
- Repo: `marcel-olbert/marcel-olbert.github.io` (public). gh CLI authenticated as `marcel-olbert`.
- Node 24 + npm installed user-space at `~/.local/bin` (PATH set in `~/.zshrc`); no Homebrew.
- Local preview: `npm run dev` → localhost:4321. Build check: `npm run build`.
- Old WordPress URLs redirect via `redirects` in `astro.config.mjs`
  (`/media-and-insights/`→`/media/`, `/hosted-events/`→`/events/`, `/data-and-code/` and
  `/blog-resources/`→`/data/`).

## Content model (`src/data/`)

| File | What | Convention |
|---|---|---|
| `site.yaml` | Name, tagline, email, photo, CV/SSRN links, roles, grants | Global settings |
| `publications.yaml` | Published papers | New entries on top; `selected: true` → homepage |
| `working-papers.yaml` | Working papers | New entries on top |
| `work-in-progress.yaml` | Projects without public draft | |
| `news.yaml` | Homepage "Latest" | date `YYYY-MM`, keep 4–6 items, prune old |
| `media.yaml` | Podcasts/videos/articles/interviews | type: podcast\|video\|article\|interview |
| `speaking.yaml` | Speaking & Policy page (topics, formats, engagements) | DRAFT — needs Marcel's voice |
| `events.yaml` | Hosted conferences (historical, LBS era) | |
| `data-code.yaml` | Datasets & code resources | |

"Add my new paper" workflow: add YAML entry (title, coauthors list w/o Marcel, journal,
year, link, abstract verbatim from source), optionally a `news.yaml` item, build, push.

## Hard rules

- **Never invent facts** — no guessed dates, quotes, titles, or abstract paraphrases.
  Abstracts verbatim from publisher/SSRN. Uncertain items get `# TODO(Marcel)` comments.
- Fonts are **self-hosted** (fontsource) — do NOT add Google Fonts or other third-party
  requests (GDPR; German audience). No YouTube iframes — link out instead.
- Design tokens in `src/styles/global.css` (Fraunces display serif + Inter, accent #1a4e8a,
  warm off-white bg). Keep the editorial, restrained look; no template-y clutter.
- Coauthor name spelling: "Roberto Gomez-Cram" (hyphenated).
- marcelolbert.com (WordPress) stays untouched until launch cutover.

## Current status (July 2026)

DONE: scaffold, deploy pipeline, full content migration from WordPress (with LBS→Mannheim
wording refresh, typo fixes, stable DOI links), all 6 pages built (Home, Research,
Speaking & Policy, Media, Events, Data & Code), 14 abstracts merged, sitemap, OG tags,
schema.org Person JSON-LD, old-URL redirects, favicon.

## Open TODOs

**Waiting on Marcel's feedback right now (he has seen the live preview):**
1. Design & feel of the live site — his reactions per page.
2. `speaking.yaml` — topics/wording are Claude's draft from his research profile; Marcel
   must make them his own. Testimonials wanted (he'll supply).
3. `news.yaml` dates — 2026-01 (Mannheim team item) and 2025-09 (Oligarch WP) are guesses.
4. Email RESOLVED (July 2026): marcel.olbert@outlook.com confirmed — this is Marcel's
   personal (non-university) site, so the personal address is intentional.
5. Add LinkedIn / Google Scholar / X links? (`site.yaml` has null slots; old site had none.)
6. Impressum + Datenschutzerklärung pages BUILT (July 2026: `/impressum/`, `/datenschutz/`,
   linked in footer; personal details live in `src/data/legal.yaml`). Marcel must still
   supply his ladungsfähige Anschrift (visible bracketed placeholders on the pages until
   then) and should have the text reviewed — Claude drafted it; it is not legal advice.

**Assets (July 2026): supplied and integrated.** Marcel drops input files in
`/Users/marcel/Library/CloudStorage/OneDrive-Personal/Shared/websitecontent/` — check there
for new material. Done so far: CV self-hosted at `/assets/cv-marcel-olbert.pdf` (source
CV_Olbert_20260624.pdf); outdoor portrait → homepage hero
(`/assets/marcel-olbert-portrait.jpg`); speaking photo (MBS COBRA launch, June 2026) →
Speaking page (`/assets/marcel-olbert-speaking.jpg`). Photos resized to 1600px via `sips`.
Unused so far: 3 more COBRA-launch event photos in that folder; **"Prof of Concept" podcast
logos** — Marcel co-hosts a podcast (3 hosts, Mannheim) with NO entry in media.yaml yet;
need details from Marcel (co-hosts, links, description) before adding — do not invent.

**Build tasks remaining:**
- Analytics: add GoatCounter snippet (free, no cookie banner) once Marcel creates account
  at goatcounter.com — or skip until launch.
- media.yaml: all dates null — fill in as Marcel remembers them.
- Fragile external links: many OneDrive (1drv.ms) / Dropbox links in data-code.yaml and
  events.yaml — consider downloading and self-hosting the files in `public/assets/`.
- OG share image: currently the profile photo; a dedicated card image would be nicer.

**Domain facts (verified via whois/dig, July 2026 — registrar login FOUND, no longer a blocker):**
- marcelolbert.com is registered at **Automattic Inc. (WordPress.com)** — Marcel's existing
  WordPress.com account IS the registrar. DNS manager:
  https://wordpress.com/domains/manage/marcelolbert.com/edit/marcelolbert.com
- Nameservers ns1–ns3.wordpress.com; A records currently point to WordPress hosting
  (192.0.78.24/.25). Registration paid until **2027-03-05** — no urgency, no transfer needed.
- Cutover = edit DNS records in that WordPress.com page (keep their nameservers).
- ⚠️ After cutover: when cancelling the WordPress *hosting plan*, ensure the *domain
  registration* survives as its own paid item (bundled-free domains can lapse on plan
  cancellation). Export full WordPress backup BEFORE cancelling anything.

**Launch checklist (Phase 5 — unblocked, go whenever Marcel says so):**
1. Change `site` in `astro.config.mjs` to `https://marcelolbert.com`.
2. Add custom domain in GitHub Pages settings (`gh api` or repo Settings → Pages);
   creates CNAME. Claude can do steps 1–2 from here.
3. Marcel edits DNS in the WordPress.com page above: replace WordPress A records with
   GitHub Pages A records 185.199.108.153/109/110/111 + www CNAME
   → marcel-olbert.github.io. Then enable HTTPS enforcement in GitHub Pages
   (needs cert provisioning after DNS propagates, minutes to a few hours).
4. Verify live + old-URL redirects, then export WordPress backup and cancel hosting
   (see domain caution above).
5. Google Search Console: verify domain, submit sitemap.
6. Pre-launch: Lighthouse ≥95, link check over dist/, mobile check, OG preview.
