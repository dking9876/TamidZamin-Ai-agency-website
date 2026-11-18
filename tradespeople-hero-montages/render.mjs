import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(root, '..', 'website', 'package.json'));
const { chromium } = require('@playwright/test');
const sharp = require('sharp');
const names = ['01-a-service-day', '02-hands-at-work', '03-from-home-to-help'];
const stills = process.argv.includes('--stills');
const requested = process.argv.find(arg => /^[0-2]$/.test(arg));
const selected = requested === undefined ? [0, 1, 2] : [Number(requested)];
await Promise.all(['videos', 'posters', 'verification'].map(name => mkdir(join(root, name), { recursive: true })));

function ffmpeg(args) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `FFmpeg exit ${result.status}`);
}

async function openRender(browser, query, width, height) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:4320/render.html?${query}`);
  await page.waitForFunction(() => window.animationReady, { timeout: 15000 });
  return { context, page, errors };
}

async function frame(page, t) {
  return Buffer.from(await page.evaluate(t => window.captureFrame(t), t), 'base64');
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  if (stills) {
    const cards = [];
    for (const [index, scene] of ['arrival', 'plumbing', 'hvac', 'contact'].entries()) {
      const { context, page, errors } = await openRender(browser, `scene=${scene}&clean=1`, 1600, 900);
      const image = await frame(page, 1.2);
      await writeFile(join(root, 'verification', `${scene}.png`), image);
      cards.push({ input: await sharp(image).resize(800, 450).toBuffer(), left: (index % 2) * 800, top: Math.floor(index / 2) * 450 });
      if (errors.length) throw new Error(errors.join('\n'));
      await context.close();
    }
    await sharp({ create: { width: 1600, height: 900, channels: 3, background: '#081721' } })
      .composite(cards).jpeg({ quality: 94 }).toFile(join(root, 'verification', 'scene-overview.jpg'));
    for (const index of selected) {
      for (const square of [false, true]) {
        const { context, page } = await openRender(browser, `edit=${index}&square=${square ? 1 : 0}`, square ? 960 : 1920, square ? 960 : 1080);
        for (const t of [0, 1.5, 4.5, 7.5, 10.5, 12]) {
          await writeFile(join(root, 'verification', `${names[index]}${square ? '-mobile' : ''}-${t}.png`), await frame(page, t));
        }
        await context.close();
      }
    }
    console.log('Scene and montage stills rendered.');
  } else {
    for (const index of selected) {
      for (const square of [false, true]) {
        const name = names[index] + (square ? '-mobile' : '');
        const { context, page, errors } = await openRender(browser, `edit=${index}&square=${square ? 1 : 0}`, square ? 960 : 1920, square ? 960 : 1080);
        const encoder = spawn('ffmpeg', [
          '-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', '24', '-vcodec', 'png', '-i', 'pipe:0',
          '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-threads', '3',
          '-g', '48', '-movflags', '+faststart', '-map_metadata', '-1', '-metadata', `title=TamidZamin - ${name}`,
          join(root, 'videos', `${name}.mp4`)
        ], { stdio: ['pipe', 'ignore', 'pipe'] });
        let stderr = '';
        encoder.stderr.on('data', data => { stderr += data.toString(); });
        const completion = once(encoder, 'close');
        encoder.stdin.on('error', error => { stderr += `\n${error.message}`; });
        try {
          for (let i = 0; i < 288; i++) {
            if (encoder.exitCode !== null) throw new Error(stderr || 'Encoder stopped');
            const image = await frame(page, i / 24);
            if (i === 0) await sharp(image).jpeg({ quality: 93 }).toFile(join(root, 'posters', `${name}.jpg`));
            if (!encoder.stdin.write(image)) await once(encoder.stdin, 'drain');
            if (i % 96 === 0) console.log(`${name}: ${i}/288`);
          }
          encoder.stdin.end();
          const [code] = await completion;
          if (code !== 0) throw new Error(stderr || `Encoder exit ${code}`);
        } catch (error) {
          encoder.kill(); throw error;
        }
        if (errors.length) throw new Error(errors.join('\n'));
        await context.close();
      }
      const context = await browser.newContext({ viewport: { width: 720, height: 560 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:4320/?layout=phone-template&edit=${index}`);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => document.body.classList.contains('phone-template'));
      const footer = join(root, 'verification', `${names[index]}-phone-footer.png`);
      await page.locator('.phone-footer').screenshot({ path: footer });
      ffmpeg([
        '-i', join(root, 'videos', `${names[index]}-mobile.mp4`), '-loop', '1', '-i', footer,
        '-filter_complex', '[0:v]scale=720:720:flags=lanczos[top];[top][1:v]vstack=inputs=2,format=yuv420p[out]',
        '-map', '[out]', '-t', '12', '-r', '24', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
        '-threads', '3', '-movflags', '+faststart', join(root, 'videos', `${names[index]}-phone-preview.mp4`)
      ]);
      await context.close();
      console.log(`Finished ${names[index]}: 3 exports.`);
    }
  }
} finally {
  await browser.close();
}
