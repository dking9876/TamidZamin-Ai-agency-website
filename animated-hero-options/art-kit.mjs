import * as THREE from './vendor/three.module.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

export const C = {
  navy: '#081721', ink: '#112c45', dark: '#102e49', blue: '#1484ed',
  cyan: '#61d8ff', ice: '#eaf7ff', mint: '#a1efd4', peach: '#ffbd8b',
  floor: '#0b2233', line: '#31556e', white: '#ffffff', slate: '#547995',
};
const materials = new Map();
function material(color) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .36, metalness: .08 }));
  return materials.get(color);
}
function mesh(parent, geometry, color, position = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material(color));
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
function group(parent, position = [0, 0, 0]) {
  const object = new THREE.Group();
  object.position.set(...position);
  parent.add(object);
  return object;
}
function box(parent, size, color, position = [0, 0, 0], radius = .1) {
  const bevel = Math.min(radius, ...size.map(v => v / 2 - .001));
  return mesh(parent, new RoundedBoxGeometry(...size, 3, Math.max(.001, bevel)), color, position);
}
function sphere(parent, radius, color, position = [0, 0, 0]) {
  return mesh(parent, new THREE.SphereGeometry(radius, 24, 16), color, position);
}
function cylinder(parent, top, bottom, height, color, position = [0, 0, 0]) {
  return mesh(parent, new THREE.CylinderGeometry(top, bottom, height, 48), color, position);
}
function torus(parent, radius, tube, color, position = [0, 0, 0], arc = Math.PI * 2) {
  return mesh(parent, new THREE.TorusGeometry(radius, tube, 10, 64, arc), color, position);
}
function tube(parent, points, radius, color) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(parent, new THREE.TubeGeometry(curve, Math.max(12, points.length * 6), radius, 8, false), color);
}
function bubble(parent, { position = [0, 0, 0], scale = 1, color = C.mint, kind = 'dots' } = {}) {
  const g = group(parent, position);
  g.scale.setScalar(scale);
  box(g, [1.32, .82, .25], color, [0, 0, 0], .22);
  const tail = box(g, [.28, .3, .2], color, [-.37, -.35, 0], .04);
  tail.rotation.z = .55;
  const marks = group(g, [0, 0, .145]);
  const ink = color === C.ice || color === C.mint || color === C.peach ? C.ink : C.ice;
  if (kind === 'phone') {
    tube(marks, [[-.21,.22,0],[-.28,.08,0],[-.16,-.14,0],[.09,-.24,0],[.23,-.15,0]], .07, ink);
    box(marks, [.16,.2,.08], ink, [-.17,.23,0], .04).rotation.z = -.4;
    box(marks, [.2,.15,.08], ink, [.23,-.13,0], .04).rotation.z = -.4;
  } else if (kind === 'lines') {
    box(marks, [.62,.075,.05], ink, [0,.12,0], .03);
    box(marks, [.43,.075,.05], ink, [-.095,-.08,0], .03);
  } else {
    for (let i = 0; i < 3; i++) sphere(marks, .072, ink, [(i-1)*.25, .02, 0]);
  }
  return { group: g, marks };
}
function robot(parent, { position = [0, 0, 0], scale = 1 } = {}) {
  const g = group(parent, position);
  g.scale.setScalar(scale);
  const body = box(g, [.95,.75,.7], C.ice, [0,.63,0], .25);
  box(g, [.47,.09,.04], C.cyan, [0,.69,.36], .04);
  const head = group(g, [0,1.52,0]);
  box(head, [1.4,.95,.8], C.ice, [0,0,0], .29);
  box(head, [1.15,.62,.11], C.dark, [0,-.01,.41], .2);
  const eyes = [-.25,.25].map(x => box(head, [.12,.21,.08], C.cyan, [x,.03,.49], .05));
  tube(head, [[-.14,-.17,.49],[0,-.21,.5],[.14,-.17,.49]], .025, C.mint);
  cylinder(head, .035,.035,.28,C.slate,[0,.6,0]);
  sphere(head,.095,C.mint,[0,.79,0]);
  sphere(head,.13,C.blue,[-.76,0,0]);
  sphere(head,.13,C.blue,[.76,0,0]);
  const arms = [-1,1].map(side => {
    const arm = group(g,[side*.6,.9,0]);
    box(arm,[.25,.62,.3],C.blue,[0,-.2,0],.12);
    sphere(arm,.16,C.ice,[0,-.53,0]);
    arm.rotation.z=side*.2;
    return arm;
  });
  [-.28,.28].forEach(x=>box(g,[.4,.24,.63],C.blue,[x,.14,.08],.1));
  return { group:g,head,eyes,arms,body };
}
function phone(parent, { position = [0,0,0], scale = 1 } = {}) {
  const g = group(parent,position);
  g.scale.setScalar(scale);
  box(g,[2.08,3.68,.37],C.slate,[0,0,0],.28);
  box(g,[1.99,3.59,.32],C.ice,[0,0,.06],.24);
  box(g,[1.77,3.33,.07],C.dark,[0,0,.245],.18);
  box(g,[.63,.105,.07],C.ink,[0,1.5,.3],.05);
  box(g,[.44,.05,.06],C.ice,[0,-1.47,.3],.025);
  const messages = group(g,[0,0,.31]);
  bubble(messages,{position:[-.12,.87,0],scale:.83,color:C.mint,kind:'dots'});
  bubble(messages,{position:[.12,.01,0],scale:.83,color:C.blue,kind:'lines'});
  bubble(messages,{position:[-.12,-.85,0],scale:.68,color:C.ice,kind:'phone'});
  return { group:g,messages };
}
function wrench(parent, { position=[0,0,0], scale=1, color=C.ice }={}) {
  const g=group(parent,position);
  g.scale.setScalar(scale);
  box(g,[.22,1.15,.18],color,[0,-.1,0],.09);
  const jaw=torus(g,.31,.11,color,[0,.62,0],Math.PI*1.5);
  jaw.rotation.z=-Math.PI*.25;
  torus(g,.13,.07,color,[0,-.73,0]);
  return g;
}
function blink(eyes, phase) {
  const value = Math.pow(Math.max(0, Math.cos(phase)), 42);
  eyes.forEach(eye=>{eye.scale.y=1-value*.88;});
}
export const H = { group,box,sphere,cylinder,torus,tube,bubble,robot,phone,wrench,blink,material };
export { THREE };
