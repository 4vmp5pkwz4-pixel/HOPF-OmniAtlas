import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

const VERSION = '4.6.1';
const SOURCE = 'app-v4.5.0.html';
const OUT_DIR = 'build';
const OUT = path.join(OUT_DIR, 'index.html');
const REPORT = path.join(OUT_DIR, 'UPRS_v4.6.1_consolidation_report.json');

let html = fs.readFileSync(SOURCE, 'utf8');
const sourceBytes = Buffer.byteLength(html);
const sourceSha256 = crypto.createHash('sha256').update(html).digest('hex');
const changes = [];

function countOf(needle, text = html) {
  if (needle instanceof RegExp) {
    const flags = needle.flags.includes('g') ? needle.flags : needle.flags + 'g';
    return [...text.matchAll(new RegExp(needle.source, flags))].length;
  }
  return text.split(needle).length - 1;
}

function replaceExact(label, needle, replacement, expected = 1) {
  const count = countOf(needle);
  if (count !== expected) throw new Error(`${label}: expected ${expected} occurrence(s), found ${count}`);
  html = html.replaceAll(needle, replacement);
  changes.push({ label, count });
}

function replaceInRange(label, startMarker, endMarker, needle, replacement, expected = 1) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`${label}: range markers not found`);
  const segment = html.slice(start, end);
  const count = countOf(needle, segment);
  if (count !== expected) throw new Error(`${label}: expected ${expected} occurrence(s) in range, found ${count}`);
  const patched = segment.replaceAll(needle, replacement);
  html = html.slice(0, start) + patched + html.slice(end);
  changes.push({ label, count });
}

const title = `UPRS Möbius–Hopf OmniAtlas v${VERSION} · Quest-safe WebXR Recovery`;
const core = fs.readFileSync('_includes/uprs460-core-authority.html', 'utf8').trim();
const consolidation = fs.readFileSync('_includes/uprs460-consolidation.html', 'utf8').trim();
const xrRecovery = fs.readFileSync('_includes/uprs461-xr-startup-recovery.js', 'utf8').trim();

replaceExact('source title','<title>UPRS Möbius–Hopf OmniAtlas v4.1.0 · Predictive Observatory + Visual Workspace + Claude + ASML EUV LPP</title>',`<title>${title}</title>`);
replaceExact('Predictive Observatory title authority',"const TITLE398='UPRS Möbius–Hopf OmniAtlas v4.1.0 · Predictive Observatory + Visual Workspace + Claude + ASML EUV LPP';",`const TITLE398='${title}';`);
replaceExact('Predictive Observatory brand version',"if(s)s.textContent='OMNIATLAS · OBSERVATORY · VISUAL WORKSPACE · ASML EUV LPP · v4.1.0';","if(s)s.textContent='UNIFIED S³ · QUEST-SAFE WEBXR · IMMERSIVE LAB · v4.6.1';");
replaceExact('v4.1 integration authorities',"const VERSION='4.1.0';\nconst TITLE='UPRS Möbius–Hopf OmniAtlas v4.1.0 · Predictive Observatory + Visual Workspace + Claude + ASML EUV LPP';\nconst BRAND='OMNIATLAS · OBSERVATORY · VISUAL WORKSPACE · ASML EUV LPP · v4.1.0';","const VERSION='4.6.1';\nconst TITLE='UPRS Möbius–Hopf OmniAtlas v4.6.1 · Quest-safe WebXR Recovery';\nconst BRAND='UNIFIED S³ · QUEST-SAFE WEBXR · IMMERSIVE LAB · v4.6.1';",2);
replaceExact('early core authority','<head>',`<head>${core}`);
replaceExact('v4.4 XR ownership deferral',"if(typeof enterXR==='function'&&!window.__UPRS440_LEGACY_XR__)window.__UPRS440_LEGACY_XR__=enterXR;","if(typeof enterXR==='function'&&!window.__UPRS440_LEGACY_XR__)window.__UPRS440_LEGACY_XR__=enterXR;\n  if(globalThis.__UPRS_APP__?.xrOwner==='450')return;");
replaceExact('remove v4.4 repair installers','for(const ms of [900,2600,7000])setTimeout(()=>{try{install440()}catch(_){}},ms);','');
replaceExact('idempotent v4.5 installer declaration','let tries=0;\nfunction install450(){','let tries=0,installed450=false;\nfunction install450(){');
replaceExact('idempotent v4.5 installer guard',"if(!document.body||typeof state==='undefined'||!CORE()){if(tries++<90)return setTimeout(install450,220);return}","if(!document.body||typeof state==='undefined'||!CORE()){if(tries++<90)return setTimeout(install450,220);return}\n if(installed450)return;installed450=true;");
replaceExact('remove v4.5 repair installers','for(const ms of [1100,3000,8000])setTimeout(()=>{try{install450()}catch(_){}},ms);','');
replaceExact('audio polling lifecycle','function toggleSound450(){const on=!AU.enabled;','function toggleSound450(){const on=!AU.enabled;if(!on&&deskTimer){clearInterval(deskTimer);deskTimer=0}');
replaceExact('v4.4 scene signature',"function sceneKey440(){try{return state.mode+'|'+((state.scene?.points||[]).length)+'|'+((state.scene?.lines||[]).length)+'|'+state.model}catch(_){return ''}}","function sceneKey440(){try{const a=globalThis.__UPRS_APP__;return state.mode+'|'+state.model+'|'+state.index+'|'+(a?.sceneRevision||0)+'|'+(a?.sceneStamp?.(state.scene)||0)}catch(_){return ''}}");
replaceExact('v4.5 scene signature',"function sceneKey450(){try{return state.mode+'|'+((state.scene?.points||[]).length)+'|'+((state.scene?.lines||[]).length)+'|'+state.model}catch(_){return ''}}","function sceneKey450(){try{const a=globalThis.__UPRS_APP__;return state.mode+'|'+state.model+'|'+state.index+'|'+(a?.sceneRevision||0)+'|'+(a?.sceneStamp?.(state.scene)||0)}catch(_){return ''}}");
replaceExact('remove stale service-worker registration',"if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('service worker',e));","if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.filter(r=>r.scope.startsWith(location.origin+location.pathname.replace(/[^/]*$/,''))).map(r=>r.unregister()))).then(x=>{if(x.some(Boolean))document.documentElement.dataset.uprsStaleWorkerRemoved='1'}).catch(e=>console.warn('service worker cleanup',e));");

