/** Ein eigener IndexedDB-Namespace: keine Nutzung der Hauptspiel-DB aphros-void. */
export const DATENBANK='aphros-void-forschungswelt-w5j';
export const SLOT='regel26-npc-bergbaueinnahmen-drittjaeger-v1';
function oeffnen(idb){
 if(!idb) return Promise.reject(Error('IndexedDB in diesem Browser nicht verfügbar'));
 return new Promise((resolve,reject)=>{
   const req=idb.open(DATENBANK,1);
   req.onupgradeneeded=()=>{
     if(!req.result.objectStoreNames.contains('saves'))req.result.createObjectStore('saves');
   };
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(req.error||Error('Datenbank konnte nicht geöffnet werden'));
   req.onblocked=()=>reject(Error('Datenbank durch anderen Tab blockiert'));
 });
}
export async function laden(idb=globalThis.indexedDB){
 const db=await oeffnen(idb);
 return new Promise((resolve,reject)=>{
   const tx=db.transaction('saves','readonly'),req=tx.objectStore('saves').get(SLOT);
   let wert;
   req.onsuccess=()=>{wert=req.result;};
   tx.oncomplete=()=>{db.close();resolve(wert);};
   tx.onerror=()=>{db.close();reject(tx.error||Error('Lesefehler'));};
   tx.onabort=()=>{db.close();reject(tx.error||Error('Lesen abgebrochen'));};
 });
}
/** Optimistisches Speichern: bei Änderung aus anderem Tab niemals überschreiben. */
export async function sichern(raw,erwartet,idb=globalThis.indexedDB){
 if(typeof raw!=='string'||raw.length===0)throw Error('Leerer Spielstand');
 const db=await oeffnen(idb);
 return new Promise((resolve,reject)=>{
   const tx=db.transaction('saves','readwrite'),store=tx.objectStore('saves');
   let grund='Schreibvorgang abgebrochen';
   const req=store.get(SLOT);
   req.onsuccess=()=>{
     if(req.result!==erwartet){
       grund='Spielstand wurde in einem anderen Tab geändert. Kein Überschreiben.';
       tx.abort();return;
     }
     store.put(raw,SLOT);
   };
   tx.oncomplete=()=>{db.close();resolve();};
   tx.onabort=()=>{db.close();reject(Error(grund));};
   tx.onerror=()=>{grund=tx.error?.message||grund;};
 });
}
