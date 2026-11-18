export const C = {
  ink: '#102d3a', navy: '#081721', blue: '#2878a0', cyan: '#73d6e5',
  paper: '#f4ede0', cream: '#ead8bb', mint: '#a9cdbb', rust: '#cc8d68',
  skin: '#d6a17f', skinShade: '#b77e60', hair: '#263b42', steel: '#a8bbc0'
};

export function path(ctx, d, fill, stroke = null, width = 2) {
  const shape = new Path2D(d);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (fill) { ctx.fillStyle = fill; ctx.fill(shape); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(shape); }
  ctx.restore();
}

export function line(ctx, points, color, width = 2) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke(); ctx.restore();
}

export function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.save(); ctx.fillStyle = fill; ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

export function round(ctx, x, y, w, h, r, fill, stroke = null, lw = 2) {
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  ctx.restore();
}

export function poly(ctx, points, fill, stroke = null, lw = 2) {
  path(ctx, `M${points.map(p => p.join(' ')).join('L')}Z`, fill, stroke, lw);
}

export function limb(ctx, points, width, color, shadowColor) {
  if (shadowColor) line(ctx, points.map(([x, y]) => [x + 3, y + 5]), shadowColor, width + 3);
  line(ctx, points, color, width);
}

export function tool(ctx, x, y, angle, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
  path(ctx, 'M-17 -12 L-8 -18 L-7 -4 L6 1 L15 -5 L16 -19 Q32 -3 19 14 L10 23 L8 100 Q8 111 0 111 Q-9 111 -9 100 L-10 23 L-21 12 Q-31 -2 -17 -12Z', '#bacdd1', '#44616d', 2);
  path(ctx, 'M-4 30 L3 30 L3 93 L-4 93Z', '#f3f5ec');
  ellipse(ctx, 0, 100, 3, 3, '#527783');
  ctx.restore();
}

export function head(ctx, x, y, scale = 1, options = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(options.tilt || 0);
  ctx.scale(scale * (options.flip ? -1 : 1), scale);
  const skin = options.skin || C.skin;
  const shade = options.skinShade || C.skinShade;
  const silver = options.hair === 'silver';
  const hair = silver ? '#d4d7cc' : C.hair;
  const hairShadow = silver ? '#9cafa9' : '#17303a';
  if (options.hair === 'long') {
    path(ctx, 'M-39 -47 Q-69 -20 -56 65 L-65 105 Q-32 121 18 105 L46 68 L45 -19 Q29 -70 -15 -67Z', hair);
  }
  path(ctx, 'M-25 34 L-24 91 Q1 106 26 86 L22 32Z', shade);
  path(ctx, 'M-17 42 L-16 82 Q2 93 23 79 L21 36Z', skin);
  const face = ctx.createLinearGradient(-42, -20, 42, 18);
  face.addColorStop(0, shade); face.addColorStop(.4, skin); face.addColorStop(1, '#eac09a');
  path(ctx, 'M-39 -33 Q-36 -61 0 -62 Q35 -63 44 -32 L42 -4 L54 17 Q56 23 43 26 L41 43 Q35 65 12 67 Q-18 63 -31 40 L-42 9Z', face);
  path(ctx, 'M-36 3 Q-55 -4 -52 14 Q-48 34 -35 29 L-29 17Z', skin);
  path(ctx, 'M-42 9 Q-48 4 -46 17 L-40 21', null, shade, 2.5);
  path(ctx, 'M-40 1 L-47 -29 Q-50 -54 -29 -65 Q-2 -83 26 -65 Q45 -56 47 -31 Q29 -24 13 -46 Q-6 -19 -29 -25 L-31 6Z', hair);
  path(ctx, 'M-38 -37 Q-22 -62 12 -61', null, silver ? '#edf0e3' : '#43565b', 5);
  if (silver) {
    path(ctx, 'M-48 -24 Q-67 -36 -52 -55 Q-36 -72 -17 -65 Q-44 -52 -38 -24Z', hair);
    path(ctx, 'M-22 12 Q-14 15 -7 12 M20 14 Q27 17 34 14 M-9 35 L-4 38', null, shade, 1.5);
  }
  path(ctx, 'M-19 -5 Q-11 -9 -3 -5 M22 -4 Q31 -7 37 -2', null, hairShadow, 3);
  if (options.blink) {
    path(ctx, 'M-18 4 Q-11 8 -4 4 M24 5 Q29 8 35 5', null, C.ink, 2.5);
  } else {
    ellipse(ctx, -10, 5, 6.2, 4.1, '#f8f3e8');
    ellipse(ctx, 29, 6, 5.2, 3.8, '#f8f3e8');
    ellipse(ctx, -7, 5, 2.8, 3.5, C.ink);
    ellipse(ctx, 31, 6, 2.6, 3.3, C.ink);
    path(ctx, 'M-17 1 Q-10 -2 -4 1 M24 2 Q30 0 35 3', null, C.ink, 1.6);
  }
  path(ctx, 'M21 10 L20 25 Q24 29 30 25', null, shade, 2.4);
  path(ctx, options.smile === false ? 'M9 42 Q21 45 31 39' : 'M5 38 Q20 50 34 37', null, '#8a594b', 2.8);
  if (options.smile !== false) path(ctx, 'M10 40 Q22 46 30 40', null, '#f3ddbd', 2);
  path(ctx, 'M-10 52 Q4 63 17 59', null, shade, 2);
  if (options.cap) {
    path(ctx, 'M-50 -35 Q-47 -84 -9 -85 Q29 -87 43 -44 L43 -31 Q-5 -44 -50 -35Z', '#2d7190');
    path(ctx, 'M-47 -36 Q6 -51 44 -36 L72 -26 Q76 -19 61 -17 L27 -22 Q-7 -35 -47 -29Z', '#183e52');
    path(ctx, 'M-6 -78 Q13 -66 12 -45', null, '#5b9aac', 2);
    round(ctx, -19, -63, 23, 12, 4, '#a2ced0');
  }
  ctx.restore();
}

export function plant(ctx, x, y, scale = 1, sway = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  path(ctx, 'M-35 0 L-26 77 Q0 91 26 77 L36 0Z', '#c99570');
  ellipse(ctx, 0, 1, 38, 11, '#6d6f58');
  for (let i = 0; i < 6; i++) {
    ctx.save(); ctx.rotate((i - 2.5) * .28 + sway);
    path(ctx, 'M0 5 Q-21 -31 -3 -111 Q33 -79 8 -21Z', i % 2 ? '#527f70' : '#83aa8a');
    path(ctx, 'M0 1 Q3 -39 -3 -100', null, '#adc8a3', 1.4);
    ctx.restore();
  }
  ctx.restore();
}
