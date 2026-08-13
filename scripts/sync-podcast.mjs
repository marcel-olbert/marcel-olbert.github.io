// Sync new "Prof of Concept" episodes into src/data/podcast.yaml.
//
// Run it with:  npm run sync:podcast        (add --dry-run to preview only)
// It also runs weekly on GitHub Actions (.github/workflows/sync-podcast.yml).
//
// Three public feeds, no API keys, no scraping:
//   1. anchor.fm RSS       -> title, publication date, Spotify episode link
//   2. iTunes lookup API   -> Apple Podcasts episode link
//   3. YouTube playlist XML-> YouTube video link
//
// The script only ADDS episodes it has never seen. Existing entries and every
// hand-written field in podcast.yaml (description, blurb, links, comments) are
// left byte-for-byte untouched, so anything Marcel edits by hand survives.
//
// Episodes are keyed by their Spotify URL, which is stable per episode.
// YouTube titles are edited for the platform and often differ from the podcast
// title, so those are matched by word overlap; when no match is confident
// enough the episode is still added with `youtube: null` and the script says so.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const YAML_PATH = join(ROOT, 'src/data/podcast.yaml');

const RSS_URL = 'https://anchor.fm/s/1133e62b4/podcast/rss';
const APPLE_ID = '6786339773';
const YOUTUBE_PLAYLIST = 'PLEioR_KrWcyNpHjVtMAMAIgCH64fFEvXE';

// A YouTube video is accepted as an episode's video when it shares at least
// this share of words with the podcast title, and beats the runner-up clearly.
const MATCH_FLOOR = 0.6;
const MATCH_MARGIN = 0.15;

// --- tiny helpers -----------------------------------------------------------

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'marcelolbert.com podcast sync' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decodeEntities(m[1]) : null;
}

