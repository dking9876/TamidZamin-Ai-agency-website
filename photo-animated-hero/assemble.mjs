import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(root, '..', 'website', 'package.json'));
const sharp = require('sharp');
const { chromium } = require('@playwright/test');
const manifest = JSON.parse(await readFile(join(root, 'sources.json'), 'utf8'));
const lengths = [3.25, 3.25, 3.5, 3.25, 3.25];
const starts = [0.5, 0.5, 0.5, 0.5, 0.5];
const mobileX = [560, 480, 450, 480, 440];
const fade = .5;
const duration = 14;
await Promise.all(['videos', 'posters', 'verification'].map(folder => mkdir(join(root, folder), { recursive: true })));

function run(name, args, encoding = 'utf8') {
  const result = spawnSync(name, args, { encoding, maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `${name} exited ${result.status}`);
  return result.stdout;
}

for (const scene of manifest.scenes) {
  const original = await readFile(join(root, '..', 'website design assets', scene.source));
  if (createHash('sha256').update(original).digest('hex') !== scene.sha256) throw new Error(`Original changed: ${scene.source}`);
  const file = join(root, 'generated-clips', `${scene.name}.mp4`);
  const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]));
  if (Number(probe.format.duration) < 4) throw new Error(`${scene.name}: generated clip is too short`);
  run('ffmpeg', ['-v', 'error', '-xerror', '-i', file, '-f', 'null', '-']);
}

const scrim = Buffer.from(`<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="shade"><stop stop-color="#081721" stop-opacity=".98"/><stop offset=".43" stop-color="#081721" stop-opacity=".94"/><stop offset=".52" stop-color="#081721" stop-opacity=".88"/><stop offset=".65" stop-color="#081721" stop-opacity=".35"/><stop offset=".82" stop-color="#081721" stop-opacity=".06"/><stop offset="1" stop-color="#081721" stop-opacity=".10"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#shade)"/></svg>`);
const shadeFile = join(root, 'verification', 'desktop-scrim.png');
await sharp(scrim).png().toFile(shadeFile);

for (const mode of ['film', 'desktop', 'mobile']) {
  const inputArgs = manifest.scenes.flatMap(scene => ['-i', join(root, 'generated-clips', `${scene.name}.mp4`)]);
  const graph = [];
  for (const [index, scene] of manifest.scenes.entries()) {
    let framing = 'scale=1280:720:flags=lanczos';
    if (mode === 'desktop') {
      framing = 'scale=1920:1080:flags=lanczos';
      if (index > 0) framing += ',pad=2160:1080:240:0:color=0x081721,crop=1920:1080:0:0';
    }
    if (mode === 'mobile') framing = `scale=1280:720:flags=lanczos,crop=720:720:${mobileX[index]}:0,scale=960:960:flags=lanczos`;
    graph.push(`[${index}:v]fps=24,trim=start=${starts[index]}:duration=${lengths[index]},setpts=PTS-STARTPTS,${framing},setsar=1,format=yuv420p[v${index}]`);
  }
  graph.push('[v0]split=2[first][loop]');
  graph.push(`[loop]trim=duration=${fade + 1 / 24},setpts=PTS-STARTPTS[head]`);
  let previous = 'first';
  let offset = lengths[0] - fade;
  for (let index = 1; index < manifest.scenes.length; index++) {
    graph.push(`[${previous}][v${index}]xfade=transition=fade:duration=${fade}:offset=${offset}[x${index}]`);
    previous = `x${index}`;
    offset += lengths[index] - fade;
  }
  graph.push(`[${previous}][head]xfade=transition=fade:duration=${fade}:offset=${offset - 1 / 24}[cycle]`);
  graph.push(`[cycle]trim=start=${fade}:duration=${duration},setpts=PTS-STARTPTS[trimmed]`);
  if (mode === 'desktop') {
    inputArgs.push('-loop', '1', '-i', shadeFile);
    graph.push('[trimmed][5:v]overlay=shortest=1,format=yuv420p[out]');
  } else {
    graph.push('[trimmed]format=yuv420p[out]');
  }
  const name = mode === 'film' ? 'tamidzamin-original-photos-film' : `tamidzamin-hero-${mode}`;
  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-filter_complex_threads', '2', ...inputArgs,
    '-filter_complex', graph.join(';'), '-map', '[out]', '-an', '-c:v', 'libx264', '-preset', 'medium',
    '-crf', mode === 'desktop' ? '21' : '22', '-pix_fmt', 'yuv420p', '-threads', '4',
    '-r', '24', '-frames:v', '336', '-g', '48', '-movflags', '+faststart',
    '-metadata', `title=TamidZamin - original photos in motion (${mode})`,
    join(root, 'videos', `${name}.mp4`)
  ]);
  run('ffmpeg', ['-v', 'error', '-y', '-i', join(root, 'videos', `${name}.mp4`), '-frames:v', '1', '-q:v', '2', join(root, 'posters', `${name}.jpg`)]);
  console.log(`Rendered ${name}: 14 seconds.`);
}

