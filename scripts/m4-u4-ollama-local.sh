#!/usr/bin/env bash
# M4-U4 local test launcher; no remote model, no persistent browser profile.
set -euo pipefail
module="${1:-A}"
model="${2:-gemma4:e4b}"
case "$module" in A|B|C|D|E|F) ;; *) echo "Aufruf: bash scripts/m4-u4-ollama-local.sh A|B|C|D|E|F [Modell]" >&2; exit 2;; esac
case "$model" in gemma4:e4b|gemma4:12b|qwen3.5:0.8b|qwen3.5:2b|granite4:micro) ;; *) echo "Nicht freigegebenes lokales Testmodell: $model" >&2; exit 2;; esac
if [[ $# -gt 2 ]]; then echo "Zu viele Argumente" >&2; exit 2; fi
cd "$(git rev-parse --show-toplevel)"
node -e 'if (+process.versions.node.split(".")[0] < 22) { console.error("Node.js 22 oder neuer erforderlich"); process.exit(1); }'
if [[ -n "$(git status --porcelain --untracked-files=normal)" ]]; then
  echo "Bitte einen sauberen separaten Test-Checkout verwenden." >&2
  exit 1
fi
unset OPENROUTER_API_KEY M4_ALLOW_REMOTE
export M4_AI_PROVIDER=ollama M4_AI_MODEL="$model" M4_AI_PORT=11434 M4_OLLAMA_NATIVE=1
export M4_PRODUCT_SHA="$(git rev-parse HEAD)"
echo "Lokaler Checkout: $M4_PRODUCT_SHA (Pages-Gleichheit separat prüfen)"
# Dev-only pinned browser, installed outside the repository. No sudo, no global install.
cache="$HOME/.cache/aphros-void/m4-playwright-1.51.1"
export PLAYWRIGHT_MODULE="$cache/node_modules/playwright"
if [[ ! -f "$PLAYWRIGHT_MODULE/package.json" ]]; then
  npm install --prefix "$cache" --no-audit --no-fund playwright@1.51.1
fi
if [[ -z "${CHROMIUM_PATH:-}" ]]; then
  "$cache/node_modules/.bin/playwright" install chromium
fi
echo "Prüfe installiertes Modell und JSON-Antwort vor dem Spielstart ..."
node - <<'NODE'
const {config,ask}=require('./scripts/m4-u4-model-runner.cjs');
(async()=>{
  const res=await fetch('http://127.0.0.1:11434/api/tags',{redirect:'error',signal:AbortSignal.timeout(5000)});
  if(!res.ok)throw Error('Ollama HTTP '+res.status);
  const data=await res.json();
  const cfg=config(process.env);
  const model=data.models?.find(m=>m.name===cfg.model||m.model===cfg.model);
  if(!model)throw Error(cfg.model+' fehlt: ollama list; ggf. ollama pull '+cfg.model);
  const body={model:cfg.model,stream:false,temperature:0,max_tokens:256,messages:[
    {role:'system',content:'Return only this JSON object: {"action":{"op":"stop"},"note":"probe"}'},
    {role:'user',content:'Return the requested JSON object.'}
  ]};
  for(const timeout of [120000,20000]){
    const started=Date.now();
    const d=await ask(cfg,body,timeout);
    if(d.action.op!=='stop'||d.note!=='probe'||d.reportedModel!==cfg.model)throw Error('Unerwartete Probeantwort oder Modellidentität');
    console.log('JSON-Probe OK: '+(Date.now()-started)+' ms (Limit '+timeout+' ms) '+JSON.stringify(d.metrics||{}));
  }
  console.log('Installiertes Modell: '+cfg.model+(typeof model.digest==='string'&&/^[a-f0-9]{64}$/.test(model.digest)?' / '+model.digest:''));
})().catch(e=>{console.error('Ollama-Vorprüfung fehlgeschlagen:',e.message);process.exitCode=1;});
NODE
echo "Starte isoliertes Modul $module mit $model (max. 5 Minuten / 12 Aktionen)."
echo "Das Ergebnis bleibt UNREVIEWED; evidence.jsonl steht im ausgegebenen Pfad."
exec node scripts/m4-u4-model-runner.cjs "$module" .
