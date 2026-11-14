const assert=require('node:assert/strict'),Welt=require('../prototypes/welt/welt-kern.js');
function good(w,s){assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s)));}
async function supply(seed){
 const {k6Start}=await import('../tools/k6-eisdisposition.mjs');
 const {terminalSave}=k6Start(seed),{welt:w,zustand:s}=Welt.ausRegel199K7(terminalSave);
 const before={ore:s.ledger.erz.mined,delivered:s.w3.geliefert,material:s.w4.materialErzeugt,hulls:s.w5.fertig};
 w.politikSetzen(s,{ersatzkauf:false,eisfracht:false});
 w.industrieAutoSetzen(s,true);
 for(let n=0;n<1500;n++){
  w.minute(s);
  if(s.w5.fertig>before.hulls&&!s.w3.auftrag)break;
 }
 assert.equal(s.ledger.erz.mined-before.ore,50);
 assert.equal(s.w3.geliefert-before.delivered,50);
 assert.ok(s.w4.materialErzeugt-before.material>=5);
 assert.equal(s.w5.fertig-before.hulls,1);
 assert.ok(s.stations.st_nadir.lager.frachter>0);
 assert.equal(s.kanon.industrieErz.signWerft,true);
 w.industrieAutoSetzen(s,false);w.politikSetzen(s,{automatik:false});
 good(w,s);return {w,s};
}
module.exports={supply};
