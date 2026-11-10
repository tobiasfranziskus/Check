/* F1-Demo [ANALYSE]: Browserhülle für den EINEN Rule195-Wirtschaftskern
 * in der opt-in-Forschungshülle Rule196. Kein Autosave, keine Produkt-Slots.
 * Wandzeit beeinflusst nur die Zahl der durch denselben F1-Adapter ausgeführten Flugschritte.
 */
'use strict';
(() => {
  const F = window.F1Kopplung.erstellen({carrierCash: 2000, buyerCash: 4000});
  const K = F.flugKern, G = window.FlugGrafik;
  const $ = id => document.getElementById(id);
  const canvas = $('raum'), ctx = canvas.getContext('2d'), graph = G.erstellen(ctx);
  const OWNER = 'house', STATION = 'st_aldera', SCALE = 0.00025, MAX_STEPS_PER_FRAME = 60;
  let state = F.createState(3301), paused = true, speed = 1, carry = 0;
  let lastFrame = null, lastAuditKey = null, pointer = null;
  const player = () => Object.values(state.ships)
    .filter(s => s.owner === OWNER && s.klasse === 'miner').sort((a,b) => a.id.localeCompare(b.id))[0] || null;
  const focused = () => player() || Object.values(state.ships).find(s => s.flug) || null;
  const message = text => { $('meldung').textContent = text; };
  const say = result => result.ok ? 'Befehl angenommen.' : 'Abgelehnt: ' + result.reason;
  const fmt = value => Number(value).toLocaleString('de-DE');
  function command(data) {
    const s = player();
    if (!s) { message('Zuerst einen eigenen Miner finanzieren.'); return false; }
    const r = F.execute(state, {owner:OWNER, schiff:s.id, ...data});
    message(say(r));
    updateStatus(true);
    return r.ok;
  }
  function buy() {
    const r = F.execute(state, {type:'shipBuy', owner:OWNER, klasse:'miner', station:STATION});
    message(r.ok ? 'Eigener Miner vollständig bezahlt gekauft. Jetzt abdocken.' : 'Kauf verweigert: ' + r.reason);
    updateStatus(true);
  }
  function currentCamera() {
    const sh=focused();
    return sh ? [sh.flug.x, sh.flug.y] : [0,0];
  }
  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1,Math.round(canvas.clientWidth*dpr)), h = Math.max(1,Math.round(canvas.clientHeight*dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return [canvas.clientWidth,canvas.clientHeight];
  }
  function paint() {
    const [width,height] = size(),[cx,cy] = currentCamera();
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle='#06101b';ctx.fillRect(0,0,width,height);
    graph.himmel(cx,cy,SCALE,width,height);
    const project=(x,y)=>G.projektion(x,y,cx,cy,SCALE,width,height);
    const sys=K.DATEN.systeme.aldera;
    const [sx,sy] = project(sys.station.x,sys.station.y);
    ctx.strokeStyle='#5d8ea3';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,18,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#cee4ec';ctx.font='12px system-ui';ctx.fillText('Aldera · Dock',sx+22,sy-5);
    for (const f of sys.felder) {
      const [x,y]=project(f.x,f.y);
      ctx.strokeStyle=f.ware==='erz'?'#ba865a':'#8bd5f4';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(x,y,f.radius*SCALE,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=ctx.strokeStyle;ctx.fillText(f.ware==='erz'?'Erzfeld':'Eisfeld',x+8,y-13);
    }
    for (const s of Object.values(state.ships)) {
      if (!s.flug || s.system!=='aldera') continue;
      const v=G.adapter(s),[x,y]=project(v.x,v.y);
      graph.schiff(v,x,y,s.owner===OWNER?0:1);
      ctx.fillStyle=s.owner===OWNER?'#a5f2f4':'#abd1ba';
      ctx.fillText(s.id+' · '+(s.owner===OWNER?'Spieler':'NPC'),x+14,y+24);
    }
    const own=player(),s=own||focused(),b=s?.flug;
    $('hud').textContent='Wirtschaftsminute '+fmt(state.tick)+' · Flugschritt '+state.flug.schritt+'/60 · '+
      (own?'Dein Miner '+own.id+' · ':'Noch kein eigener Miner · ')+(b?b.lage+' · '+b.x+'/'+b.y:'');
  }
  function updateStatus(force=false) {
    const own=player(),b=own?.flug;
    $('kaufen').disabled=!(state.stations.st_aldera.lager.miner>0) || state.owners.house.cash < F.rules.economy.waren.miner.basis;
    $('dock').disabled=!own || !['frei','angedockt'].includes(b.lage);
    $('dock').textContent=b?.lage==='angedockt'?'Abdocken':'Andocken';
    for (const id of ['erz','eis','links','rechts','schneller','langsamer']) $(id).disabled=!own||b.lage!=='frei';
    $('pause').textContent=paused?'Weiter':'Pause';
    $('pause').setAttribute('aria-pressed',String(paused));
    $('tempo').textContent='Zeit '+speed+'×';
    const key=state.tick+'/'+state.flug.schritt+'/'+(own?.flug.lage||'-')+'/'+state.nextShip;
    if (!force && lastAuditKey===key) return;
    lastAuditKey=key;
    const audit=F.audit(state);
    $('bilanz').textContent='Kasse Spieler: '+fmt(state.owners.house.cash)+' ISK · NPC: '+
      fmt(state.owners.npc3.cash)+' ISK\nGesamtgeld: '+fmt(audit.total)+' / '+fmt(audit.expected)+
      ' ISK · Mint: '+fmt(state.minted)+'\nErz gefördert: '+fmt(state.ledger.erz.mined)+
      ' · Eis gefördert: '+fmt(state.ledger.eis.mined)+' · Spieler-Miner: '+(own?.id||'keiner');
    $('status').textContent='Regel '+state.rulesVersion+' (Forschung) · Schema '+state.schema+
      '\nWirtschaft/Güter/Flug-Audit: '+(audit.ok?'OK':'FEHLER: '+audit.fehler);
  }
  function frame(now) {
    if (lastFrame!==null && !paused) {
      const elapsed=Math.min(250,Math.max(0,now-lastFrame));
      carry+=elapsed*20*speed/1000;
      const n=Math.min(MAX_STEPS_PER_FRAME,Math.floor(carry));
      carry-=n;
      if (n) {
        try{F.fliegen(state,n);}
        catch(e){paused=true;carry=0;message('Simulation angehalten: '+e.message);}
      }
    }
    lastFrame=now;
    paint();updateStatus();
    requestAnimationFrame(frame);
  }
  function safe(action) {
    try { action(); } catch(e) { paused=true;message('F1: '+e.message); }
    updateStatus(true);
  }
  $('kaufen').addEventListener('click',()=>safe(buy));
  $('dock').addEventListener('click',()=>safe(()=>{
    const b=player()?.flug;
    command(b?.lage==='angedockt'?{type:'shipUndock'}:{type:'shipDock',station:STATION});
  }));
  for (const [id,ware] of [['erz','erz'],['eis','eis']])
    $(id).addEventListener('click',()=>safe(()=>command({type:'shipApproach',zielArt:'feld',ziel:'aldera:'+ware})));
  for (const [id,delta] of [['links',-8],['rechts',8]])
    $(id).addEventListener('click',()=>safe(()=>{
      const b=player()?.flug;if(b)command({type:'shipSteer',kurs:(b.sollKurs+delta+256)&255,fahrt:b.sollFahrt});
    }));
  for (const [id,delta] of [['langsamer',-10],['schneller',10]])
    $(id).addEventListener('click',()=>safe(()=>{
      const b=player()?.flug;if(b)command({type:'shipSteer',kurs:b.sollKurs,fahrt:Math.max(0,Math.min(100,b.sollFahrt+delta))});
    }));
  $('pause').addEventListener('click',()=>{paused=!paused;lastFrame=null;carry=0;updateStatus(true);});
  $('tempo').addEventListener('click',()=>{speed=speed===1?3:1;updateStatus(true);});
  $('minute').addEventListener('click',()=>safe(()=>{
    F.minute(state);message('Eine echte Wirtschaftsminute mit 60 F0-Flugschritten durchlaufen.');
  }));
  canvas.addEventListener('pointerdown',e=>{pointer={id:e.pointerId,x:e.clientX,y:e.clientY};});
  canvas.addEventListener('pointerup',e=>safe(()=>{
    const p=pointer;pointer=null;
    if(!p||p.id!==e.pointerId||Math.hypot(p.x-e.clientX,p.y-e.clientY)>12)return;
    const s=player();if(!s||s.flug.lage!=='frei')return;
    const r=canvas.getBoundingClientRect(),[cx,cy]=currentCamera(),limit=K.DATEN.raumRadius;
    const clamp=v=>Math.max(-limit,Math.min(limit,Math.round(v)));
    command({type:'shipFlyTo',x:clamp(cx+(e.clientX-r.left-r.width/2)/SCALE),
      y:clamp(cy+(e.clientY-r.top-r.height/2)/SCALE)});
  }));
  canvas.addEventListener('pointercancel',()=>{pointer=null;});
  $('export').addEventListener('click',()=>safe(()=>{
    const blob=new Blob([F.save(state)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='aphros-f1-forschung-regel196.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    message('F1-Regel196-Forschungsstand als JSON bereitgestellt.');
  }));
  $('import').addEventListener('change',async e=>{
    const input=e.target, file=input.files?.[0];
    if(!file)return;
    try{
      if(file.size>1024*1024)throw Error('Datei größer als 1 MiB');
      const loaded=F.load(await file.text());
      if(!window.confirm('Aktuelle F1-Forschungssitzung ersetzen? Vorher gegebenenfalls JSON exportieren.')) {
        message('Import abgebrochen; bisherige Sitzung geschützt.');return;
      }
      state=loaded;paused=true;carry=0;lastFrame=null;lastAuditKey=null;
      message('Explizit bestätigter F1-Import erfolgreich; keine produktiven Speicherplätze berührt.');
    }catch(e){message('Import abgewiesen: '+e.message);}
    finally{input.value='';updateStatus(true);}
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){paused=true;carry=0;lastFrame=null;updateStatus(true);}
  });
  // Nur lesende Testoberfläche; keine zweite Simulationsquelle oder externes Save.
  window.F1Demo=Object.freeze({
    zustand:()=>F.canonical(state),
    audit:()=>F.audit(state),
    grafikCache:()=>graph.cache(),
    pausiert:()=>paused,
    rendern:paint,
  });
  updateStatus(true);requestAnimationFrame(frame);
})();
