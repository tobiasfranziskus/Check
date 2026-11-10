/* Browser-only save shell. Never opens legacy databases or migrates rules. */
(function(scope){
'use strict';
const database='aphros-void-regel195-v1',key='world',profile='regel195-schema8';
function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
function checksum(text){let n=2166136261;for(let i=0;i<text.length;i++)n=Math.imul(n^text.charCodeAt(i),16777619);return (n>>>0).toString(16);}
function validate(text,create){
 if(typeof text!=='string'||text.length>5*1024*1024)throw Error('Ungültige JSON-Größe');
 const raw=JSON.parse(text);
 if(raw?.schema!==8||raw.rulesVersion!==195)throw Error('Nur Regel195 / Schema8; keine Migration');
 const candidate=create();candidate.import(text);
 const json=candidate.export();
 if(canonical(raw)!==canonical(JSON.parse(json)))throw Error('Unvollständiger oder unbekannter Spielstand');
 return json;
}
async function open(indexedDB,create){
 const db=await new Promise((resolve,reject)=>{
  const req=indexedDB.open(database,1);
  req.onupgradeneeded=()=>req.result.createObjectStore('saves');
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  req.onblocked=()=>reject(Error('Speicher durch anderen Tab blockiert'));
 });
 db.onversionchange=()=>db.close();
 let expected=await new Promise((resolve,reject)=>{
  const tx=db.transaction('saves','readonly'),r=tx.objectStore('saves').get(key);
  tx.oncomplete=()=>resolve(r.result);tx.onabort=()=>reject(tx.error);
 });
 let blocked=false;
 function checkHeader(){
  if(expected!==undefined&&(expected.format!==1||expected.profile!==profile||!Number.isSafeInteger(expected.revision)||expected.revision<1||!expected.slots))throw Error('Inkompatible Speicherhülle');
 }
 function read(slot){
  checkHeader();const entry=expected?.slots[slot];if(entry===undefined)return null;
  if(!entry||typeof entry.json!=='string'||checksum(entry.json)!==entry.checksum)throw Error('Beschädigter Spielstand: '+slot);
  return validate(entry.json,create);
 }
 try{checkHeader();for(const slot of Object.keys(expected?.slots||{})){
  if(!['auto','manual','previous'].includes(slot))throw Error('Unbekannter Speicherplatz');read(slot);
 }}catch(e){blocked=true;}
 return Object.freeze({read,get blocked(){return blocked;},close:()=>db.close(),
  async write(text,manual=false){
   if(blocked)throw Error('Speichern gesperrt: beschädigter/fremder Stand. JSON exportieren; gültige Sicherung laden.');
   const json=validate(text,create),entry={json,checksum:checksum(json)};
   const slots={...expected?.slots};
   if(slots.auto&&slots.auto.json!==json)slots.previous=slots.auto;
   slots.auto=entry;if(manual)slots.manual=entry;
   const next={format:1,profile,revision:(expected?.revision||0)+1,slots};
   await new Promise((resolve,reject)=>{
    const tx=db.transaction('saves','readwrite'),store=tx.objectStore('saves'),req=store.get(key);
    let failure=null;
    req.onsuccess=()=>{
     if(canonical(req.result)!==canonical(expected)){failure=Error('Anderer Tab hat gespeichert. Zum Schutz gesperrt; JSON exportieren und neu laden.');tx.abort();return;}
     try{store.put(next,key);}catch(e){failure=e;tx.abort();}
    };
    tx.oncomplete=resolve;tx.onabort=()=>reject(failure||tx.error||Error('Speichern abgebrochen'));
    tx.onerror=()=>{};
   }).catch(e=>{blocked=true;throw e;});
   expected=next;
  }
 });
}
const api=Object.freeze({open,validate,database});
if(typeof module==='object'&&module.exports)module.exports=api;else scope.W5agStorage=api;
})(globalThis);
