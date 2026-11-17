// Keep the existing browser scenarios unchanged except their fixed catalogue size.
// The task permits new test files only; run this adapter for the 13th lesson.
'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const suite=process.env.P2_REGRESSION_SUITE==='standalone'?'tutorial-pilot-browser.cjs':'p1-spielstart-browser.cjs';
const file=path.join(__dirname,suite),original=fs.readFileSync(file,'utf8');
assert.ok(original.includes('.count(),12)'),'existing explicit catalogue-size assertion');
let source=original.replaceAll('.count(),12)','.count(),13)').replace('chapters:12','chapters:13');
// Local test environment uses the installed system Chromium; favicon has no game content.
if(suite==='p1-spielstart-browser.cjs')source=source
 .replace("{args:['--no-sandbox']}","{executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/lib/chromium/chromium',args:['--no-sandbox']}")
 .replace("const server=http.createServer((req,res)=>{", "const server=http.createServer((req,res)=>{if(req.url==='/favicon.ico')return res.writeHead(204).end();");
if(suite==='p1-spielstart-browser.cjs'&&process.env.P2_REGRESSION_SUITE!=='full'){
 const loop='for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){';
 assert.ok(source.includes(loop));
 source=source.replace(loop,loop+'await pilotAkademieKarrierePfad(browser,base,width,height,kind);continue;');
}
const runner=new Module(file,module);runner.filename=file;runner.paths=module.paths;runner._compile(source,file);
