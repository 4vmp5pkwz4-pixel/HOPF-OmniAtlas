import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Execute the actual numerical catalogue, without the browser registration/UI.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const context=vm.createContext({});
function section(start,end){
  const a=html.indexOf(start),b=html.indexOf(end,a);
  assert.ok(a>=0&&b>a,`Missing numerical catalogue section: ${start}`);
  return html.slice(a,b);
}
vm.runInContext(section('const PI=Math.PI','const MODEL_RU=')+
  ';globalThis.baseModels=UPRSO_MODELS;globalThis.constants=UPRSO_CONST;',context);
for(const [version,name] of [['420','opticalModels'],['430','nonlinearModels']]){
  const versionString=version.split('').join('.');
  vm.runInContext('(()=>{'+section(`const V${version}='${versionString}';`,
    '/* ------------------------------------------------------------------ i18n */')+
    `;globalThis.${name}=M;})();`,context);
}
vm.runInContext(section('function mapResponse(m,res)','function modelParams()')+
  ';globalThis.mapResponse=mapResponse;',context);
const models={...context.baseModels,...context.opticalModels,...context.nonlinearModels};
const K=context.constants;
const params=id=>Object.fromEntries(models[id].params.map(d=>[d.key,d.value]));
const magnitude=z=>Math.hypot(z.re,z.im);
const close=(actual,expected,relative=1e-9,absolute=1e-12)=>assert.ok(
  Math.abs(actual-expected)<=absolute+relative*Math.abs(expected),
  `${actual} differs from ${expected}`);
const multiply=(a,b)=>({re:a.re*b.re-a.im*b.im,im:a.re*b.im+a.im*b.re});
const divide=(a,b)=>{const d=b.re*b.re+b.im*b.im;return {
  re:(a.re*b.re+a.im*b.im)/d,im:(a.im*b.re-a.re*b.im)/d};};

test('passive graphene has nonnegative sheet conductance and impedance',()=>{
  const m=models.graphene_kubo;
  for(const mu of [.01,.3,1])for(const T of [4,300,600])for(const f of [1e11,1e13,1e15]){
    const r=m.response(f,{...params('graphene_kubo'),mu,T});
    assert.ok(r.extras.sigma.re>=0,`Re sigma=${r.extras.sigma.re}, mu=${mu}, T=${T}, f=${f}`);
    assert.ok(r.z.re>=0,`Re sheet impedance=${r.z.re}`);
    assert.ok(magnitude(context.mapResponse(m,r).gamma)<=1+1e-12);
  }
});

test('graphene DC limit agrees with the degenerate Drude sheet conductance',()=>{
  const p={...params('graphene_kubo'),T:4,tau:1e-11};
  const s=models.graphene_kubo.response(0,p).extras.sigma;
  const drudeDC=K.e**2*(p.mu*K.e)*p.tau/(Math.PI*K.hbar**2);
  close(s.re,drudeDC,1e-6);
  close(s.im,0,0,1e-12);
});

test('collisionless graphene approaches the universal interband conductance',()=>{
  const p={...params('graphene_kubo'),T:4,tau:Infinity};
  const s=models.graphene_kubo.response(1e15,p).extras.sigma;
  close(s.re,K.e**2/(4*K.hbar),1e-12);
});

test('collisionless sub-threshold graphene is reactive with inductive sheet impedance',()=>{
  const p={...params('graphene_kubo'),T:4,tau:Infinity};
  const r=models.graphene_kubo.response(1e11,p);
  close(r.extras.sigma.re,0,0,1e-12);
  assert.ok(r.extras.sigma.im<0,'e^(+i omega t) intraband conductance is inductive');
  assert.ok(r.z.im>0);
});

test('double-negative medium selects the passive negative-index branch',()=>{
  const r=models.metamaterial_dng.response(7e9,params('metamaterial_dng'));
  const {eps,mu,n}=r.extras;
  assert.ok(eps.re<0&&mu.re<0);
  assert.ok(eps.im<=0&&mu.im<=0,'passive constitutive loss for e^(+i omega t)');
  assert.ok(n.re<0&&n.im<=0,`negative index with forward decay required, got ${JSON.stringify(n)}`);
  assert.ok(r.z.re>0,'forward power requires positive real wave impedance');
  const nz=multiply(n,r.z),noverz=divide(n,r.z);
  close(nz.re,mu.re);close(nz.im,mu.im);
  close(noverz.re,eps.re);close(noverz.im,eps.im);
});

