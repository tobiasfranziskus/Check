/* R1 / Issue469: Node-only Forschung, keine Browseraktivierung oder Save-Migration.
 * Ein Geologiebuch, KEINE zweite Wirtschaft. Kein RNG erforderlich: feste Wartezeit
 * ab nachgewiesener Erschöpfung. Neue Vorkommens-ID = feldId:generation.
 * Profile sind unfreigegebene Experimente. Preise/Löhne bleiben im Originalcore.
 */
'use strict';
const PROFILE=Object.freeze({
 A:Object.freeze({erz:[400,1,1,240],eis:[400,1,1,240],silizium:[16,1,1,10080],kristall:[8,1,4,20160]}),
 B:Object.freeze({erz:[400,1,1,1440],eis:[400,1,1,1440],silizium:[16,1,2,20160],kristall:[8,1,8,40320]}),
 C:Object.freeze({erz:[50,1,2,10080],eis:[50,1,2,10080],silizium:[16,1,4,40320],kristall:[8,1,16,80640]})
});
for(const p of Object.values(PROFILE))for(const c of Object.values(p))Object.freeze(c);
const clone=x=>JSON.parse(JSON.stringify(x));
const nat=x=>Number.isSafeInteger(x)&&x>=0;
const keys=(x,k)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join()===k.split(',').sort().join();
function create(profil){
 if(!Object.hasOwn(PROFILE,profil))throw Error('R1: explizites Profil A/B/C erforderlich');
 const config=clone(PROFILE[profil]); let definitionen;
 const buch=s=>s.kanon.rohstoffe;
 function konfigurieren(r){
   definitionen=[...r.world.fields.filter(f=>['erz','eis','kristall'].includes(f.ware)).map(f=>({feldId:f.system+'-'+f.ware,system:f.system,ware:f.ware})),
    ...[r.j2b.feld,r.j2b.nebenfeld].map(f=>({feldId:f.id,system:f.system,ware:'silizium'}))].sort((a,b)=>a.feldId<b.feldId?-1:a.feldId>b.feldId?1:0);
 }
 function init(s,r){
   konfigurieren(r);
   s.kanon.rohstoffe={modell:'R1',profil,felder:Object.fromEntries(definitionen.map(d=>[d.feldId,{...d,
    maxkapazitaet:config[d.ware][0],foerderrate:config[d.ware][1],minuten:config[d.ware][2],wartezeit:config[d.ware][3],
    restmenge:config[d.ware][0],gefoerdert:0,generation:0,respawn:null,letzte:{},ereignisse:[]}]))};
 }
 const feld=(s,sh,ware,id)=>Object.values(buch(s).felder).find(f=>f.ware===ware&&f.system===sh.system&&(!id||f.feldId===id));
 function menge(s,sh,ware,n,id){
   const f=feld(s,sh,ware,id);
   // Kristall hat in Rule207 KEINEN originalfinanzierten Produktionspfad.
   // Metadaten allein berechtigen niemals zur Förderung.
   if(!f||ware==='kristall'||sh.klasse!=='miner'||!s.owners[sh.owner]||s.tick%f.minuten||f.letzte[sh.id]?.tick===s.tick)return 0;
   return Math.min(n,f.foerderrate,f.restmenge);
 }
 function abbauen(s,sh,ware,n,id){
   if(!nat(n)||!n||menge(s,sh,ware,n,id)!==n)throw Error('R1: unzulaessige Entnahme');
   const f=feld(s,sh,ware,id);f.restmenge-=n;f.gefoerdert+=n;f.letzte[sh.id]={tick:s.tick,owner:sh.owner};
   if(!f.restmenge){f.respawn=s.tick+f.wartezeit;f.ereignisse.push({id:f.feldId+':'+f.generation,leer:s.tick,neu:f.respawn});}
 }
 function minute(s,tick){
   for(const f of Object.values(buch(s).felder))if(f.respawn===tick){
     f.restmenge=f.maxkapazitaet;f.generation++;f.respawn=null;
     if(f.ware==='silizium'){
       s.kanon.silizium.vorrat+=f.maxkapazitaet;
       s.kanon.silizium.felder[f.feldId].vorrat+=f.maxkapazitaet;
     }
   }
 }
 function kapazitaet(s,id){const f=buch(s).felder[id];return (f.generation+1)*f.maxkapazitaet;}
 function audit(s){try{
   const b=buch(s);if(!keys(b,'modell,profil,felder')||b.modell!=='R1'||b.profil!==profil||!definitionen
     ||Object.keys(b.felder).sort().join()!==definitionen.map(d=>d.feldId).sort().join())return false;
   const totals={erz:0,eis:0,silizium:0,kristall:0};
   for(const d of definitionen){const f=b.felder[d.feldId],c=config[d.ware];
     if(!keys(f,'feldId,system,ware,maxkapazitaet,foerderrate,minuten,wartezeit,restmenge,gefoerdert,generation,respawn,letzte,ereignisse')
       ||Object.entries(d).some(([k,v])=>f[k]!==v)
       ||[f.maxkapazitaet,f.foerderrate,f.minuten,f.wartezeit].join()!==c.join()
       ||![f.restmenge,f.gefoerdert,f.generation].every(nat)||f.restmenge>f.maxkapazitaet
       ||f.restmenge!==kapazitaet(s,d.feldId)-f.gefoerdert
       ||!Array.isArray(f.ereignisse)||f.ereignisse.length!==f.generation+(f.respawn!==null?1:0)
       ||(f.respawn!==null&&(!nat(f.respawn)||f.respawn<=s.tick||f.restmenge!==0))
       ||(f.restmenge===0&&f.respawn===null))return false;
     let vorher=-1;
     for(let i=0;i<f.ereignisse.length;i++){const e=f.ereignisse[i];
       if(!keys(e,'id,leer,neu')||e.id!==f.feldId+':'+i||!nat(e.leer)||e.leer<=vorher||e.leer>s.tick
         ||e.neu!==e.leer+f.wartezeit||(i<f.generation?e.neu>s.tick:e.neu!==f.respawn))return false;
       vorher=e.neu;
     }
     if(!f.letzte||Array.isArray(f.letzte)||Object.entries(f.letzte).some(([id,e])=>!keys(e,'tick,owner')||!s.ships[id]||s.ships[id].owner!==e.owner||!nat(e.tick)||e.tick>s.tick||e.tick%f.minuten))return false;
     if(f.ware==='silizium'&&s.kanon.silizium.felder[f.feldId].vorrat!==f.restmenge)return false;
     totals[f.ware]+=f.gefoerdert;
   }
   return Object.entries(totals).every(([w,n])=>n===(s.ledger[w]?.mined||0));
 }catch{return false;}}
 return Object.freeze({konfigurieren,init,menge,abbauen,minute,kapazitaet,audit});
}
module.exports=Object.freeze({create,PROFILE});
