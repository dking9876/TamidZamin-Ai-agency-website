import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname,join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const require=createRequire(join(root,'..','website','package.json'));
const {chromium}=require('@playwright/test');
const {default:AxeBuilder}=require('@axe-core/playwright');
const sharp=require('sharp');
const names=['01-message-playground','02-little-service-street','03-helpful-workshop'];
const report={media:[],loops:[],textSafe:[],interaction:[],accessibility:[],errors:[]};
await mkdir(join(root,'verification'),{recursive:true});
for(const name of process.argv.includes('--ui-only')?[]:names){
  for(const [suffix,width,height] of [['',1920,1080],['-mobile',960,960],['-phone-preview',720,1280]]){
    const file=join(root,'videos',`${name}${suffix}.mp4`);
    const probe=spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'});
    assert.equal(probe.status,0,probe.stderr);
    const data=JSON.parse(probe.stdout);
    assert.equal(data.streams.length,1);
    assert.equal(data.streams[0].codec_name,'h264');
    assert.equal(data.streams[0].width,width);
    assert.equal(data.streams[0].height,height);
    assert.equal(data.streams[0].r_frame_rate,'24/1');
    assert.equal(Number(data.streams[0].nb_frames),288);
    assert(Math.abs(Number(data.format.duration)-12)<.02);
    const bytes=await readFile(file);
    assert(bytes.indexOf('moov')<bytes.indexOf('mdat'));
    assert(bytes.length<6000000,`${name}${suffix}: exceeds 6MB budget`);
    const decode=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-i',file,'-f','null','-'],{encoding:'utf8'});
    assert.equal(decode.status,0,decode.stderr);
    assert.equal(decode.stderr.trim(),'');
    report.media.push({name:`${name}${suffix}`,resolution:`${width}x${height}`,seconds:12,bytes:bytes.length,silent:true,decoded:true,fastStart:true});
  }
}
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader']});
try{
  for(let i=0;i<3;i++){
    const context=await browser.newContext({viewport:{width:1440,height:810}});
    const page=await context.newPage();
    page.on('pageerror',error=>report.errors.push(error.message));
    await page.goto(`http://127.0.0.1:4319/?render=1&scene=${i}&layout=desktop`);
    await page.waitForFunction(()=>window.animationReady);
    await page.evaluate(()=>window.renderFrame(0));
    const first=await page.screenshot();
    await page.evaluate(()=>window.renderFrame(12));
    const seam=await page.screenshot();
    const a=await sharp(first).removeAlpha().raw().toBuffer();
    const b=await sharp(seam).removeAlpha().raw().toBuffer();
    let delta=0;
    for(let n=0;n<a.length;n++)delta+=Math.abs(a[n]-b[n]);
    const average=delta/a.length;
    assert(average<.1,`${names[i]} loop endpoints differ: ${average}`);
    report.loops.push({name:names[i],endpointMeanPixelDifference:average});
    for(const time of [0,3,6,9]){
      await page.evaluate(t=>window.renderFrame(t),time);
      const picture=await page.screenshot();
      const pixels=await sharp(picture).extract({left:0,top:0,width:Math.floor(1440*.48),height:810}).removeAlpha().raw().toBuffer();
      let bright=0;
      for(let n=0;n<pixels.length;n+=3)if(Math.max(pixels[n],pixels[n+1],pixels[n+2])>100)bright++;
      const fraction=bright/(pixels.length/3);
      assert(fraction<.005,`${names[i]} has bright moving art behind the left headline`);
      report.textSafe.push({name:names[i],time,brightFractionInLeft48Percent:fraction});
    }
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:1100}});
  const page=await context.newPage();
  page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto('http://127.0.0.1:4319/');
  await page.waitForFunction(()=>window.animationReady);
  for(let i=0;i<3;i++){
    await page.locator(`[data-scene="${i}"]`).click();
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(()=>window.heroDebug().index),i);
    await page.locator('#react').click();
    await page.waitForTimeout(100);
    assert((await page.evaluate(()=>window.heroDebug().pulse))>0);
    await page.mouse.move(1200,550);
    await page.waitForTimeout(300);
    assert(Math.abs(await page.evaluate(()=>window.heroDebug().interaction.x))>.1);
    await page.locator('#pause').click();
    assert.equal(await page.evaluate(()=>window.heroDebug().running),false);
    await page.evaluate(()=>window.renderFrame(3));
    await page.locator('#hero').screenshot({path:join(root,'verification',`${names[i]}-on-hero.png`)});
    report.interaction.push(`${names[i]}: scene switch, pointer response, button response, pause verified`);
  }
  await page.locator('#raw').click();
  assert(await page.locator('#hero').evaluate(e=>e.classList.contains('raw')));
  await page.locator('#raw').click();
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:1000});
    await page.waitForTimeout(200);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);
    if(width===390)await page.screenshot({path:join(root,'verification','mobile-interactive-preview.png'),fullPage:true});
  }
  const accessibility=await new AxeBuilder({page}).analyze();
  report.accessibility=accessibility.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));
  assert.equal(accessibility.violations.length,0,JSON.stringify(report.accessibility));
  await page.locator('#pause').click();
  await page.evaluate(()=>{
    document.body.style.paddingBottom='1500px';
    window.scrollTo(0,document.documentElement.scrollHeight);
  });
  await page.waitForTimeout(300);
  const pausedTime=await page.evaluate(()=>window.heroDebug().seconds);
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(()=>window.heroDebug().seconds),pausedTime,'Offscreen scene should stop');
  report.interaction.push('Offscreen animation pauses');

  const reduceContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const reduce=await reduceContext.newPage();
  await reduce.goto('http://127.0.0.1:4319/');
  await reduce.waitForFunction(()=>window.animationReady);
  assert.equal(await reduce.evaluate(()=>window.heroDebug().running),false);
  assert.equal(await reduce.evaluate(()=>window.heroDebug().seconds),0);
  await reduce.locator('#pause').click();
  assert.equal(await reduce.evaluate(()=>window.heroDebug().running),true);
  report.interaction.push('Reduced-motion starts still and permits explicit playback');
  await reduceContext.close();

  const failureContext=await browser.newContext();
  await failureContext.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){if(type.startsWith('webgl'))return null;return original.call(this,type,...args);};
  });
  const failure=await failureContext.newPage();
  await failure.goto('http://127.0.0.1:4319/');
  await failure.waitForFunction(()=>window.animationError);
  assert(await failure.locator('#canvas').evaluate(e=>e.hidden));
  assert(await failure.locator('#fallback').evaluate(e=>e.complete&&e.naturalWidth>0));
  assert((await failure.locator('#status').textContent()).includes('could not load'));
  report.interaction.push('WebGL failure shows poster and explicit error');
  await failureContext.close();
  assert.equal(report.errors.length,0,report.errors.join('\n'));
}finally{
  await browser.close();
  await writeFile(join(root,'verification','results.json'),JSON.stringify(report,null,2));
}
console.log(JSON.stringify(report,null,2));
