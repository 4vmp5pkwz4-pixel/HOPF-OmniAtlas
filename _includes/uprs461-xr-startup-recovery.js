/* ------------------------------------------------ Quest 3 startup recovery v4.6.1 */
const XRSTART450={
 stage:'idle',detail:'',startedAt:0,sessionRequestedAt:0,sessionAcquiredAt:0,
 firstFrameAt:0,refType:'',lastError:null,history:[],firstFrameTimer:0,
 policy:Object.freeze({
  mode:'immersive-vr',
  requiredFeatures:[],
  optionalFeatures:['local-floor','bounded-floor'],
  directUserActivation:true,
  preferAR:false,
  depthOnStartup:false,
  autoLegacyFallback:false,
  requestTimeoutMs:15000,
  glTimeoutMs:8000,
  referenceSpaceTimeoutMs:5000,
  firstFrameTimeoutMs:8000
 })
};
function xrNow450(){try{return performance.now()}catch(_){return Date.now()}}
function xrScale450(ms){const k=Number(globalThis.__UPRS_XR_TEST_TIMEOUT_SCALE__);return Math.max(1,Math.round(ms*(Number.isFinite(k)&&k>0?k:1)))}
function xrStage450(stage,detail){
 XRSTART450.stage=stage;XRSTART450.detail=String(detail||'');
 XRSTART450.history.push({stage,detail:XRSTART450.detail,at:Math.round(xrNow450())});
 if(XRSTART450.history.length>32)XRSTART450.history.shift();
 try{const b=document.getElementById('xrBtn');if(b){b.dataset.xrStage=stage;b.title='XR · '+stage+(detail?' · '+detail:'')}}catch(_){}
}
function xrWait450(promise,ms,stage){
 return new Promise((resolve,reject)=>{
  let done=false;
  const timer=setTimeout(()=>{if(done)return;done=true;const e=new Error('Timeout: '+stage);e.name='TimeoutError';reject(e)},xrScale450(ms));
  Promise.resolve(promise).then(v=>{if(done)return;done=true;clearTimeout(timer);resolve(v)},e=>{if(done)return;done=true;clearTimeout(timer);reject(e)});
 });
}
function xrExplain450(error,stage){
 const name=String(error?.name||'Error'),msg=String(error?.message||error||'unknown');
 if(name==='SecurityError')return 'WebXR SecurityError: откройте страницу напрямую в Meta Quest Browser по HTTPS и нажмите XR ещё раз. Встроенный iframe или потерянная активация пользователя запрещают запуск.';
 if(name==='NotSupportedError')return 'WebXR NotSupportedError: immersive-vr или запрошенная конфигурация недоступна в этом браузере.';
 if(name==='InvalidStateError')return 'WebXR InvalidStateError: другая immersive-сессия уже активна. Закройте её или перезагрузите страницу.';
 if(name==='TimeoutError')return 'WebXR завис на этапе «'+stage+'». Сессия принудительно остановлена; повторный запуск безопасен.';
 return 'WebXR '+name+' на этапе «'+stage+'»: '+msg;
}
function xrReport450(){
 return {
  version:'4.6.1',stage:XRSTART450.stage,detail:XRSTART450.detail,
  secureContext:!!globalThis.isSecureContext,focused:document.hasFocus?.()??null,
  visibility:document.visibilityState,embedded:globalThis.top!==globalThis.self,
  navigatorXR:!!navigator.xr,userActivation:{
   active:navigator.userActivation?.isActive??null,
   hasBeenActive:navigator.userActivation?.hasBeenActive??null
  },
  policy:XRSTART450.policy,refType:XRSTART450.refType,
  elapsedMs:XRSTART450.startedAt?Math.round(xrNow450()-XRSTART450.startedAt):0,
  lastError:XRSTART450.lastError,history:XRSTART450.history.slice()
 };
}
function xrShowReport450(message){
 const report=xrReport450(),text=(message||'XR')+'\n'+JSON.stringify(report,null,2);
 console.warn('UPRS XR startup',report);
 toast450(message||('XR: '+XRSTART450.stage));
 try{
  let box=document.getElementById('xrDiag450');
  if(!box){
   box=document.createElement('div');box.id='xrDiag450';
   box.style.cssText='position:fixed;left:10px;right:10px;bottom:10px;z-index:2147483600;max-height:45vh;overflow:auto;padding:10px 12px;border:1px solid rgba(255,157,157,.55);border-radius:12px;background:rgba(18,7,10,.96);color:#ffe2e2;font:11px/1.45 ui-monospace,monospace;white-space:pre-wrap;box-shadow:0 18px 55px rgba(0,0,0,.65)';
   box.addEventListener('click',()=>box.remove());
   document.body.appendChild(box);
  }
  box.textContent=text+'\n\nНажмите на это сообщение, чтобы закрыть.';
 }catch(_){}
}
async function xrAbort450(sess,error,stage){
 if(XRSTART450.firstFrameTimer){clearTimeout(XRSTART450.firstFrameTimer);XRSTART450.firstFrameTimer=0}
 XRSTART450.lastError={name:String(error?.name||'Error'),message:String(error?.message||error||''),stage};
 xrStage450('failed',stage);
 try{if(sess)await Promise.race([sess.end(),new Promise(r=>setTimeout(r,xrScale450(1200)))])}catch(_){}
 if(S.sess===sess)S.sess=null;S.gl=null;S.ref=null;S.sceneKey='';
 try{if(state.xrSession===sess)state.xrSession=null}catch(_){}
 xrShowReport450(xrExplain450(error,stage));
}
function xrGuard450(){
 if(!globalThis.isSecureContext){const e=new Error('secure context required');e.name='SecurityError';throw e}
 if(globalThis.top!==globalThis.self){
  const pp=document.permissionsPolicy||document.featurePolicy;
  if(pp?.allowsFeature&&!pp.allowsFeature('xr-spatial-tracking')){const e=new Error('iframe lacks xr-spatial-tracking permission');e.name='SecurityError';throw e}
 }
 if(document.visibilityState==='hidden'){const e=new Error('document is hidden');e.name='SecurityError';throw e}
}
async function xrPreflight450(){
 const b=document.getElementById('xrBtn');if(!b)return;
 if(!navigator.xr){b.dataset.xrSupport='none';b.title='WebXR API отсутствует';return}
 try{
  const ok=await navigator.xr.isSessionSupported('immersive-vr');
  b.dataset.xrSupport=ok?'immersive-vr':'unsupported';
  if(ok)b.title='Quest-safe WebXR · immersive-vr · v4.6.1';
 }catch(e){b.dataset.xrSupport='probe-error';b.title='WebXR probe: '+String(e?.message||e)}
}
