import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const file=new URL('../_includes/uprs670-laboratory-core.js',import.meta.url),ctx={};
vm.createContext(ctx);if(fs.existsSync(file))vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const core=()=>{assert.ok(ctx.__UPRS670_CORE__,'the parameter laboratory numerical authority exists');return ctx.__UPRS670_CORE__};
const near=(a,b,rtol=1e-9)=>assert.ok(Math.abs(a-b)<=rtol*Math.max(Math.abs(b),1e-300),`${a} ≠ ${b}`);

test('laboratory uses the exact SI defining constants',()=>{
 const c=core().constants;assert.equal(c.h,6.62607015e-34);assert.equal(c.kB,1.380649e-23);assert.equal(c.c,299792458);
 near(c.sigma,5.670374419184429e-8,2e-14);
});
test('Planck radiance approaches Rayleigh–Jeans at low frequency',()=>{
 const c=core();near(c.planckNu(1e8,300),9.217001398665564e-22,1e-12);
 near(c.planckNu(1e6,300)/(2*c.constants.kB*300*1e12/c.constants.c**2),1,1e-7);
});
test('frequency and wavelength spectral densities obey the Jacobian',()=>{
 const c=core(),lambda=550e-9,T=5772,nu=c.constants.c/lambda;
 near(c.planckLambda(lambda,T),c.planckNu(nu,T)*c.constants.c/lambda**2,1e-12);
});
test('Wien maxima refer to their own spectral coordinate',()=>{
 const c=core(),b=c.blackbody(300);
 near(b.peakLambda*300,2.897771955185172e-3,1e-12);
 near(b.peakNu/300,5.878925757646825e10,1e-12);
 assert.ok(Math.abs(c.constants.c/b.peakNu/b.peakLambda-1)>.5);
 for(const [f,peak] of [[x=>c.planckNu(x,300),b.peakNu],[x=>c.planckLambda(x,300),b.peakLambda]])assert.ok(f(peak)>f(peak*.99)&&f(peak)>f(peak*1.01));
});
test('independent spectral quadrature reproduces Stefan–Boltzmann and converges',()=>{
 const c=core(),coarse=c.blackbodyIntegral(300,128),fine=c.blackbodyIntegral(300,512);
 near(fine.numeric,459.30032795393877,2e-8);assert.ok(fine.relativeError<coarse.relativeError);assert.ok(fine.relativeError<2e-8);
 near(c.blackbody(600).exitance/c.blackbody(300).exitance,16,1e-14);
});
test('Planck exponential extremes stay finite and invalid domains are refused',()=>{
 const c=core();assert.equal(c.planckNu(1e20,2.725),0);assert.ok(Number.isFinite(c.planckLambda(1e-10,2.725)));
 for(const p of [[0,300],[-1,300],[1,0],[1,NaN],[Infinity,300]])assert.throws(()=>c.planckNu(...p));
});
test('Casimir pressure, force and energy have the ideal parallel-plate limits',()=>{
 const c=core(),r=c.casimir(1e-6,1e-4,0);
 near(r.pressure,-.0013001257732448343,1e-12);near(r.force,r.pressure*1e-4);
 near(r.energyPerArea,-4.333752577482781e-10,1e-12);assert.equal(r.thermalParameter,0);
 const d=1e-10,gradient=-(c.casimir(1e-6+d,1,0).energyPerArea-c.casimir(1e-6-d,1,0).energyPerArea)/(2*d);
 near(gradient,r.pressure,1e-7);
});
test('Casimir scales as inverse fourth power and temperature is diagnostic only',()=>{
 const c=core(),a=c.casimir(1e-6,1,0),b=c.casimir(2e-6,1,300);
 near(a.pressure/b.pressure,16);assert.ok(b.thermalParameter>1);assert.equal(c.casimir(2e-6,1,0).pressure,b.pressure);
 assert.equal(b.finiteTemperatureCorrection,false);assert.ok(b.radiationPressure>0);
 for(const x of [0,-1,NaN,Infinity])assert.throws(()=>c.casimir(x,1,300));
});
test('electrical, mechanical and acoustic parameters yield the same canonical resonator',()=>{
 const c=core(),r=1/Math.sqrt(Math.PI),models=[
  c.canonical('electrical',{R:20,L:1,C:1e-4}),
  c.canonical('mechanical',{m:1,c:20,k:1e4}),
  c.canonical('acoustic',{rho:1,cs:10,radius:r,length:1-1.7*r,volume:.01,loss:20})
 ];
 for(const m of models){near(m.omega0,100,1e-13);near(m.Q,5,1e-13)}
 const z=c.resonance(2,5);near(z.im,7.5);assert.equal(z.re,1);near(c.resonance(1,5).amplitude,1);
 near(c.resonance(.5,5).phase,-z.phase);
});
test('canonical resonance rejects nonphysical or unresolvable parameters',()=>{
 const c=core();assert.throws(()=>c.canonical('electrical',{R:0,L:1,C:1}));assert.throws(()=>c.resonance(0,1));assert.throws(()=>c.resonance(1,-1));
});
test('logistic fixed point has its analytic local Lyapunov exponent',()=>{
 const r=core().logistic({r:2.8,x0:.123,burn:800,count:512});
 near(r.orbit.at(-1),1-1/2.8,1e-12);near(r.lyapunov,Math.log(.8),1e-11);
 assert.equal(r.scope,'finite-time estimate');
});
test('logistic r=4 recovers ln2 while a period-two window is contracting',()=>{
 const c=core(),chaos=c.logistic({r:4,x0:.123456789,burn:1200,count:8192}),period=c.logistic({r:3.2,x0:.123,burn:1000,count:2048});
 near(chaos.lyapunov,Math.log(2),.002);assert.ok(period.lyapunov<-.5);
 assert.ok(period.orbit.every(x=>x>=0&&x<=1));
});
test('logistic rejects invalid seeds and bounds work; superstable orbit is explicit',()=>{
 const c=core();for(const o of [{r:4.1},{r:3,x0:0},{r:3,x0:NaN},{r:3,count:1e8}])assert.throws(()=>c.logistic(o));
 const r=c.logistic({r:2,x0:.5,burn:20,count:40});assert.equal(r.lyapunov,null);assert.equal(r.superstable,true);
});
test('bifurcation grid includes requested endpoints and changes with control range',()=>{
 const r=core().bifurcation({rMin:2.8,rMax:4,width:32,burn:300,count:32,x0:.123});
 assert.equal(r.columns.length,32);near(r.columns[0].r,2.8);near(r.columns.at(-1).r,4);
 assert.ok(r.columns[0].lyapunov<0);assert.ok(r.columns.at(-1).lyapunov>0);
});
test('Cantor dust box counts recover the known self-similar dimension',()=>{
 const c=core(),p=c.cantorDust(6),d=c.boxDimension(p,[3,9,27,81]);
 assert.equal(p.length,4096);near(d.dimension,Math.log(4)/Math.log(3),1e-12);
 assert.equal(d.scope,'finite-scale box-counting estimate');assert.ok(d.r2>.999999);
});
test('box counting rejects coincident, nonfinite and undersampled data',()=>{
 const c=core();for(const p of [[],[[0,0],[0,0]],[[0,NaN],[1,0]]])assert.throws(()=>c.boxDimension(p));
 assert.throws(()=>c.cantorDust(20));
});
test('parameter grids preserve SI coordinates and mask invalid evaluations',()=>{
 const c=core(),g=c.grid({xMin:1,xMax:100,yMin:2,yMax:4,width:3,height:3,logX:true},(x,y)=>Math.abs(x-10)<1e-9&&y===3?NaN:x*y);
 near(g.x[1],10);assert.equal(g.y[1],3);assert.equal(g.values[8],400);assert.equal(g.invalid,1);assert.ok(Number.isNaN(g.values[4]));
 assert.equal(g.min,2);assert.equal(g.max,400);
});
test('grid size and logarithmic domain are validated before evaluation',()=>{
 const c=core();let calls=0;assert.throws(()=>c.grid({xMin:0,xMax:10,yMin:1,yMax:2,width:5,height:5,logX:true},()=>++calls));assert.equal(calls,0);
 assert.throws(()=>c.grid({xMin:1,xMax:2,yMin:1,yMax:2,width:10000,height:10000},()=>0));
});
