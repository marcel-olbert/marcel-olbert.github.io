# marcelolbert.com — personal academic website of Prof. Marcel Olbert

Relaunch of Marcel's personal site (previously WordPress at https://marcelolbert.com/, still
live there until DNS cutover). Goal: generate leads for public speaking and policy advice,
and raise Marcel's and University of Mannheim's international visibility. Built July 2026
with Claude Code; full original plan in `~/.claude/plans/you-know-i-am-shiny-whisper.md`.

Marcel is Professor of Taxation, Accounting, and Finance at University of Mannheim
(formerly London Business School). Strong in Stata, comfortable in R, basic Python —
explain web-stack things briefly when they matter; don't assume JS/Astro knowledge.

**Day-to-day maintenance recipes live in `WORKFLOWS.md`** (new episode, new paper, news,
CV, photos, housekeeping) — written for Marcel; keep it in sync when workflows change.

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
| `podcast.yaml` | Prof of Concept podcast (show info, platform links, episodes) | New episodes on TOP of `episodes` — homepage auto-features `episodes[0]` |
| `teaching.yaml` | Teaching page (intro, materials) | PLACEHOLDER — Marcel adds courses/materials over time; never invent course details |
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
Unused so far: 3 more COBRA-launch event photos in that folder.
**Prof of Concept podcast (built July 2026):** own page `/podcast/` (in nav) + homepage
band featuring the latest episode + news item. Data in `podcast.yaml` — show description
verbatim from official RSS feed (anchor.fm/s/1133e62b4/podcast/rss); co-hosts Niklas
Schwab (@hedgefonds.henning) & Christoph Wieland; Spotify/Apple/YouTube links verified.
To feature a new episode: add it at the top of `episodes` in `podcast.yaml`.

**Off-site SEO actions for Marcel (July 2026 — site side is done: robots.txt, sitemap,
JSON-LD Person + PodcastSeries, per-page OG images):** after domain cutover, add
marcelolbert.com to: LinkedIn profile (contact info + featured section), podcast
descriptions on Spotify/YouTube/Apple, SSRN profile, university faculty page, Google
Scholar profile (also give Claude the Scholar URL for the `googleScholarUrl` slot in
site.yaml). Announce relaunch in a LinkedIn post. Backlinks from these profiles are the
main visibility lever besides the domain itself.

**Build tasks remaining:**
- Analytics: GoatCounter is WIRED (Base.astro, off while `goatcounter: null` in site.yaml).
  Waiting on Marcel to sign up at goatcounter.com and supply his code; when activating,
  ALSO add a GoatCounter section to the Datenschutzerklärung (no cookies, no personal
  data, but disclosure required).
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

**LAUNCHED July 6, 2026** 🎉 — marcelolbert.com serves the new site from GitHub Pages.
Site config, GitHub custom domain, and DNS (A records + www CNAME at WordPress.com;
MX records for Google mail kept untouched) all done. Verified: homepage, podcast page,
www→apex redirect, old-WordPress-URL redirects.

**Post-launch remaining:**
1. HTTPS enforcement — watcher enables it once GitHub issues the cert; VERIFY it is on
   (`gh api repos/marcel-olbert/marcel-olbert.github.io/pages` → https_enforced: true).
2. Marcel: export full WordPress backup, THEN cancel WordPress hosting plan — domain
   registration must survive as its own paid item (see domain caution above).
3. DONE (July 7, 2026): Google Search Console verified, sitemap submitted by Marcel.
4. Marcel's off-site SEO list (see above) + LinkedIn relaunch announcement.
5. Nice-to-have: Lighthouse pass, full link check, dedicated OG card image.
NOTE: Marcel has Google-hosted email on the domain (MX aspmx.l.google.com) — a
@marcelolbert.com address may exist as a nicer public contact; ask before using.
