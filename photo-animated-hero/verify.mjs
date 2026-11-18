import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(root, '..', 'website', 'package.json'));
const sharp = require('sharp');
const manifest = JSON.parse(await readFile(join(root, 'sources.json'), 'utf8'));
await mkdir(join(root, 'verification'), { recursive: true });

function command(name, args, encoding = 'utf8') {
  const result = spawnSync(name, args, { encoding, maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, String(result.stderr));
  return result.stdout;
}
function image(file, t) {
  return command('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', 'pipe:1'], null);
}
function difference(a, b) {
  assert.equal(a.length, b.length);
  let total = 0;
  for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
  return total / a.length;
}

const report = { originalAssets: [], generationMotion: [], outputs: [], textSafeArea: null };
const cells = [];
for (const [index, scene] of manifest.scenes.entries()) {
  const original = await readFile(join(root, '..', 'website design assets', scene.source));
  assert.equal(createHash('sha256').update(original).digest('hex'), scene.sha256);
  report.originalAssets.push({ source: scene.source, unchanged: true });
  const file = join(root, 'generated-clips', `${scene.name}.mp4`);
  const frames = [];
  for (const [column, t] of [0, 3, 6].entries()) {
    const png = image(file, t);
    frames.push(await sharp(png).resize(320, 180).removeAlpha().raw().toBuffer());
    cells.push({ input: await sharp(png).resize(576, 324).toBuffer(), left: column * 576, top: index * 324 });
  }
  const movement = difference(frames[0], frames[1]);
  assert(movement > 1, `${scene.name}: generated scene is effectively still`);
  const reference = await sharp(join(root, scene.frame)).resize(320, 180).removeAlpha().raw().toBuffer();
  const firstFrameDifference = difference(reference, frames[0]);
  assert(firstFrameDifference < 30, `${scene.name}: start frame differs substantially from the supplied image`);
  report.generationMotion.push({ scene: scene.name, movement, firstFrameDifference });
}
await sharp({ create: { width: 1728, height: 1620, channels: 3, background: '#081721' } })
  .composite(cells).jpeg({ quality: 93 }).toFile(join(root, 'verification', 'generated-motion-contact.jpg'));

for (const name of (await readdir(join(root, 'videos'))).filter(name => name.endsWith('.mp4')).sort()) {
  const file = join(root, 'videos', name);
  const metadata = JSON.parse(command('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]));
  assert.equal(metadata.streams.length, 1, `${name}: unexpected audio/data stream`);
  const video = metadata.streams[0];
  assert.equal(video.codec_name, 'h264');
  assert.equal(video.pix_fmt, 'yuv420p');
  assert.equal(video.r_frame_rate, '24/1');
  assert.equal(Number(video.nb_frames), 336);
  assert(Math.abs(Number(metadata.format.duration) - 14) < .02);
  const expected = name.includes('desktop') ? [1920, 1080] : name.includes('phone') ? [720, 1280] : name.includes('mobile') ? [960, 960] : [1280, 720];
  assert.deepEqual([video.width, video.height], expected);
  const bytes = await readFile(file);
  assert(bytes.indexOf(Buffer.from('moov')) < bytes.indexOf(Buffer.from('mdat')), `${name}: missing fast-start`);
  command('ffmpeg', ['-v', 'error', '-xerror', '-i', file, '-f', 'null', '-']);
  const a = await sharp(image(file, 0)).resize(320, 180).removeAlpha().raw().toBuffer();
  const b = await sharp(image(file, 335 / 24)).resize(320, 180).removeAlpha().raw().toBuffer();
  const loopDifference = difference(a, b);
  assert(loopDifference < 7, `${name}: loop jump is too large: ${loopDifference}`);
  report.outputs.push({ name, duration: 14, width: video.width, height: video.height, bytes: bytes.length, loopDifference });
}
assert.equal(report.outputs.length, 4);
const stats = command('ffmpeg', [
  '-v', 'error', '-i', join(root, 'videos', 'tamidzamin-hero-desktop.mp4'),
  '-vf', 'crop=998:1080:0:0,signalstats,metadata=print:file=-', '-an', '-f', 'null', '-'
]);
const peaks = [...stats.matchAll(/lavfi\.signalstats\.YMAX=(\d+)/g)].map(match => Number(match[1]));
assert.equal(peaks.length, 336);
assert(Math.max(...peaks) < 78, 'Text-safe area exceeds luminance threshold');
report.textSafeArea = { leftPercent: 52, checkedFrames: peaks.length, maximumY: Math.max(...peaks) };
const phone = image(join(root, 'videos', 'tamidzamin-hero-phone-preview.mp4'), 4);
await sharp(phone).jpeg({ quality: 92 }).toFile(join(root, 'phone-preview.jpg'));
const row = [];
for (const [index, t] of [1, 4, 7, 10, 12.5].entries()) {
  row.push({
    input: await sharp(image(join(root, 'videos', 'tamidzamin-hero-desktop.mp4'), t)).resize(576, 324).toBuffer(),
    left: (index % 2) * 576, top: Math.floor(index / 2) * 324
  });
}
await sharp({ create: { width: 1152, height: 972, channels: 3, background: '#081721' } })
  .composite(row).jpeg({ quality: 92 }).toFile(join(root, 'scenes-overview.jpg'));
await writeFile(join(root, 'verification', 'results.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
