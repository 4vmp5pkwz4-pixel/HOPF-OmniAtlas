import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const installer=html.match(/^function installLate25\(\)\{.*$/m)?.[0];
assert.ok(installer);

function boot(delayed){
 const pending=[],ctx={window:{},V25:{entitySnapshot25:()=>null},state:{scene:{lines:[],points:[]}},console,performance:{now:()=>0}};
 ctx.setTimeout=fn=>pending.push(fn);
 for(const name of ['entitySnapshot25','resetIds25','fixPrecisionIcons25','installTargetMatrix25','installLayoutResync25','updateUI','draw','syncUI25','stamp25','scheduleSilentTests393'])ctx[name]=()=>{};
 ctx.runTests=()=>({tests:[]});
 ctx.buildScene=()=>{ctx.state.scene.lines=[]};
 // The legacy hook appends a layer; the authoritative post-pass replaces it.
 ctx.finalPost25=()=>{ctx.state.scene.lines=ctx.state.scene.lines.filter(e=>e.meta.kind!=='invariant-clifford21')};
 const legacy=()=>{ctx.window.__UPRS_V21_INIT__=true;const pre=ctx.buildScene;ctx.buildScene=()=>{pre();ctx.state.scene.lines.push({meta:{kind:'invariant-clifford21'}})}};
 vm.createContext(ctx);vm.runInContext(installer,ctx);
 if(!delayed)legacy();ctx.installLate25();if(delayed)legacy();
 const callback=pending.shift();if(callback)callback();
 ctx.buildScene();return ctx;
}

test('authoritative invariant replacement follows normally initialized legacy layers',()=>{
 const ctx=boot(false);assert.equal(ctx.window.__UPRS_V25_LATE__,true);assert.equal(ctx.state.scene.lines.length,0);
});
test('delayed legacy initialization cannot append obsolete geometry after replacement',()=>{
 const ctx=boot(true);assert.equal(ctx.window.__UPRS_V25_LATE__,true);assert.equal(ctx.state.scene.lines.length,0);
});
