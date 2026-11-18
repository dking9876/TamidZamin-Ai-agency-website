import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(root, '..', 'website', 'package.json'));
const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const sharp = require('sharp');
const names = ['01-a-service-day', '02-hands-at-work', '03-from-home-to-help'];
const report = { media: [], loop: [], safeArea: [], distinctShots: [], ui: [] };

function command(name, args, encoding = 'utf8') {
  const result = spawnSync(name, args, { encoding, maxBuffer: 20 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, String(result.stderr));
  return result.stdout;
}

function sample(file, t) {
  return command('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', 'scale=320:180', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], null);
}

function difference(a, b) {
  assert.equal(a.length, b.length);
  let total = 0;
  for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
  return total / a.length;
}

for (const name of (await readdir(join(root, 'videos'))).filter(name => name.endsWith('.mp4')).sort()) {
  const file = join(root, 'videos', name);
  const metadata = JSON.parse(command('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]));
  const video = metadata.streams.find(stream => stream.codec_type === 'video');
  assert.equal(metadata.streams.length, 1, `${name}: unexpected audio/data stream`);
  assert.equal(video.codec_name, 'h264');
  assert.equal(video.pix_fmt, 'yuv420p');
  assert.equal(video.r_frame_rate, '24/1');
  assert.equal(Number(video.nb_frames), 288);
  assert(Math.abs(Number(metadata.format.duration) - 12) < .02);
  const phone = name.includes('phone-preview');
  const mobile = name.includes('-mobile');
  assert.equal(video.width, phone ? 720 : mobile ? 960 : 1920);
  assert.equal(video.height, phone ? 1280 : mobile ? 960 : 1080);
  const bytes = await readFile(file);
  assert(bytes.indexOf(Buffer.from('moov')) < bytes.indexOf(Buffer.from('mdat')), `${name}: not fast-start`);
  command('ffmpeg', ['-v', 'error', '-xerror', '-i', file, '-f', 'null', '-']);
  const loopDifference = difference(sample(file, 0), sample(file, 287 / 24));
  assert(loopDifference < 4, `${name}: loop jump ${loopDifference}`);
  report.media.push({ name, duration: 12, size: bytes.length, width: video.width, height: video.height, loopDifference });
}
assert.equal(report.media.length, 9);

for (const [index, name] of names.entries()) {
  const file = join(root, 'videos', `${name}.mp4`);
  const stats = command('ffmpeg', [
    '-v', 'error', '-i', file, '-vf', 'crop=998:1080:0:0,signalstats,metadata=print:file=-',
    '-an', '-f', 'null', '-'
  ]);
  const peaks = [...stats.matchAll(/lavfi\.signalstats\.YMAX=(\d+)/g)].map(match => Number(match[1]));
  assert.equal(peaks.length, 288);
  const peak = Math.max(...peaks);
  assert(peak < 78, `${name}: text-safe area too bright: ${peak}`);
  report.safeArea.push({ name, frames: peaks.length, leftPercent: 52, maximumY: peak });
  const times = index === 1 ? [1.5, 5.5, 9.5] : [1.5, 4.5, 7.5, 10.5];
  const frames = times.map(t => sample(file, t));
  const distances = frames.slice(1).map((buffer, i) => difference(frames[i], buffer));
  assert(distances.every(distance => distance > 4), `${name}: shots insufficiently distinct`);
  report.distinctShots.push({ name, sampledTimes: times, meanPixelDifferences: distances });
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (let edit = 0; edit < 3; edit++) {
    const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:4320/render.html?edit=${edit}`);
    await page.waitForFunction(() => window.animationReady);
    const first = Buffer.from(await page.evaluate(() => window.captureFrame(0)), 'base64');
    const last = Buffer.from(await page.evaluate(() => window.captureFrame(12)), 'base64');
    assert(first.equals(last), `edit ${edit}: deterministic loop mismatch`);
    report.loop.push({ edit, exactTwelveSecondLoop: true });
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4320/');
  await page.waitForFunction(() => document.getElementById('film').currentTime > .1);
  await page.getByRole('button', { name: 'Pause video', exact: true }).click();
  assert(await page.locator('#film').evaluate(video => video.paused));
  await page.getByRole('button', { name: 'Video only', exact: true }).click();
  assert(await page.locator('body').evaluate(body => body.classList.contains('raw')));
  await page.getByRole('button', { name: 'Video only', exact: true }).click();
  for (const edit of [1, 2, 0]) {
    await page.locator(`[data-edit="${edit}"]`).click();
    await page.waitForFunction(file => document.getElementById('film').currentSrc.includes(file) && document.getElementById('film').readyState >= 2, names[edit]);
    assert.equal(await page.locator(`[data-edit="${edit}"]`).getAttribute('aria-pressed'), 'true');
  }
  const accessibility = await new AxeBuilder({ page }).analyze();
  assert.equal(accessibility.violations.length, 0, JSON.stringify(accessibility.violations));
  report.ui.push('Playback, pause, edit switching, raw mode and accessibility passed.');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
    await page.waitForFunction(mobile => {
      const video = document.getElementById('film');
      return video.readyState >= 2 && video.currentSrc.includes('-mobile.mp4') === mobile;
    }, width <= 880);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
    const source = await page.locator('#film').evaluate(video => video.currentSrc);
    assert.equal(source.includes('-mobile.mp4'), width <= 880);
    if ([390, 1440].includes(width)) {
      await page.screenshot({ path: join(root, 'verification', `preview-${width}.png`), fullPage: true });
    }
  }
  await page.getByRole('button', { name: 'Play video', exact: true }).click();
  await page.waitForFunction(() => !document.getElementById('film').paused);
  await page.locator('.hero').evaluate(hero => { hero.style.marginTop = '2000px'; });
  await page.waitForFunction(() => document.getElementById('film').paused);
  report.ui.push('Responsive sources at 320/390/768/1440px and offscreen pause passed.');
  assert.deepEqual(errors, []);
  await context.close();

  const reducedContext = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto('http://127.0.0.1:4320/');
  await reducedPage.waitForFunction(() => document.getElementById('film').readyState >= 2);
  assert(await reducedPage.locator('#film').evaluate(video => video.paused && video.currentTime === 0));
  await reducedPage.getByRole('button', { name: 'Play video', exact: true }).click();
  await reducedPage.waitForFunction(() => document.getElementById('film').currentTime > .1);
  report.ui.push('Reduced-motion starts still and permits deliberate playback.');
  await reducedContext.close();

  const failureContext = await browser.newContext();
  await failureContext.route('**/*.mp4', route => route.abort());
  const failurePage = await failureContext.newPage();
  await failurePage.goto('http://127.0.0.1:4320/');
  await failurePage.waitForFunction(() => /could not (load|start)/.test(document.getElementById('status').textContent));
  assert.equal(await failurePage.locator('#pause').textContent(), 'Play video');
  report.ui.push('Missing-media failure is visible and provides a recovery route.');
  await failureContext.close();

  const localContext = await browser.newContext({ reducedMotion: 'reduce' });
  const localPage = await localContext.newPage();
  await localPage.goto(pathToFileURL(join(root, 'index.html')).href);
  await localPage.waitForFunction(() => document.getElementById('film').readyState >= 2);
  await localPage.locator('[data-edit="1"]').click();
  await localPage.waitForFunction(() => document.getElementById('film').currentSrc.includes('02-hands-at-work'));
  report.ui.push('Offline file preview loads and switches edits.');
  await localContext.close();
} finally {
  await browser.close();
}

const thumbnails = [];
for (const [i, name] of names.entries()) {
  const image = command('ffmpeg', ['-v', 'error', '-ss', '4.5', '-i', join(root, 'videos', `${name}-phone-preview.mp4`), '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', 'pipe:1'], null);
  thumbnails.push({ input: await sharp(image).resize(360, 640).toBuffer(), top: 0, left: i * 360 });
}
await sharp({ create: { width: 1080, height: 640, channels: 3, background: '#081721' } })
  .composite(thumbnails).jpeg({ quality: 93 }).toFile(join(root, 'preview-overview.jpg'));
await writeFile(join(root, 'verification', 'results.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
