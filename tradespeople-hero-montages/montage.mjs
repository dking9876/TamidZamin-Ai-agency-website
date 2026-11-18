import { drawPlumbing } from './scene-plumbing.mjs';
import { drawHVAC } from './scene-hvac.mjs';
import { drawArrival, drawContact } from './scene-home.mjs';

export const edits = [
  {
    name: 'A service day', file: '01-a-service-day',
    description: 'A doorstep greeting, a plumber at the sink, an HVAC repair, and a homeowner making contact.',
    shots: ['arrival', 'plumbing', 'hvac', 'contact'], zoom: 1
  },
  {
    name: 'Hands at work', file: '02-hands-at-work',
    description: 'Closer views of the plumber and HVAC technician working, followed by a friendly doorstep moment.',
    shots: ['plumbing', 'hvac', 'arrival'], zoom: 1.12
  },
  {
    name: 'From home to help', file: '03-from-home-to-help',
    description: 'The homeowner starts the story, followed by the greeting and two hands-on trade scenes.',
    shots: ['contact', 'arrival', 'plumbing', 'hvac'], zoom: 1.025
  }
];

const scenes = { plumbing: drawPlumbing, hvac: drawHVAC, arrival: drawArrival, contact: drawContact };
const layers = Array.from({ length: 2 }, () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1600; canvas.height = 900;
  return { canvas, ctx: canvas.getContext('2d', { alpha: false }) };
});

export function shotAt(t, editIndex = 0) {
  const edit = edits[editIndex];
  if (!edit) throw new RangeError(`Unknown edit ${editIndex}`);
  const time = ((t + .35) % 12 + 12) % 12;
  const length = 12 / edit.shots.length;
  const index = Math.floor(time / length);
  return {
    edit, name: edit.shots[index], previous: edit.shots[(index + edit.shots.length - 1) % edit.shots.length],
    local: time - index * length, length
  };
}

function drawLayer(layer, name, local) {
  layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
  layer.ctx.globalAlpha = 1;
  scenes[name](layer.ctx, local);
}

function place(ctx, layer, local, zoom, square, alpha) {
  const push = zoom + Math.min(local / 4, 1) * .024;
  const sourceWidth = (square ? 900 : 1600) / push;
  const sourceHeight = 900 / push;
  const anchor = square ? 1145 : 1160;
  const sx = Math.max(0, Math.min(1600 - sourceWidth, anchor - sourceWidth / 2));
  const sy = (900 - sourceHeight) * .42;
  ctx.globalAlpha = alpha;
  ctx.drawImage(layer.canvas, sx, sy, sourceWidth, sourceHeight, 0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function render(ctx, t, { edit = 0, square = false, clean = false, scene = null } = {}) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  if (scene) {
    if (!scenes[scene]) throw new RangeError(`Unknown scene ${scene}`);
    drawLayer(layers[0], scene, t);
    place(ctx, layers[0], t, 1, square, 1);
  } else {
    const shot = shotAt(t, edit);
    const transition = Math.min(1, shot.local / .30);
    const blend = transition * transition * (3 - 2 * transition);
    if (blend < 1) {
      drawLayer(layers[0], shot.previous, shot.length + shot.local);
      place(ctx, layers[0], shot.length + shot.local, shot.edit.zoom, square, 1);
    }
    drawLayer(layers[1], shot.name, shot.local);
    place(ctx, layers[1], shot.local, shot.edit.zoom, square, blend);
  }
  ctx.globalAlpha = 1;
  if (!clean && !square) {
    const scrim = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
    scrim.addColorStop(0, 'rgba(8,23,33,.98)');
    scrim.addColorStop(.43, 'rgba(8,23,33,.94)');
    scrim.addColorStop(.52, 'rgba(8,23,33,.88)');
    scrim.addColorStop(.66, 'rgba(8,23,33,.30)');
    scrim.addColorStop(.87, 'rgba(8,23,33,.10)');
    scrim.addColorStop(1, 'rgba(8,23,33,.16)');
    ctx.fillStyle = scrim; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
  const shade = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  shade.addColorStop(0, 'rgba(8,23,33,.08)');
  shade.addColorStop(.72, 'rgba(8,23,33,0)');
  shade.addColorStop(1, 'rgba(8,23,33,.20)');
  ctx.fillStyle = shade; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  return { time: t, shot: scene || shotAt(t, edit).name, edit };
}
