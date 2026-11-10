/* Explicit file read only: no storage, commands, simulation or network. */
'use strict';
let coreHub=null,readVersion=0;
document.getElementById('core-input').addEventListener('submit',async event=>{
  event.preventDefault();const version=++readVersion;
  const status=document.getElementById('core-status');
  try{
    const file=document.getElementById('core-file').files[0];
    if(!file)throw Error('Core-JSON auswählen');
    const ownerId=document.getElementById('core-owner').value;
    const text=await file.text();if(version!==readVersion)return;
    const bundle=LegacyCoreAdapter.project(text,{ownerId});
    if(coreHub)coreHub.update(bundle);else coreHub=LegacyHub.mount(document.getElementById('hub-content'),document.getElementById('hub-nav'),bundle);
    status.textContent='Core-Snapshot · Tick '+bundle.tick+' · Eigentümer '+bundle.ownerId+' · Fitting/Pilot/Scanner: getrennte Demos';
  }catch(error){if(version===readVersion)status.textContent='Nicht geladen: '+error.message+' · bisherige Ansicht bleibt unverändert.';}
});
