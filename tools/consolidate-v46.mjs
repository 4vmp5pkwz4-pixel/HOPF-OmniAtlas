import fs from 'node:fs';
import vm from 'node:vm';

const FILE = 'index.html';
const VERSION = '4.6.0';
let html = fs.readFileSync(FILE, 'utf8');
const before = html;
const report = {
  version: VERSION,
  generatedAt: new Date().toISOString(),
  changes: [],
  warnings: [],
  scriptSyntax: { total: 0, failed: [] }
};

function replaceOnce(label, pattern, replacement, required = true) {
  const next = html.replace(pattern, replacement);
  if (next === html) {
    const msg = `Pattern not found: ${label}`;
    if (required) throw new Error(msg);
    report.warnings.push(msg);
    return false;
  }
  html = next;
  report.changes.push(label);
  return true;
}

replaceOnce(
  'central document title',
  /<title>[\s\S]*?<\/title>/,
  `<title>UPRS Möbius–Hopf OmniAtlas v${VERSION} · Unified Scientific & Immersive Observatory</title>`
);

if (!html.includes('id="uprs460CoreAuthority"')) {
  const coreAuthority = `<script id="uprs460CoreAuthority">(()=>{'use strict';
const VERSION='${VERSION}',TITLE='UPRS Möbius–Hopf OmniAtlas v${VERSION} · Unified Scientific & Immersive Observatory';
const A=globalThis.__UPRS_APP__||(globalThis.__UPRS_APP__={});
A.version=VERSION;A.release='core-consolidation';A.xrOwner='450';A.sceneRevision=Number.isFinite(A.sceneRevision)?A.sceneRevision:0;
A.bumpSceneRevision=reason=>{A.sceneRevision=(A.sceneRevision+1)>>>0;A.lastSceneReason=reason||'unspecified';return A.sceneRevision};
A.sceneStamp=scene=>{let h=2166136261>>>0;const mix=v=>{let n=Number(v);if(!Number.isFinite(n))n=0;n=Math.round(n*1e5);h^=n;h=Math.imul(h,16777619)>>>0};
 const pts=scene?.points||[],lns=scene?.lines||[];mix(pts.length);mix(lns.length);
 const sample=(arr,read)=>{const n=arr.length;if(!n)return;read(arr[0]);if(n>2)read(arr[n>>1]);if(n>1)read(arr[n-1])};
 sample(pts,p=>{const q=p?.p||[];mix(q[0]);mix(q[1]);mix(q[2]);mix(p?.meta?.index)});
 sample(lns,l=>{const p=l?.pts||[];mix(p.length);if(p.length){mix(p[0]?.[0]);mix(p[0]?.[1]);mix(p[0]?.[2]);const z=p[p.length-1];mix(z?.[0]);mix(z?.[1]);mix(z?.[2])}});return h>>>0};
A.claimVersion=()=>{document.title=TITLE;document.documentElement.dataset.uprsVersion=VERSION};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',A.claimVersion,{once:true});else A.claimVersion();
})();</script>`;
  replaceOnce('early core authority', '<head>', `<head>${coreAuthority}`);
}

replaceOnce(
  'v4.4 defers XR ownership to v4.5 capability engine',
  "if(typeof enterXR==='function'&&!window.__UPRS440_LEGACY_XR__)window.__UPRS440_LEGACY_XR__=enterXR;",
  "if(typeof enterXR==='function'&&!window.__UPRS440_LEGACY_XR__)window.__UPRS440_LEGACY_XR__=enterXR;\n  if(globalThis.__UPRS_APP__?.xrOwner==='450')return;"
);
replaceOnce(
  'remove redundant v4.4 repair installers',
  /for\(const ms of \[900,2600,7000\]\)setTimeout\(\(\)=>\{try\{install440\(\)\}catch\(_\)\{\}\},ms\);/,
  ''
);

replaceOnce(
  'make v4.5 installer idempotent',
  'let tries=0;\nfunction install450(){',
  'let tries=0,installed450=false;\nfunction install450(){'
);
replaceOnce(
  'guard repeated v4.5 installation',
  "if(!document.body||typeof state==='undefined'||!CORE()){if(tries++<90)return setTimeout(install450,220);return}",
  "if(!document.body||typeof state==='undefined'||!CORE()){if(tries++<90)return setTimeout(install450,220);return}\n if(installed450)return;installed450=true;"
);
replaceOnce(
  'remove redundant v4.5 repair installers',
  /for\(const ms of \[1100,3000,8000\]\)setTimeout\(\(\)=>\{try\{install450\(\)\}catch\(_\)\{\}\},ms\);/,
  ''
);

