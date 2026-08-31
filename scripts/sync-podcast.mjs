// Sync "Prof of Concept" episodes into src/data/podcast.yaml.
//
// Run it with:  npm run sync:podcast        (add --dry-run to preview only)
// It also runs three times a week on GitHub Actions
// (.github/workflows/sync-podcast.yml).
//
// Three public feeds, no API keys, no scraping:
//   1. anchor.fm RSS        -> title, publication date, Spotify episode link
//   2. iTunes lookup API    -> Apple Podcasts episode link
//   3. YouTube playlist XML -> YouTube video link
//
// Each run does two things:
//   ADD      episodes that are not in the file yet, newest on top.
//   BACKFILL platform links that are still `null` on episodes already in the
//            file. YouTube usually publishes a day or two after the audio
//            feed, so an episode often arrives without its video; the next run
//            fills it in once the video appears.
//
// Nothing else is ever touched: existing links, hand-edited titles, the show
// description, blurb, comments and formatting all survive byte-for-byte. The
// only lines this script ever rewrites are `youtube: null` / `apple: null`.
//
// Episodes are keyed by their Spotify URL, which is stable per episode.
// YouTube titles are edited for the platform and often differ from the podcast
// title (episode 8 is "Milliardenschaden…" in the feed but "Deutschland
// beklaut…" on YouTube), so those are matched by word overlap. When no match
// is confident enough the link stays `null` rather than being guessed, the
// page hides it, and a later run tries again.

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

function unquote(s) {
  const v = s.trim();
  if (!v.startsWith('"') || !v.endsWith('"')) return v;
  return v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
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
  return `https://www.youtube.com/watch?v=${best.video.id}`;
}

// --- reading and writing the YAML ------------------------------------------

// Everything below the `episodes:` key is the episode list; the text before it
// (description, blurb, links, comments) is never parsed and never rewritten.
function splitYaml(yaml) {
  const key = yaml.match(/^episodes:.*$/m);
  if (!key) throw new Error('Could not find the `episodes:` key in podcast.yaml');
  const from = key.index + key[0].length + 1;

  // The list runs until a line starts in column 0 again (another top-level key).
  let offset = 0;
  for (const line of yaml.slice(from).split('\n')) {
    if (line.trim() !== '' && !/^\s/.test(line)) break;
    offset += line.length + 1;
  }
  const to = Math.min(from + offset, yaml.length);
  return { head: yaml.slice(0, from), list: yaml.slice(from, to), tail: yaml.slice(to) };
}

function readField(raw, name) {
  const m = raw.match(new RegExp(`^\\s*${name}:[ \\t]*(.*)$`, 'm'));
  if (!m) return null;
  const value = m[1].trim();
  return value === 'null' || value === '' ? null : value;
}

// Replaces `youtube: null` with a real URL, leaving the rest of the entry alone.
function fillField(raw, name, value) {
  return raw.replace(new RegExp(`^([ \\t]*${name}:[ \\t]*)null[ \\t]*$`, 'm'), `$1${value}`);
}

function parseEntries(list) {
  return list
    .split(/(?=^ {2}- )/m)
    .filter((raw) => raw.trim() !== '')
    .map((raw) => ({
      raw,
      title: unquote((raw.match(/^ {2}- title:[ \t]*(.*)$/m) ?? ['', ''])[1]),
      date: readField(raw, 'date') ?? '',
      spotify: readField(raw, 'spotify'),
      youtube: readField(raw, 'youtube'),
      apple: readField(raw, 'apple'),
    }));
}

function renderEntry(e) {
  const line = (key, value) => `    ${key}: ${value ?? 'null'}\n`;
  return (
    `  - title: ${yamlString(e.title)}\n` +
    line('date', e.date) +
    line('youtube', e.youtube) +
    line('spotify', e.spotify) +
    line('apple', e.apple)
  );
}

// --- main -------------------------------------------------------------------

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const [feedEpisodes, appleLinks, videos] = await Promise.all([
    fetchEpisodes(),
    fetchAppleLinks().catch((err) => {
      console.warn(`! Apple lookup failed (${err.message}) — apple links left as they are`);
      return new Map();
    }),
    fetchYoutubeVideos().catch((err) => {
      console.warn(`! YouTube feed failed (${err.message}) — youtube links left as they are`);
      return [];
    }),
  ]);
  console.log(`Feed: ${feedEpisodes.length} episodes, ${videos.length} YouTube videos.`);

  const yaml = readFileSync(YAML_PATH, 'utf8');
  const { head, list, tail } = splitYaml(yaml);
  const existing = parseEntries(list);

  // A video already referenced in the file belongs to that episode.
  for (const v of videos) if (list.includes(v.id)) v.used = true;

  const known = new Set(existing.map((e) => e.spotify));
  const fresh = feedEpisodes.filter((e) => !known.has(e.spotify));

  // Claim videos oldest first, so an older episode still missing its link gets
  // first refusal before a newly published one.
  const needLinks = [
    ...existing.filter((e) => !e.youtube || !e.apple),
    ...fresh,
  ].sort((a, b) => a.date.localeCompare(b.date));

  const added = [];
  const backfilled = [];
  const stillMissing = [];

  for (const e of needLinks) {
    const isNew = !known.has(e.spotify);
    const found = {
      youtube: e.youtube ?? matchYoutube(e.title, videos),
      apple: e.apple ?? appleLinks.get(e.title) ?? null,
    };

    if (isNew) {
      Object.assign(e, found);
      added.push(e);
    } else {
      // Only rewrite the `null` lines; the entry is otherwise left as it is.
      for (const name of ['youtube', 'apple']) {
        if (!e[name] && found[name]) {
          e.raw = fillField(e.raw, name, found[name]);
          e[name] = found[name];
          backfilled.push(`${e.title} — ${name}`);
        }
      }
    }

    for (const name of ['youtube', 'apple']) {
      if (!e[name]) stillMissing.push(`${e.date}  ${e.title} — no ${name} link yet`);
    }
  }

  for (const e of added) console.log(`+ new     ${e.date}  ${e.title}`);
  for (const note of backfilled) console.log(`+ link    ${note}`);

  if (added.length === 0 && backfilled.length === 0) {
    console.log('Nothing to do — podcast.yaml is up to date.');
  } else if (dryRun) {
    console.log('\n--dry-run: nothing written.');
  } else {
    const rebuilt =
      head + added.map(renderEntry).reverse().join('') + existing.map((e) => e.raw).join('') + tail;
    writeFileSync(YAML_PATH, rebuilt);
    console.log(
      `\nWrote ${added.length} new episode(s) and ${backfilled.length} recovered link(s).`
    );
  }

  if (stillMissing.length) {
    console.log('\nStill missing (page hides the link; a later run will retry):');
    for (const note of stillMissing) console.log(`  - ${note}`);
  }
}

main().catch((err) => {
  console.error(`sync-podcast failed: ${err.message}`);
  process.exit(1);
});
