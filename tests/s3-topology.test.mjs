import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const block=html.match(/<script id="uprs660FibreTopology">([\s\S]*?)<\/script>/)?.[1];
const context={};vm.createContext(context);if(block)vm.runInContext(block,context);
const core=()=>{assert.ok(context.__UPRS660__,'v6.6.0 topology engine must exist');return context.__UPRS660__.core};
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} differs from ${b}`);
const project=f=>f.components.map(c=>c.map(q=>core().stereo(q,1)));
function circle(center=[0,0,0],plane='xy',n=80){
  return Array.from({length:n+1},(_,i)=>{const t=2*Math.PI*i/n;return plane==='xy'?[center[0]+Math.cos(t),center[1]+Math.sin(t),center[2]]:[center[0]+Math.cos(t),center[1],center[2]+Math.sin(t)]});
}
test('T(2,2) has two different closed components on unit S³',()=>{
  const f=core().phaseFibre(2,2,0,80,Math.PI/4);
  assert.equal(f.components.length,2);
  for(const c of f.components){near(Math.hypot(...c[0]),1,1e-12);near(Math.hypot(...c.at(-1).map((v,i)=>v-c[0][i])),0,1e-12)}
  assert.ok(Math.hypot(...f.components[0][0].map((v,i)=>v-f.components[1][0][i]))>.1);
});
test('all components satisfy qα−pβ = Φ mod 2π',()=>{
  const phase=.79,f=core().phaseFibre(4,6,phase,120,Math.PI/4);
  assert.equal(f.components.length,2);
  for(const c of f.components)for(const s of c){const a=Math.atan2(s[1],s[0]),b=Math.atan2(s[3],s[2]);near(Math.cos(6*a-4*b),Math.cos(phase),1e-11);near(Math.sin(6*a-4*b),Math.sin(phase),1e-11)}
});
test('fundamental Hopf fibres link once and orientation is signed',()=>{
  const [a]=project(core().phaseFibre(1,1,0,96,Math.PI/4));
  const [b]=project(core().phaseFibre(1,1,Math.PI,96,Math.PI/4));
  const r=core().linking(a,b);assert.equal(r.status,'ok');near(r.value,1);
  near(core().linking([...a].reverse(),b).value,-1);
});
test('two complete (2,2) fibres link four times across all four pairs',()=>{
  const a=project(core().phaseFibre(2,2,0,96,Math.PI/4));
  const b=project(core().phaseFibre(2,2,Math.PI,96,Math.PI/4));
  let total=0;for(const x of a)for(const y of b){const r=core().linking(x,y);assert.equal(r.status,'ok');near(r.value,1);total+=r.value}near(total,4);
});
test('two trefoil phase fibres link six times at two sampling resolutions',()=>{
  for(const n of [120,240]){
    const [a]=project(core().phaseFibre(2,3,0,n,Math.PI/4));
    const [b]=project(core().phaseFibre(2,3,Math.PI,n,Math.PI/4));
    const r=core().linking(a,b);assert.equal(r.status,'ok');near(r.value,6);
  }
});
test('separated circles have zero linking; rigid transforms preserve result',()=>{
  const a=circle(),b=circle([0,0,3]);near(core().linking(a,b).value,0);
  const move=c=>c.map(([x,y,z])=>[10-3*y,-7+3*x,2+3*z]);
  near(core().linking(move(a),move(b)).value,0);
});
test('open, coincident and intersecting polygons refuse an integer',()=>{
  const a=circle(),b=circle([0,0,3]);
  for(const [x,y] of [[a.slice(0,-1),b],[a,a],[a,circle([0,0,0],'xz')]]){
    const r=core().linking(x,y);assert.notEqual(r.status,'ok');assert.equal(r.value,null);
  }
});
test('malformed winding and singular projection are explicitly refused',()=>{
  for(const [p,q] of [[0,1],[1,0],[1.5,2],[9,1],[NaN,2]])assert.equal(core().phaseFibre(p,q,0,96,Math.PI/4).status,'invalid');
  assert.equal(core().stereo([0,0,0,1],1),null);
});
test('negative winding reverses the signed phase-fibre link',()=>{
  const [a]=project(core().phaseFibre(-1,1,0,96,Math.PI/4));
  const [b]=project(core().phaseFibre(-1,1,Math.PI,96,Math.PI/4));
  const r=core().linking(a,b);assert.equal(r.status,'ok');near(r.value,-1);
});
test('scene rebuilds preserve other entities and contain both complete fibres exactly once',()=>{
  const scene={lines:[{pts:[[0,0,0],[1,0,0]],meta:{id:'response',kind:'locus'}}],points:[]};
  const opt={mode:'hopf',enabled:true,p:2,q:2,n:96,scale:.6,wireframe:false};
  core().appendScene(scene,opt);core().appendScene(scene,opt);
  const lines=scene.lines.filter(l=>l.meta?.kind==='topo660-fibre');
  assert.equal(lines.length,4);assert.ok(scene.lines.some(l=>l.meta.id==='response'));
  assert.equal(new Set([...scene.lines,...scene.points].map(e=>e.meta.id)).size,scene.lines.length+scene.points.length);
});
test('topology scene layer is gated by mode and disabled layers remove their geometry',()=>{
  const scene={lines:[],points:[]};
  core().appendScene(scene,{mode:'smith',enabled:true,p:2,q:2});assert.equal(scene.lines.length,0);
  core().appendScene(scene,{mode:'hopf',enabled:true,p:2,q:2});assert.equal(scene.lines.length,4);
  core().appendScene(scene,{mode:'hopf',enabled:false,p:2,q:2});assert.equal(scene.lines.length,0);assert.equal(scene.points.length,0);
});
test('a self-intersecting curve cannot be reported as a topological link',()=>{
  const bow=[[-1,-1,0],[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0]];
  const r=core().linking(bow,circle([0,0,4]));assert.equal(r.value,null);assert.notEqual(r.status,'ok');
});
test('collinear retracing edges are refused, including at polygon closure',()=>{
  const c=[[0,0,0],[1,0,0],[2,0,0],[0,0,0]],b=[[0,0,3],[1,0,3],[0,1,3],[0,0,3]];
  for(const a of [c,[...c].reverse()]){const r=core().linking(a,b);assert.equal(r.value,null);assert.notEqual(r.status,'ok')}
});
