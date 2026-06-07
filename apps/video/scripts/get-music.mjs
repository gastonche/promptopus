import { existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Background tracks for the videos — both by Gregor Quendel, CC-BY 4.0.
// Source: https://opengameart.org/content/cinematic-trailer-music-collection
// Credit: https://www.gregorquendel.com
const TRACKS = [
  {
    file: 'music.mp3', // Speedrun teaser
    url: 'https://opengameart.org/sites/default/files/gregor_quendel_-_cinematic_trailer_music_-_03_-_cinematic_action_percussion_trailer.mp3',
  },
  {
    file: 'music-pitch.mp3', // cinematic Pitch film
    url: 'https://opengameart.org/sites/default/files/gregor_quendel_-_cinematic_trailer_music_-_02_-_cinematic_orchestral_action_trailer_0.mp3',
  },
];

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');

for (const { file, url } of TRACKS) {
  const out = resolve(publicDir, file);
  if (existsSync(out)) {
    console.log(`${file} already present — skipping`);
    continue;
  }
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) {
    console.error(`download failed for ${file}: HTTP ${res.status}`);
    process.exit(1);
  }
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  console.log(`wrote ${file} — CC-BY Gregor Quendel`);
}
