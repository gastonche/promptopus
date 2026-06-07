import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Original, royalty-free (CC0) background bed for the Promptopus teaser.
// Clean A-minor progression, 120 BPM, soft 4-on-floor — synthesized PCM, no deps.

const SR = 44100;
const DUR = 35.0;
const N = Math.floor(SR * DUR);
const BEAT = 0.5; // 120 BPM
const BAR = BEAT * 4; // 2s

const NOTE = {
  A2: 110.0,
  F2: 87.31,
  C3: 130.81,
  G2: 98.0,
  C4: 261.63,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
};

// vi–IV–I–V in C major (uplifting), one chord per 2s bar.
const PROG = [
  { bass: NOTE.A2, triad: [NOTE.A4, NOTE.C5, NOTE.E5] },
  { bass: NOTE.F2, triad: [NOTE.F4, NOTE.A4, NOTE.C5] },
  { bass: NOTE.C3, triad: [NOTE.C4, NOTE.E4, NOTE.G4] },
  { bass: NOTE.G2, triad: [NOTE.G4, NOTE.B4, NOTE.D5] },
];

const TAU = Math.PI * 2;
const tri = (p) => 2 * Math.abs(2 * (p / TAU - Math.floor(p / TAU + 0.5))) - 1;
const sine = (p) => Math.sin(p);

function adsr(t, dur, a, r) {
  if (t < 0 || t > dur) return 0;
  if (t < a) return t / a;
  if (t > dur - r) return Math.max(0, (dur - t) / r);
  return 1;
}

const buf = new Float32Array(N);

for (let i = 0; i < N; i++) {
  const t = i / SR;
  const barIdx = Math.floor(t / BAR) % PROG.length;
  const chord = PROG[barIdx];
  const tInBar = t % BAR;
  let s = 0;

  // Pad: sustained triad, soft, slightly detuned — present the whole time.
  for (const f of chord.triad) {
    s += 0.045 * sine(TAU * f * t);
    s += 0.03 * sine(TAU * f * 1.005 * t);
  }
  s *= 0.5 + 0.5 * Math.min(1, t / 1.5); // slow swell in

  // Sub bass root, gentle pulse on each beat.
  const beatPhase = (t % BEAT) / BEAT;
  const bassEnv = Math.exp(-beatPhase * 2.2);
  s += 0.16 * bassEnv * sine(TAU * chord.bass * t);

  // Arp + kick enter at 4s (under/after the hook).
  if (t >= 4.0) {
    const intensity = Math.min(1, (t - 4.0) / 8.0);

    // Arp: 16th-note triangle plucks ascending through the triad.
    const step = Math.floor(tInBar / 0.125);
    const tInStep = tInBar - step * 0.125;
    const note = chord.triad[step % 3] * (step >= 8 ? 2 : 1);
    const arpEnv = adsr(tInStep, 0.125, 0.006, 0.05) * Math.exp(-tInStep * 6);
    s += 0.075 * intensity * arpEnv * tri(TAU * note * t);

    // Soft kick on every beat (4-on-floor), pitch drop.
    const kp = t % BEAT;
    if (kp < 0.14) {
      const pitch = 48 + 70 * Math.exp(-kp * 40);
      const kEnv = Math.exp(-kp * 26);
      s += 0.26 * intensity * kEnv * sine(TAU * pitch * kp);
    }
  }

  // Riser before the CTA (~28.5s–30s).
  if (t > 28.5 && t < 30.2) {
    const rp = (t - 28.5) / 1.7;
    const noise = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    s += 0.06 * rp * rp * (noise - Math.floor(noise) - 0.5) * 2;
  }

  buf[i] = s;
}

// Master: soft-limit, normalize to ~-3dB, fade in/out.
let peak = 0;
for (let i = 0; i < N; i++) {
  buf[i] = Math.tanh(buf[i] * 1.1);
  if (Math.abs(buf[i]) > peak) peak = Math.abs(buf[i]);
}
const norm = 0.71 / (peak || 1);
const fadeIn = 0.3 * SR;
const fadeOut = 1.6 * SR;
for (let i = 0; i < N; i++) {
  let g = norm;
  if (i < fadeIn) g *= i / fadeIn;
  if (i > N - fadeOut) g *= (N - i) / fadeOut;
  buf[i] *= g;
}

// Write 16-bit mono WAV.
const bytes = Buffer.alloc(44 + N * 2);
bytes.write('RIFF', 0);
bytes.writeUInt32LE(36 + N * 2, 4);
bytes.write('WAVE', 8);
bytes.write('fmt ', 12);
bytes.writeUInt32LE(16, 16);
bytes.writeUInt16LE(1, 20);
bytes.writeUInt16LE(1, 22);
bytes.writeUInt32LE(SR, 24);
bytes.writeUInt32LE(SR * 2, 28);
bytes.writeUInt16LE(2, 32);
bytes.writeUInt16LE(16, 34);
bytes.write('data', 36);
bytes.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) {
  bytes.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(buf[i] * 32767))), 44 + i * 2);
}

const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'music.wav');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, bytes);
console.log(`wrote ${out} (${(bytes.length / 1e6).toFixed(1)} MB, ${DUR}s)`);