// "Thu, 13 Aug 2026 09:00:00 GMT" -> "2026-08-13" (UTC, matching the feed)
function isoDate(pubDate) {
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

// Words used for fuzzy title matching: lowercase, umlauts folded, punctuation
// dropped, and the "| Prof of Concept # 7" / "Folge 5" suffix removed.
function words(title) {
  return title
    .toLowerCase()
    .replace(/\|?\s*prof of concept\s*(#|folge)?\s*\d*\s*$/i, '')
    .replace(/[äàáâ]/g, 'a').replace(/[öòóô]/g, 'o').replace(/[üùúû]/g, 'u')
    .replace(/[éèêë]/g, 'e').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean);
}

// Share of the shorter title's words that also appear in the longer one.
function overlap(a, b) {
  const A = new Set(words(a));
  const B = new Set(words(b));
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / Math.min(A.size, B.size);
}

function yamlString(s) {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

// --- the three feeds --------------------------------------------------------

async function fetchEpisodes() {
  const xml = await fetchText(RSS_URL);
  return xml
    .split('<item>')
    .slice(1)
    .map((item) => ({
      title: tag(item, 'title'),
      date: isoDate(tag(item, 'pubDate')),
      spotify: tag(item, 'link'),
    }))
    .filter((e) => e.title && e.date && e.spotify);
}

async function fetchAppleLinks() {
  const url = `https://itunes.apple.com/lookup?id=${APPLE_ID}&entity=podcastEpisode&limit=100`;
  const data = JSON.parse(await fetchText(url));
  const byTitle = new Map();
  for (const r of data.results ?? []) {
    if (r.wrapperType !== 'podcastEpisode' || !r.trackViewUrl) continue;
    // Apple hands back a /us/ storefront URL with tracking; the audience is
    // German, so point at /de/ and drop the &uo= parameter.
    const url = r.trackViewUrl.replace('/us/podcast/', '/de/podcast/').replace(/&uo=\d+/, '');
    byTitle.set(r.trackName.trim(), url);
  }
  return byTitle;
}

async function fetchYoutubeVideos() {
  const xml = await fetchText(
    `https://www.youtube.com/feeds/videos.xml?playlist_id=${YOUTUBE_PLAYLIST}`
  );
  return xml
    .split('<entry>')
    .slice(1)
    .map((entry) => ({
      id: tag(entry, 'yt:videoId'),
      title: tag(entry, 'title'),
      used: false,
    }))
    .filter((v) => v.id && v.title);
}

function matchYoutube(episodeTitle, videos) {
  const scored = videos
    .filter((v) => !v.used)
    .map((v) => ({ video: v, score: overlap(episodeTitle, v.title) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const runnerUp = scored[1];
  if (!best || best.score < MATCH_FLOOR) return null;
  if (runnerUp && best.score - runnerUp.score < MATCH_MARGIN) return null;

  best.video.used = true;
  return best.video;
}

// --- writing back into the YAML --------------------------------------------

function renderEpisode(e) {
  const line = (key, value) => `    ${key}: ${value ?? 'null'}\n`;
  return (
    `  - title: ${yamlString(e.title)}\n` +
    line('date', e.date) +
    line('youtube', e.youtube) +
    line('spotify', e.spotify) +
    line('apple', e.apple)
  );
}

function insertEpisodes(yaml, episodes) {
  const anchor = yaml.match(/^episodes:.*$/m);
  if (!anchor) throw new Error('Could not find the `episodes:` key in podcast.yaml');
  const at = anchor.index + anchor[0].length + 1; // just after the newline
  return yaml.slice(0, at) + episodes.map(renderEpisode).join('') + yaml.slice(at);
}

// --- main -------------------------------------------------------------------

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const [episodes, appleLinks, videos] = await Promise.all([
    fetchEpisodes(),
    fetchAppleLinks().catch((err) => {
      console.warn(`! Apple lookup failed (${err.message}) — apple links will be null`);
      return new Map();
    }),
    fetchYoutubeVideos().catch((err) => {
      console.warn(`! YouTube feed failed (${err.message}) — youtube links will be null`);
      return [];
    }),
  ]);
  console.log(`Feed: ${episodes.length} episodes, ${videos.length} YouTube videos.`);

  const yaml = readFileSync(YAML_PATH, 'utf8');
  const known = new Set([...yaml.matchAll(/^\s*spotify:\s*(\S+)$/gm)].map((m) => m[1]));

  // Oldest first while matching, so YouTube videos get claimed in feed order.
  const fresh = episodes.filter((e) => !known.has(e.spotify)).reverse();
  if (fresh.length === 0) {
    console.log('No new episodes — podcast.yaml is up to date.');
    return;
  }

  // Videos already referenced in the YAML belong to existing episodes.
  for (const v of videos) if (yaml.includes(v.id)) v.used = true;

  const incomplete = [];
  for (const e of fresh) {
    e.apple = appleLinks.get(e.title) ?? null;
    const video = matchYoutube(e.title, videos);
    e.youtube = video ? `https://www.youtube.com/watch?v=${video.id}` : null;

    console.log(`+ ${e.date}  ${e.title}`);
    if (!e.apple) incomplete.push(`${e.title} — no Apple Podcasts link`);
    if (!e.youtube) incomplete.push(`${e.title} — no confident YouTube match`);
  }

  if (dryRun) {
    console.log('\n--dry-run: nothing written. Would add:\n');
    console.log(fresh.slice().reverse().map(renderEpisode).join(''));
  } else {
    writeFileSync(YAML_PATH, insertEpisodes(yaml, fresh.slice().reverse()));
    console.log(`\nWrote ${fresh.length} new episode(s) to src/data/podcast.yaml.`);
  }

  if (incomplete.length) {
    console.log('\nNeeds a manual look (entry added with null, page hides the link):');
    for (const note of incomplete) console.log(`  - ${note}`);
  }
}

main().catch((err) => {
  console.error(`sync-podcast failed: ${err.message}`);
  process.exit(1);
});
