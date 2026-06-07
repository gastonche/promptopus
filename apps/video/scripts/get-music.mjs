import { existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Background track for the teaser.
// "Cinematic Action Percussion Trailer" by Gregor Quendel — CC-BY 4.0.
// Source: https://opengameart.org/content/cinematic-trailer-music-collection
// Credit: https://www.gregorquendel.com
const URL =
  'https://opengameart.org/sites/default/files/gregor_quendel_-_cinematic_trailer_music_-_03_-_cinematic_action_percussion_trailer.mp3';

const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'music.mp3');

if (existsSync(out)) {
  console.log('music.mp3 already present — skipping download');
  process.exit(0);
}

const res = await fetch(URL, { headers: { 'user-agent': 'Mozilla/5.0' } });
if (!res.ok) {
  console.error(`download failed: HTTP ${res.status}`);
  process.exit(1);
}
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(out, buf);
console.log(`wrote ${out} (${(buf.length / 1e6).toFixed(1)} MB) — CC-BY Gregor Quendel`);
