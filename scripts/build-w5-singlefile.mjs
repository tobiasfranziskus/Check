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
out='<!-- Aphros Void / single-file Rule195 W0-W5: Generated from same original core, no asset URLs. -->\n'+out;
// GitHub Pages erhält nur die statische Spielmodus-Navigation; NAS bleibt eine
// eigenständige W0–W5-Datei ohne nicht mitgelieferte J4e-Dateipfade.
const pagesNavigation="<nav aria-label=\"Spielmodi\" style=\"padding:12px;border:2px solid #65d7ec;border-radius:9px;margin:12px 0;background:#102332\">\n <a href=\"prototypes/j4c/index.html\" style=\"display:inline-block;min-height:50px;padding:12px 18px;border-radius:8px;background:#176d77;color:#fff;font-weight:700;text-decoration:none\">Jäger selbst fliegen · Patrouille &amp; Duell</a>\n <span style=\"display:block;margin-top:8px\">Neu: echter bezahlter 2D-Jäger (Regel204) mit Startknopf für den unabhängig geprüften, vollständig finanzierten Beispielspielstand. W0–W5-Hauptspiel und dessen Speicher bleiben getrennt erhalten. Jäger-Spielstand vor Verlassen als JSON exportieren.</span>\n</nav>";
const heading="<h1>Aphros Void – W0–W5</h1>";
assert.ok(out.includes(heading),'W0–W5 Spieltitel fehlt');
const pages=out.replace(heading,heading+String.fromCharCode(10)+pagesNavigation);
assert.doesNotMatch(out,/<script[^>]*\bsrc\s*=|<link[^>]*\brel="stylesheet"[^>]*\bhref\s*=/);
for(const [name,expected] of [['index.html',pages],['aphros-void.html',out]]){
 const dest=path.join(root,name);
 if(process.argv.includes('--write'))fs.writeFileSync(dest,expected);
 else assert.equal(fs.readFileSync(dest,'utf8'),expected,name+' must exactly match source build + approved navigation');
}
console.log('W5_SINGLEFILE_OK '+JSON.stringify({chars:out.length,styles:css.length,scripts:scripts.length,pagesNavigation:true}));
