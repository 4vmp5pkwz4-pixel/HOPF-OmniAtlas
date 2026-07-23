/* ------------------------------------------------ Quest 3 startup recovery v4.6.1 */
const XRSTART450={
 stage:'idle',detail:'',startedAt:0,sessionRequestedAt:0,sessionAcquiredAt:0,
 firstFrameAt:0,refType:'',lastError:null,history:[],firstFrameTimer:0,
 pending:false,attempt:0,lateSessionsEnded:0,
 policy:Object.freeze({
  mode:'immersive-vr',
  requiredFeatures:[],
  optionalFeatures:['local-floor'],
  directUserActivation:true,
  preferAR:false,
  depthOnStartup:false,
  autoLegacyFallback:false,
  automaticPreflight:false,
  requestTimeoutMs:0,
  permissionReminderMs:8000,
  glTimeoutMs:8000,
  referenceSpaceTimeoutMs:5000,
  firstFrameTimeoutMs:8000,
  forceWebGL1ForGLSL100:true
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
function xrWait450(promise,ms,stage,onLateResolve){
 /* requestSession cannot be cancelled safely. Rejecting on a timer can leave Quest with a late zombie immersive session. */
 if(stage==='request-session'){
  const reminder=setTimeout(()=>{
   if(XRSTART450.pending&&XRSTART450.stage==='request-session'){
    xrStage450('waiting-user-permission','confirm inside headset');
    try{toast450('WebXR: подтвердите запуск внутри шлема')}catch(_){}
   }
  },xrScale450(XRSTART450.policy.permissionReminderMs));
  return Promise.resolve(promise).finally(()=>clearTimeout(reminder));
 }
 return new Promise((resolve,reject)=>{
  let done=false;
  const timer=setTimeout(()=>{if(done)return;done=true;const e=new Error('Timeout: '+stage);e.name='TimeoutError';reject(e)},xrScale450(ms));
  Promise.resolve(promise).then(v=>{
   if(done){try{onLateResolve?.(v)}catch(_){}return}
   done=true;clearTimeout(timer);resolve(v)
  },e=>{if(done)return;done=true;clearTimeout(timer);reject(e)});
 });
}
/* v4.5 shaders use GLSL ES 1.00 attribute/varying syntax. Quest WebGL2 rejects them, so only this XR canvas falls back to WebGL1. */
try{
 const proto=globalThis.HTMLCanvasElement?.prototype;
 if(proto&&!proto.__uprs461XRContextGuard){
  const nativeGetContext=proto.getContext;
  Object.defineProperty(proto,'__uprs461XRContextGuard',{value:true});
  proto.getContext=function(type,attrs){
   if(this?.id==='xr450Canvas'&&type==='webgl2')return null;
   return nativeGetContext.call(this,type,attrs);
  };
 }
}catch(_){}
function xrExplain450(error,stage){
 const name=String(error?.name||'Error'),msg=String(error?.message||error||'unknown');
 if(stage==='webxr-api')return 'WebXR API отсутствует. Откройте опубликованный HTTPS-адрес непосредственно в Meta Quest Browser; локальный file://, предпросмотр файла и встроенный iframe не запускают immersive WebXR.';
 if(name==='SecurityError')return 'WebXR SecurityError: откройте страницу напрямую в Meta Quest Browser по HTTPS, убедитесь, что вкладка активна, и нажмите XR ещё раз. Встроенный iframe или потерянная активация пользователя запрещают запуск.';
 if(name==='NotSupportedError')return 'WebXR NotSupportedError: immersive-vr или запрошенная конфигурация недоступна в этом браузере.';
 if(name==='InvalidStateError')return 'WebXR InvalidStateError: другая immersive-сессия уже активна или ещё создаётся. Закройте её либо перезагрузите страницу.';
 if(name==='TimeoutError')return 'WebXR завис на этапе «'+stage+'». Сессия безопасно завершена.';
 return 'WebXR '+name+' на этапе «'+stage+'»: '+msg;
}
function xrReport450(){
 return {
  version:'4.6.1',stage:XRSTART450.stage,detail:XRSTART450.detail,
  protocol:location.protocol,origin:location.origin,secureContext:!!globalThis.isSecureContext,
  focused:document.hasFocus?.()??null,visibility:document.visibilityState,
  embedded:globalThis.top!==globalThis.self,navigatorXR:!!navigator.xr,
  pending:XRSTART450.pending,attempt:XRSTART450.attempt,lateSessionsEnded:XRSTART450.lateSessionsEnded,
  userActivation:{active:navigator.userActivation?.isActive??null,hasBeenActive:navigator.userActivation?.hasBeenActive??null},
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
   box.addEventListener('click',()=>box.remove());document.body.appendChild(box);
  }
  box.textContent=text+'\n\nНажмите на это сообщение, чтобы закрыть.';
 }catch(_){}
}
async function xrEndLate450(sess){
 if(!sess)return;
 XRSTART450.lateSessionsEnded++;
 try{await Promise.race([sess.end(),new Promise(r=>setTimeout(r,xrScale450(1200)))])}catch(_){}
}
async function xrAbort450(sess,error,stage){
 if(XRSTART450.firstFrameTimer){clearTimeout(XRSTART450.firstFrameTimer);XRSTART450.firstFrameTimer=0}
 XRSTART450.pending=false;
 XRSTART450.lastError={name:String(error?.name||'Error'),message:String(error?.message||error||''),stage};
 xrStage450('failed',stage);
 try{if(sess)await Promise.race([sess.end(),new Promise(r=>setTimeout(r,xrScale450(1200)))])}catch(_){}
 if(S.sess===sess)S.sess=null;S.gl=null;S.ref=null;S.sceneKey='';
 try{if(state.xrSession===sess)state.xrSession=null}catch(_){}
 xrShowReport450(xrExplain450(error,stage));
}
function xrGuard450(){
 if(!globalThis.isSecureContext){const e=new Error('secure context required');e.name='SecurityError';throw e}
 if(document.hasFocus&&!document.hasFocus()){const e=new Error('document is not focused');e.name='SecurityError';throw e}
 if(globalThis.top!==globalThis.self){
  const pp=document.permissionsPolicy||document.featurePolicy;
  if(pp?.allowsFeature&&!pp.allowsFeature('xr-spatial-tracking')){const e=new Error('iframe lacks xr-spatial-tracking permission');e.name='SecurityError';throw e}
 }
 if(document.visibilityState==='hidden'){const e=new Error('document is hidden');e.name='SecurityError';throw e}
}
async function xrPreflight450(){
 const b=document.getElementById('xrBtn');if(!b)return false;
 if(!navigator.xr){b.dataset.xrSupport='none';b.title='WebXR API отсутствует';return false}
 try{const ok=await navigator.xr.isSessionSupported('immersive-vr');b.dataset.xrSupport=ok?'immersive-vr':'unsupported';return ok}
 catch(e){b.dataset.xrSupport='probe-error';b.title='WebXR probe: '+String(e?.message||e);return false}
}