replaceOnce(
  'clear desktop audio polling when sound is disabled',
  'function toggleSound450(){const on=!AU.enabled;',
  'function toggleSound450(){const on=!AU.enabled;if(!on&&deskTimer){clearInterval(deskTimer);deskTimer=0}'
);

replaceOnce(
  'v4.4 robust scene signature',
  /function sceneKey440\(\)\{try\{return state\.mode\+'\\\|\+'\+\(\(state\.scene\?\.points\|\|\[\]\)\.length\)\+'\\\|\+'\+\(\(state\.scene\?\.lines\|\|\[\]\)\.length\)\+'\\\|\+'\+state\.model\}catch\(_\)\{return ''\}\}/,
  "function sceneKey440(){try{const a=globalThis.__UPRS_APP__;return state.mode+'|'+state.model+'|'+state.index+'|'+(a?.sceneRevision||0)+'|'+(a?.sceneStamp?.(state.scene)||0)}catch(_){return ''}}"
);
replaceOnce(
  'v4.5 robust scene signature',
  /function sceneKey450\(\)\{try\{return state\.mode\+'\\\|\+'\+\(\(state\.scene\?\.points\|\|\[\]\)\.length\)\+'\\\|\+'\+\(\(state\.scene\?\.lines\|\|\[\]\)\.length\)\+'\\\|\+'\+state\.model\}catch\(_\)\{return ''\}\}/,
  "function sceneKey450(){try{const a=globalThis.__UPRS_APP__;return state.mode+'|'+state.model+'|'+state.index+'|'+(a?.sceneRevision||0)+'|'+(a?.sceneStamp?.(state.scene)||0)}catch(_){return ''}}"
);

replaceOnce(
  'preallocate v4.5 XR beam buffers',
  "tmpA:new Float32Array(16),tmpB:new Float32Array(16),tmpC:new Float32Array(16),worldMat:new Float32Array(16),gridMat:new Float32Array(16)};",
  "beamPos:new Float32Array(192),beamCol:new Float32Array(256),tmpA:new Float32Array(16),tmpB:new Float32Array(16),tmpC:new Float32Array(16),worldMat:new Float32Array(16),gridMat:new Float32Array(16)};",
  false
);
const oldBeamBuild = ` /* beams */
 const bp=[],bc=[];for(const src of sess.inputSources){if(src.hand)continue;const rp=frame.getPose(src.targetRaySpace,S.ref);if(!rp)continue;
  const o=rp.transform.position,q=[rp.transform.orientation.x,rp.transform.orientation.y,rp.transform.orientation.z,rp.transform.orientation.w];
  const d=c.qRotV(q,[0,0,-1]);const col=src.handedness==='left'?[.6,.68,1,.5]:[1,.94,.74,.5];
  bp.push(o.x,o.y,o.z,o.x+d[0]*1.6,o.y+d[1]*1.6,o.z+d[2]*1.6);bc.push(...col,col[0],col[1],col[2],0)}`;
const newBeamBuild = ` /* beams: preallocated, no Array/Float32Array creation in the frame loop */
 const bp=S.beamPos,bc=S.beamCol;let beamVerts=0;for(const src of sess.inputSources){if(src.hand||beamVerts+2>bp.length/3)continue;const rp=frame.getPose(src.targetRaySpace,S.ref);if(!rp)continue;
  const o=rp.transform.position,rq=rp.transform.orientation;S.tmpQuat||(S.tmpQuat=[0,0,0,1]);S.tmpQuat[0]=rq.x;S.tmpQuat[1]=rq.y;S.tmpQuat[2]=rq.z;S.tmpQuat[3]=rq.w;
  const d=c.qRotV(S.tmpQuat,[0,0,-1]),left=src.handedness==='left',cr=left?.6:1,cg=left?.68:.94,cb=left?1:.74;
  let p=beamVerts*3,k=beamVerts*4;bp[p]=o.x;bp[p+1]=o.y;bp[p+2]=o.z;bp[p+3]=o.x+d[0]*1.6;bp[p+4]=o.y+d[1]*1.6;bp[p+5]=o.z+d[2]*1.6;
  bc[k]=cr;bc[k+1]=cg;bc[k+2]=cb;bc[k+3]=.5;bc[k+4]=cr;bc[k+5]=cg;bc[k+6]=cb;bc[k+7]=0;beamVerts+=2}`;
