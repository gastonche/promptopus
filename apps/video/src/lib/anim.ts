import { Easing, interpolate, spring } from 'remotion';

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_OUT = Easing.out(Easing.cubic);

export function fadeUp(frame: number, start: number, dur = 15, dist = 40) {
  const opacity = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  const y = interpolate(frame, [start, start + dur], [dist, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  return { opacity, transform: `translateY(${y}px)` };
}

export function fade(frame: number, start: number, dur = 12) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
}

export function fadeOut(frame: number, start: number, dur = 10) {
  return interpolate(frame, [start, start + dur], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
}

export function pop(
  frame: number,
  fps: number,
  start: number,
  config: { damping?: number; stiffness?: number; mass?: number } = {},
) {
  return spring({
    frame: frame - start,
    fps,
    config: { damping: 13, stiffness: 140, mass: 0.7, ...config },
  });
}

export function countUp(frame: number, start: number, dur: number, to: number, from = 0) {
  return interpolate(frame, [start, start + dur], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT,
  });
}
