/** Load the existing inline modules, without booting the productive UI or copying a Core. */
export function vorhandeneModule(html) {
 const first=html.indexOf('const m_data_systeme =');
 const last=html.indexOf('const m_data_oberflaeche =');
 const ui=html.indexOf('const m_ui_miner2d =');
 const end=html.indexOf('const m_ui_main =',ui);
 if(first<0||last<=first||ui<last||end<=ui)throw Error('Vorhandene Core-/Grafikmodule nicht verfügbar');
 return Function(html.slice(first,last)+'\n'+html.slice(ui,end)+'\nreturn {api:m_core_index,grafik:m_ui_miner2d};')();
}
export function sitzung(api,stand=api.createW3State(42)) {
 const rules=api.W3_RULES;
 let state=stand;
 if(state.rulesVersion!==rules.rulesVersion)throw Error('Nur W3-Regel17 verfügbar');
 return {
  lesen:()=>state,
  befehl:cmd=>api.execute(state,cmd,rules),
  schritt:n=>{if(![1,10,50,60].includes(n))throw Error('Ungültiger Zeitschritt');api.advance(state,n,rules);},
  export:()=>api.save(state),
  import:text=>{const next=api.loadW3(text);if(!api.audit(next).ok)throw Error('Audit fehlgeschlagen');state=next;},
 };
}
