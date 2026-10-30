// Referenzprüfungen der historischen v11-Welt trotz neuer produktiver Regelversion 12.
// Im alten v11-Testpfad bleibt die Versorgungspriorität deaktiviert.
// Kein eingefrorener Zweitkern, sondern identischer Core mit Version-11-Regelauswahl.
import assert from 'node:assert/strict';
export function v11CoreSource(html) {
  const start=html.indexOf('<script>')+8,end=html.indexOf('const m_data_oberflaeche');
  assert(start>=8&&end>start,'Kern nicht gefunden');
  const source=html.slice(start,end);
  const marker='schema: 8, rulesVersion: 12,';
  if(!source.includes(marker))return source;
  assert.equal(source.split(marker).length,2,'Versionsanker nicht eindeutig');
  return source.replace(marker,'schema: 8, rulesVersion: 11,');
}