if (html.includes(oldBeamBuild)) {
  html = html.replace(oldBeamBuild, newBeamBuild);
  report.changes.push('zero-allocation v4.5 beam construction');
} else {
  report.warnings.push('Beam construction block not found; frame allocation remains for later refactor');
}
const oldBeamDraw = `  if(bp.length){gl.bindBuffer(gl.ARRAY_BUFFER,S.buf.bv);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(bp),gl.DYNAMIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER,S.buf.bc);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(bc),gl.DYNAMIC_DRAW);
   const I=S.tmpC;I.set([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);drawGeom450(gl,proj,c.m4Mul(S.tmpB,vinv,I),S.buf.bv,S.buf.bc,bp.length/3,gl.LINES)}`;
const newBeamDraw = `  if(beamVerts){gl.bindBuffer(gl.ARRAY_BUFFER,S.buf.bv);gl.bufferData(gl.ARRAY_BUFFER,bp.subarray(0,beamVerts*3),gl.DYNAMIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER,S.buf.bc);gl.bufferData(gl.ARRAY_BUFFER,bc.subarray(0,beamVerts*4),gl.DYNAMIC_DRAW);
   const I=S.tmpC;I.set([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);drawGeom450(gl,proj,c.m4Mul(S.tmpB,vinv,I),S.buf.bv,S.buf.bc,beamVerts,gl.LINES)}`;
if (html.includes(oldBeamDraw)) {
  html = html.replace(oldBeamDraw, newBeamDraw);
  report.changes.push('zero-allocation v4.5 beam upload');
} else {
  report.warnings.push('Beam draw block not found; typed-array conversion remains for later refactor');
}

