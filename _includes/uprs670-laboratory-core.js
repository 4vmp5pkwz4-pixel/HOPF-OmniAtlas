(()=>{'use strict';
/* Numerical authority of the Parameter Observatory. SI throughout. No DOM,
   global model mutations, fitted confidence percentages or display transforms. */
const VERSION='6.7.0',h=6.62607015e-34,kB=1.380649e-23,c=299792458,hbar=h/(2*Math.PI);
const sigma=2*Math.PI**5*kB**4/(15*h**3*c**2);
const constants=Object.freeze({h,kB,c,hbar,sigma});
const sources=Object.freeze([
 {id:'si',title:'NIST · defining SI constants (2022 CODATA)',url:'https://physics.nist.gov/cuu/Constants/'},
 {id:'casimir',title:'Klimchitskaya, Mohideen & Mostepanenko · Rev. Mod. Phys. 81, 1827 (2009)',url:'https://doi.org/10.1103/RevModPhys.81.1827'},
 {id:'logistic',title:'May · Simple mathematical models with very complicated dynamics (1976)',url:'https://doi.org/10.1038/261459a0'},
 {id:'dimension',title:'Hutchinson · Fractals and self similarity (1981)',url:'https://doi.org/10.1512/iumj.1981.30.30055'},
 {id:'s3',title:'Acoustic toroidal vortices with programmable links and knots · preprint (2026)',url:'https://arxiv.org/abs/2608.15499'}
]);
function finite(x,name){if(typeof x!=='number'||!Number.isFinite(x))throw new RangeError(`${name}: finite number required`);return x}
function positive(x,name){finite(x,name);if(!(x>0))throw new RangeError(`${name}: positive value required`);return x}
function integer(x,min,max,name){finite(x,name);if(!Number.isInteger(x)||x<min||x>max)throw new RangeError(`${name}: integer ${min}…${max} required`);return x}
function bounded(x,min,max,name){finite(x,name);if(x<min||x>max)throw new RangeError(`${name}: ${min}…${max} required`);return x}
function finiteResult(x,name){if(!Number.isFinite(x))throw new RangeError(`${name}: numerical range exceeded`);return x}
/* Use Rayleigh–Jeans times x/expm1(x) at small x, log form in the tail.
   This avoids both cancellation near x=0 and Infinity/Infinity for the tail. */
function planckNu(nu,T){
 positive(nu,'frequency / Hz');positive(T,'temperature / K');
 const x=h*nu/(kB*T);if(x>745)return 0;
 const logValue=Math.log(2*h/c**2)+3*Math.log(nu)-(x>50?x:Math.log(Math.expm1(x)));
 if(logValue<-745)return 0;return finiteResult(Math.exp(logValue),'spectral radiance');
}
function planckLambda(lambda,T){
 positive(lambda,'wavelength / m');positive(T,'temperature / K');
 const x=h*c/(lambda*kB*T);if(x>745)return 0;
 const logValue=Math.log(2*h*c**2)-5*Math.log(lambda)-(x>50?x:Math.log(Math.expm1(x)));
 if(logValue<-745)return 0;return finiteResult(Math.exp(logValue),'spectral radiance');
}
function blackbody(T){
 positive(T,'temperature / K');
 const exitance=finiteResult(sigma*T**4,'exitance');
 return {temperature:T,peakNu:2.8214393721220787*kB*T/h,
  peakLambda:h*c/(4.965114231744276*kB*T),exitance,
  energyDensity:4*exitance/c,radiationPressure:4*exitance/(3*c),
  scope:'ideal equilibrium blackbody',source:'si'};
}
function blackbodyIntegral(T,n=512){
 positive(T,'temperature / K');integer(n,32,32768,'quadrature intervals');if(n%2)n++;
 // x=t² smooths the low-frequency endpoint; include the Jacobian 2t.
 const hi=50,step=Math.sqrt(hi)/n;let sum=0,compensation=0;
 for(let i=0;i<=n;i++){
  const t=i*step,x=t*t,f=i===0?0:2*t*x**3/Math.expm1(x),term=(i===0||i===n?1:i%2?4:2)*f-compensation;
  const next=sum+term;compensation=(next-sum)-term;sum=next;
 }
 const dimensionless=sum*step/3,numeric=finiteResult(2*Math.PI*kB**4*T**4/(h**3*c**2)*dimensionless,'integrated exitance');
 const analytic=blackbody(T).exitance;
 return {numeric,analytic,relativeError:Math.abs(numeric-analytic)/analytic,intervals:n,
  dimensionless,domain:[0,hi],method:'composite Simpson quadrature after x=t², including Jacobian 2t',tailBound:3e-17,unit:'W/m²'};
}
function casimir(a,area=1,T=0){
 positive(a,'plate separation / m');positive(area,'plate area / m²');bounded(T,0,1e8,'temperature / K');
 const pressure=finiteResult(-(Math.PI**2)*hbar*c/(240*a**4),'Casimir pressure');
 const energyPerArea=finiteResult(-(Math.PI**2)*hbar*c/(720*a**3),'Casimir energy');
 return {separation:a,area,temperature:T,pressure,force:finiteResult(pressure*area,'Casimir force'),energyPerArea,
  thermalParameter:2*Math.PI*kB*T*a/(hbar*c),thermalLength:T>0?hbar*c/(2*Math.PI*kB*T):null,
  radiationPressure:T>0?blackbody(T).radiationPressure:0,finiteTemperatureCorrection:false,
  scope:'infinite parallel perfect conductors; zero-temperature pressure',source:'casimir'};
}
function canonical(kind,p){
 if(!p||typeof p!=='object')throw new TypeError('Physical parameters required');
 let mass,stiffness,damping,unit;
 if(kind==='electrical'){mass=positive(p.L,'L / H');stiffness=1/positive(p.C,'C / F');damping=positive(p.R,'R / Ω');unit='Ω'}
 else if(kind==='mechanical'){mass=positive(p.m,'m / kg');stiffness=positive(p.k,'k / N/m');damping=positive(p.c,'c / N·s/m');unit='N·s/m'}
 else if(kind==='acoustic'){
  const rho=positive(p.rho,'density'),cs=positive(p.cs,'sound speed'),r=positive(p.radius,'radius'),length=positive(p.length,'neck length'),v=positive(p.volume,'volume');
  mass=rho*(length+1.7*r)/(Math.PI*r*r);stiffness=rho*cs**2/v;damping=positive(p.loss,'acoustic resistance');unit='Pa·s/m³';
 }else throw new RangeError('Unknown resonator family');
 const omega0=finiteResult(Math.sqrt(stiffness/mass),'resonance frequency'),Q=finiteResult(Math.sqrt(mass*stiffness)/damping,'quality factor');
 if(!(omega0>0&&Q>0))throw new RangeError('Resonance outside numerical range');
 return {kind,mass,stiffness,damping,omega0,f0:omega0/(2*Math.PI),Q,unit,
  equation:'Z/R = 1 + iQ(u − 1/u); u = ω/ω₀',scope:'linear lumped steady-state response'};
}
function resonance(u,Q){
 positive(u,'normalized frequency');positive(Q,'quality factor');
 const im=finiteResult(Q*(u-1/u),'normalized reactance');
 return {re:1,im,amplitude:1/Math.hypot(1,im),phase:-Math.atan2(im,1)};
}
function logistic(options={}){
 const {r=3.8,x0=.123456789,burn=1000,count=512}=options;
 bounded(r,0,4,'logistic r');finite(x0,'initial state');if(!(x0>0&&x0<1))throw new RangeError('Initial state must be inside (0,1)');
 integer(burn,0,20000,'transient iterations');integer(count,16,16384,'retained iterations');
 let x=x0;for(let i=0;i<burn;i++)x=r*x*(1-x);
 const orbit=[];let sum=0,superstable=false;
 for(let i=0;i<count;i++){
  const derivative=Math.abs(r*(1-2*x));if(derivative===0)superstable=true;else sum+=Math.log(derivative);
  x=r*x*(1-x);orbit.push(x);
 }
 return {r,x0,burn,count,orbit,lyapunov:superstable?null:sum/count,superstable,
  scope:'finite-time estimate',equation:'xₙ₊₁ = r xₙ(1 − xₙ)',source:'logistic'};
}
function bifurcation(options={}){
 const {rMin=2.8,rMax=4,width=320,burn=800,count=64,x0=.123456789}=options;
 bounded(rMin,0,4,'r min');bounded(rMax,0,4,'r max');if(rMin>=rMax)throw new RangeError('Increasing r interval required');
 integer(width,16,640,'bifurcation columns');integer(count,16,256,'retained iterations');integer(burn,0,4000,'transient iterations');
 const columns=[];for(let i=0;i<width;i++){const r=rMin+(rMax-rMin)*i/(width-1),q=logistic({r,x0,burn,count});columns.push({r,values:q.orbit,lyapunov:q.lyapunov,superstable:q.superstable})}
 return {columns,rMin,rMax,width,burn,count,x0,scope:'sampled asymptotic iterates with finite transient'};
}
function cantorDust(depth=6){
 integer(depth,1,7,'Cantor depth');let xs=[.5];
 for(let k=0;k<depth;k++)xs=xs.flatMap(x=>[x/3,(x+2)/3]);
 const points=[];for(const x of xs)for(const y of xs)points.push([x,y]);return points;
}
function boxDimension(points,divisions=[3,9,27,81]){
 if(!Array.isArray(points)||points.length<16||points.length>100000||!points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))throw new RangeError('16…100000 finite 2D points required');
 if(!Array.isArray(divisions)||divisions.length<3||divisions.length>12)throw new RangeError('3…12 box divisions required');
 const min=[Infinity,Infinity],max=[-Infinity,-Infinity];for(const p of points)for(let j=0;j<2;j++){min[j]=Math.min(min[j],p[j]);max[j]=Math.max(max[j],p[j])}
 const span=Math.max(max[0]-min[0],max[1]-min[1]);if(!(span>1e-15))throw new RangeError('Coincident point cloud');
 const counts=[];let previous=0;
 for(const n of divisions){integer(n,2,4096,'box division');if(n<=previous)throw new RangeError('Strictly increasing box divisions required');previous=n;
  const boxes=new Set();for(const p of points){const x=Math.min(n-1,Math.floor((p[0]-min[0])/span*n)),y=Math.min(n-1,Math.floor((p[1]-min[1])/span*n));boxes.add(x+','+y)}
  counts.push({division:n,count:boxes.size,used:boxes.size<=points.length/2});
 }
 const fit=counts.filter(p=>p.used);if(fit.length<3)throw new RangeError('Insufficient unsaturated box scales');
 const xs=fit.map(p=>Math.log(p.division)),ys=fit.map(p=>Math.log(p.count)),N=fit.length,mx=xs.reduce((a,b)=>a+b)/N,my=ys.reduce((a,b)=>a+b)/N;
 let xx=0,xy=0,yy=0;for(let i=0;i<N;i++){xx+=(xs[i]-mx)**2;xy+=(xs[i]-mx)*(ys[i]-my);yy+=(ys[i]-my)**2}
 return {dimension:xy/xx,intercept:my-xy/xx*mx,r2:yy>0?xy*xy/(xx*yy):null,counts,points:points.length,
  normalization:{origin:min,span},scope:'finite-scale box-counting estimate',analyticCantorDust:Math.log(4)/Math.log(3)};
}
function axis(min,max,n,log=false){
 finite(min,'axis minimum');finite(max,'axis maximum');if(!(max>min))throw new RangeError('Increasing axis interval required');integer(n,2,4096,'axis samples');
 if(log&&min<=0)throw new RangeError('Logarithmic axis requires positive bounds');
 const out=[];for(let i=0;i<n;i++){const t=i/(n-1);out.push(i===0?min:i===n-1?max:log?Math.exp(Math.log(min)*(1-t)+Math.log(max)*t):min+(max-min)*t)}return out;
}
function grid(options,evaluate){
 const {xMin,xMax,yMin,yMax,width=128,height=64,logX=false,logY=false}=options;
 integer(width,2,512,'grid width');integer(height,2,256,'grid height');if(typeof evaluate!=='function')throw new TypeError('Grid evaluator required');
 const x=axis(xMin,xMax,width,logX),y=axis(yMin,yMax,height,logY),values=new Float64Array(width*height);let min=Infinity,max=-Infinity,invalid=0;
 for(let j=0;j<height;j++)for(let i=0;i<width;i++){
  let v;try{v=evaluate(x[i],y[j])}catch(_){v=NaN}
  if(typeof v!=='number'||!Number.isFinite(v)){values[j*width+i]=NaN;invalid++}else{values[j*width+i]=v;min=Math.min(min,v);max=Math.max(max,v)}
 }
 return {x,y,width,height,values,min:Number.isFinite(min)?min:null,max:Number.isFinite(max)?max:null,invalid};
}
globalThis.__UPRS670_CORE__={version:VERSION,constants,sources,planckNu,planckLambda,blackbody,blackbodyIntegral,casimir,canonical,resonance,logistic,bifurcation,cantorDust,boxDimension,axis,grid};
})();
