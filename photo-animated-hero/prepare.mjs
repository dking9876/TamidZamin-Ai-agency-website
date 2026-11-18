import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(root, '..', 'website', 'package.json'));
const sharp = require('sharp');
const source = join(root, '..', 'website design assets');
const scenes = [
  {
    name: '01-hero-arrival', source: '01_hero_background.png',
    crop: { left: 528, top: 0, width: 1287, height: 724 }, flip: false,
    prompt: 'Animate this exact supplied starting photograph as a calm cinematic live-action-style shot. Preserve the same male tradesperson, his face from behind, navy cap, navy work clothes, tool belt, black tool case, house, van, garden and sunset lighting. He takes two slow natural steps toward the existing house; the case swings gently from his hand and his shoulders move naturally. Leaves move very slightly in a soft breeze. Keep the camera nearly locked, with only a very slow forward drift. No new people, no talking, no invented objects, no text, no logos, no cuts, no cartoon or illustration styling, no exaggerated motion, no distortion. Keep the original framing and colors. This is a quiet website hero background.'
  },
  {
    name: '02-plumber', source: '02_trade_plumber.png',
    crop: { left: 0, top: 20, width: 1448, height: 815 }, flip: false,
    prompt: 'Animate this exact supplied photograph into a restrained photorealistic service-work shot. Preserve the same plumber, face, navy cap, navy work shirt, hands, sink, white drain pipes, kitchen and tools. The plumber makes one small controlled tightening adjustment at the existing pipe fitting, then pauses to inspect it. Hands and forearms move naturally while the pipe assembly stays stable. Subtle breathing and a small downward glance. Camera almost locked, very gentle cinematic drift. No leaks, no new tools or objects, no extra fingers, no face changes, no talking, no text, no logos, no cuts, no cartoon style. Maintain the same lighting and composition. Quiet premium website background.'
  },
  {
    name: '03-electrician', source: '03_trade_electrician.png',
    crop: { left: 0, top: 5, width: 1448, height: 815 }, flip: false,
    prompt: 'Animate the exact supplied photograph of the electrician, preserving the identical man, face, safety glasses, navy shirt, gloves, screwdriver and electrical panel. Depict a calm inspection of a safely isolated de-energized panel, not live electrical work. One subtle wrist adjustment with the existing screwdriver, a small head tilt and natural breathing; the equipment remains stationary. No sparks, flashes, exposed new wires, new tools, additional people, extra fingers, face morphing, text or logos. Nearly locked camera with a tiny cinematic push. No scene changes. Preserve the photographic style, framing and original light. Restrained hero-background motion.'
  },
  {
    name: '04-repair', source: '04_trade_repair_technician.png',
    crop: { left: 0, top: 5, width: 1448, height: 815 }, flip: false,
    prompt: 'Animate this exact photograph while preserving the same repair technician, his face, navy work clothes, existing screwdriver, washing machine and room. He makes a small natural wrist movement with the existing screwdriver, then pauses and looks at the repair area. Subtle breathing. The washing machine remains still. Static camera. Keep the original photographic style and lighting. No added people or objects, no text, no cuts. Restrained natural movement for a silent website background.'
  },
  {
    name: '05-hvac', source: '05_trade_hvac_technician.png',
    crop: { left: 0, top: 5, width: 1448, height: 815 }, flip: true,
    prompt: 'Animate the exact supplied HVAC maintenance photograph. Preserve the identical technician, face, navy cap, navy clothes, gloves, existing service gauges, hoses and outdoor AC equipment. The technician gently steadies the existing gauge and makes a small wrist adjustment, then studies it. A slight natural head nod and breathing motion; subtle leaf movement in the background. Keep the AC fan and equipment stationary. No added tools, people, leaks, smoke, sparks, extra fingers, face changes, text, logos, cartoon styling or cuts. Almost locked camera, very slight cinematic drift. Keep original photographic lighting and composition. Gentle motion for a website hero.'
  }
];

await mkdir(join(root, 'frames'), { recursive: true });
await mkdir(join(root, 'generated-clips'), { recursive: true });
const manifest = [];
for (const scene of scenes) {
  const buffer = await readFile(join(source, scene.source));
  let pipeline = sharp(buffer).extract(scene.crop);
  if (scene.flip) pipeline = pipeline.flop();
  await pipeline.resize(1280, 720).png().toFile(join(root, 'frames', `${scene.name}.png`));
  manifest.push({
    ...scene,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    provenance: 'User-supplied existing website asset. Original file not modified.',
    frame: `frames/${scene.name}.png`,
    sourceDimensions: await sharp(buffer).metadata().then(({ width, height }) => ({ width, height }))
  });
}
await writeFile(join(root, 'sources.json'), JSON.stringify({
  project: 'TamidZamin - Original photos in motion',
  flowProject: 'https://flow.google.com/project/0ec14cfb-053b-46fd-a345-d7a9f3954c7c',
  authorization: 'Google Flow permitted by user; free credits only; Help improve Flow off before uploading.',
  scenes: manifest
}, null, 2));
console.log(`Prepared ${manifest.length} original-photo frames; all source PNGs untouched.`);
