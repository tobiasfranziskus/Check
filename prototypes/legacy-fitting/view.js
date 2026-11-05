const m_ui_fitting_ansicht = (() => {
  const M = m_ui_fitting_modell;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nummer = v => v === null ? 'Nicht verfügbar' : v.toLocaleString('de-DE', { maximumFractionDigits: 3 });
  function tabelle(v) {
    return `<div class="tabelle"><table><caption>Schiffswerte · ein hypothetischer Austausch</caption><thead><tr><th scope="col">Eigenschaft</th><th scope="col">Vorher</th><th scope="col">Nachher</th><th scope="col">Differenz</th></tr></thead><tbody>${v.zeilen.map(z => `<tr><th scope="row">${esc(z.label)}<small>${esc(z.einheit)}</small></th><td>${nummer(z.vorher)}</td><td>${nummer(z.nachher)}</td><td class="${z.ton}">${z.delta === null ? 'Nicht verfügbar' : z.delta === 0 ? '= unverändert' : `${z.delta > 0 ? '+' : ''}${nummer(z.delta)} · ${z.ton}`}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function details(v) {
    if (!v.modul) return '<h2>Vergleich</h2><p>Wähle ein Modul aus dem Katalog. Die eingebaute Ausrüstung bleibt unverändert.</p>';
    return `<h2>${esc(v.modul.name)}</h2><p class="badge">VORSCHAUOBJEKT · KEINE PRODUKTFREIGABE</p><p>Eingebaut: <strong>${esc(v.eingebaut?.name || (v.platz?.modulId ? 'Unbekanntes Modul: ' + v.platz.modulId : 'Platz leer'))}</strong></p>
      <h3>Voraussetzungen &amp; Bestand</h3>${v.gruende.length ? `<ul class="sperren">${v.gruende.map(g => `<li>${esc(g)}</li>`).join('')}</ul>` : '<p>Beispielvoraussetzungen erfüllt · im Beispielbestand vorhanden.</p>'}
      <p>${!v.kompatibel ? 'Kein Vergleich: Kategorie oder Größe inkompatibel.' : !v.vergleichVorhanden ? 'Keine Vergleichswerte vom Datenlieferanten vorhanden.' : v.hypothetisch ? 'Hypothetischer Vergleich trotz Sperren; keine Nutzungsfreigabe.' : 'Hypothetischer Vergleich; keine Nutzungsfreigabe.'}</p>${tabelle(v)}<p class="hinweis">Vorschau beendet keine Sperre und löst keinen Einbau aus.</p>`;
  }
  function mount(root, snapshot) {
    const zustand = M.starten(snapshot), d = zustand.daten;
    root.innerHTML = `<div class="layout"><section class="panel schiff"><h2>${esc(d.schiff.name)}</h2><p>Größe ${esc(d.schiff.groesse)} · 4 aktive / 3 passive Plätze</p><svg class="schiffsbild" viewBox="0 0 300 160" role="img" aria-label="Schematisches Erprobungsschiff"><ellipse cx="150" cy="80" rx="135" ry="65" fill="none" stroke="#31546a" stroke-dasharray="3 6"/><path d="M150 15 190 90 250 130 170 115 150 145 130 115 50 130 110 90Z" fill="#214557" stroke="#80d6da" stroke-width="2"/><path d="M150 40V110M130 92H170" stroke="#a3ecf0"/></svg><div id="plaetze"></div></section>
      <section class="panel katalog"><h2>Modulkatalog</h2><label for="groesse">Modulgröße</label><select id="groesse"><option value="alle">Alle Größen</option>${M.groessen.map(g => `<option>${g}</option>`).join('')}</select><p>MK1–MK3 · gesperrte Optionen antippen, um Gründe zu lesen.</p><div id="module"></div></section>
      <section class="panel vergleich" aria-label="Modulvergleich"><div id="vergleich"></div><p id="meldung" class="sr" role="status" aria-live="polite"></p></section></div>`;
    const slots = root.querySelector('#plaetze'), liste = root.querySelector('#module');
    const vergleich = root.querySelector('#vergleich'), filter = root.querySelector('#groesse');
    function zeichnen() {
      const v = zustand.ansicht();
      slots.innerHTML = [true, false].map(aktiv => `<h3>${aktiv ? 'Aktive Module' : 'Passive Module'}</h3><nav aria-label="${aktiv ? 'Aktive' : 'Passive'} Ausrüstungsplätze">${d.schiff.plaetze.filter(p => M.kategorien.find(k => k.id === p.kategorie).aktiv === aktiv).map(p => `<button type="button" data-platz="${esc(p.id)}" aria-pressed="${v.platz?.id === p.id}"><strong>${esc(M.kategorien.find(k => k.id === p.kategorie).name)} · ${esc(p.groesse)}</strong><small>${esc(d.module.find(m => m.id === p.modulId)?.name || (p.modulId ? 'Unbekanntes Modul' : 'Leer · kein Modul eingebaut'))}</small></button>`).join('')}</nav>`).join('');
      liste.innerHTML = d.module.filter(m => m.kategorie === v.platz?.kategorie && (filter.value === 'alle' || m.groesse === filter.value)).map(m => {
        const a = M.auswahl(d, v.platz.id, m.id);
        return `<button type="button" data-modul="${esc(m.id)}" aria-pressed="${v.modul?.id === m.id}"><strong>${esc(m.name)}</strong><small>Vorschau · Bestand ${esc(m.bestand)}</small><small>${a.gruende.length ? esc(a.gruende.join(' ')) : 'Beispielvoraussetzungen erfüllt'}</small></button>`;
      }).join('') || '<p>Keine Module für diesen Filter vorhanden.</p>';
      vergleich.innerHTML = details(v);
    }
    // Fokus bleibt nach dem Neuzeichnen beim gewählten Steuerelement.
    root.addEventListener('click', event => {
      const b = event.target.closest('button');
      if (!b || !root.contains(b)) return;
      if (b.dataset.platz) zustand.platzWaehlen(b.dataset.platz);
      else if (b.dataset.modul) zustand.modulWaehlen(b.dataset.modul);
      else return;
      const attr = b.dataset.platz ? 'data-platz' : 'data-modul', id = b.getAttribute(attr);
      zeichnen();
      Array.from(root.querySelectorAll(`button[${attr}]`)).find(e => e.getAttribute(attr) === id)?.focus({ preventScroll: true });
      root.querySelector('#meldung').textContent = b.dataset.platz ? 'Ausrüstungsplatz gewechselt. Modul auswählen.' : 'Modul ausgewählt. Vergleich aktualisiert.';
    });
    filter.addEventListener('change', zeichnen);
    zeichnen();
    return zustand;
  }
  return Object.freeze({ mount, details, tabelle, esc });
})();
if (typeof document !== 'undefined' && document.getElementById('fitting')) m_ui_fitting_ansicht.mount(document.getElementById('fitting'), m_data_fitting_beispiel);
if (typeof module !== 'undefined') module.exports = m_ui_fitting_ansicht;
