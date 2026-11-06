(function(scope) {
  'use strict';
  const missing='Nicht verfügbar';
  const scalar=v => (typeof v==='string' && v.trim()) || (typeof v==='number' && Number.isFinite(v)) ? String(v) : missing;
  const esc=v=>scalar(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const list=v=>Array.isArray(v)?v:[];
  // JSON data only; validate without invoking accessors, then detach every reference.
  function copy(input) {
    const seen=new Set();
    function visit(v) {
      if(v===null || typeof v==='string' || typeof v==='boolean' || typeof v==='number'&&Number.isFinite(v)) return;
      if(!v || typeof v!=='object' || seen.has(v) || ![Object.prototype,Array.prototype,null].includes(Object.getPrototypeOf(v))) throw new TypeError('Reine JSON-Daten erforderlich.');
      seen.add(v);
      for(const key of Reflect.ownKeys(v)) {
        if(Array.isArray(v)&&key==='length')continue;
        const d=Object.getOwnPropertyDescriptor(v,key);
        if(typeof key!=='string'||!d.enumerable||!('value' in d))throw new TypeError('Keine Accessoren oder Symbole.');
        visit(d.value);
      }
      seen.delete(v);
    }
    if(!input || Array.isArray(input)||typeof input!=='object')throw new TypeError('Snapshot-Objekt erforderlich.');
    visit(input);
    const data=JSON.parse(JSON.stringify(input));
    if(data.company!=null&&(typeof data.company!=='object'||Array.isArray(data.company)))throw new TypeError('company: Objekt erforderlich.');
    for(const key of ['ships','orders','flows','production','sales','inventory','transports']) {
      if(data[key]!=null&&!Array.isArray(data[key]))throw new TypeError(key+': Liste erforderlich.');
      const ids=new Set();
      for(const row of list(data[key])) {
        if(!row || typeof row!=='object'||Array.isArray(row)||typeof row.id!=='string'||!row.id.trim()||ids.has(row.id))throw new TypeError(key+': eindeutige String-IDs erforderlich.');
        ids.add(row.id);
      }
    }
    for(const ship of list(data.ships)) {
      if(ship.cargo!=null&&(!Array.isArray(ship.cargo)||ship.cargo.some(row=>!row||typeof row!=='object'||Array.isArray(row))))throw new TypeError('cargo: Liste von Objekten erforderlich.');
    }
    return data;
  }
  const facts=rows=>'<dl>'+rows.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>';
  function table(title,rows,columns) {
    return '<section class="card"><h3>'+title+'</h3>'+(rows==null?'<p>'+missing+'</p>':!rows.length?'<p>Keine Einträge im Snapshot</p>':'<div class="table-scroll" tabindex="0" role="region" aria-label="'+title+'"><table><thead><tr>'+columns.map(([label])=>'<th scope="col">'+label+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+columns.map(([,key])=>'<td>'+esc(row[key])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>')+'</section>';
  }
  const tabs=[['overview','Konzernübersicht'],['fleet','Flottencontrolling'],['economy','Wirtschaft'],['orders','Aufträge']];
  const orderCols=[['Auftrag','name'],['Schiff-ID','shipId'],['Status','status'],['Finanzierung','funding'],['Beleg / Grund','evidence']];
  function mount(root,snapshot) {
    if(!root || typeof root.addEventListener!=='function')throw new TypeError('DOM-Wurzel erforderlich.');
    let data=copy(snapshot),tab='overview',shipId=null,closed=false;
    const ships=()=>list(data.ships);
    const reconcile=()=>{shipId=ships().find(s=>s.id===shipId)?.id??ships()[0]?.id??null;};
    function orders() {
      return table('Offene Aufträge',data.orders==null?null:list(data.orders).filter(o=>o.phase==='open'),orderCols)+table('Abgeschlossene Aufträge',data.orders==null?null:list(data.orders).filter(o=>o.phase==='completed'),orderCols)+table('Status nicht zugeordnet',data.orders==null?null:list(data.orders).filter(o=>!['open','completed'].includes(o.phase)),orderCols);
    }
    function fleet() {
      const ship=ships().find(s=>s.id===shipId);
      return '<div class="split"><section class="card"><h3>Eigene Schiffe</h3>'+(data.ships==null?'<p>'+missing+'</p>':!ships().length?'<p>Keine Einträge im Snapshot</p>':['miner','hauler','fighter','other'].map((role,i)=>'<h4>'+['Miner','Frachter','Jäger','Weitere / Rolle nicht verfügbar'][i]+'</h4><div class="ship-list">'+(ships().map((s,index)=>({s,index})).filter(({s})=>role==='other'?!['miner','hauler','fighter'].includes(s.role):s.role===role).map(({s,index})=>'<button type="button" data-ship="'+index+'" aria-pressed="'+(s.id===shipId)+'"><b>'+esc(s.name)+'</b><span>'+esc(s.location)+' · '+esc(s.activity)+'</span></button>').join('')||'<p>Keine Einträge im Snapshot</p>')+'</div>').join(''))+'</section><section class="card"><p class="eyebrow">SCHIFFSDETAILS</p><h3>'+esc(ship?.name)+'</h3>'+facts([['Schiff-ID',ship?.id],['Eigentümer-ID',ship?.ownerId],['Standort',ship?.location],['Tätigkeit',ship?.activity],['Zustand',ship?.condition],['Einnahmen (belegt)',ship?.income],['Kosten (belegt)',ship?.costs],['Zeitraum',ship?.period],['Finanzierung',ship?.funding],['Finanzierungsbeleg / Grund',ship?.fundingEvidence],['Buchungsnachweis',ship?.evidence]])+table('Tatsächlich verfügbare Fracht',ship?.cargo,[['Ware','name'],['An Bord','aboard'],['Frei verfügbar','available'],['Einheit','unit'],['Beleg','evidence']])+'</section></div>';
    }
    function content() {
      const c=data.company||{};
      if(tab==='fleet')return fleet();
      if(tab==='orders')return orders();
      if(tab==='economy')return '<p>Förderung, Verkauf und Transport sind getrennte Leistungen. Lagerbestände sind keine Einnahmen.</p>'+table('Fördermengen',data.production,[['Ware','name'],['Menge','quantity'],['Einheit','unit'],['Schiff-ID','shipId'],['Zeitraum','period'],['Beleg','evidence']])+table('Realisierte Verkäufe',data.sales,[['Ware','name'],['Menge','quantity'],['Einheit','unit'],['Einnahmen','income'],['Zeitraum','period'],['Beleg','evidence']])+table('Warenbestände des Konzerns',data.inventory,[['Ware','name'],['Ort','location'],['Bestand','quantity'],['Frei verfügbar','available'],['Einheit','unit'],['Beleg','evidence']])+table('Transportleistungen',data.transports,[['Leistung','name'],['Schiff-ID','shipId'],['Menge','quantity'],['Einheit','unit'],['Route','route'],['Status','status'],['Einnahmen','income'],['Kosten','costs'],['Beleg','evidence']])+table('Aufträge mit belegter Unterfinanzierung',data.orders==null?null:list(data.orders).filter(o=>o.fundingState==='insufficient'),orderCols)+result(c);
      return '<div class="metrics">'+[[esc(c.capitalLabel??'Verfügbares Kapital'),c.availableCapital],['Belegte Einnahmen',c.income],['Belegte Ausgaben',c.expenses]].map(([label,value])=>'<section class="card"><h3>'+label+'</h3><strong>'+esc(value)+'</strong></section>').join('')+'</div>'+facts([['Konzern-ID',c.id],['Zeitraum',c.period],['Kapitalnachweis',c.capitalEvidence],['Buchungsumfang',c.coverage]])+result(c)+table('Geldflüsse · tatsächliche Buchungen',data.flows,[['Buchung','name'],['Von','from'],['An','to'],['Betrag','amount'],['Art','kind'],['Schiff-ID','shipId'],['Zeitpunkt','at'],['Beleg','evidence']])+table('Eigene Flotte',data.ships,[['Schiff','name'],['Rolle','role'],['Standort','location'],['Tätigkeit','activity'],['Zustand','condition'],['Finanzierung','funding']])+orders();
    }
    function result(c) {return '<section class="card result"><h3>Unternehmensergebnis laut Snapshot</h3>'+facts([['Gewinn / Verlust',c.result],['Ergebnisumfang',c.resultScope],['Zeitraum',c.period],['Ergebnisnachweis',c.resultEvidence]])+'<p>Keine eigene Gewinnrechnung. Unvollständige Kosten erlauben keine Vollkostenaussage.</p></section>';}
    function render(reset=false) {
      const active=(root.getRootNode?.().activeElement || root.ownerDocument?.activeElement);
      const key=active&&root.contains(active)?['tab','ship'].find(k=>active.hasAttribute('data-'+k)):null;
      const value=key?active.getAttribute('data-'+key):null;
      const scroll=root.querySelector('.content')?.scrollTop||0;
      root.innerHTML='<div class="shell"><header><div><p class="eyebrow">APHROS VOID / KONZERNZENTRALE</p><h1>'+esc(data.company?.name)+'</h1></div><span class="badge">Schreibgeschützte Vorschau</span><p class="provenance">'+(data.demo===true?'DEMO · Fiktive Demonstrationswelt · ':'')+esc(data.provenance)+'</p><p class="meta">Stand: '+esc(data.asOf)+'</p></header><nav aria-label="Konzernbereiche">'+tabs.map(([id,label])=>'<button type="button" data-tab="'+id+'" aria-pressed="'+(id===tab)+'">'+label+'</button>').join('')+'</nav><main class="content" tabindex="-1"><h2>'+tabs.find(t=>t[0]===tab)[1]+'</h2>'+content()+'</main><footer>Nur Anzeige · keine Befehle oder Buchungen · keine Speicherung</footer></div>';
      const area=root.querySelector('.content');if(area)area.scrollTop=reset?0:scroll;
      if(key)root.querySelector('[data-'+key+'="'+value+'"]')?.focus({preventScroll:true});
    }
    function click(e) {
      const b=e.target.closest?.('button');if(!b||!root.contains(b))return;
      if(tabs.some(t=>t[0]===b.dataset.tab))tab=b.dataset.tab;
      else if(b.dataset.ship!==undefined&&ships()[b.dataset.ship])shipId=ships()[b.dataset.ship].id;
      else return;
      render(true);
    }
    reconcile();render();root.addEventListener('click',click);
    return Object.freeze({update(snapshot){if(closed)throw new Error('Ansicht abgebaut.');const next=copy(snapshot);data=next;reconcile();render();},getSelection(){return {tab,shipId};},destroy(){if(closed)return;root.removeEventListener('click',click);root.innerHTML='';closed=true;}});
  }
  const api=Object.freeze({mount});
  if(typeof module==='object'&&module.exports)module.exports=api;else scope.LegacyCorporation=api;
})(typeof window==='object'?window:globalThis);