if (!html.includes('id="uprs460Consolidation"')) {
const module460 = `<script id="uprs460Consolidation">(()=>{'use strict';
const V='${VERSION}',A=globalThis.__UPRS_APP__;
function inferSemantics(m){if(m.responseSemantics)return m.responseSemantics;const map=String(m.map||'').toLowerCase();if(map.includes('reflect'))return 'reflection-coefficient';if(map.includes('impedance'))return 'impedance';if(map.includes('admittance'))return 'admittance';if(map.includes('transfer'))return 'transfer-function';return 'derived-complex-response'}
function applicability(s){return {resonance:true,phase:true,powerLaw:true,plateau:true,fano:true,directGamma:s==='reflection-coefficient',directPassivity:s==='reflection-coefficient',cayleyPassivity:s==='impedance'||s==='admittance',groupDelay:s==='transfer-function'||s==='reflection-coefficient'}}
function annotateModels(){let inferred=0,explicit=0,total=0;try{for(const m of Object.values(UPRSO_MODELS||{})){total++;if(m.responseSemantics)explicit++;else{m.responseSemantics=inferSemantics(m);m.semanticsSource='inferred-v4.6';inferred++}m.detectorApplicability=m.detectorApplicability||applicability(m.responseSemantics)}}catch(_){}return {total,explicit,inferred}}
function claimXR(){if(globalThis.__UPRS450__?.enter){globalThis.enterXR=globalThis.__UPRS450__.enter;window.enterXR=globalThis.__UPRS450__.enter;const b=document.getElementById('xrBtn');if(b)b.onclick=()=>globalThis.__UPRS450__.enter();A.xrOwner='450';return true}return false}
function hookSceneRevision(){const names=['draw','setMode','rebuildModelOptions'];for(const n of names){try{const f=globalThis[n];if(typeof f!=='function'||f.__uprs460)continue;const w=function(...args){A.bumpSceneRevision(n);return f.apply(this,args)};w.__uprs460=true;globalThis[n]=w;try{window[n]=w}catch(_){}}catch(_){}}
 document.addEventListener('input',e=>{if(e.target?.matches?.('input,select'))A.bumpSceneRevision('input')},{passive:true});document.addEventListener('change',e=>{if(e.target?.matches?.('input,select'))A.bumpSceneRevision('change')},{passive:true})}
function audit(){const sem=annotateModels(),r450=globalThis.__UPRS450__?.audit?.(),r440=globalThis.__UPRS440__?.audit?.();return {version:V,title:document.title,models:sem,xr:{owner:A.xrOwner,v450:!!globalThis.__UPRS450__,v440Fallback:!!globalThis.__UPRS440__,active:r450?.active||false,depth:r450?.depth||null,audio:r450?.audio||null},sceneRevision:A.sceneRevision,selfTest:globalThis.__UPRS_SELF_TEST__?{passed:__UPRS_SELF_TEST__.passed,total:__UPRS_SELF_TEST__.total,failed:__UPRS_SELF_TEST__.failed?.map?.(x=>x.name)||[]}:null,earlyErrors:(globalThis.__UPRS_EARLY_ERRORS__||[]).slice()}}
function checks(){const s=annotateModels(),stamp1=A.sceneStamp({points:[{p:[0,0,0]}],lines:[]}),stamp2=A.sceneStamp({points:[{p:[1,0,0]}],lines:[]});return [
{name:'v4.6.0 single version authority',pass:A.version===V&&document.title.includes('v'+V)},
{name:'v4.6.0 v4.5 owns XR entry',pass:A.xrOwner==='450'&&typeof globalThis.__UPRS450__?.enter==='function'},
{name:'v4.6.0 v4.4 retained as fallback',pass:typeof globalThis.__UPRS440__?.enter==='function'},
{name:'v4.6.0 scene signature detects geometry change',pass:stamp1!==stamp2},
{name:'v4.6.0 response semantics cover model registry',pass:s.total>0&&s.explicit+s.inferred===s.total,detail:JSON.stringify(s)},
{name:'v4.6.0 no early runtime errors',pass:(globalThis.__UPRS_EARLY_ERRORS__||[]).length===0,detail:JSON.stringify(globalThis.__UPRS_EARLY_ERRORS__||[])}]}
function wrapTests(){try{if(typeof runTests!=='function'||runTests.__uprs460)return;const base=runTests,w=function(show=true){const r=base(false),T=r.tests.filter(x=>!String(x.name||'').startsWith('v4.6.0'));for(const x of checks())T.push(x);const rep={passed:T.filter(x=>x.pass).length,total:T.length,failed:T.filter(x=>!x.pass),tests:T};globalThis.__UPRS_SELF_TEST__=rep;if(show)try{toast(rep.failed.length?'Self-test: '+rep.failed.length+' failed':'Self-test: '+rep.passed+'/'+rep.total)}catch(_){}return rep};w.__uprs460=true;globalThis.runTests=w;window.runTests=w}catch(_){} }
function install(){A.claimVersion();annotateModels();claimXR();hookSceneRevision();wrapTests();document.dispatchEvent(new CustomEvent('uprs:ready',{detail:audit()}))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
globalThis.__UPRS460__={version:V,audit,checks,annotateModels,claimXR,bumpSceneRevision:A.bumpSceneRevision};
})();</script>`;
  replaceOnce('append v4.6 consolidation module', '</body>', `${module460}\n</body>`);
}

const scriptRx = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
while ((match = scriptRx.exec(html))) {
  const attrs = match[1] || '';
  const code = match[2] || '';
  if (/\bsrc\s*=/.test(attrs) || /type\s*=\s*["']module["']/.test(attrs)) continue;
  report.scriptSyntax.total++;
  try { new vm.Script(code, { filename: `inline-script-${report.scriptSyntax.total}.js` }); }
  catch (error) { report.scriptSyntax.failed.push({ index: report.scriptSyntax.total, message: error.message }); }
}
if (report.scriptSyntax.failed.length) {
  throw new Error(`Inline script syntax failures: ${JSON.stringify(report.scriptSyntax.failed, null, 2)}`);
}

report.bytesBefore = Buffer.byteLength(before);
report.bytesAfter = Buffer.byteLength(html);
report.changed = before !== html;
fs.writeFileSync(FILE, html);
fs.writeFileSync('UPRS_v4.6.0_consolidation_report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