replaceExact('insert Quest XR startup recovery','/* ------------------------------------------------------------- session */\nasync function enterImmersive450(){',`${xrRecovery}\n/* ------------------------------------------------------------- session */\nasync function enterImmersive450(){`);
replaceExact('guard XR render frame','function frame450(t,frame){const sess=S.sess;if(!sess)return;sess.requestAnimationFrame(frame450);',`function frame450(t,frame){
 const first=!XRSTART450.firstFrameAt;
 if(first){
  XRSTART450.firstFrameAt=xrNow450();XRSTART450.pending=false;
  if(XRSTART450.firstFrameTimer){clearTimeout(XRSTART450.firstFrameTimer);XRSTART450.firstFrameTimer=0}
  xrStage450('running','first XR frame');
 }
 try{return frame450Core(t,frame)}catch(e){
  console.error('UPRS450 XR frame',e);
  xrAbort450(S.sess,e,'render-frame');
 }
}
function frame450Core(t,frame){const sess=S.sess;if(!sess)return;sess.requestAnimationFrame(frame450);`);
replaceExact('direct trusted immersive-vr request',`async function enterImmersive450(){
 if(S.sess){try{await S.sess.end()}catch(_){}return}
 if(!navigator.xr){toast450(t450('noXR'));AU.setEnabled(true);const sel=currentSel450();if(sel)AU.apply(sel);return}
 let mode=null;
 try{if(await navigator.xr.isSessionSupported('immersive-ar'))mode='immersive-ar'}catch(_){}
 if(!mode){try{if(await navigator.xr.isSessionSupported('immersive-vr'))mode='immersive-vr'}catch(_){}}
 if(!mode){toast450(t450('noXR'));AU.setEnabled(true);const sel=currentSel450();if(sel)AU.apply(sel);return}
 const c=CORE();if(!c){try{return window.__UPRS440__?.enter()}catch(_){return}}
 try{
  const opts={requiredFeatures:['local'],optionalFeatures:['local-floor','bounded-floor','hand-tracking','hit-test','anchors','depth-sensing'],
   depthSensing:{usagePreference:['gpu-optimized','cpu-optimized'],dataFormatPreference:['luminance-alpha','float32']}};
  const sess=await navigator.xr.requestSession(mode,opts);`,`async function enterImmersive450(){
 if(S.sess){try{await S.sess.end()}catch(_){}return}
 if(XRSTART450.pending){toast450('WebXR: запуск уже выполняется');return}
 XRSTART450.startedAt=xrNow450();XRSTART450.sessionRequestedAt=0;XRSTART450.sessionAcquiredAt=0;
 XRSTART450.firstFrameAt=0;XRSTART450.refType='';XRSTART450.lastError=null;XRSTART450.history.length=0;
 XRSTART450.pending=true;XRSTART450.attempt++;
 if(!navigator.xr){const e=new Error('navigator.xr unavailable');e.name='NotSupportedError';await xrAbort450(null,e,'webxr-api');return}
 const c=CORE();if(!c){await xrAbort450(null,new Error('XR core unavailable'),'core');return}
 const mode='immersive-vr';let sess=null,requestPromise=null;
 try{
  xrGuard450();
  xrStage450('request-session','direct trusted click · immersive-vr');
  XRSTART450.sessionRequestedAt=xrNow450();
  requestPromise=navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});
  sess=await xrWait450(requestPromise,XRSTART450.policy.requestTimeoutMs,'request-session',late=>xrEndLate450(late));
  XRSTART450.sessionAcquiredAt=xrNow450();
  xrStage450('session-acquired',sess.environmentBlendMode||'immersive-vr');`);

