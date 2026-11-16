// Development-only, deterministic inline build of Aphros Void Rule195.
// Usage: node scripts/build-w5-singlefile.mjs --check | --write
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source='prototypes/w5ag/index.html';
const html=fs.readFileSync(path.join(root,source),'utf8');
const css=[...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*>/g)].map(m=>({tag:m[0],rel:m[1]}));
const scripts=[...html.matchAll(/<script\s+defer\s+src="([^"]+)"\s*><\/script>/g)].map(m=>({tag:m[0],rel:m[1]}));
const content=rel=>{
 const file=path.normalize(path.join(root,path.dirname(source),rel));
 assert.ok(file.startsWith(path.join(root,'prototypes')+path.sep),'Unsupported external dependency: '+rel);
 return fs.readFileSync(file,'utf8');
};
assert.equal(css.length,7,'CSS dependency graph changed');
assert.equal(scripts.length,15,'JS dependency graph changed');
let out=html;
for(const c of css)out=out.replace(c.tag,()=>'<style data-inlined-from="'+c.rel+'">\n'+content(c.rel).replace(/<\/style/gi,'<\\/style')+'\n</style>');
let js='';
for(const s of scripts){
 out=out.replace(s.tag,'');
 js+='\n<script data-inlined-from="'+s.rel+'">\n'+content(s.rel).replace(/<\/script/gi,'<\\/script')+'\n</script>';
}
out=out.replace('</body>',js+'\n</body>')
 .replace('<title>Aphros Void · W5ak – Folgezyklen</title>','<title>Aphros Void – W0–W5 · Spielbare Entwicklungsversion</title>')
 .replace('<h1>Aphros Void · W5ag</h1>','<h1>Aphros Void – W0–W5</h1>');
// W5ag-Legacy-Schattenkomponenten mussten bislang zwei CSS-Dateien nachladen.
// In der Root- und NAS-Einzeldatei müssen die echten CSS-Quellen stattdessen
// exakt und reproduzierbar in den zugehörigen ShadowRoots eingebettet sein.
const linkBlock=`  const link=document.createElement('link');link.rel='stylesheet';link.href=css;
  const mountRoot=document.createElement('div');shadow.append(link,mountRoot);`;
const shadowCss={corporation:content('../legacy-corporation/corporation.css'),
  station:content('../legacy-station/station.css')};
const inlineBlock=`  const style=document.createElement('style');
  style.textContent=css==='../legacy-corporation/corporation.css'?
    ${JSON.stringify(shadowCss.corporation)}:
    css==='../legacy-station/station.css'?${JSON.stringify(shadowCss.station)}:
    (()=>{throw Error('Unbekannte Legacy-Shadow-CSS-Quelle: '+css)})();
  const mountRoot=document.createElement('div');shadow.append(style,mountRoot);`;
assert.equal(out.split(linkBlock).length,2,'Legacy-Schattenkomponenten müssen genau einmal vorkommen');
out=out.replace(linkBlock,inlineBlock);
assert.doesNotMatch(out,/document\.createElement\('link'\);link\.rel='stylesheet';link\.href=css/);
out='<!-- Aphros Void / single-file Rule195 W0-W5: Generated from same original core, no asset URLs. -->\n'+out;
// GitHub Pages erhält nur die statische Spielmodus-Navigation; NAS bleibt eine
// eigenständige W0–W5-Datei ohne nicht mitgelieferte J4e-Dateipfade.

const nl=String.fromCharCode(10);
const pagesStyle='<style id="pages-premium-entry">'+nl+
  fs.readFileSync(path.join(root,'scripts/pages-entry.css'),'utf8')+nl+'</style>'+nl;
const pagesNavigation=fs.readFileSync(path.join(root,'scripts/pages-entry.html'),'utf8');
const pagesLegacyDivider="<section id=\"klassische-wirtschaft\" aria-label=\"Klassischer Wirtschaftsmodus\"><h2>Klassische Wirtschaft · W0–W5</h2><p>Der bisherige Wirtschaftseinstieg bleibt mit seinen bisherigen Spielständen, Funktionen und JSON-Importen erhalten. Das neue Spiel erreichst du über „Karriere öffnen“.</p></section>";
const pagesDetailsStart="<details id=\"root-legacy-info\"><summary>Hintergrund zum klassischen Wirtschaftsmodus</summary>";
const heading='<h1>Aphros Void – W0–W5</h1>';
assert.ok(out.includes(heading),'W0–W5 Spieltitel fehlt');
const pages=out.replace("<title>Aphros Void – W0–W5 · Spielbare Entwicklungsversion</title>","<title>Aphros Void · Dein Weltraumkonzern</title>")
 .replace('</head>',pagesStyle+'</head>')
 .replace(heading,pagesNavigation+nl+pagesDetailsStart+nl+heading)
 .replace('</header>'+nl+'<section class="controls"',
   '</details>'+nl+'</header>'+nl+pagesLegacyDivider+nl+'<section class="controls"');
assert.equal((pages.match(/<nav aria-label="Spielmodi"/g)||[]).length,1,'Exactly one game entry navigation');
assert.doesNotMatch(out,/<script[^>]*\bsrc\s*=|<link[^>]*\brel="stylesheet"[^>]*\bhref\s*=/);
for(const [name,expected] of [['index.html',pages],['aphros-void.html',out]]){
 const dest=path.join(root,name);
 if(process.argv.includes('--write'))fs.writeFileSync(dest,expected);
 else assert.equal(fs.readFileSync(dest,'utf8'),expected,name+' must exactly match source build + approved navigation');
}
console.log('W5_SINGLEFILE_OK '+JSON.stringify({chars:out.length,styles:css.length,scripts:scripts.length,pagesNavigation:true}));
