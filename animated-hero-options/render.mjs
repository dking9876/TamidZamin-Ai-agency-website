import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const require=createRequire(join(root,'..','website','package.json'));
const {chromium}=require('@playwright/test');
const sharp=require('sharp');
const names=['01-message-playground','02-little-service-street','03-helpful-workshop'];
const stills=process.argv.includes('--stills');
const requested=process.argv.find(arg=>/^[0-2]$/.test(arg));
const selected=requested===undefined?[0,1,2]:[Number(requested)];
const duration=12,fps=24;
await Promise.all(['videos','posters','verification'].map(name=>mkdir(join(root,name),{recursive:true})));
function ffmpeg(args){
  const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8'});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(result.stderr||`FFmpeg failed: ${result.status}`);
}
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader']});
try{
  for(const index of selected){
    for(const mobile of [false,true]){
      const width=mobile?960:1920,height=mobile?960:1080;
      const layout=mobile?'square':'desktop';
      const name=names[index]+(mobile?'-mobile':'');
      const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(`http://127.0.0.1:4319/?render=1&scene=${index}&layout=${layout}`);
      await page.waitForFunction(()=>window.animationReady||window.animationError);
      const initError=await page.evaluate(()=>window.animationError);
      if(initError)throw new Error(initError);
      await page.evaluate(()=>document.fonts.ready);
      const stats=await page.evaluate(()=>window.renderFrame(0));
      console.log(`${name}: ${stats.drawCalls} draw calls, ${stats.triangles} triangles`);
      if(stills){
        for(const t of [0,3,6,9,12]){
          await page.evaluate(t=>window.renderFrame(t),t);
          await page.screenshot({path:join(root,'verification',`${name}-${t}.png`)});
        }
      }else{
        const output=join(root,'videos',`${name}.mp4`);
        const encoder=spawn('ffmpeg',[
          '-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','png','-i','pipe:0',
          '-an','-c:v','libx264','-preset','medium','-crf',mobile?'24':'22','-pix_fmt','yuv420p',
          '-threads','4','-maxrate',mobile?'1600k':'3200k','-bufsize',mobile?'3200k':'6400k',
          '-g','48','-movflags','+faststart','-map_metadata','-1','-metadata',`title=TamidZamin - ${names[index]}`,output
        ],{stdio:['pipe','ignore','pipe']});
        let stderr='';
        encoder.stderr.on('data',data=>{stderr+=data.toString();});
        const completion=once(encoder,'close');
        encoder.stdin.on('error',error=>{stderr+=`\n${error.message}`;});
        try{
          for(let frame=0;frame<duration*fps;frame++){
            if(encoder.exitCode!==null)throw new Error(stderr||'Encoder stopped');
            await page.evaluate(t=>window.renderFrame(t),frame/fps);
            const image=await page.screenshot({type:'png'});
            if(frame===0)await sharp(image).jpeg({quality:90}).toFile(join(root,'posters',`${name}.jpg`));
            if(!encoder.stdin.write(image))await once(encoder.stdin,'drain');
            if(frame%72===0)console.log(`${name}: ${frame}/${duration*fps} frames`);
          }
          encoder.stdin.end();
          const [code]=await completion;
          if(code!==0)throw new Error(stderr||`Encoder exited ${code}`);
        }catch(error){
          encoder.kill();
          throw error;
        }
      }
      if(errors.length)throw new Error(errors.join('\n'));
      await context.close();
    }
    if(!stills){
      const context=await browser.newContext({viewport:{width:720,height:560},deviceScaleFactor:1});
      const page=await context.newPage();
      await page.goto(`http://127.0.0.1:4319/?render=1&scene=${index}&layout=phone-template`);
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForFunction(()=>document.getElementById('phone-label').textContent.includes('Animation preview'));
      const panel=join(root,'verification',`${names[index]}-phone-panel.png`);
      await page.locator('.phone-footer').screenshot({path:panel});
      ffmpeg([
        '-i',join(root,'videos',`${names[index]}-mobile.mp4`),'-loop','1','-i',panel,
        '-filter_complex','[0:v]scale=720:720:flags=lanczos[top];[top][1:v]vstack=inputs=2,format=yuv420p[out]',
        '-map','[out]','-t',String(duration),'-r',String(fps),'-an','-c:v','libx264','-preset','medium','-crf','22',
        '-threads','4','-movflags','+faststart',join(root,'videos',`${names[index]}-phone-preview.mp4`)
      ]);
      await context.close();
      console.log(`Finished ${names[index]}: desktop, square mobile, phone preview`);
    }
  }
}finally{await browser.close();}
