import fs from 'node:fs';
const path='index.html',start='<!-- UPRS670:BEGIN -->',end='<!-- UPRS670:END -->';
const core=fs.readFileSync('_includes/uprs670-laboratory-core.js','utf8').trim();
const ui=fs.readFileSync('_includes/uprs670-laboratory-ui.html','utf8').trim();
const block=`${start}\n<script id="uprs670LaboratoryCore">\n${core}\n</script>\n${ui}\n${end}`;
let html=fs.readFileSync(path,'utf8');
if(html.includes(start)){const a=html.indexOf(start),b=html.indexOf(end,a);if(b<0)throw new Error('Unclosed laboratory block');html=html.slice(0,a)+block+html.slice(b+end.length)}
else html=html.trimEnd()+'\n'+block+'\n';
fs.writeFileSync(path,html);console.log('Embedded exact laboratory sources; standalone release preserved.');
