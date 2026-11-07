/* Presentation only. No simulation, commands, network or persistence. */
(function (scope) {
  'use strict';
  const routes = [['overview', 'Übersicht', 'Dein Raumhafen'], ['hangar', 'Hangar', 'Schiffe ansehen'],
    ['storage', 'Lager & Fracht', 'Bestände getrennt lesen'], ['industry', 'Industrie', 'Produktionswege ansehen'],
    ['market', 'Markt', 'Angebote ansehen'], ['orders', 'Aufträge', 'Auftragstafel ansehen'],
    ['connections', 'Anschlüsse', 'Forschung und Fitting']];
  const missing = 'Nicht verfügbar';
  const scalar = v => typeof v === 'string' && v.trim() !== '' || typeof v === 'number' && Number.isFinite(v);
  const text = v => scalar(v) ? String(v) : missing;
  const esc = v => text(v).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const list = v => Array.isArray(v) ? v.filter(x => x && typeof x === 'object' && !Array.isArray(x)) : [];
  function copy(value) {
    function valid(v, seen = new Set()) {
      if (v === null || typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number' && Number.isFinite(v)) return;
      if (!v || typeof v !== 'object' || seen.has(v) || !Array.isArray(v) && Object.getPrototypeOf(v) !== Object.prototype) throw new TypeError('Snapshot muss JSON-kompatibel sein.');
      seen.add(v);
      for (const x of Object.values(v)) valid(x, seen);
      seen.delete(v);
    }
    valid(value);
    const result = JSON.parse(JSON.stringify(value));
    if (!result || Array.isArray(result) || typeof result !== 'object') throw new TypeError('Snapshot muss ein Objekt sein.');
    for (const rows of [result.stations, ...list(result.stations).map(s => s.ships)]) {
      const ids = new Set();
      for (const row of list(rows)) {
        if (typeof row.id !== 'string' || !row.id || ids.has(row.id)) throw new TypeError('Stationen und Schiffe benötigen eindeutige String-IDs.');
        ids.add(row.id);
      }
    }
    return result;
  }
  const facts = rows => '<dl class="facts">' + rows.map(([label, value]) => '<div><dt>'+label+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>';
  function table(title, rows, columns) {
    return '<section class="card"><h3>'+title+'</h3>' + (!Array.isArray(rows) ? '<p>'+missing+'</p>' : !rows.length ? '<p>Keine Einträge im Snapshot.</p>' :
      '<div class="table-scroll"><table><thead><tr>'+columns.map(c=>'<th scope="col">'+c[0]+'</th>').join('')+'</tr></thead><tbody>'+list(rows).map(row=>'<tr>'+columns.map(c=>'<td>'+esc(row[c[1]])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>')+'</section>';
  }
  function mount(root, snapshot, options = {}) {
    if (!root || typeof root.addEventListener !== 'function') throw new TypeError('DOM-Wurzel erforderlich.');
    let data = copy(snapshot), state = {stationId:null, shipId:null, tab:'overview'}, closed = false;
    const stations = () => list(data.stations);
    const station = () => stations().find(s=>s.id===state.stationId);
    const ship = () => list(station()?.ships).find(s=>s.id===state.shipId);
    function reconcile() {
      state.stationId = stations().find(s=>s.id===state.stationId)?.id ?? stations()[0]?.id ?? null;
      state.shipId = list(station()?.ships).find(s=>s.id===state.shipId)?.id ?? list(station()?.ships)[0]?.id ?? null;
    }
    const routeButton = (r, tile=false) => '<button type="button" data-tab="'+r[0]+'" aria-pressed="'+(state.tab===r[0])+'"'+(tile?' class="tile"':'')+'><b>'+r[1]+'</b>'+(tile?'<span>'+r[2]+' →</span>':'')+'</button>';
    function content() {
      const s=station(), v=ship();
      if (state.tab==='overview') return '<p class="eyebrow">STATIONSÜBERSICHT</p><h2>Willkommen im Raumhafen</h2><p>Wähle einen Bereich des Terminals.</p><div class="tiles">'+routes.slice(1).map(r=>routeButton(r,true)).join('')+'</div>';
      if (state.tab==='hangar') return '<h2>Hangar & Schiffsauswahl</h2><p>Die Auswahl zeigt ein Schiff; sie aktiviert oder bewegt es nicht.</p><div class="split"><section class="card"><h3>Schiffe im Snapshot</h3><div class="ship-list">'+(list(s?.ships).map((v,i)=>'<button type="button" data-ship="'+i+'" aria-pressed="'+(v.id===state.shipId)+'">'+esc(v.name)+'<small>'+esc(v.role)+'</small></button>').join('') || '<p>'+missing+'</p>')+'</div></section><section class="card"><p class="eyebrow">AUSGEWÄHLTE ANSICHT</p><h3>'+esc(v?.name)+'</h3>'+facts([['Schiff-ID',v?.id],['Rolle',v?.role],['Eigentümer',v?.owner],['Pilot',v?.pilot],['Status',v?.status],['Frachtbelegung',v?.cargoUsed],['Frachtkapazität',v?.cargoCapacity]])+'<p>Fitting zeigt einen eigenen Demo-Snapshot; keine Zuordnung zum gewählten Schiff.</p>'+routeButton(routes[6])+'</section></div>';
      if (state.tab==='storage') return '<h2>Stationslager & Schiffsfracht</h2><p>Getrennte Bestände · Schiff: '+esc(v?.name)+'</p><div class="split">'+table('Stationslager',s?.storage,[['Ware','name'],['Menge','quantity'],['Eigentümer','owner']])+table('Fracht an Bord',v?.cargo,[['Ware','name'],['Menge','quantity'],['Eigentümer','owner']])+'</div>';
      if (state.tab==='industry') return '<h2>Industrieübersicht</h2><p>Material, Ausgabe und Status werden aus dem Snapshot gelesen.</p>'+table('Produktionswege',s?.industry,[['Bereich','name'],['Material','input'],['Ausgabe','output'],['Status / Sperrgrund','status']]);
      if (state.tab==='market') return '<h2>Marktübersicht</h2><p>Lesende Angebote · Preise und Gebühren nur, soweit übermittelt.</p>'+table('Angebote am gewählten Ort',s?.market,[['Ware','name'],['Bestand','stock'],['Kaufpreis','buyPrice'],['Verkaufspreis','sellPrice'],['Gebühr','fee']]);
      if (state.tab==='orders') return '<h2>Auftragstafel</h2><p>Aufträge ansehen · keine Annahme oder Auszahlung.</p>'+table('Aufträge am gewählten Ort',s?.orders,[['Auftrag','name'],['Auftraggeber','issuer'],['Status','status'],['Finanzierung','funding']]);
      if (typeof options.navigate === 'function') return '<h2>Weitere Hub-Ansichten</h2><p>Eigene fiktive Snapshots, keine gemeinsame Schiffsidentität oder Core-Verbindung.</p><button type="button" data-hub="fitting">Fitting öffnen</button> <button type="button" data-hub="pilot">Pilotenakte öffnen</button>';
      return '<h2>Anschlüsse für spätere Ansichten</h2><div class="split"><section class="card"><h3>W5-Forschungswelt</h3><p>Ein künftiger Adapter kann lesende Stations-Snapshots liefern. Keine Forschungswelt verbunden.</p></section><section class="card"><h3>Separater Fitting-Prototyp · PR #186</h3><p>Keine Fitting-Logik in dieser Ansicht. Später können stabile Schiff- und Stations-IDs an die getrennte Vorschau übergeben werden.</p></section></div><p>Der gemeinsame Core muss Eigentum, Finanzierung, Berechtigungen und jeden Befehl autoritativ bestimmen.</p>';
    }
    function render(reset=false) {
      const active=(root.getRootNode?.().activeElement || root.ownerDocument?.activeElement);
      const focus=active && root.contains(active) ? ['tab','ship','station'].find(k=>active.hasAttribute('data-'+k)) : null;
      const focusValue=focus ? active.getAttribute('data-'+focus) : null;
      const scroll=root.querySelector('.content')?.scrollTop || 0;
      const s=station();
      root.innerHTML='<div class="station-shell"><header><div class="heading"><div><p class="eyebrow">APHROS VOID / RAUMHAFEN</p><h1>'+esc(s?.name)+'</h1></div><span class="badge">Lesende Vorschau</span></div><label class="station-picker">Stationsansicht<select data-station aria-label="Stationsansicht">'+(stations().map((s,i)=>'<option value="'+i+'"'+(s.id===state.stationId?' selected':'')+'>'+esc(s.name)+'</option>').join('') || '<option>'+missing+'</option>')+'</select></label><p class="provenance">'+esc(data.provenance)+'</p></header><div class="workspace"><nav class="main-nav" aria-label="Stationsbereiche">'+routes.map(r=>routeButton(r)).join('')+'</nav><main class="content" tabindex="-1" aria-label="Stationsinhalt">'+content()+'</main></div><footer role="status">Nur Anzeige · keine Buchungen · keine Spielstände</footer></div>';
      const area=root.querySelector('.content');
      if (area) area.scrollTop=reset?0:scroll;
      if (focus) root.querySelector('[data-'+focus+(focus==='station'?'': '="'+focusValue+'"')+']')?.focus({preventScroll:true});
    }
    function click(e) {
      const b=e.target.closest?.('button');
      if (!b || !root.contains(b)) return;
      if (['fitting','pilot'].includes(b.dataset.hub) && typeof options.navigate === 'function') { options.navigate(b.dataset.hub); return; }
      if (routes.some(r=>r[0]===b.dataset.tab)) state.tab=b.dataset.tab;
      else if (b.dataset.ship !== undefined && list(station()?.ships)[b.dataset.ship]) state.shipId=list(station().ships)[b.dataset.ship].id;
      else return;
      render(true);
    }
    function change(e) {
      if (!e.target.hasAttribute?.('data-station')) return;
      const s=stations()[e.target.value];
      if (!s) return;
      state.stationId=s.id; state.shipId=null; reconcile(); render(true);
    }
    reconcile(); render(); root.addEventListener('click',click); root.addEventListener('change',change);
    return Object.freeze({
      update(snapshot) { if (closed) throw new Error('Ansicht ist abgebaut.'); const next=copy(snapshot); data=next; reconcile(); render(); },
      getSelection() { return {...state}; },
      destroy() { root.removeEventListener('click',click); root.removeEventListener('change',change); root.innerHTML=''; closed=true; }
    });
  }
  const api=Object.freeze({mount});
  if (typeof module === 'object' && module.exports) module.exports=api;
  else scope.LegacyStation=api;
})(typeof window === 'object' ? window : globalThis);
