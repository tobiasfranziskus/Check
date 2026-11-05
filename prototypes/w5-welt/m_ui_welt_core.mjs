/** W5e: eine bereits existierende Regel22-Welt, keine zweite Simulation. */
export function weltSitzung(api,anfang=api.createW5DState(42)) {
 const rules=api.W5D_RULES;
 let state=anfang;
 const pruefen=()=>{
   if(state?.rulesVersion!==22 || state?.schema!==8 || !api.audit(state).ok)
     throw Error('Regel22-Sitzung nicht finanz- und warenauditierbar');
 };
 pruefen();
 return {
   lesen:()=>state,
   export:()=>api.save(state),
   befehl:cmd=>{
     pruefen();
     const result=api.execute(state,cmd,rules);
     pruefen();
     return result;
   },
   schritt:n=>{
     if(![1,10,20,32,50,60,64,120].includes(n))throw Error('Unzulässiger Zeitschritt');
     pruefen();api.advance(state,n,rules);pruefen();
   },
   import:raw=>{
     const next=api.loadW5D(raw);
     if(!api.audit(next).ok)throw Error('W5d-Audit ungültig');
     state=next;
   },
   neu:seed=>{
     if(!Number.isSafeInteger(seed)||seed<1||seed>2147483647)throw Error('Ungültiger Seed');
     const next=api.createW5DState(seed);
     if(!api.audit(next).ok)throw Error('Startaudit ungültig');
     state=next;
   },
 };
}
function einfrieren(o){
 if(o&&typeof o==='object'){for(const v of Object.values(o))einfrieren(v);Object.freeze(o);}
 return o;
}
/** Rein lesende, schematische gemeinsame Karte für Miner, Frachter und Jäger. */
export function weltSicht(api,state,gewaehlt=null){
 const regeln=state.rulesVersion===api.W5I_RULES?.rulesVersion?api.W5I_RULES
   :state.rulesVersion===api.W5H_RULES?.rulesVersion?api.W5H_RULES
   :state.rulesVersion===api.W5G_RULES?.rulesVersion?api.W5G_RULES
   :state.rulesVersion===api.W5F_RULES?.rulesVersion?api.W5F_RULES:api.W5D_RULES;
 if(state.rulesVersion!==regeln.rulesVersion)throw Error('Nur W5d-Regel22 oder W5f-Regel23');
 const schiffe=Object.keys(state.ships).sort().map(id=>state.ships[id]).map(s=>({
   id:s.id,name:s.rufname||s.id,owner:s.owner,klasse:s.klasse,
   system:s.system,phase:s.phase,auftrag:s.auftrag,
   ziel:s.ziel??null,ankunft:s.ankunft??null,ladung:{...s.ladung},
 }));
 const akt=state.w3.auftrag;
 const entities=[
   {id:'st_aldera',ty:'s',nm:'Aldera',x:-650,y:100},
   {id:'st_nadir',ty:'s',nm:'Nadir',x:650,y:100},
   {id:'feld-erz',ty:'r',nm:'Erz (Aldera)',ware:'erz',x:-790,y:-250},
   {id:'feld-silizium',ty:'r',nm:'Silizium (Nadir)',ware:'silizium',x:790,y:-250},
 ];
 const laenge=akt?.zeit??60;
 for(let i=0;i<schiffe.length;i++){
   const s=schiffe[i];
   let x=(s.system==='nadir'?650:-650)+((i%4)-1.5)*95;
   let y=-110-Math.floor(i/4)*85;
   let a=0;
   if(akt?.schiff===s.id && s.phase==='reise'){
     const rest=Math.max(0,(s.ankunft??state.tick)-state.tick);
     const f=Math.max(0,Math.min(1,1-rest/laenge));
     x=akt.phase==='rueck'?650-1300*f:-650+1300*f;
     y=-55;a=akt.phase==='rueck'?Math.PI:0;
   }
   entities.push({id:s.id,ty:'p',nm:s.name,owner:s.owner,
     hull:({miner:'miner',frachter:'trader',jaeger:'hunter'})[s.klasse]||'rookie',x,y,a});
 }
 const audit=api.audit(state);
 const selected=schiffe.find(s=>s.id===gewaehlt)??schiffe[0]??null;
 const z=state.stations;
 const o=state.owners;
 return einfrieren({
   version:'W5dGemeinsameWeltV1',tick:state.tick,hash:api.hash(state),
   schiffe,selected,audit,
   lager:{
     aldera:{erz:z.st_aldera.lager.erz,miner:z.st_aldera.lager.miner,frachter:z.st_aldera.lager.frachter},
     nadir:{erz:z.st_nadir.lager.erz,material:z.st_nadir.lager.material,
       silizium:z.st_nadir.lager.silizium,bauteil:z.st_nadir.lager.bauteil,
       jaeger:z.st_nadir.lager.jaeger,miner:z.st_nadir.lager.miner},
   },
   kassen:Object.fromEntries(['house','npc3','transport','st_aldera','st_nadir','pirates','fonds_transport']
     .map(id=>[id,o[id]?.cash??0])),
   transport:{auftrag:akt?{schiff:akt.schiff,phase:akt.phase,rest:Math.max(0,(state.ships[akt.schiff]?.ankunft??state.tick)-state.tick)}:null,
     beauftragt:state.w3.beauftragt,abgeschlossen:state.w3.abgeschlossen,geliefert:state.w3.geliefert},
   produktion:{raffinerie:state.w4.abgeschlossen,bauteile:state.w5b.bauteilFertig,
     jaeger:state.w5b.jaegerFertig,verkauft:state.w5b.jaegerVerkauft},
   jagd:{kaempfe:state.w5d.kaempfe,verluste:state.w5d.verluste.map(e=>({...e})),
     bezahlteStunden:state.w5c.bezahlteStunden,jagdkosten:state.w5c.jagdKosten,
     kopfgeld:state.stats.kopfgeld,minted:state.minted},
   canvas:{t:state.tick,entities,fields:[],cargo:selected?Object.values(selected.ladung).reduce((a,b)=>a+b,0):0,
     capacity:regeln.economy.cargo,phase:selected?.phase??'dock',auftrag:selected?.auftrag??'halten'},
 });
}
