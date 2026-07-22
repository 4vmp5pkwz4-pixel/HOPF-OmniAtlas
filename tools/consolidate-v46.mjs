import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const VERSION = '4.6.0';
const SOURCE = 'app-v4.5.0.html';
const OUT_DIR = 'build';
const OUT = path.join(OUT_DIR, 'index.html');
const REPORT = path.join(OUT_DIR, 'UPRS_v4.6.0_consolidation_report.json');

let html = fs.readFileSync(SOURCE, 'utf8');
const sourceBytes = Buffer.byteLength(html);
const changes = [];

function countOf(needle) {
  if (needle instanceof RegExp) {
    const flags = needle.flags.includes('g') ? needle.flags : needle.flags + 'g';
    return [...html.matchAll(new RegExp(needle.source, flags))].length;
  }
  return html.split(needle).length - 1;
}

function replaceExact(label, needle, replacement, expected = 1) {
  const count = countOf(needle);
  if (count !== expected) {
    throw new Error(`${label}: expected ${expected} occurrence(s), found ${count}`);
  }
  html = html.replace(needle, replacement);
  changes.push({ label, count });
}

const title = `UPRS Möbius–Hopf OmniAtlas v${VERSION} · Unified Scientific & Immersive Observatory`;
const core = fs.readFileSync('_includes/uprs460-core-authority.html', 'utf8').trim();
const consolidation = fs.readFileSync('_includes/uprs460-consolidation.html', 'utf8').trim();

replaceExact(
  'source title',
  '<title>UPRS Möbius–Hopf OmniAtlas v4.1.0 · Predictive Observatory + Visual Workspace + Claude + ASML EUV LPP</title>',
  `<title>${title}</title>`
);
replaceExact(
  'Predictive Observatory title authority',
  "const TITLE398='UPRS Möbius–Hopf OmniAtlas v3.9.8 · Predictive Phenomenon Observatory + Point Selection + Claude + ASML EUV LPP';",
  `const TITLE398='${title}';`
);
replaceExact(
  'Predictive Observatory brand version',
  "if(s)s.textContent='UNIFIED S³ · PREDICTIVE OBSERVATORY · DISCOVERY · HYPOTHESIS ENGINE · v3.9.8';",
  "if(s)s.textContent='UNIFIED S³ · PREDICTIVE OBSERVATORY · IMMERSIVE LAB · v4.6.0';"
);
replaceExact('early core authority', '<head>', `<head>${core}`);
replaceExact(
  'v4.4 XR ownership deferral',
  "if(typeof enterXR==='function'&&!window.__UPRS440_LEGACY_XR__)window.__UPRS440_LEGACY_XR__=enterXR;",
  "if(typeof enterXR==='function'&&!window.__UPRS440_LEGACY_XR__)window.__UPRS440_LEGACY_XR__=enterXR;\n  if(globalThis.__UPRS_APP__?.xrOwner==='450')return;"
);
replaceExact(
  'remove v4.4 repair installers',
  'for(const ms of [900,2600,7000])setTimeout(()=>{try{install440()}catch(_){}},ms);',
  ''
);
replaceExact(
  'idempotent v4.5 installer declaration',
  'let tries=0;\nfunction install450(){',
  'let tries=0,installed450=false;\nfunction install450(){'
);
replaceExact(
  'idempotent v4.5 installer guard',
  "if(!document.body||typeof state==='undefined'||!CORE()){if(tries++<90)return setTimeout(install450,220);return}",
  "if(!document.body||typeof state==='undefined'||!CORE()){if(tries++<90)return setTimeout(install450,220);return}\n if(installed450)return;installed450=true;"
);
replaceExact(
  'remove v4.5 repair installers',
  'for(const ms of [1100,3000,8000])setTimeout(()=>{try{install450()}catch(_){}},ms);',
  ''
);
replaceExact(
  'audio polling lifecycle',
  'function toggleSound450(){const on=!AU.enabled;',
  'function toggleSound450(){const on=!AU.enabled;if(!on&&deskTimer){clearInterval(deskTimer);deskTimer=0}'
);
replaceExact(
  'v4.4 scene signature',
  "function sceneKey440(){try{return state.mode+'|'+((state.scene?.points||[]).length)+'|'+((state.scene?.lines||[]).length)+'|'+state.model}catch(_){return ''}}",
  "function sceneKey440(){try{const a=globalThis.__UPRS_APP__;return state.mode+'|'+state.model+'|'+state.index+'|'+(a?.sceneRevision||0)+'|'+(a?.sceneStamp?.(state.scene)||0)}catch(_){return ''}}"
);
replaceExact(
  'v4.5 scene signature',
  "function sceneKey450(){try{return state.mode+'|'+((state.scene?.points||[]).length)+'|'+((state.scene?.lines||[]).length)+'|'+state.model}catch(_){return ''}}",
  "function sceneKey450(){try{const a=globalThis.__UPRS_APP__;return state.mode+'|'+state.model+'|'+state.index+'|'+(a?.sceneRevision||0)+'|'+(a?.sceneStamp?.(state.scene)||0)}catch(_){return ''}}"
);
replaceExact('late consolidation module', '</body>', `${consolidation}</body>`);

const scripts = [];
const syntaxFailures = [];
const scriptRx = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
while ((match = scriptRx.exec(html))) {
  const attrs = match[1] || '';
  if (/\bsrc\s*=/.test(attrs) || /type\s*=\s*["']module["']/.test(attrs)) continue;
  scripts.push(match[2] || '');
}
scripts.forEach((code, index) => {
  try {
    new vm.Script(code, { filename: `inline-script-${index + 1}.js` });
  } catch (error) {
    syntaxFailures.push({ index: index + 1, message: error.message });
  }
});
if (syntaxFailures.length) {
  throw new Error(`Inline script syntax failures: ${JSON.stringify(syntaxFailures, null, 2)}`);
}

const required = [
  'uprs460CoreAuthority',
  'uprs460Consolidation',
  '__UPRS420__',
  '__UPRS430__',
  '__UPRS440__',
  '__UPRS450__',
  '__UPRS398__',
  'asml_euv_lpp'
];
const missing = required.filter(token => !html.includes(token));
if (missing.length) throw new Error(`Required capabilities missing: ${missing.join(', ')}`);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, html);
const report = {
  version: VERSION,
  source: SOURCE,
  sourceBytes,
  outputBytes: Buffer.byteLength(html),
  inlineScripts: scripts.length,
  syntaxFailures,
  changes,
  requiredCapabilities: required,
  generatedAt: new Date().toISOString()
};
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
