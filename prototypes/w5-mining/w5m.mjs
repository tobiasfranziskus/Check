import {vorhandeneModule} from '../w5-frachter/m_ui_frachter_core.mjs';

const el=id=>document.getElementById(id),geld=n=>new Intl.NumberFormat('de-DE').format(n)+' ISK';
const zeit=n=>new Intl.NumberFormat('de-DE').format(n)+' Min';
let api,s;
const meldung=x=>el('meldung').textContent=String(x);
const miner=(owner)=>Object.keys(s.ships).sort().map(id=>s.ships[id]).find(sh=>
  sh.owner===owner&&sh.klasse==='miner'&&sh.system==='aldera');
const frachter=()=>Object.keys(s.ships).sort().map(id=>s.ships[id]).find(sh=>
  sh.owner==='transport'&&sh.klasse==='frachter');
function berechnen(){
  const v=api.pilotW5MStand(s),a=api.audit(s);
  el('markt').textContent='Spielminute '+zeit(s.tick)+' · Stationskasse Aldera '+geld(s.owners.st_aldera.cash)
    +' · Erz im Stationslager '+s.stations.st_aldera.lager.erz
    +' · physisch gefördert '+s.ledger.erz.mined
    +' · Gesamtgeld '+geld(Object.values(s.owners).reduce((n,o)=>n+o.cash,0))
    +' · neue ISK '+s.minted+' · Audit '+(a.ok?'OK':'FEHLER')
    +' · Hash '+api.hash(s);
  const firm=el('firmen');
  firm.replaceChildren(...['house','npc3'].map(owner=>{
    const f=v.unternehmen[owner],panel=document.createElement('section'),
      header=document.createElement('h2'),intro=document.createElement('p'),
      table=document.createElement('table');
    header.textContent=owner==='house'?'House · Spieler':'NPC3 · Konkurrenz';
    intro.textContent=f.schiffe.length?f.schiffe.map(sh=>
      sh.id+' · '+(sh.mk1?'MK1: 2 Erz/Min':'Basis: 1 Erz/Min')+' · Ladung '+sh.ladung).join(' | ')
      :'Noch kein Miner gekauft';
    const rows=[
      ['Gefördertes Erz',f.gefoerdert],
      ['Tatsächlich verkauft',f.verkauft],
      ['Verkaufserlöse',geld(f.umsatz)],
      ['Bezahlte Förderlöhne',geld(f.foerderlohn)],
      ['Operativer Deckungsbeitrag',geld(f.operativerBeitrag)],
      ['Gekaufte Minerhüllen',geld(f.hüllen)],
      ['Bezahlte MK1-Arbeit',geld(f.bohrerArbeit)],
      ['Verbrauchtes MK1-Erz (Opportunität)',geld(f.bohrerErz)],
      ['Vollkostensaldo',geld(f.amortisierterSaldo)],
      ['Frei verfügbare Konzernkasse',geld(s.owners[owner].cash)]
    ];
    for(const [key,value]of rows){
      const tr=document.createElement('tr'),th=document.createElement('th'),
        td=document.createElement('td');th.scope='row';th.textContent=key;td.textContent=String(value);
      if(key==='Vollkostensaldo')td.className=f.amortisierterSaldo>=0?'positive':'negative';
      tr.append(th,td);table.append(tr);
    }
    panel.append(header,intro,table);return panel;
  }));
}
function cmd(type,owner,data){
  const result=api.execute(s,{type,owner,...data},api.W5M_RULES);
  if(!result.ok)throw Error(result.reason||'Core-Befehl abgelehnt');
}
function datei(){
  const url=URL.createObjectURL(new Blob([api.save(s)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='aphros-w5m-regel28-seed42.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function aktion(action){
  switch(action){
    case 'houseBuy':return cmd('shipBuy','house',{klasse:'miner',station:'st_aldera'});
    case 'houseMine':
    case 'npcMine':{
      const owner=action==='npcMine'?'npc3':'house',sh=miner(owner);
      if(!sh)throw Error('Eigener Miner fehlt');
      return cmd('shipMine',owner,{schiff:sh.id,ware:'erz'});
    }
    case 'transportBuy':return cmd('shipBuy','transport',{klasse:'frachter',station:'st_aldera'});
    case 'freight':{
      const sh=frachter();if(!sh)throw Error('Kein bezahlter Frachter');
      return cmd('shipFreight','transport',{schiff:sh.id});
    }
    case 'fitHouse':
    case 'fitNpc':{
      const owner=action==='fitNpc'?'npc3':'house',sh=miner(owner);
      if(!sh)throw Error('Eigener Miner fehlt');
      return cmd('shipUpgradeMiner',owner,{schiff:sh.id});
    }
    case 'step1':return api.advance(s,1,api.W5M_RULES);
    case 'step25':return api.advance(s,25,api.W5M_RULES);
    case 'step60':return api.advance(s,60,api.W5M_RULES);
    case 'stepDay':return api.advance(s,1440,api.W5M_RULES);
    case 'export':return datei();
    case 'reset':{
      if(!confirm('Nur die Forschungswelt im Arbeitsspeicher neu starten? Export gegebenenfalls zuvor sichern.'))return;
      s=api.createW5MState(42);return;
    }
    default:throw Error('Unbekannte Forschungsaktion');
  }
}
try{
  const response=await fetch('../../index.html',{cache:'no-store'});
  if(!response.ok)throw Error('Spielkern nicht ladbar');
  ({api}=vorhandeneModule(await response.text()));
  s=api.createW5MState(42);
  berechnen();meldung('Bereit · Seed 42 · NPC3-Miner fördert bereits eigenständig.');
  document.querySelectorAll('button[data-action]').forEach(button=>button.addEventListener('click',()=>{
    try{aktion(button.dataset.action);berechnen();meldung('Aktion durchgeführt: '+button.textContent);}
    catch(err){berechnen();meldung('Abgelehnt: '+err.message);}
  }));
  el('import').addEventListener('change',async event=>{
    try{
      const file=event.target.files?.[0];if(!file)return;
      const geladen=api.loadW5M(await file.text()); // Nur Regel28, auditierte Save-Daten.
      s=geladen;berechnen();meldung('Separater W5m-Forschungsstand geladen.');
    }catch(err){meldung('Import abgelehnt, bisheriger Stand bleibt: '+err.message);}
    finally{event.target.value='';}
  });
}catch(err){meldung('Forschungswelt nicht geladen: '+err.message);}
