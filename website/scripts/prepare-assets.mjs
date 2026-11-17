import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const source = resolve(process.env.SOURCE_ASSET_DIR || '..\\website design assets');
const output = resolve('public\\images');
await mkdir(output, { recursive: true });
const manifest = [];
const images = [
  ['01_hero_background.png', 'hero', [768, 1280, 1920]],
  ['02_trade_plumber.png', 'plumber', [320, 640]],
  ['03_trade_electrician.png', 'electrician', [320, 640]],
  ['04_trade_repair_technician.png', 'repair', [320, 640]],
  ['05_trade_hvac_technician.png', 'hvac', [320, 640]],
  ['06_trade_contractor.png', 'contractor', [320, 640]],
  ['07_human_support.png', 'support', [640, 960]],
  ['08_about_technician.png', 'about', [640, 960]],
  ['09_tamidzamin_logo.png', 'logo', [300, 600]],
];
for (const [original, name, widths] of images) {
  const buffer = await readFile(join(source, original));
  const meta = await sharp(buffer).metadata();
  for (const width of widths) {
    const file = `${name}-${width}.webp`;
    await sharp(buffer).resize({ width, withoutEnlargement: true })
      .webp({ quality: name === 'logo' ? 95 : 80, effort: 5 }).toFile(join(output, file));
    manifest.push({
      file, source: `website design assets\\${original}`,
      sha256: createHash('sha256').update(buffer).digest('hex'),
      sourceWidth: meta.width, sourceHeight: meta.height,
      transformation: `resize to max ${width}px wide; WebP`,
      provenance: 'User-supplied approved asset. No claim about depicted people or authorship.',
    });
  }
}
await sharp(join(source, '01_hero_background.png')).resize(1200, 630, { fit: 'cover' })
  .jpeg({ quality: 82 }).toFile(join(output, 'social.jpg'));
await sharp(join(source, '09_tamidzamin_logo.png')).extract({ left: 42, top: 55, width: 278, height: 260 })
  .resize(192, 192, { fit: 'contain', background: '#08162c' }).png().toFile(join(output, 'icon.png'));
await writeFile(join(output, 'provenance.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Optimized ${manifest.length} image variants, social image and icon. Originals unchanged.`);
