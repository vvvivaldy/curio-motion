import type { Step2D } from '../../core/contacts';
import { sampleFootsteps } from '../../core/gait';
import { tween } from '../../core/time';
import { approachX, boardingFeet, groundY } from './layout';

export const approachStartY = 608;
export const transferTime = .12;
// Four unhurried footfalls, then two turning steps and two boarding steps.
// Coordinates are projected floor contacts, not offsets glued to a growing body.
export const footTracks: readonly (readonly Step2D[])[] = [-1, 1].map((side, i) => {
  const initial: [number, number] = [approachX + side * 30 * .82, approachStartY];
  const middle: [number, number] = [approachX + side * 28, i === 0 ? 622 : 636];
  const finish: [number, number] = [approachX + side * 30, groundY];
  const turned: [number, number] = [i === 0 ? 494 : 526, groundY];
  return [
    { start: i === 0 ? .28 : .94, end: i === 0 ? .7 : 1.36, from: initial, to: middle, lift: 28 },
    { start: i === 0 ? 1.62 : 2.28, end: i === 0 ? 2.04 : 2.7, from: middle, to: finish, lift: 30 },
    { start: i === 0 ? 3.2 : 4.05, end: i === 0 ? 3.85 : 4.7, from: finish, to: turned, lift: 22,
      fromHeading: 0, toHeading: Math.PI / 2 },
    { start: i === 0 ? 5.1 : 5.85, end: i === 0 ? 5.65 : 6.35, from: turned, to: boardingFeet[i], lift: 40,
      fromHeading: Math.PI / 2, toHeading: Math.PI / 2 },
  ];
});

export const sampleFeet = (t: number) => footTracks.map(track => sampleFootsteps(t, track, transferTime));
export const boardingSteps = footTracks.map(track => track.at(-1)!);

const approachSteps = footTracks.flatMap(track => track.slice(0, 2)).sort((a, b) => a.start - b.start);
/** This shot's projected forward path; smooth through passing instead of max() switching feet. */
export function approachGroundAt(t: number) {
  let lead = approachStartY, y = approachStartY;
  for (const step of approachSteps) {
    const next = Math.max(lead, step.to[1]);
    y += (next - lead) * tween(t, step.start, step.end);
    lead = next;
  }
  return y;
}
