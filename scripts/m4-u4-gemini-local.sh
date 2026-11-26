#!/usr/bin/env bash
# Development-only direct Google API pilot, no key in browser or repository.
set +x
set -euo pipefail
module="${1:-A}"
model="${2:-gemini-3.8-flash}"
case "$module" in A|B|C|D|E|F) ;; *) echo "Aufruf: bash scripts/m4-u4-gemini-local.sh A|B|C|D|E|F [Modell]" >&2; exit 2;; esac
case "$model" in gemini-3.8-flash|gemini-3.5-flash-lite) ;; *) echo "Nicht freigegebenes Gemini-Modell" >&2; exit 2;; esac
if [[ $# -gt 2 || "${M4_GEMINI_FREE_CONFIRMED:-}" != 1 ]]; then
 echo "Nur Projekt ohne aktivierte Abrechnung: Free-Tier in AI Studio prüfen und M4_GEMINI_FREE_CONFIRMED=1 setzen." >&2; exit 2
fi
# Do not pass credentials to npm, git or browser installation.
unset GOOGLE_API_KEY OPENROUTER_API_KEY M4_OLLAMA_NATIVE
# Keep an already supplied key only as a non-exported shell variable.
gemini_key="${GEMINI_API_KEY:-}"
export -n gemini_key
unset GEMINI_API_KEY
cd "$(git rev-parse --show-toplevel)"
node -e 'if (+process.versions.node.split(".")[0] < 22) process.exit(1)'
if [[ -n "$(git status --porcelain --untracked-files=normal)" ]]; then
 echo "Bitte einen sauberen separaten Test-Checkout verwenden." >&2; exit 1
fi
export M4_AI_PROVIDER=gemini M4_AI_MODEL="$model" M4_ALLOW_REMOTE=1 M4_GEMINI_FREE_CONFIRMED=1
export M4_PRODUCT_SHA="$(git rev-parse HEAD)"
echo "Lokaler Checkout: $M4_PRODUCT_SHA (Pages-Gleichheit separat prüfen)"
cache="$HOME/.cache/aphros-void/m4-playwright-1.51.1"
export PLAYWRIGHT_MODULE="$cache/node_modules/playwright"
if [[ ! -f "$PLAYWRIGHT_MODULE/package.json" ]]; then
 npm install --prefix "$cache" --no-audit --no-fund playwright@1.51.1
fi
if [[ -z "${CHROMIUM_PATH:-}" ]]; then
 "$cache/node_modules/.bin/playwright" install chromium
fi
if [[ -z "$gemini_key" ]]; then
 read -r -s -p "Gemini API-Key (Eingabe verborgen): " gemini_key
 printf '\n'
fi
if [[ -z "$gemini_key" ]]; then echo "API-Key fehlt." >&2; exit 2; fi
export GEMINI_API_KEY="$gemini_key"
unset gemini_key
echo "Ein synthetischer API-Test vor dem Spielstart; kein Spieltext im Probeaufruf."
node - <<'NODE'
const {config,ask}=require('./scripts/m4-u4-model-runner.cjs');
(async()=>{
 const cfg=config(process.env);delete process.env.GEMINI_API_KEY;
 const body={messages:[
  {role:'system',content:'Return only this JSON object: {"action":{"op":"stop"},"note":"probe"}'},
  {role:'user',content:'Return the requested JSON object.'}
 ]};
 const started=Date.now();
 const d=await ask(cfg,body,45000);
 if(d.action.op!=='stop'||d.note!=='probe'||d.reportedModel!==cfg.model)throw Error('Probe response mismatch');
 console.log('JSON-Probe OK: '+(Date.now()-started)+' ms / '+d.modelVersion+' '+JSON.stringify(d.metrics||{}));
})().catch(e=>{
 // Never print provider body, headers, raw exception or key.
 const m=String(e?.message||'');
 console.error('Gemini-Vorprüfung fehlgeschlagen:',/^Model HTTP [0-9]{3}$/.test(m)?m:e?.name==='TimeoutError'?'Model timeout':'Antwort oder Verbindung nicht validiert');
 process.exitCode=1;
});
NODE
echo "Starte isoliertes Modul $module mit $model (5 Minuten / 12 Aktionen)."
exec node scripts/m4-u4-model-runner.cjs "$module" .
