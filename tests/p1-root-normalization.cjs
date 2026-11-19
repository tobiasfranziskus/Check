// Independent inverse check: remove only documented Pages-only portal additions.
// The result MUST be byte-identical to the standalone NAS Rule195 game.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(repo,rel),'utf8');
const heading='<h1>Aphros Void – W0–W5</h1>';
const disclosure='<details id="root-legacy-info"><summary>Hintergrund zum klassischen Wirtschaftsmodus</summary>';
const divider='<section id="klassische-wirtschaft" aria-label="Klassischer Wirtschaftsmodus"><h2>Klassische Wirtschaft · W0–W5</h2><p>Der bisherige Wirtschaftseinstieg bleibt mit seinen bisherigen Spielständen, Funktionen und JSON-Importen erhalten. Das neue Spiel erreichst du über „Wirtschaftsmanager“.</p></section>';
function once(text,from,to,what){
 assert.equal(text.split(from).length,2,'expected exactly one '+what);
 return text.replace(from,to);
}
function normalizedPages(pages=read('index.html')){
 const style='<style id="pages-premium-entry">\n'+read('scripts/pages-entry.css')+'\n</style>\n';
 const portal=read('scripts/pages-entry.html');
 const match=pages.match(/<nav aria-label="Spielmodi"[\s\S]*?<\/nav>/g)||[];
 assert.equal(match.length,1,'one public Spielmodi navigation');
 assert.match(portal,/href="prototypes\/spiel\/index\.html"/);
 assert.match(portal,/href="prototypes\/j4c\/index\.html"/);
 let without=once(pages,"<title>Aphros Void · Dein Weltraumkonzern</title>","<title>Aphros Void – W0–W5 · Spielbare Entwicklungsversion</title>",'Pages-only document title');
 without=once(without,style,'','Pages-only embedded CSS');
 without=once(without,portal+'\n'+disclosure+'\n'+heading,heading,'Pages-only hero and disclosure opening');
 without=once(without,'</details>\n</header>\n'+divider+'\n<section class="controls"',
   '</header>\n<section class="controls"','Pages-only disclosure and legacy heading');
 assert.doesNotMatch(without,/id="root-portal"|id="root-legacy-info"|id="klassische-wirtschaft"/);
 return without;
}
function verify(){
 const pages=read('index.html'),nas=read('aphros-void.html');
 assert.equal(normalizedPages(pages),nas,
   'Pages-minus-only-premium-portal is byte-identical to NAS: no economy, UI, save, or style changes');
 return {pages,nas};
}
module.exports={normalizedPages,verify};
