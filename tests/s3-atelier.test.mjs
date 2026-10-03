import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function core(){const m=html.match(/<script id="uprs660AtelierRenderer">([\s\S]*?)<\/script>/);assert.ok(m,'volumetric Atelier module exists');const ctx={};vm.createContext(ctx);vm.runInContext(m[1],ctx);return ctx.__UPRS660_ATELIER__.core}
const circle=(n=80)=>Array.from({length:n+1},(_,i)=>{const a=2*Math.PI*(i%n)/n;return [Math.cos(a),Math.sin(a),0]});

test('closed tubes retain the centre line and have exact ring closure',()=>{
 const c=core(),p=circle(),r=.017,m=c.tubeMesh(p,r,12);assert.equal(m.status,'ok');
 assert.equal(m.vertices.length,(p.length)*13*8);assert.equal(m.indices.length,80*12*6);
 const stride=13*8,last=80*stride;for(let k=0;k<stride;k++)assert.equal(m.vertices[k],m.vertices[last+k]);
 for(let i=0;i<80;i++){let centroid=[0,0,0];for(let j=0;j<12;j++){const k=(i*13+j)*8,v=m.vertices.slice(k,k+3),n=m.vertices.slice(k+3,k+6);
 assert.ok(Math.abs(Math.hypot(...n)-1)<1e-6);assert.ok(Math.abs(Math.hypot(...v.map((x,a)=>x-p[i][a]))-r)<1e-6);
 for(let a=0;a<3;a++)centroid[a]+=v[a]/12}
 assert.ok(Math.hypot(...centroid.map((x,a)=>x-p[i][a]))<1e-6)}
});
test('nonplanar tube frames are finite and close without a material seam',()=>{
 const p=Array.from({length:193},(_,i)=>{const t=2*Math.PI*(i%192)/192;return [(1+.3*Math.cos(3*t))*Math.cos(2*t),(1+.3*Math.cos(3*t))*Math.sin(2*t),.3*Math.sin(3*t)]});
 const m=core().tubeMesh(p,.01,16);assert.equal(m.status,'ok');assert.ok(m.vertices.every(Number.isFinite));
 const ring=17*8;for(let k=0;k<ring;k++)assert.equal(m.vertices[k],m.vertices[192*ring+k]);
 for(let i=0;i<m.vertices.length;i+=8){assert.ok(Math.abs(Math.hypot(...m.vertices.slice(i+3,i+6))-1)<1e-6)}
});
test('tube triangle winding agrees with the outward surface normal',()=>{
 const m=core().tubeMesh(circle(),.017,12),v=m.vertices,ix=m.indices;
 const p=i=>Array.from(v.slice(i*8,i*8+3)),sub=(a,b)=>a.map((x,j)=>x-b[j]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 for(let i=0;i<ix.length;i+=6){const a=p(ix[i]),b=p(ix[i+1]),c=p(ix[i+2]),n=v.slice(ix[i]*8+3,ix[i]*8+6),face=cross(sub(b,a),sub(c,a));assert.ok(face.reduce((sum,x,j)=>sum+x*n[j],0)>0)}
});
test('open, zero-length and nonfinite tube inputs are rejected',()=>{
 const c=core();for(const p of [circle().slice(0,-1),[[0,0,0],[0,0,0],[1,0,0],[0,0,0]],[[0,0,0],[1,0,0],[NaN,1,0],[0,0,0]]])assert.notEqual(c.tubeMesh(p,.01,12).status,'ok');
 for(const r of [0,-.1,Infinity])assert.notEqual(c.tubeMesh(circle(),r,12).status,'ok');
});
test('GPU camera uses the exact native yaw pitch roll and zoom projection',()=>{
 const c=core(),p=[.7,-.3,.4],cam={yaw:.39,pitch:-.2,roll:.17,distance:3.8};
 for(const [w,h] of [[1440,700],[390,740]]){
 const cy=Math.cos(cam.yaw),sy=Math.sin(cam.yaw),cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch),cr=Math.cos(cam.roll),sr=Math.sin(cam.roll);
 let x=cy*p[0]+sy*p[2],z=-sy*p[0]+cy*p[2],y=cp*p[1]-sp*z;z=sp*p[1]+cp*z;const xx=cr*x-sr*y,yy=sr*x+cr*y,d=cam.distance-z,f=Math.min(w,h)*1.38;
 const q=c.projectPoint(p,cam,w,h);assert.ok(Math.abs(q[0]-(w/2+xx*f/d))<1e-9);assert.ok(Math.abs(q[1]-(h/2-yy*f/d))<1e-9);assert.ok(Math.abs(q[2]-d)<1e-9);
 }
});
test('focus camera translates the world before rotation and projection',()=>{
 const c=core(),cam={yaw:.39,pitch:-.2,roll:.17,distance:3.8,target:[.4,.2,-.1]},p=[.5,.2,.1];
 const shifted=p.map((v,i)=>v-cam.target[i]),expected=c.projectPoint(shifted,{...cam,target:[0,0,0]},1440,700),actual=c.projectPoint(p,cam,1440,700);
 actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-9));
});
test('presentation tube radius stays below the analytic inter-fibre clearance bound',()=>{
 const c=core(),scale=.4212,eta=Math.PI/4;for(const [p,q] of [[1,1],[2,2],[2,3],[4,6],[8,7],[8,8]]){
 const lower=scale*2*Math.min(Math.cos(eta),Math.sin(eta))/((1+Math.sin(eta))*Math.hypot(p,q));
 const r=c.safeRadius(p,q,scale,eta);assert.ok(r>0&&2*r<lower*.4);
 }
});
