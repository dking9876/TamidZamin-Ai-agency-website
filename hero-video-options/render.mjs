import { spawnSync } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await readFile(join(root, 'sources.json'), 'utf8'));
const cache = resolve(process.env.HERO_SOURCE_CACHE || join(root, '.source-cache'));
const selected = process.argv[2];
const edits = selected ? manifest.edits.filter(edit => edit.id === selected) : manifest.edits;
if (!edits.length) throw new Error(`Unknown edit: ${selected}`);
await mkdir(cache, { recursive: true });
await mkdir(join(root, 'videos'), { recursive: true });
await mkdir(join(root, 'posters'), { recursive: true });

function ffmpeg(args) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `FFmpeg exited ${result.status}`);
}

for (const edit of edits) {
  const inputs = [];
  for (const shot of edit.shots) {
    const source = manifest.sources.find(source => source.id === shot.id);
    if (!source) throw new Error(`Missing source record: ${shot.id}`);
    const file = join(cache, `stock-${shot.id}.mp4`);
    const present = await stat(file).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (!present) {
      console.log(`Downloading ${source.title}`);
      const response = await fetch(source.download);
      if (!response.ok) throw new Error(`Download failed: ${response.status} ${source.download}`);
      await writeFile(file, Buffer.from(await response.arrayBuffer()));
    }
    inputs.push('-ss', String(shot.start), '-t', String(edit.shotSeconds / edit.slowdown + 0.5), '-i', file);
  }

  const d = 0.75;
  const step = edit.shotSeconds - d;
  const filters = edit.shots.map((_, i) =>
    `[${i}:v]setpts=${edit.slowdown}*(PTS-STARTPTS),fps=24,` +
    'scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,' +
    `setsar=1,format=yuv420p,trim=duration=${edit.shotSeconds},setpts=PTS-STARTPTS,settb=AVTB,${edit.grade}[s${i}]`
  );
  // End on the next frames of the opening shot, so replay continues through the dissolve.
  filters.push('[s0]split=2[first][repeat]');
  filters.push(`[repeat]trim=duration=${d},setpts=PTS-STARTPTS[head]`);
  filters.push(`[first][s1]xfade=transition=fade:duration=${d}:offset=${step}[ab]`);
  filters.push(`[ab][s2]xfade=transition=fade:duration=${d}:offset=${2 * step}[abc]`);
  filters.push(`[abc][head]xfade=transition=fade:duration=${d}:offset=${3 * step}[cycle]`);
  filters.push(`[cycle]trim=start=${d}:duration=${edit.seconds},setpts=PTS-STARTPTS,format=yuv420p[out]`);

  const video = join(root, 'videos', `${edit.id}.mp4`);
  console.log(`Rendering ${edit.name}`);
  ffmpeg([
    '-filter_complex_threads', '2', ...inputs, '-filter_complex', filters.join(';'),
    '-map', '[out]', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
    '-maxrate', '3600k', '-bufsize', '7200k', '-threads', '4',
    '-profile:v', 'high', '-level:v', '4.1', '-pix_fmt', 'yuv420p',
    '-g', '48', '-movflags', '+faststart', '-map_metadata', '-1',
    '-metadata', `title=TamidZamin - ${edit.name}`, video,
  ]);
  ffmpeg([
    '-i', video, '-an', '-vf', 'scale=960:540:flags=lanczos',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-threads', '4',
    '-maxrate', '1100k', '-bufsize', '2200k', '-profile:v', 'main', '-level:v', '3.1',
    '-pix_fmt', 'yuv420p', '-g', '48', '-movflags', '+faststart', '-map_metadata', '-1',
    join(root, 'videos', `${edit.id}-mobile.mp4`),
  ]);
  ffmpeg(['-i', video, '-frames:v', '1', '-q:v', '2', join(root, 'posters', `${edit.id}.jpg`)]);
  ffmpeg([
    '-i', video, '-frames:v', '1', '-vf', 'scale=960:540:flags=lanczos', '-q:v', '3',
    join(root, 'posters', `${edit.id}-mobile.jpg`),
  ]);
  console.log(`Finished ${edit.name}: ${((await stat(video)).size / 1024 / 1024).toFixed(2)} MiB`);
}
