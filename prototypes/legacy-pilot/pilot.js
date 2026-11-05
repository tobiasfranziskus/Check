/* Read-only presentation. No rules, storage, networking or commands. */
(function (scope) {
  'use strict';
  const missing = 'Nicht verfügbar';
  const text = value => typeof value === 'string' && value.length ? value :
    typeof value === 'number' && Number.isFinite(value) ? String(value) : missing;
  const list = value => Array.isArray(value) ? value : [];
  const status = value => ['unlocked', 'locked'].includes(value) ? value : 'unknown';
  const labels = { unlocked: 'Freigeschaltet', locked: 'Gesperrt', unknown: 'Noch nicht bewertbar' };
  // Copy only display fields. Missing numbers never become zero; no thresholds inferred.
  function copySnapshot(input) {
    const s = input || {}, p = s.pilot || {}, xp = s.experience || {};
    const seen = new Set();
    return {
      example: s.example === true, revision: text(s.revision),
      pilot: { id: text(p.id), name: text(p.name), role: text(p.role), corporation: text(p.corporation),
        ship: text(p.ship), shipOwner: text(p.shipOwner) },
      experience: { current: text(xp.current), target: text(xp.target), label: text(xp.label),
        percent: typeof xp.percent === 'number' && Number.isFinite(xp.percent) && xp.percent >= 0 && xp.percent <= 100 ? xp.percent : null },
      skillPoints: text(s.skillPoints),
      skills: list(s.skills).filter(q => {
        if (!q || typeof q.id !== 'string' || !q.id || seen.has(q.id)) return false;
        seen.add(q.id); return true;
      }).map(q => ({ id: q.id, name: text(q.name), area: text(q.area), stage: text(q.stage),
        status: status(q.status), reason: text(q.reason), progress: text(q.progress), description: text(q.description),
        requirements: list(q.requirements).map(r => ({ name: text(r?.name), have: text(r?.have), need: text(r?.need),
          assessment: text(r?.assessment) })) })),
      history: Array.isArray(s.history) ? s.history.map(h => ({ title: text(h?.title), value: text(h?.value), evidence: text(h?.evidence) })) : null
    };
  }
  function mount(root, snapshot) {
    if (!root || !root.ownerDocument) throw new TypeError('DOM-Wurzel erforderlich');
    const doc = root.ownerDocument;
    const el = (tag, value, cls) => {
      const node = doc.createElement(tag);
      if (value !== undefined) node.textContent = value;
      if (cls) node.className = cls;
      return node;
    };
    const host = el('article', undefined, 'lp'); root.append(host);
    let data, selected = null, destroyed = false;
    function pair(parent, name, value) { const row = el('div', undefined, 'lp-pair'); row.append(el('dt', name), el('dd', value)); parent.append(row); }
    function details(box) {
      box.replaceChildren();
      const skill = data.skills.find(q => q.id === selected);
      box.append(el('h2', skill ? skill.name : 'Fähigkeit auswählen'));
      if (!skill) { box.append(el('p', 'Tippe auf eine Karte im Skillbaum. Auch gesperrte Fähigkeiten lassen sich ansehen.')); return; }
      box.append(el('p', labels[skill.status], 'lp-status ' + skill.status), el('p', skill.description), el('h3', 'Bewertung'),
        el('p', skill.reason), el('h3', 'Fortschritt'), el('p', skill.progress), el('h3', 'Voraussetzungen'));
      if (!skill.requirements.length) box.append(el('p', 'Keine Voraussetzungen übermittelt.'));
      const ul = el('ul');
      for (const r of skill.requirements) ul.append(el('li', r.name + ': vorhanden ' + r.have + ' / benötigt ' + r.need + ' · ' + r.assessment));
      box.append(ul);
    }
    function render() {
      const focusId = host.contains((host.getRootNode?.().activeElement || doc.activeElement)) ? (host.getRootNode?.().activeElement || doc.activeElement)?.dataset?.skill : null;
      host.replaceChildren();
      host.append(el('p', data.example ? 'BEISPIELDATEN · frei erfundene UI-Vorschau' : 'LESENDE ANSICHT · Core-Snapshot', 'lp-notice'),
        el('p', 'PILOTENARCHIV / ' + data.pilot.id, 'lp-eyebrow'), el('h1', data.pilot.name));
      const identity = el('dl', undefined, 'lp-identity');
      pair(identity, 'Rolle', data.pilot.role); pair(identity, 'Konzern', data.pilot.corporation);
      pair(identity, 'Aktuelles Einsatzschiff', data.pilot.ship); pair(identity, 'Schiffseigentümer', data.pilot.shipOwner); host.append(identity);
      const progress = el('section', undefined, 'lp-progress');
      progress.append(el('h2', 'Erfahrung & Skillpunkte'), el('p', data.experience.label),
        el('p', data.experience.current + ' / ' + data.experience.target + ' XP · ' + data.skillPoints + ' Skillpunkte vorhanden'));
      if (data.experience.percent !== null) {
        const meter = el('progress'); meter.max = 100; meter.value = data.experience.percent;
        meter.setAttribute('aria-label', 'Erfahrungsfortschritt laut Snapshot'); progress.append(meter);
      } else progress.append(el('p', 'Fortschrittsbalken: Nicht verfügbar'));
      host.append(progress);
      const heading = el('header'); heading.append(el('h2', 'Skill- & Technologiebaum'),
        el('p', 'Freigeschaltet · Gesperrt · Noch nicht bewertbar. Reihen zeigen Pfade, keine abgeleiteten Freischaltregeln.')); host.append(heading);
      const layout = el('div', undefined, 'lp-layout'), tree = el('section', undefined, 'lp-tree'), detail = el('aside', undefined, 'lp-detail');
      tree.setAttribute('aria-label', 'Skillpfade'); detail.setAttribute('aria-label', 'Fähigkeitsdetails'); detail.setAttribute('aria-live', 'polite');
      const buttons = [];
      for (const area of [...new Set(data.skills.map(q => q.area))]) {
        const lane = el('section', undefined, 'lp-lane'); lane.append(el('h3', area));
        const cards = el('div', undefined, 'lp-cards');
        for (const q of data.skills.filter(q => q.area === area)) {
          const b = el('button', undefined, 'lp-card ' + q.status); b.type = 'button'; b.dataset.skill = q.id;
          b.setAttribute('aria-pressed', String(selected === q.id));
          b.append(el('small', q.stage), el('strong', q.name), el('span', labels[q.status], 'lp-status'), el('small', q.progress));
          b.onclick = () => { if (destroyed) return; selected = q.id;
            for (const other of buttons) other.setAttribute('aria-pressed', String(other === b)); details(detail); };
          buttons.push(b); cards.append(b);
        }
        lane.append(cards); tree.append(lane);
      }
      if (!data.skills.length) tree.append(el('p', 'Keine Fähigkeiten übermittelt.'));
      details(detail); layout.append(tree, detail); host.append(layout);
      const history = el('section', undefined, 'lp-history'); history.append(el('h2', 'Nachgewiesene Leistungen'));
      if (data.history === null) history.append(el('p', 'Keine Leistungsdaten übermittelt.'));
      else if (!data.history.length) history.append(el('p', 'Snapshot enthält keine Leistungseinträge.'));
      else { const ul = el('ul'); for (const h of data.history) ul.append(el('li', h.title + ' · ' + h.value + ' · Beleg: ' + h.evidence)); history.append(ul); }
      host.append(history, el('p', 'Snapshot ' + data.revision + ' · Alle Bewertungen stammen aus dem Snapshot.', 'lp-footer'));
      if (focusId) buttons.find(b => b.dataset.skill === focusId)?.focus({ preventScroll: true });
    }
    function update(next) {
      if (destroyed) return;
      const copy = copySnapshot(next);
      if (!data || copy.pilot.id !== data.pilot.id || !copy.skills.some(q => q.id === selected)) selected = null;
      data = copy; render();
    }
    update(snapshot);
    return Object.freeze({ update, destroy() { if (destroyed) return; destroyed = true; host.remove(); data = null; selected = null; } });
  }
  scope.LegacyPilot = Object.freeze({ mount });
  if (typeof module !== 'undefined') module.exports = { mount, copySnapshot };
})(globalThis);
