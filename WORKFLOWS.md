# WORKFLOWS.md — running marcelolbert.com day to day

How to keep the site up to date. Every workflow has two routes:
**(a) tell Claude Code** in plain words (open this folder in VS Code, start a chat), or
**(b) do it yourself** — edit a YAML file in `src/data/`, then commit & push.

**Golden rule:** all content lives in `src/data/*.yaml`. You never touch the page
files for content changes. After any push to `main`, the live site updates
automatically in ~1–2 minutes (GitHub Actions → GitHub Pages).

---

## The basics

| What | How |
|---|---|
| See changes locally before pushing | `npm run dev` in the terminal → http://localhost:4321 |
| Check nothing is broken | `npm run build` (must end with "Complete!") |
| Publish | commit + push to `main`; live at https://marcel-olbert.github.io/ (later marcelolbert.com) |
| Drop-folder for new material | `~/Library/CloudStorage/OneDrive-Personal/Shared/websitecontent/` — put photos, CV versions, logos etc. here and tell Claude to "check the websitecontent folder" |

---

## New podcast episode (Prof of Concept) — **automatic**

**You don't have to do anything.** A GitHub Action runs every Thursday, Friday
and Monday morning, finds new episodes in the official feeds, adds them to
`src/data/podcast.yaml`, and deploys. The homepage always features the top
entry of `episodes` as the latest episode.

Where the three links come from: title, date and the Spotify link come from the
anchor.fm feed, the Apple link from Apple's public lookup API, and the YouTube
link from the playlist feed. YouTube titles are often edited for the platform
(episode 8 is "Milliardenschaden…" in the podcast feed but "Deutschland
beklaut…" on YouTube), so those are matched by word overlap.

- **Want it live now, not Thursday:** GitHub → Actions → "Sync podcast
  episodes" → *Run workflow*. Or locally: `npm run sync:podcast`, then commit.
  `npm run sync:podcast -- --dry-run` shows what it would add without writing.
- **An episode shows up without its YouTube link:** normal. YouTube usually
  publishes a day or two after the audio feed, so the entry arrives with
  `youtube: null` and the page just hides that one link. **Every later run
  retries it** and fills the link in once the video appears — that is what the
  Friday and Monday passes are for. Nothing for you to do.
- It only stays missing if the video is never published, or if its title is so
  different that no match is confident enough. Then paste the URL into the entry
  in `podcast.yaml` by hand, or ask Claude.
- **The script never overwrites** anything already in the file. The only lines
  it ever rewrites are `youtube: null` / `apple: null`; titles, dates and links
  you or Claude edited by hand stay exactly as they are.

Script: `scripts/sync-podcast.mjs`. Schedule: `.github/workflows/sync-podcast.yml`.

## New paper (publication or working paper)

- **Tell Claude:** "Add my new paper" + SSRN/journal link. Claude adds the YAML
  entry (title, coauthors, year, link, abstract **verbatim** from the source),
  optionally a news item, builds and pushes.
- **DIY:** new entry at the TOP of `src/data/publications.yaml` (published) or
  `src/data/working-papers.yaml` (working paper). `selected: true` puts a
  publication on the homepage. Coauthor list without your own name.
- Working paper became a publication? Move the entry from one file to the other
  and add the journal + year.

## News item ("Latest" on the homepage)

- Edit `src/data/news.yaml`: new item on top, date as `YYYY-MM`.
- Keep it to 4–6 items — delete the oldest when adding.

## Media appearance (podcast guest, interview, article, video)

- New entry on top of `src/data/media.yaml`; `type:` is one of
  podcast | video | article | interview. Link out — never embed YouTube
  (GDPR: no third-party requests).

## Speaking engagement / testimonial

- `src/data/speaking.yaml` — engagements under `engagements`, with year.
- Testimonials: supply the quote + who said it (verbatim, with permission);
  Claude adds the section.

## New CV version

- Drop the PDF in the websitecontent folder and tell Claude — or copy it
  yourself to `public/assets/cv-marcel-olbert.pdf` (same filename, so all
  links keep working), then commit & push.

## New photos

- Drop high-res originals in the websitecontent folder; tell Claude where they
  should go (homepage, speaking page, an event). Claude resizes to ~1600px
  web versions in `public/assets/` — originals never go into the repo.

## Hosted event / conference

- New entry in `src/data/events.yaml` (title, date, location, description,
  links, optional photos in `public/assets/events/`).

---

## Launch day (domain cutover to marcelolbert.com)

The full technical checklist is in `CLAUDE.md`; short version: tell Claude
"let's launch" — Claude changes the site config and GitHub Pages settings,
you paste four DNS records into WordPress.com
(wordpress.com/domains/manage/marcelolbert.com). Old site stays up until DNS
flips; export a WordPress backup before cancelling the hosting plan, and make
sure the domain registration itself survives (paid until March 2027).

**SEO actions right after launch (Marcel, ~30 minutes, biggest visibility
lever after the domain itself):**
- ~~Google Search Console: verify marcelolbert.com, submit the sitemap.~~ DONE July 2026.
- Add marcelolbert.com to: LinkedIn profile (contact info + Featured section),
  podcast descriptions on Spotify / YouTube / Apple, SSRN profile,
  Mannheim faculty page, Google Scholar profile.
- Announce the relaunch (site + podcast page) in a LinkedIn post — wait for
  the real domain so the link is permanent.

The site side is already done: robots.txt, sitemap, structured data
(Person + PodcastSeries), per-page share images, self-hosted fonts, redirects
from all old WordPress URLs.

## Housekeeping (occasionally)

- **Prune news:** keep the "Latest" list at 4–6 items.
- **Check links:** external links (esp. old OneDrive/Dropbox links in
  `data-code.yaml` and `events.yaml`) rot over time. Ask Claude to "run a link
  check" now and then; consider self-hosting important files in `public/assets/`.
- **media.yaml dates:** many are still `null` — fill in as you remember them.
- **Domain / launch:** all facts and the step-by-step cutover plan are in
  `CLAUDE.md` (section "Domain facts" + "Launch checklist"). Domain is
  registered at WordPress.com, paid until March 2027.
- **After launch:** renewal reminder — the domain registration at WordPress.com
  must survive the hosting-plan cancellation (details in CLAUDE.md).

## Hard rules (also enforced by Claude)

- Never invent facts — dates, titles, quotes. Abstracts verbatim from source.
- No third-party embeds (fonts self-hosted, no YouTube iframes, no Google Fonts).
- Content edits = YAML edits. Design lives in `src/styles/global.css`.
