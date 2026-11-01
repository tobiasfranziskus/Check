// B9i [ANALYSE]: Test-only-Bruecke in die originalen Core-Buchungswege.
// index.html bleibt unveraendert. Dies ist KEIN Produktcode / keine Save-Migration.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('const m_data_systeme =');
const end=html.indexOf('const m_data_oberflaeche =');
assert(start>=0&&end>start,'Core-Modulgrenzen unveraendert');
const original=html.slice(start,end);

function replaceOnce(src,needle,patch){
  assert.equal(src.split(needle).length,2,'B9i-Anker fehlt oder nicht eindeutig: '+needle);
  return src.replace(needle,patch);
}

// Vertragstreuhand wird bei Vertragsschluss REAL von der Kasse abgezogen.
// Reservierte Fracht bleibt physisch im Schiff und wird zentral im Core-Handel gesperrt.
// Der Schiffsverlust-Hook storniert VOR dem Entfernen genau einmal.
const bridge=String.raw