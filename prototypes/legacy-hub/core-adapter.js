/* W5t: pure projection of ONE validated Core state. Never executes Core code. */
(function(scope){
  'use strict';
  const own=(o,k)=>o!=null&&Object.hasOwn(o,k);
  const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const value=v=>v??null;
  function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
  function copy(v,seen=new Set()){
    if(v===null||['string','boolean'].includes(typeof v)||typeof v==='number'&&Number.isFinite(v))return v;
    if(!obj(v)&&!Array.isArray(v)||seen.has(v)||![Object.prototype,Array.prototype,null].includes(Object.getPrototypeOf(v)))throw TypeError('Reine JSON-Daten erforderlich');
    seen.add(v);const out=Array.isArray(v)?[]:{};
    for(const k of Reflect.ownKeys(v)){
      if(Array.isArray(v)&&k==='length')continue;
      const d=Object.getOwnPropertyDescriptor(v,k);
      if(typeof k!=='string'||!d.enumerable||!own(d,'value'))throw TypeError('Keine Accessoren/Symbole');
      Object.defineProperty(out,k,{value:copy(d.value,seen),enumerable:true,writable:true,configurable:true});
    }
    seen.delete(v);return out;
  }
  function project(input,{ownerId}={}){
    const s=copy(typeof input==='string'?JSON.parse(input):input);
    if(!obj(s)||s.schema!==8||![14,15,16,17,32].includes(s.rulesVersion))throw TypeError('W5t/W5w/W5x erwartet Core Schema 8 / Regel 14, 15, 16, 17 oder 32; vorher mit dem passenden Original-Core laden');
    const rows=key=>{
      if(s[key]==null)return null;
      if(!obj(s[key]))throw TypeError(key+': ID-Tabelle erforderlich');
      return Object.entries(s[key]).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([id,row])=>{
        if(!obj(row)||row.id!==id||!id.trim())throw TypeError(key+': falsche ID');return row;
      });
    };
    const owners=rows('owners'),ships=rows('ships'),stations=rows('stations'),systems=rows('systems');
    if(typeof ownerId!=='string'||!owners?.some(o=>o.id===ownerId))throw TypeError('Unbekannte Eigentümer-ID');
    const ref=(table,id)=>id==null?null:table?.find(x=>x.id===id)?.id??null;
    for(const sh of ships||[])if(sh.owner!=null&&!ref(owners,sh.owner))throw TypeError('Schiff: unbekannter Eigentümer');
    for(const st of stations||[])if(st.eigentum!=null&&!ref(owners,st.eigentum))throw TypeError('Station: unbekannter Eigentümer');
    for(const row of [...(ships||[]),...(stations||[])])if(row.system!=null&&systems&&!ref(systems,row.system))throw TypeError('Unbekannte System-ID');
    for(const sys of systems||[])if(sys.station!=null&&stations&&!ref(stations,sys.station))throw TypeError('Unbekannte Stations-ID');
    const goods=(map,path)=>map==null?null:Object.entries(map).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([name,quantity])=>({name,quantity:value(quantity),aboard:value(quantity),available:null,owner:null,evidence:path+'.'+name}));
    const location=sh=>ref(systems,sh.system);
    const shipRow=sh=>({id:sh.id,name:sh.rufname||sh.id,ownerId:value(sh.owner),owner:value(sh.owner),
      role:({miner:'miner',frachter:'hauler',jaeger:'fighter'})[sh.klasse]??null,
      location:location(sh),activity:value(sh.auftrag),status:value(sh.phase),cargo:goods(sh.ladung,'ships.'+sh.id+'.ladung')});
    // These paths identify snapshot slots, NOT durable order identities or receipts.
    const orders=[];
    const ordersKnown=(obj(s.w3)&&own(s.w3,'auftrag'))||(obj(s.w5n)&&own(s.w5n,'frachtauftrag'));
    for(const [section,key] of [['w3','auftrag'],['w5n','frachtauftrag']]){
      const job=s[section]?.[key];if(job==null)continue;
      const sh=ships?.find(x=>x.id===job.schiff);
      if(!sh)throw TypeError('Frachtauftrag: unbekannte Schiff-ID');
      orders.push({id:section+'.'+key,name:section+'.'+key,shipId:sh.id,ownerId:sh.owner,
        status:value(job.phase),phase:null,funding:null,issuer:null,evidence:section+'.'+key,core:job});
    }
    const owner=owners.find(o=>o.id===ownerId),account=s.stats?.konto?.[ownerId];
    const provenance='Core-Snapshot · Schema 8 / Regel '+s.rulesVersion+' · Tick '+value(s.tick)+' · keine Vollkostenrechnung';
    const corporation={demo:false,provenance,asOf:value(s.tick),company:{id:owner.id,name:owner.id,
      capitalLabel:'ISK-Kontostand',availableCapital:value(owner.cash),capitalEvidence:'owners.'+owner.id+'.cash (Kontostand, keine freie Reserve)',
      income:value(account?.erloes),expenses:value(account?.kosten),coverage:'Kumulierte Core-Kontozähler; kein vollständiges Journal',result:null},
      ships:ships==null||ships.some(sh=>sh.owner==null)?null:ships.filter(sh=>sh.owner===ownerId).map(shipRow),
      orders:ordersKnown?orders.filter(o=>o.ownerId===ownerId):null,inventory:stations==null||stations.some(st=>st.eigentum==null||st.eigentum===ownerId&&st.lager==null)?null:stations.filter(st=>st.eigentum===ownerId).flatMap(st=>(goods(st.lager,'stations.'+st.id+'.lager')||[]).map((g,i)=>({...g,id:st.id+':'+i,location:st.id}))),
      flows:null,production:null,sales:null,transports:null};
    const station={provenance,stations:stations?.map(st=>({id:st.id,name:st.id,ownerId:value(st.eigentum),system:ref(systems,st.system),
      ships:ships==null?null:ships.filter(sh=>sh.phase==='dock'&&systems?.find(sys=>sys.id===sh.system)?.station===st.id).map(shipRow),
      storage:goods(st.lager,'stations.'+st.id+'.lager')?.map(g=>({...g,owner:value(st.eigentum)}))??null,
      industry:null,market:null,orders:null}))??null};
    return freeze({contract:'W5t/1',tick:value(s.tick),ownerId,corporation,station,
      accounts:owners,freightOrders:ordersKnown?orders:null,financialEvidence:{accounts:value(s.stats?.konto),events:value(s.ereignisse),journal:null},
      missing:{fitting:['Slot-/Modulvertrag und Schiffswerte'],pilot:['Stabile Pilot-ID und Schiff-/Vertragsbindung, Skills'],scanner:['Messdaten, Kontakte, Scanreichweite und Ressourcenpositionen']}});
  }
  const api=Object.freeze({project});if(typeof module==='object'&&module.exports)module.exports=api;else scope.LegacyCoreAdapter=api;
})(typeof window==='object'?window:globalThis);
