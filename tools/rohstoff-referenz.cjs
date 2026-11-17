/* Unabhaengige Original-main-Referenzen: nur Ausgabe, kein Ueberschreiben.
 * Benoetigt Git-Historie mit bf8d4d27; der normale Regressionstest nicht. */
const {Module,createRequire}=require('node:module'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto'),fs=require('node:fs');
const base=require('node:path').resolve(__dirname,'../prototypes/welt')+'/';const cache={};
function alt(path){if(cache[path])return cache[path].exports;const filename=base+path,m=new Module(filename);cache[path]=m;m.filename=filename;m.paths=Module._nodeModulePaths(base);const native=createRequire(filename);m.require=id=>['./j2b-silizium-core.js','./rule200-k7-industry-core.js'].includes(id)?alt(id.slice(2)):native(id);m._compile(execFileSync('git',['show','bf8d4d27:prototypes/welt/'+path],{encoding:'utf8',cwd:require('node:path').resolve(__dirname,'..')}),filename);return m.exports;}
const K=alt('welt-kern.js'),hash=s=>createHash('sha256').update(s).digest('hex');
const refs={quelle:'bf8d4d27e87914abf725992e41752577dc7106cc',minuten:3000,regeln:{}};
for(const name of ['erstellenJ4c','erstellenP8d']){const w=K[name](),s=w.createState();const start={sha256:hash(w.save(s)),hash:w.hash(s)};w.advance(s,3000);refs.regeln[name]={start,fortsetzung:{sha256:hash(w.save(s)),hash:w.hash(s)}};}
console.log(JSON.stringify(refs,null,2));
