/* One read-only host. No Core, storage, commands or economic state. */
const LegacyHub = (() => {
  'use strict';
  const freeze = o => { if (o && typeof o === 'object') { Object.values(o).forEach(freeze); Object.freeze(o); } return o; };
  const snapshots = freeze({corporation:corporationDemo, station:previewSnapshot,
    fitting:m_data_fitting_beispiel, pilot:LegacyPilotExamples, scanner:demoSnapshot});
  // Fitting has no update/destroy. A disposable child owns its anonymous listeners.
  // Updating deliberately resets fitting selection; switching views does not update it.
  function fittingMount(root, snapshot) {
    let child, closed=false;
    function update(next) {
      if(closed)return;
      m_ui_fitting_modell.starten(next); // Validate before replacing the current view.
      const replacement=root.ownerDocument.createElement('div');
      m_ui_fitting_ansicht.mount(replacement,next);
      root.replaceChildren(replacement); child=replacement;
    }
    update(snapshot);
    return {update,destroy(){if(closed)return;closed=true;child.remove();child=null;}};
  }
  const definitions = {
    corporation:['../legacy-corporation/corporation.css',LegacyCorporation.mount,'legacy-corporation'],
    station:['../legacy-station/station.css',LegacyStation.mount,'legacy-station'],
    fitting:['../legacy-fitting/style.css',fittingMount,''],
    pilot:['../legacy-pilot/pilot.css',LegacyPilot.mount,''],
    scanner:['../legacy-mining-scanner/scanner.css',LegacyMiningScanner.mount,'']
  };
  function mount(root, nav) {
    const views=new Map(); let current=null,closed=false;
    function show(id) {
      if(closed || !Object.hasOwn(definitions,id))return false;
      if(!views.has(id)) {
        const [css,component,className]=definitions[id];
        const host=document.createElement('section');host.className='hub-view';host.dataset.view=id;
        const shadow=host.attachShadow({mode:'open'});
        const link=document.createElement('link');link.rel='stylesheet';link.href=css;
        const style=document.createElement('style');
        // Reuse original styles once, isolated from other components and host navigation.
        style.textContent=':host{font:16px/1.5 system-ui,sans-serif;color:#e1eaf2} .legacy-corporation .shell,.legacy-station{height:100%;min-height:460px} .hub-component{min-width:0}';
        shadow.append(link,style);
        if(id==='pilot') {
          const label=document.createElement('label');label.textContent='Demo-Beispielakte ';
          const picker=document.createElement('select');picker.setAttribute('aria-label','Demo-Beispielakte');
          snapshots.pilot.forEach((s,i)=>{const option=document.createElement('option');option.value=i;option.textContent=s.pilot.role;picker.append(option);});
          label.append(picker);shadow.append(label);
        }
        const target=document.createElement('div');target.className=className+' hub-component';shadow.append(target);
        if(id==='corporation')target.style.height='100%';
        root.append(host);
        const api=component(target,id==='pilot'?snapshots.pilot[0]:snapshots[id], {navigate(id){show(id);nav.querySelector('[data-view="'+id+'"]').focus({preventScroll:true});}});
        if(id==='pilot')shadow.querySelector('select').addEventListener('change',e=>api.update(snapshots.pilot[Number(e.target.value)]));
        views.set(id,{host,api});
      }
      views.forEach((view,key)=>{view.host.hidden=key!==id;});current=id;
      nav.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
      return true;
    }
    function click(event){const b=event.target.closest('button[data-view]');if(b&&nav.contains(b))show(b.dataset.view);}
    nav.addEventListener('click',click);show('corporation');
    return Object.freeze({show,getCurrent:()=>current,destroy(){if(closed)return;closed=true;nav.removeEventListener('click',click);views.forEach(v=>{v.api.destroy();v.host.remove();});views.clear();nav.querySelectorAll('[aria-current]').forEach(b=>b.removeAttribute('aria-current'));}});
  }
  return Object.freeze({mount,snapshots,fittingMount});
})();
const legacyHub=LegacyHub.mount(document.getElementById('hub-content'),document.getElementById('hub-nav'));
