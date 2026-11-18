import { THREE, H, C } from './art-kit.mjs';
import { createScene as playground } from './scene-playground.mjs';
import { createScene as street } from './scene-street.mjs';
import { createScene as workshop } from './scene-workshop.mjs';

export const options = [
  {id:'01-message-playground',name:'Message Playground',description:'A friendly helper, a toy-like phone and little messages finding their place. Playful, clear and the most directly connected to TamidZamin.'},
  {id:'02-little-service-street',name:'Little Service Street',description:'A tiny neighborhood comes to life: a service van, welcoming homes and animated conversations. A miniature world built around service businesses.'},
  {id:'03-helpful-workshop',name:'Helpful Workshop',description:'A cheerful helper keeps the workshop moving. Tactile tools and animated message cards bring a warm, hands-on feel to the hero.'},
];
const factories=[playground,street,workshop];

export function createHero(canvas,index,{mobile=false,quality='live'}={}){
  if(!factories[index])throw new Error(`Unknown scene ${index}`);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(quality==='render'?1:Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(C.navy);
  const root=new THREE.Group();
  scene.add(root);
  const world=factories[index]({THREE,H,C,root});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.25}));
  floor.rotation.x=-Math.PI/2;
  floor.position.y=-.015;
  floor.receiveShadow=true;
  scene.add(floor);
  scene.add(new THREE.HemisphereLight('#d5efff','#21374a',2.2));
  const key=new THREE.DirectionalLight('#fff0de',3.4);
  key.position.set(-4,10,9);
  key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{left:-8,right:8,top:9,bottom:-8,near:.1,far:35});
  key.shadow.normalBias=.035;
  key.shadow.bias=-.0002;
  key.shadow.radius=4;
  scene.add(key);
  const fill=new THREE.DirectionalLight('#63ccff',1.8);
  fill.position.set(6,5,-4);
  scene.add(fill);
  const front=new THREE.DirectionalLight('#ffffff',.5);
  front.position.set(3,3,12);
  scene.add(front);
  const camera=new THREE.OrthographicCamera();
  camera.position.set(9,7,12);
  camera.lookAt(0,2.2,0);
  camera.near=.1;
  camera.far=100;
  let disposed=false;
  const interaction={x:0,y:0,pulse:0,reduced:false};
  function resize(width,height,isMobile=mobile){
    if(width<=0||height<=0)return;
    const aspect=width/height;
    const span=isMobile?9.5/aspect:10.1;
    const viewWidth=span*aspect;
    const center=isMobile?.5:.765;
    camera.left=-viewWidth*center;
    camera.right=viewWidth*(1-center);
    camera.top=span/2;
    camera.bottom=-span/2;
    camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
  }
  function render(t){
    if(disposed)return;
    world.update(t,interaction);
    root.rotation.y=interaction.reduced?0:interaction.x*.045;
    root.rotation.x=interaction.reduced?0:interaction.y*.018;
    renderer.render(scene,camera);
  }
  function dispose(){
    disposed=true;
    const geometries=new Set();
    scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);});
    geometries.forEach(geometry=>geometry.dispose());
    floor.material.dispose();
    renderer.dispose();
  }
  return {render,resize,dispose,interaction,renderer,scene,root};
}
