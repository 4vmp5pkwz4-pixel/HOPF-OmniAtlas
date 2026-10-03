import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const line=name=>html.split('\n').find(l=>l.startsWith(name));
function harness(){
  let resolve,reject,now=0,next=0,ended=0;
  const pending=new Promise((a,b)=>{resolve=a;reject=b});
  const timers=new Map(),events=[];
  const session={end:async()=>{ended++}};
  const ctx={X:{requestToken:1,starting:true,session:null},navigator:{xr:{requestSession:()=>pending}},
    setTimeout:(fn,ms)=>{timers.set(++next,{fn,at:now+ms});return next},
    clearTimeout:id=>timers.delete(id),timeoutScale:()=>1,
    rec:(...e)=>events.push(e),toastXR:()=>{},setStage:()=>{}};
  vm.createContext(ctx);
  vm.runInContext(line('function timeout(')+'\n'+line('async function requestImmersive('),ctx);
  return {ctx,session,events,get ended(){return ended},resolve:()=>resolve(session),reject,
    advance:ms=>{now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn()}},timers};
}
test('headset permission granted after 20 seconds still returns a live session',async()=>{
  const h=harness();let status='pending';
  const request=h.ctx.requestImmersive('immersive-vr',{},1);
  request.then(()=>{status='resolved'},()=>{status='rejected'});
  h.advance(20000);await new Promise(setImmediate);
  assert.equal(status,'pending','permission request must have no artificial deadline');
  h.resolve();assert.equal(await request,h.session);assert.equal(h.ended,0);
  assert.equal(h.timers.size,0);
});
test('permission denial preserves browser error and clears reminder',async()=>{
  const h=harness(),err=new Error('user denied');
  const request=h.ctx.requestImmersive('immersive-vr',{},1);
  h.reject(err);await assert.rejects(request,e=>e===err);
  assert.equal(h.timers.size,0);assert.equal(h.ended,0);
});
test('a stale request closes its late session',async()=>{
  const h=harness();const request=h.ctx.requestImmersive('immersive-vr',{},1);
  h.ctx.X.requestToken=2;h.resolve();
  await request.catch(()=>{});assert.equal(h.ended,1);
});
test('published compressed XR module is exactly the current authority',()=>{
  const block=html.match(/<script id="uprs461QuestXRRecovery">[\s\S]*?<\/script>/)[0].trim();
  const compressed=fs.readFileSync(new URL('../_includes/uprs461-quest-xr-recovery-v2.html.gz.b64',import.meta.url),'utf8');
  const source=zlib.gunzipSync(Buffer.from(compressed.trim(),'base64')).toString().trim();
  assert.equal(source,block,'publisher must not restore an older XR implementation');
});
