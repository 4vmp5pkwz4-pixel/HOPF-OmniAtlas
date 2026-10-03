import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

// index.html is the current release, not the frozen v4.5 historical input.
const source='index.html',version='6.6.0';
const outputArg=process.argv.indexOf('--output');
const output=outputArg<0?null:process.argv[outputArg+1];
if(outputArg>=0&&!output)throw new Error('--output requires a directory');
const bytes=fs.readFileSync(source),html=bytes.toString('utf8');
const required=['uprs461QuestXRRecovery','uprs530ScientificIntegrity',
  'uprs550PhaseSpaceEngine','uprs560PhaseGeometryS3','uprs620TopologicalAtlas',
  'uprs650PredictiveMethods','uprs660FibreTopology'];
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
let parsed=0;
for(const [i,m] of scripts.entries()){
  if(/\bsrc\s*=/.test(m[1]))throw new Error(`External script ${i+1}: release must be standalone`);
  if(/\btype\s*=\s*["'](?:application\/json|application\/ld\+json)["']/.test(m[1]))continue;
  new vm.Script(m[2],{filename:`${source}:script-${i+1}`});parsed++;
}
for(const id of required){
  const found=scripts.filter(m=>new RegExp(`\\bid=["']${id}["']`).test(m[1]));
  if(found.length!==1)throw new Error(`${id}: expected one current module, found ${found.length}`);
}
const current=html.match(/<script id="uprs461QuestXRRecovery">[\s\S]*?<\/script>/)[0].trim();
const encoded=fs.readFileSync('_includes/uprs461-quest-xr-recovery-v2.html.gz.b64','utf8');
const decoded=zlib.gunzipSync(Buffer.from(encoded.trim(),'base64')).toString('utf8').trim();
if(current!==decoded)throw new Error('Published XR input differs from current index.html');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const report={schema:'uprs-current-release/1',version,source,bytes:bytes.length,
  sourceSha256:hash(bytes),outputSha256:hash(bytes),inlineScripts:parsed,requiredModules:required,
  xrModuleSha256:hash(current),checks:{inlineSyntax:true,currentModules:true,xrInputMatches:true},
  scope:'Static release verification; numerical and browser tests run separately'};
if(output){fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'index.html'),bytes);
  fs.writeFileSync(path.join(output,`UPRS_v${version}_report.json`),JSON.stringify(report,null,2)+'\n')}
console.log(JSON.stringify(report,null,2));
