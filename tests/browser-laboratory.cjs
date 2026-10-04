const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto((process.env.ATLAS_URL||'http://127.0.0.1:8766')+'/index.html');
 await page.waitForFunction(()=>!!globalThis.__UPRS670__?.open,{},{timeout:3000});
 await page.locator('#labOpen670').click();await page.waitForFunction(()=>document.getElementById('laboratory670').open);
 const snapshots=[];
 for(const study of ['planck','casimir','resonance','fractal','model','topology']){
  await page.locator(`[data-lab-study="${study}"]`).click();
  await page.waitForFunction(()=>__UPRS670__.snapshot().status==='ready',{},{timeout:20000});
  const s=await page.evaluate(()=>__UPRS670__.snapshot());assert.equal(s.study,study);assert.ok(s.result);snapshots.push({study,result:s.result});
  assert.ok(await page.locator('#labPlot670').isVisible());
 }
 await page.locator('[data-lab-study="planck"]').click();
 const temperature=page.locator('input[type="number"][data-lab-param="T"]');await temperature.fill('300');await temperature.dispatchEvent('change');
 const b=await page.evaluate(()=>__UPRS670__.snapshot());assert.equal(b.parameters.T,300);assert.ok(Math.abs(b.result.exitance-459.300327954)<1e-6);
 await page.evaluate(()=>__UPRS670__.setParameter('coordinate','nu'));
 const frequency=await page.evaluate(()=>__UPRS670__.snapshot());assert.match(frequency.equation,/Bν/);assert.ok(Math.abs(frequency.result.peakNu/300-5.878925757646825e10)<1);
 await page.evaluate(async()=>{await __UPRS670__.setStudy('fractal');await __UPRS670__.setParameter('kind','cantor');await __UPRS670__.setParameter('depth',4)});
 const cantor=await page.evaluate(()=>__UPRS670__.snapshot());assert.equal(cantor.status,'ready');assert.ok(Math.abs(cantor.result.dimension-Math.log(4)/Math.log(3))<1e-12);assert.match(cantor.sources[0].title,/Hutchinson/);
 await page.locator('[data-lab-study="model"]').click();
 await page.waitForFunction(()=>__UPRS670__.snapshot().status==='ready',{},{timeout:20000});
 const original=await page.evaluate(()=>({model:state.model,params:JSON.stringify(modelParams())}));
 await page.evaluate(()=>__UPRS670__.setParameter('metric','phase'));
 await page.waitForFunction(()=>__UPRS670__.snapshot().status==='ready',{},{timeout:20000});
 assert.deepEqual(await page.evaluate(()=>({model:state.model,params:JSON.stringify(modelParams())})),original);
 await page.locator('#labPlot670').click({position:{x:250,y:190}});
 await page.locator('#labApply670').click();
 assert.equal(await page.evaluate(()=>document.getElementById('laboratory670').open),false);
 const native=await page.evaluate(()=>({model:state.model,selector:document.getElementById('model').value,index:state.index,cursor:Number(document.getElementById('cursor').value),log:state.log,switch:document.getElementById('logSw').classList.contains('on')}));
 assert.equal(native.model,native.selector);assert.equal(native.index,native.cursor);assert.equal(native.log,native.switch);
 await page.evaluate(async()=>{await __UPRS670__.open('resonance');await __UPRS670__.setParameter('family','mechanical')});
 await page.locator('#labApply670').click();assert.equal(await page.locator('#model').inputValue(),'mechanical_msd');
 await page.evaluate(()=>__UPRS670__.open('planck'));
 const download=page.waitForEvent('download');await page.locator('#labExport670').click();const file=await (await download).path();const exported=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(exported.schema,'uprs-experiment/1');assert.equal(exported.study,'planck');
 await page.evaluate(()=>{__UPRS670__.setStudy('model');__UPRS670__.setStudy('casimir')});await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>__UPRS670__.snapshot().study),'casimir');
 const sizes=[];for(const [width,height] of [[1440,1000],[768,1024],[390,844],[320,568]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(120);
  const r=await page.evaluate(()=>{const d=document.getElementById('laboratory670'),b=d.getBoundingClientRect();return {width:innerWidth,left:b.left,right:b.right,overflow:d.scrollWidth>d.clientWidth+1}});
  assert.ok(r.left>=0&&r.right<=width+1);assert.equal(r.overflow,false);sizes.push(r);
 }
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>__UPRS670__.setStudy('planck'));await page.waitForTimeout(120);
 if(process.env.LAB_SCREENSHOT)await page.screenshot({path:process.env.LAB_SCREENSHOT});
 await page.evaluate(()=>document.body.classList.add('paper328'));await page.waitForTimeout(100);assert.ok(await page.locator('#labPlot670').isVisible());
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.getElementById('laboratory670').open),false);
 assert.deepEqual(errors,[]);const report={studies:snapshots,substudies:{frequency:{peakNu:frequency.result.peakNu,equation:frequency.equation},cantor:{dimension:cantor.result.dimension,analytic:cantor.result.analyticCantorDust}},nativeSynchronization:native,sizes,errors};if(process.env.LAB_REPORT)fs.writeFileSync(process.env.LAB_REPORT,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(async e=>{console.error(e);process.exitCode=1;await browser?.close()});
