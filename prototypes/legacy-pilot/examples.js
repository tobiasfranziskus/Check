/* Explicitly fictional display snapshots, not balancing or Legacy rules. */
globalThis.LegacyPilotExamples = ['Spielerpilot', 'NPC-Miner', 'NPC-Frachterpilot', 'NPC-Jägerpilot'].map((role, i) => ({
  example: true, revision: 'DEMO-' + (i + 1),
  pilot: { id: 'demo-' + i, name: ['Mara Voss', 'Ivo Kern', 'Nela Arendt', 'Tarek Holm'][i], role,
    corporation: 'Helix-Konzern (Beispiel)', ship: ['Kurier 03', 'Miner 12', 'Frachter 07', 'Jäger 04'][i], shipOwner: 'Helix-Konzern (Beispiel)' },
  experience: { current: 24, target: 80, percent: 30, label: 'Fiktiver Erfahrungsstand · kein Regelmodell' }, skillPoints: 2,
  skills: [
    { id: 'mining', area: 'Bergbau', stage: 'Grundlage', name: 'Erzgewinnung', status: 'unlocked', reason: 'Als freigeschaltet übermittelt.', progress: 'Stufe 1 · Beispiel', description: 'Bergbaukenntnis des Piloten.', requirements: [{ name: 'Grundausbildung', have: 'Nachgewiesen', need: 'Nachweis', assessment: 'Erfüllt laut Beispiel' }] },
    { id: 'survey', area: 'Bergbau', stage: 'Vertiefung', name: 'Lagerstättenkunde', status: 'locked', reason: 'Ausbildungsnachweis fehlt laut Beispiel.', progress: '3 / 8 Nachweise (Beispiel)', description: 'Vertiefung des Bergbaupfads.', requirements: [{ name: 'Ausbildungsnachweise', have: 3, need: 8, assessment: 'Nicht erfüllt laut Beispiel' }] },
    { id: 'cargo', area: 'Transport', stage: 'Grundlage', name: 'Frachtlogistik', status: 'unlocked', reason: 'Als freigeschaltet übermittelt.', progress: 'Stufe 1 · Beispiel', description: 'Transportkenntnis. Keine Frachtraumwirkung berechnet.' },
    { id: 'combat', area: 'Kampf', stage: 'Grundlage', name: 'Zielerfassung', status: 'locked', reason: 'Kampfausbildung fehlt laut Beispiel.', progress: 'Nicht übermittelt', description: 'Kampfkenntnis ohne Schadensberechnung.', requirements: [{ name: 'Kampfausbildung', have: 'Offen', need: 'Abgeschlossen', assessment: 'Gesperrt laut Beispiel' }] },
    { id: 'navigation', area: 'Navigation', stage: 'Grundlage', name: 'Sprungnavigation', status: 'unknown', reason: 'Keine autoritative Bewertung vorhanden.', description: 'Noch nicht bewertbare Fähigkeit. Fehlende Werte bedeuten keine Freigabe.' }
  ],
  history: i === 3 ? [{ title: 'Nachgewiesener Abschuss', value: 1, evidence: 'DEMO-KAMPF-01 (fiktiv)' }] : i === 2 ? [{ title: 'Abgeschlossene Aufträge', value: 3, evidence: 'DEMO-AUFTRAG-03 (fiktiv)' }] : undefined
}));