test('lossless double-negative medium retains a negative refractive index',()=>{
  const p={...params('metamaterial_dng'),damp:0};
  const {n}=models.metamaterial_dng.response(7e9,p).extras;
  assert.ok(n.re<0);
  close(n.im,0,0,1e-12);
});

test('Raman resonance amplifies with its absorptive susceptibility',()=>{
  const p={...params('raman_gain'),gL:.2};
  const r=models.raman_gain.response(p.OmR,p);
  // On resonance chi is purely imaginary, OmR/GR. The resonant
  // susceptibility produces gain; its zero real part produces no phase.
  close(Math.log(magnitude(r.h)),p.gL*p.OmR/(2*p.GR));
  close(Math.atan2(r.h.im,r.h.re),0,0,1e-12);
});

test('positive Raman gain does not turn into absorption above resonance',()=>{
  const p={...params('raman_gain'),gL:.2};
  for(const factor of [.9,1.1])assert.ok(
    magnitude(models.raman_gain.response(p.OmR*factor,p).h)>1,
    `Stokes gain at ${factor} times the Raman frequency must exceed unity`);
});

test('constant-Q propagation tends to a pure propagation delay without loss',()=>{
  const p={...params('kjartansson_q'),Q:Infinity,L:100};
  const f=10,r=models.kjartansson_q.response(f,p),phase=-2*Math.PI*f*p.L/p.V0;
  close(magnitude(r.h),1);
  close(r.h.re,Math.cos(phase));close(r.h.im,Math.sin(phase));
});

test('finite constant-Q loss is set by Q with a nonzero propagation phase',()=>{
  const p={...params('kjartansson_q'),Q:50,L:100};
  const r=models.kjartansson_q.response(p.f0,p);
  const halfMaterialLossAngle=Math.atan(1/p.Q)/2;
  const travelPhase=2*Math.PI*p.f0*p.L/p.V0;
  const amplitude=Math.exp(-travelPhase*Math.sin(halfMaterialLossAngle));
  const phase=-travelPhase*Math.cos(halfMaterialLossAngle);
  close(r.h.re,amplitude*Math.cos(phase));close(r.h.im,amplitude*Math.sin(phase));
});

test('ISM delay at 1 GHz and DM=50 is 207.4404 ms',()=>{
  const r=models.ism_dispersion.response(1000,params('ism_dispersion'));
  close(r.extras.groupDelayMs,207.4404,1e-12);
});

test('ISM spectral phase differentiates to the positive physical delay',()=>{
  const f=1000,df=1e-7,p={...params('ism_dispersion'),fref:f,sc:0};
  const low=models.ism_dispersion.response(f-df,p).h;
  const high=models.ism_dispersion.response(f+df,p).h;
  const relative=multiply(high,{re:low.re,im:-low.im});
  const delay=-Math.atan2(relative.im,relative.re)/(2*Math.PI*2*df*1e6);
  close(delay,.2074404,1e-6);
});

test('TE cutoff is an open-impedance limit with Gamma=+1',()=>{
  const m=models.waveguide_te,p={...params('waveguide_te'),mode:0};
  const response=m.response(p.fc,p),mapped=context.mapResponse(m,response);
  assert.equal(response.z.re,Infinity);
  close(mapped.gamma.re,1);close(mapped.gamma.im,0);
  assert.equal(mapped.passive,true);
});

test('TM cutoff is a zero-impedance limit with Gamma=-1',()=>{
  const m=models.waveguide_te,p={...params('waveguide_te'),mode:1};
  const response=m.response(p.fc,p),mapped=context.mapResponse(m,response);
  close(magnitude(response.z),0);
  close(mapped.gamma.re,-1);close(mapped.gamma.im,0);
});

test('evanescent TE is inductive and TM capacitive for the forward-decaying branch',()=>{
  const m=models.waveguide_te,p=params('waveguide_te'),f=.8*p.fc;
  const te=m.response(f,{...p,mode:0}),tm=m.response(f,{...p,mode:1});
  close(te.z.re,0);close(tm.z.re,0);
  assert.ok(te.z.im>0,'TE below cutoff is inductive for e^(+i omega t)');
  assert.ok(tm.z.im<0,'TM below cutoff is capacitive for e^(+i omega t)');
  const product=multiply(te.z,tm.z);
  close(product.re,p.eta**2);close(product.im,0);
});