const xrStart='async function enterImmersive450(){',xrEnd='/* desktop sonification loop */';
replaceInRange('non-blocking target frame rate',xrStart,xrEnd,'  try{if(sess.supportedFrameRates&&sess.updateTargetFrameRate){const rates=[...sess.supportedFrameRates];const want=rates.includes(90)?90:Math.max(...rates);await sess.updateTargetFrameRate(want);S.support.rate=want}}catch(_){}','  try{if(sess.supportedFrameRates&&sess.updateTargetFrameRate){const rates=[...sess.supportedFrameRates].filter(Number.isFinite);if(rates.length){const want=rates.includes(90)?90:Math.max(...rates);Promise.resolve(sess.updateTargetFrameRate(want)).then(()=>{S.support.rate=want}).catch(()=>{})}}}catch(_){}');
replaceInRange('finite WebGL compatibility stage',xrStart,xrEnd,"  S.gl=gl;await gl.makeXRCompatible();\n  const layer=new XRWebGLLayer(sess,gl,{alpha:true,antialias:true,framebufferScaleFactor:1});","  S.gl=gl;xrStage450('gl-compatible',(typeof WebGL2RenderingContext!=='undefined'&&gl instanceof WebGL2RenderingContext)?'webgl2':'webgl1');\n  await xrWait450(gl.makeXRCompatible(),XRSTART450.policy.glTimeoutMs,'makeXRCompatible');\n  xrStage450('render-layer','XRWebGLLayer');\n  const layer=new XRWebGLLayer(sess,gl,{alpha:false,depth:true,stencil:false,antialias:true,framebufferScaleFactor:.85});");
replaceExact('finite reference-space fallback',"  S.ref=await sess.requestReferenceSpace('local-floor').catch(()=>sess.requestReferenceSpace('local'));\n  /* depth sensing */","  xrStage450('reference-space','local-floor → local');\n  try{S.ref=await xrWait450(sess.requestReferenceSpace('local-floor'),XRSTART450.policy.referenceSpaceTimeoutMs,'local-floor');XRSTART450.refType='local-floor'}\n  catch(_){S.ref=await xrWait450(sess.requestReferenceSpace('local'),XRSTART450.policy.referenceSpaceTimeoutMs,'local');XRSTART450.refType='local'}\n  /* depth sensing is intentionally disabled in the default VR startup path; it is AR-only capability. */");
replaceInRange('visible placement for local reference space',xrStart,xrEnd,"  S.world.pos=[0,mode==='immersive-ar'?1.05:1.15,-.75];","  S.world.pos=[0,XRSTART450.refType==='local-floor'?1.15:-.08,-1.25];");
replaceExact('first-frame watchdog',"  sess.requestAnimationFrame(frame450);\n  toast450(t450('started')+(S.support.rate?` · ${S.support.rate} Hz`:'')+(mode==='immersive-ar'?' · AR':' · VR'));","  xrStage450('waiting-first-frame','render pipeline ready');\n  XRSTART450.firstFrameTimer=setTimeout(()=>{\n   if(!XRSTART450.firstFrameAt&&S.sess===sess){\n    const e=new Error('No XR animation frame');e.name='TimeoutError';\n    xrAbort450(sess,e,'first-frame');\n   }\n  },xrScale450(XRSTART450.policy.firstFrameTimeoutMs));\n  sess.requestAnimationFrame(frame450);\n  toast450('WebXR: запуск VR…');");
replaceExact('session end cleanup',"  sess.addEventListener('end',()=>{S.sess=null;S.gl=null;S.sceneKey='';S.grabs.clear();btnPrev.clear();S.hands.clear();S.panel.tex=null;S.hit.source=null;S.anchorSpace=null;S.depth.binding=null;try{state.xrSession=null}catch(_){}toast450(t450('ended'))});","  sess.addEventListener('end',()=>{if(XRSTART450.firstFrameTimer){clearTimeout(XRSTART450.firstFrameTimer);XRSTART450.firstFrameTimer=0}XRSTART450.pending=false;S.sess=null;S.gl=null;S.ref=null;S.sceneKey='';S.grabs.clear();btnPrev.clear();S.hands.clear();S.panel.tex=null;S.hit.source=null;S.anchorSpace=null;S.depth.binding=null;try{state.xrSession=null}catch(_){}if(XRSTART450.stage!=='failed')xrStage450('ended','session end');toast450(t450('ended'))},{once:true});");
replaceExact('abort failed session without legacy retry',"}catch(e){console.warn('UPRS450 session',e);toast450('XR: '+e.message);try{window.__UPRS440__?.enter()}catch(_){}}","}catch(e){console.warn('UPRS450 session',e);await xrAbort450(sess,e,XRSTART450.stage||'startup')}");
replaceExact('Quest-safe button binding without automatic preflight',"  const btn=document.getElementById('xrBtn');if(btn)btn.onclick=()=>enterImmersive450();","  const btn=document.getElementById('xrBtn');if(btn){btn.onclick=()=>enterImmersive450();btn.dataset.xrPolicy='quest-safe-v461';btn.dataset.xrSupport=navigator.xr?'available':'none';btn.title=navigator.xr?'Quest-safe WebXR · нажмите для VR':'WebXR API отсутствует'}");
replaceExact('expose XR startup diagnostics',"globalThis.__UPRS450__={version:V450,enter:enterImmersive450,exit:()=>{try{S.sess?.end()}catch(_){}},toggleSound:toggleSound450,checks:checks450,","globalThis.__UPRS450__={version:V450,enter:enterImmersive450,exit:()=>{try{S.sess?.end()}catch(_){}},toggleSound:toggleSound450,checks:checks450,startup:XRSTART450,startupPolicy:XRSTART450.policy,startupReport:xrReport450,preflight:xrPreflight450,");
replaceExact('late consolidation module','</body>',`${consolidation}</body>`);

