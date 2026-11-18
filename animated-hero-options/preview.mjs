import { createHero, options } from './engine.mjs';
const params=new URLSearchParams(location.search);
const recording=params.has('render');
const layout=params.get('layout')||'desktop';
const canvas=document.getElementById('canvas');
const artwork=document.getElementById('artwork');
const status=document.getElementById('status');
const pause=document.getElementById('pause');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const narrow=matchMedia('(max-width: 700px)');
const connection=navigator.connection;
let current=null;
let index=Math.max(0,Math.min(2,Number(params.get('scene')||0)));
if(!Number.isInteger(index))index=0;
let running=!reduced.matches&&!connection?.saveData;
let visible=true;
let seconds=0,last=0,raf=0,pulse=0;
let pointer={x:0,y:0};
if(recording)document.body.classList.add('render');
if(layout==='phone-template')document.body.classList.add('phone-template');

function resize(){
  const rect=artwork.getBoundingClientRect();
  const mobile=recording?layout!=='desktop':narrow.matches;
  current?.resize(rect.width,rect.height,mobile);
  current?.render(seconds);
}
function setScene(value){
  if(current)current.dispose();
  index=value;seconds=0;pulse=0;last=0;
  const option=options[index];
  document.querySelectorAll('[data-scene]').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  document.getElementById('scene-title').textContent=option.name;
  document.getElementById('description').textContent=option.description;
  document.getElementById('download').href=`videos/${option.id}.mp4`;
  document.getElementById('phone-download').href=`videos/${option.id}-phone-preview.mp4`;
  document.getElementById('mobile-download').href=`videos/${option.id}-mobile.mp4`;
  document.getElementById('fallback').src=`posters/${option.id}${narrow.matches?'-mobile':''}.jpg`;
  document.getElementById('phone-label').textContent=`${option.name} · Animation preview`;
  try{
    current=createHero(canvas,index,{mobile:layout!=='desktop',quality:recording?'render':'live'});
    current.interaction.reduced=reduced.matches;
    resize();
    window.animationReady=true;
    status.textContent=running?'Move your mouse or tap the artwork to make it react.':'Paused. Play when you want; reduced-motion and data-saving preferences are respected.';
  }catch(error){
    canvas.hidden=true;
    window.animationError=error.message;
    window.animationReady=false;
    status.textContent='The interactive scene could not load. The poster is shown instead; you can also download the MP4.';
    console.error(error);
  }
  updatePause();
}
function updatePause(){pause.textContent=running?'Pause animation':'Play animation';}
function animate(now){
  const dt=last?Math.min(.05,(now-last)/1000):0;
  last=now;
  if(current&&running&&visible&&!document.hidden){
    seconds=(seconds+dt)%12;
    pulse=Math.max(0,pulse-dt/1.3);
    current.interaction.x+=(pointer.x-current.interaction.x)*.06;
    current.interaction.y+=(pointer.y-current.interaction.y)*.06;
    current.interaction.pulse=Math.sin(pulse*Math.PI/2);
    current.render(seconds);
  }
  raf=requestAnimationFrame(animate);
}
function react(){
  if(!current)return;
  if(reduced.matches){
    status.textContent='Interaction acknowledged. Motion stays reduced; press Play animation if you want to watch.';
    return;
  }
  pulse=1;
  if(!running){running=true;updatePause();}
  status.textContent='The scene is reacting. This is only an illustration; nothing is sent.';
}
document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>setScene(Number(button.dataset.scene))));
pause.addEventListener('click',()=>{
  running=!running;
  if(current)current.interaction.reduced=reduced.matches&&!running;
  updatePause();
  status.textContent=running?'Playing the animated scene.':'Paused. Press Play animation to continue.';
});
document.getElementById('react').addEventListener('click',react);
document.getElementById('raw').addEventListener('click',event=>{
  const raw=document.getElementById('hero').classList.toggle('raw');
  event.currentTarget.setAttribute('aria-pressed',String(raw));
  resize();
});
artwork.addEventListener('pointermove',event=>{
  const rect=artwork.getBoundingClientRect();
  pointer={x:((event.clientX-rect.left)/rect.width-.5)*2,y:((event.clientY-rect.top)/rect.height-.5)*2};
});
artwork.addEventListener('pointerleave',()=>{pointer={x:0,y:0};});
artwork.addEventListener('pointerup',react);
canvas.addEventListener('webglcontextlost',event=>{
  event.preventDefault();running=false;canvas.hidden=true;window.animationError='WebGL context lost';
  status.textContent='The 3D renderer stopped. A still poster is shown; reload to try again or watch the MP4.';
  updatePause();
});
new ResizeObserver(resize).observe(artwork);
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;last=0;},{threshold:.1}).observe(artwork);
document.addEventListener('visibilitychange',()=>{last=0;});
reduced.addEventListener('change',()=>{
  if(reduced.matches){running=false;pointer={x:0,y:0};pulse=0;updatePause();if(current){Object.assign(current.interaction,{x:0,y:0,pulse:0,reduced:true});current.render(seconds);}status.textContent='Paused because reduced motion is enabled.';}
});
connection?.addEventListener('change',()=>{if(connection.saveData){running=false;updatePause();status.textContent='Paused because data saving is enabled.';}});
setScene(index);
window.renderFrame=t=>{
  if(!current||window.animationError)throw new Error(window.animationError||'Scene unavailable');
  seconds=t;
  Object.assign(current.interaction,{x:0,y:0,pulse:0,reduced:false});
  current.render(t);
  return {drawCalls:current.renderer.info.render.calls,triangles:current.renderer.info.render.triangles};
};
window.heroDebug=()=>({index,seconds,running,visible,pulse,interaction:current?{...current.interaction}:null,error:window.animationError||null});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);current?.dispose();});
if(!recording)raf=requestAnimationFrame(animate);
