import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const website = fileURLToPath(new URL('../', import.meta.url));
const originals = join(website, '..', 'photo-animated-hero');
const output = join(website, 'public', 'media');
const source = JSON.parse(await readFile(join(originals, 'sources.json'), 'utf8'));
const manifestPath = join(output, 'provenance.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
if (hash(await readFile(join(output, 'hero-film.mp4'))) !== manifest['hero-film.mp4'].sha256) {
  throw new Error('The approved desktop film changed; verify its source before rebuilding the phone edit.');
}

function run(args) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `FFmpeg exited ${result.status}`);
}

const cropX = [560, 480, 450, 480, 440];
const { sourceStarts, sourceLengths, dissolveSeconds: fade, fps, duration } = source.edit;
const graph = [];
const clips = source.scenes.map((scene) => join(originals, 'generated-clips', `${scene.name}.mp4`));
for (const [index] of clips.entries()) {
  graph.push(`[${index}:v]fps=${fps},trim=start=${sourceStarts[index]}:duration=${sourceLengths[index]},setpts=PTS-STARTPTS,scale=1280:720:flags=lanczos,crop=720:720:${cropX[index]}:0,setsar=1,format=yuv420p[v${index}]`);
}
graph.push('[v0]split=2[first][loop]');
graph.push(`[loop]trim=duration=${fade + 1 / fps},setpts=PTS-STARTPTS[head]`);
let previous = 'first';
let offset = sourceLengths[0] - fade;
for (let index = 1; index < clips.length; index++) {
  graph.push(`[${previous}][v${index}]xfade=transition=fade:duration=${fade}:offset=${offset}[x${index}]`);
  previous = `x${index}`;
  offset += sourceLengths[index] - fade;
}
graph.push(`[${previous}][head]xfade=transition=fade:duration=${fade}:offset=${offset - 1 / fps}[cycle]`);
graph.push(`[cycle]trim=start=${fade}:duration=${duration},setpts=PTS-STARTPTS,split=2[subject][ambient]`);
graph.push('[ambient]scale=1280:1280:flags=lanczos,crop=720:1280,gblur=sigma=24[backdrop]');
graph.push("[subject]format=yuva420p,geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='255*clip((720-Y)/160,0,1)'[foreground]");
graph.push('[backdrop][foreground]overlay=0:0:shortest=1,setsar=1,format=yuv420p[out]');
run([
  '-filter_complex_threads', '2', ...clips.flatMap((clip) => ['-i', clip]),
  '-filter_complex', graph.join(';'), '-map', '[out]', '-an',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p',
  '-threads', '4', '-r', String(fps), '-frames:v', String(duration * fps),
  '-g', '48', '-movflags', '+faststart',
  '-metadata', 'title=TamidZamin - phone portrait hero',
  join(output, 'hero-film-mobile.mp4'),
]);
run([
  '-i', join(output, 'hero-film-mobile.mp4'), '-frames:v', '1',
  '-c:v', 'libwebp', '-quality', '85', '-update', '1', join(output, 'hero-poster-mobile.webp'),
]);

manifest['hero-film-mobile.mp4'] = {
  source: '../../../photo-animated-hero/generated-clips',
  sourceRecord: '../../../photo-animated-hero/sources.json',
  transform: '720x1280 portrait, 24fps, 14 seconds, silent H.264 with fast-start metadata. Same five shots, timing and loop as the approved film. Scene-specific 720x720 crops keep the person and work in the upper frame; a softly extended moving background fills the lower copy area. No baked-in text, new generation or altered original.',
  cropX,
  sourceClipHashes: Object.fromEntries(await Promise.all(clips.map(async (clip, index) => [
    source.scenes[index].name, hash(await readFile(clip)),
  ]))),
  sha256: hash(await readFile(join(output, 'hero-film-mobile.mp4'))),
  build: 'node scripts/prepare-hero-mobile.mjs',
};
manifest['hero-poster-mobile.webp'] = {
  source: 'hero-film-mobile.mp4',
  transform: 'First frame extracted with FFmpeg, libwebp quality 85, 720x1280.',
  purpose: 'Responsive phone loading, reduced-motion, no-JavaScript and playback-failure fallback.',
};
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('Created 720x1280 mobile film and poster; desktop film and original clips are unchanged.');
