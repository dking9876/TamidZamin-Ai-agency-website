interface TimedCue {
  start: number;
  end: number;
}

export function activeCueIndex(cues: readonly TimedCue[], time: number): number {
  return cues.findIndex((cue) => time >= cue.start && time < cue.end);
}

export function transcriptAnchorIndex(cues: readonly TimedCue[], time: number): number {
  return Math.max(0, cues.findLastIndex((cue) => cue.start <= time));
}

export function formatCallTime(seconds: number): string {
  const time = Math.max(0, Math.floor(seconds));
  return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;
}