const scripts=[],syntaxFailures=[];const scriptRx=/<script([^>]*)>([\s\S]*?)<\/script>/gi;let match;
while((match=scriptRx.exec(html))){const attrs=match[1]||'';if(/\bsrc\s*=/.test(attrs)||/type\s*=\s*["']module["']/.test(attrs))continue;scripts.push(match[2]||'')}
scripts.forEach((code,index)=>{try{new vm.Script(code,{filename:`inline-script-${index+1}.js`})}catch(error){syntaxFailures.push({index:index+1,message:error.message})}});
if(syntaxFailures.length)throw new Error(`Inline script syntax failures: ${JSON.stringify(syntaxFailures,null,2)}`);
const required=['uprs460CoreAuthority','uprs460Consolidation','XRSTART450','quest-safe-v461','__UPRS420__','__UPRS430__','__UPRS440__','__UPRS450__','__UPRS398__','asml_euv_lpp'];
const missing=required.filter(token=>!html.includes(token));if(missing.length)throw new Error(`Required capabilities missing: ${missing.join(', ')}`);
const outputBytes=Buffer.byteLength(html),outputSha256=crypto.createHash('sha256').update(html).digest('hex');fs.mkdirSync(OUT_DIR,{recursive:true});fs.writeFileSync(OUT,html);
const report={version:VERSION,source:SOURCE,sourceBytes,sourceSha256,outputBytes,outputSha256,inlineScripts:scripts.length,syntaxFailures,changes,requiredCapabilities:required,xrStartupPolicy:{mode:'immersive-vr',directUserActivation:true,preferAR:false,depthOnStartup:false,autoLegacyFallback:false,automaticPreflight:false,optionalFeatures:['local-floor'],lateSessionCleanup:true,staleServiceWorkerCleanup:true,requestTimeoutMs:30000,glTimeoutMs:8000,referenceSpaceTimeoutMs:5000,firstFrameTimeoutMs:8000,framebufferScaleFactor:.85}};
fs.writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
