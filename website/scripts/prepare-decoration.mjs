import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve('public\\images');
await mkdir(output, { recursive: true });
const edgeSvg = (paths) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="250" viewBox="0 0 1024 250"><defs><filter id="wide" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="10"/></filter><filter id="near" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="2"/></filter></defs><g fill="none" stroke="#008fff" stroke-width="17" opacity=".35" filter="url(#wide)"><path d="${paths}"/></g><g fill="none" stroke="#009fff" stroke-width="5" filter="url(#near)"><path d="${paths}"/></g><path d="${paths}" fill="none" stroke="#39c7ff" stroke-width="1.5"/><path d="${paths}" fill="none" stroke="#d6f8ff" stroke-width=".5"/></svg>`;
const svgs = {
  'blue-edge': edgeSvg('M-80 189C28 175 44 221 147 230S286 211 351 250M1080 205C1010 223 924 228 861 250'),
  'edge-band': edgeSvg('M-60 12C35 20 48 239 240 253M1080 20C1000 45 1015 240 805 253'),
  'pale-waves': '<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="600" viewBox="0 0 2048 600"><rect width="2048" height="600" fill="#f5f9fe"/><g fill="none"><path d="M-180 60C140 0 180 450 610 515S1030 530 1270 730M2200 20C1850 40 1780 500 1360 530" stroke="#e4f0fd" stroke-width="65" opacity=".55"/><path d="M-180 87C160 30 210 466 620 539M2200 90C1880 90 1760 510 1370 560" stroke="#fff" stroke-width="4" opacity=".85"/></g></svg>',
  'connector': '<svg xmlns="http://www.w3.org/2000/svg" width="560" height="480" viewBox="0 0 280 240"><defs><filter id="g" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="7"/></filter></defs><g stroke="#009eff" fill="none" stroke-width="8" filter="url(#g)"><path d="M0 120h55m170 0h55"/><circle cx="140" cy="120" r="82"/></g><circle cx="140" cy="120" r="82" fill="#061823" stroke="#35c5ff" stroke-width="2"/><circle cx="140" cy="120" r="79" fill="none" stroke="#cff5ff" stroke-width="1"/><path d="M0 120h23l3-10 4 22 5-18 4 12 4-6h13m170 0h6l3-12 4 24 4-18 4 12 4-6h29" stroke="#26bfff" stroke-width="1.4" fill="none"/></svg>',
  'process-medallion': '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 96 96"><defs><radialGradient id="b"><stop stop-color="#fff"/><stop offset=".6" stop-color="#f5fbff"/><stop offset=".86" stop-color="#b4e1ff"/><stop offset="1" stop-color="#eaf7ff"/></radialGradient><filter id="g"><feGaussianBlur stdDeviation="4"/></filter></defs><circle cx="48" cy="50" r="36" fill="#2aabff" opacity=".3" filter="url(#g)"/><circle cx="48" cy="46" r="33" fill="url(#b)" stroke="#a1d6ff"/><path d="M22 56a28 28 0 0 0 52 0" fill="none" stroke="#229cff" stroke-width="2" opacity=".7"/><circle cx="48" cy="46" r="30" fill="none" stroke="#fff" opacity=".8"/></svg>',
  'step-arrow': '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="32" viewBox="0 0 40 16"><path d="M34 8H6m6-5L6 8l6 5" stroke="#087be7" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
for (const [name, svg] of Object.entries(svgs)) {
  const path = resolve(output, `${name}.webp`);
  let image = sharp(Buffer.from(svg));
  if (name === 'blue-edge') image = image.resize(1024, 250);
  if (name === 'connector') image = image.resize(280, 240);
  await image.webp({ quality: 80, alphaQuality: 70, effort: 6 }).toFile(path);
  await writeFile(`${path}.json`, JSON.stringify({
    prompt: `Origin: original code-authored decorative ${name} asset, rendered by scripts/prepare-decoration.mjs with Sharp. Reconstructs neutral electric-blue UI decoration from the user-approved TamidZamin reference. Not a crop or screenshot of the reference; contains no factual claims or customer data.`,
    createdAt: new Date().toISOString(),
  }, null, 2));
}
console.log(`Created ${Object.keys(svgs).length} reusable decorative rasters and their provenance sidecars.`);
