// Optional browser verification: requires Playwright and an installed Chromium.
// Usage: ATLAS_URL=http://127.0.0.1:8766 node tests/browser-atlas.cjs
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 if(process.env.ATLAS_DELAY_LEGACY_INIT==='1')await page.addInitScript(()=>{
   const original=window.setTimeout;window.atlasBootOrder=[];
   window.setTimeout=function(fn,delay,...args){const name=fn?.name;
     if(name==='init21')delay+=2400;
     if(name==='init21'||name==='installLate25'){const callback=fn;fn=function(){atlasBootOrder.push({name,legacyReady:!!window.__UPRS_V21_INIT__});return callback(...args)}}
     return original(fn,delay,...args);
   };
 });
 await page.goto((process.env.ATLAS_URL||'http://127.0.0.1:8766')+'/index.html');
 // Existing installers intentionally run for 31 seconds; verify their final state.
 await page.waitForTimeout(32500);
 const tests=await page.evaluate(()=>{const r=runTests(false);return {passed:r.passed,total:r.total,failed:r.failed}});
 const boot=await page.evaluate(()=>({events:window.atlasBootOrder||[],mode:state.mode,obsolete:[...state.scene.lines,...state.scene.points].filter(e=>['invariant-clifford21','invariant-hopf-link21','invariant-skyrmion21'].includes(e.meta?.kind)).length}));
 assert.equal(tests.failed.length,0,JSON.stringify({failed:tests.failed,boot}));
 const version=await page.evaluate(()=>({title:document.title,version:__UPRS_APP__.version,html:document.documentElement.dataset.uprsVersion,stamp:document.getElementById('uprsVersionStamp580')?.textContent}));
 assert.equal(version.version,'6.6.0');assert.equal(version.html,'6.6.0');assert.match(version.title,/v6\.6\.0/);assert.match(version.stamp,/v6\.6\.0/);
 // Native winding inputs may change independently of the new controls.
 const cancelled=await page.evaluate(async()=>{
   state.rotate=false;__UPRS660__.setPreset(2,2);const pending=__UPRS660__.verify();
   const p=document.getElementById('pWind');p.value=3;p.dispatchEvent(new Event('change',{bubbles:true}));
   const r=await pending;return {status:r.status,disabled:document.getElementById('topologyVerify660').disabled,
     text:document.getElementById('topologyStatus660').textContent,verification:__UPRS660__.analysis().verification};
 });
 assert.equal(cancelled.status,'cancelled');assert.equal(cancelled.disabled,false,JSON.stringify(cancelled));assert.equal(cancelled.verification,null);
 await page.evaluate(()=>{state.rotate=false;__UPRS660__.setPreset(2,2);__UPRS660__.setFocus(true);document.getElementById('topologyDock660').open=true});
 const result=await page.evaluate(()=>__UPRS660__.verify());assert.equal(result.status,'verified');assert.ok(Math.abs(result.measured-4)<1e-8);
 const count=await page.evaluate(()=>{buildScene();buildScene();const a=[...state.scene.lines,...state.scene.points];return {fibres:a.filter(e=>e.meta.kind==='topo660-fibre').length,total:a.length,unique:new Set(a.map(e=>e.meta.id)).size}});
 assert.equal(count.fibres,4);assert.equal(count.unique,count.total);
 // Select a nondefault component, then drag the actual canvas phase handle.
 await page.selectOption('#topologyGroup660','1');await page.selectOption('#topologyComponent660','1');
 const drag=await page.evaluate(()=>{
   __UPRS660__.setCursor(.4,1,1);const h=state.scene.points.find(e=>e.meta.kind==='topo660-cursor');state.activeEntity=h;
   const n=__UPRS660__.core.phasePoint(2,2,Math.PI,1,1.1),q=__UPRS660__.core.stereo(n,(state.layers20.scale||.54)*.78),xy=proj(q,state.renderYaw,state.renderPitch);
   dragInteraction(xy[0],xy[1]);return {cursor:__UPRS660__.snapshot().cursor,active:state.activeEntity?.meta};
 });
 assert.equal(drag.cursor.group,1);assert.equal(drag.cursor.component,1);assert.ok(Math.abs(drag.cursor.phase-1.1)<.03);
 assert.equal(drag.active.component,1);assert.equal(drag.active.group,1);
 const screen=await page.evaluate(()=>{
   __UPRS660__.setCursor(.4,1,1);draw(performance.now());
   const scale=(state.layers20.scale||.54)*.78,point=t=>proj(__UPRS660__.core.stereo(__UPRS660__.core.phasePoint(2,2,Math.PI,1,t),scale),state.renderYaw,state.renderPitch);
   const canvas=document.querySelector('canvas'),r=canvas.getBoundingClientRect(),coord=t=>{const p=point(t);return {x:r.left+p[0]/W*r.width,y:r.top+p[1]/H*r.height}};
   return {start:coord(.4),end:coord(1.1)};
 });
 await page.mouse.move(screen.start.x,screen.start.y);await page.mouse.down();await page.mouse.move(screen.end.x,screen.end.y,{steps:6});await page.mouse.up();
 const pointerDrag=await page.evaluate(()=>__UPRS660__.snapshot().cursor);
 assert.equal(pointerDrag.group,1);assert.equal(pointerDrag.component,1);assert.ok(Math.abs(pointerDrag.phase-1.1)<.04,JSON.stringify(pointerDrag));
 const viewports=[];
 for(const [width,height] of [[1920,1080],[1440,900],[1024,768],[768,1024],[390,844],[320,568]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(200);
   const v=await page.evaluate(()=>{const d=document.getElementById('topologyDock660'),r=d.getBoundingClientRect(),host=document.getElementById('viewport').getBoundingClientRect();return {width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,left:r.left,right:r.right,bottom:r.bottom,hostBottom:host.bottom}});
   assert.equal(v.overflow,false);assert.ok(v.left>=0&&v.right<=width+1);assert.ok(v.bottom<=v.hostBottom+1,JSON.stringify(v));viewports.push(v);
 }
 await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>__UPRS660__.setCursor(.4,0,0));
 const screenshot=process.env.ATLAS_SCREENSHOT;if(screenshot)await page.screenshot({path:screenshot});
 await page.evaluate(()=>setMode('smith'));assert.equal(await page.locator('#topologyDock660').isVisible(),false);
 assert.equal(await page.evaluate(()=>state.scene.lines.filter(e=>e.meta.kind==='topo660-fibre').length),0);
 assert.deepEqual(errors,[]);
 const report={tests,boot,version,cancelled,linking:result,scene:count,drag,pointerDrag,viewports,errors};
 if(process.env.ATLAS_REPORT)fs.writeFileSync(process.env.ATLAS_REPORT,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(async e=>{console.error(e);process.exitCode=1;await browser?.close()});
