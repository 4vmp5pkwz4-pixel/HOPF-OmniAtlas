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

function startupHarness(){
  const pending=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
  const a=pending(),b=pending(),queue=[a,b],timers=new Map();let next=0,ended=0,created=0;
  const session={end:async()=>{ended++},enabledFeatures:[],addEventListener:()=>{}};
  const X={requestToken:0,starting:false,session:null,stage:'idle',error:'',requestLog:[],support:{features:[]}};
  const ctx={X,state:{},navigator:{xr:{requestSession:()=>queue.shift().promise},userActivation:{isActive:true}},isSecureContext:true,
    document:{getElementById:()=>null,createElement:()=>{created++;throw new Error('Cancelled request must not allocate a canvas')}},
    setTimeout:(fn,ms)=>{timers.set(++next,{fn,ms});return next},clearTimeout:id=>timers.delete(id),timeoutScale:()=>1,
    performance:{now:()=>0},policyAllowed:()=>true,sessionInit:()=>({}),rec:()=>{},toastXR:()=>{},syncButtons:()=>{},
    stopWatchdog:()=>{},disposeGL:()=>{},setStage:(stage,error)=>{X.stage=stage;if(error)X.error=error},
    errorText:e=>e.message,console:{error:()=>{}}};
  const begin=html.indexOf("async function start(mode='immersive-vr',profile='safe')");
  const end=html.indexOf('\nlet API461=null;',begin);
  vm.createContext(ctx);
  vm.runInContext([line('function timeout('),line('function clearRuntime('),line('async function endSession('),line('async function requestImmersive('),html.slice(begin,end)].join('\n'),ctx);
  return {ctx,a,b,session,get ended(){return ended},get created(){return created}};
}
test('a stale permission completion cannot fail the next XR startup',async()=>{
  const h=startupHarness(),first=h.ctx.start();await h.ctx.endSession(null,'user-exit');
  const second=h.ctx.start();h.a.resolve(h.session);await first;
  assert.equal(h.ended,1);assert.equal(h.created,0);
  assert.equal(h.ctx.X.starting,true,'newer startup must remain pending');assert.equal(h.ctx.X.stage,'request-session');
  h.b.reject(new Error('user denied newer request'));await second;
});
test('exit during permission prompt invalidates the request even without another start',async()=>{
  const h=startupHarness(),first=h.ctx.start();await h.ctx.endSession(null,'user-exit');
  h.a.resolve(h.session);await first;
  assert.equal(h.created,0,'cancelled request must not proceed to XR setup');
  assert.equal(h.ended,1);assert.equal(h.ctx.X.starting,false);assert.equal(h.ctx.X.stage,'user-exit');
});
test('a stale permission rejection cannot overwrite newer startup state',async()=>{
  const h=startupHarness(),first=h.ctx.start();await h.ctx.endSession(null,'user-exit');
  const second=h.ctx.start();h.a.reject(new Error('old prompt denied'));await first;
  assert.equal(h.ctx.X.starting,true);assert.equal(h.ctx.X.stage,'request-session');assert.equal(h.ctx.X.error,'');
  h.b.reject(new Error('new prompt denied'));await second;
});