const fontFolder = join(root, '..', 'animated-hero-options', 'assets');
const hebrew = (await readFile(join(fontFolder, 'heebo-hebrew.woff2'))).toString('base64');
const latin = (await readFile(join(fontFolder, 'heebo-latin.woff2'))).toString('base64');
const html = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><style>
@font-face{font-family:Heebo;src:url(data:font/woff2;base64,${hebrew});font-weight:100 900;unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}
@font-face{font-family:Heebo;src:url(data:font/woff2;base64,${latin});font-weight:100 900}
*{box-sizing:border-box}body{margin:0;width:720px;height:560px;background:#081721;color:#fff;font-family:Heebo,sans-serif;padding:32px 54px}
h1{font-size:57px;line-height:1.13;font-weight:800;letter-spacing:-.025em;margin:0}h1 span{display:block}h1 span:last-child{color:#37bbff}
p{font-size:23px;line-height:1.55;margin:26px 0 25px}.cta{display:inline-block;background:#f4f8fa;color:#102637;border-radius:40px;padding:14px 29px;font-size:23px;font-weight:750}
small{position:absolute;bottom:21px;left:54px;font-size:17px;color:#c0d0d5;direction:ltr}
</style><h1><span>כל פנייה מתחילה</span><span>במענה נכון.</span></h1><p>סוכני AI בוואטסאפ ובטלפון לעסקי שירות. אוספים פרטים, מסדרים פניות ומשאירים את ההחלטות המקצועיות אצלכם.</p><span class="cta">לבדיקת התאמה</span><small>Original website photos · Animated preview</small></html>`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 720, height: 560 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(root, 'verification', 'phone-footer.png') });
} finally {
  await browser.close();
}
run('ffmpeg', [
  '-v', 'error', '-y', '-i', join(root, 'videos', 'tamidzamin-hero-mobile.mp4'),
  '-loop', '1', '-framerate', '24', '-i', join(root, 'verification', 'phone-footer.png'),
  '-filter_complex', '[0:v]scale=720:720:flags=lanczos[top];[top][1:v]vstack=inputs=2,format=yuv420p[out]',
  '-map', '[out]', '-an', '-t', '14', '-r', '24', '-c:v', 'libx264', '-preset', 'medium', '-crf', '22',
  '-threads', '4', '-movflags', '+faststart', join(root, 'videos', 'tamidzamin-hero-phone-preview.mp4')
]);
manifest.edit = {
  duration, fps: 24, dissolveSeconds: fade, sourceStarts: starts, sourceLengths: lengths,
  sourceResolution: '1280x720', desktopExport: '1920x1080; ordinary scaling, not AI upscaling',
  note: 'Generated pixels retain their AI provenance. No attempt is made to remove invisible SynthID.'
};
await writeFile(join(root, 'sources.json'), JSON.stringify(manifest, null, 2));
console.log('Phone preview rendered. Original asset hashes still match.');
