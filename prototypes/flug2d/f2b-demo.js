/* F2b [DRAFT] – nur statische Browserhülle für den EINEN Original-Wirtschaftskern.
 * Keine automatische Speicherung, keine zweite Simulation, keine Produkt-Slots.
 */
'use strict';
(() => {
  const F=window.F2bVollcharge.erstellen({carrierCash:2000,buyerCash:4000});
  const K=F.flugKern,G=window.FlugGrafik, $=id=>document.getElementById(id);
  const canvas=$('raum'),ctx=canvas.getContext('2d'),graph=G.erstellen(ctx);
  const SC=0.00025;
  let state=F.createState(3301),paused=true,speed=1,last=null,carry=0,statusKey=null;
  const ships=()=>Object.values(state.ships).filter(s=>s.klasse==='miner'&&s.flug).sort((a,b)=>a.id.localeCompare(b.id));
  const player=()=>ships().find(s=>s.owner==='house');
  const npc=()=>ships().find(s=>s.owner==='npc3');
  const mission=s=>s?state.f2a.missionen[s.id]:null;
  const active=()=>Object.values(state.f2a.missionen).some(m=>m.status!=='fertig');
  const msg=s=>{$('meldung').textContent=s;};
  const fmt=n=>Number(n).toLocaleString('de-DE');

  function groesse(){
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return [canvas.clientWidth,canvas.clientHeight];
  }
  function zeichnen(){
    const [w,h]=groesse(),own=player(),focus=own?.flug||npc()?.flug;
    const cx=focus?.x||0,cy=focus?.y||0;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#06101b';ctx.fillRect(0,0,w,h);
    graph.himmel(cx,cy,SC,w,h);
    const proj=(x,y)=>G.projektion(x,y,cx,cy,SC,w,h);
    const sys=K.DATEN.systeme.aldera,[sx,sy]=proj(sys.station.x,sys.station.y);
    ctx.strokeStyle='#6a8f9e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,18,0,Math.PI*2);ctx.stroke();
    ctx.font='12px system-ui';ctx.fillStyle='#d3e8ec';ctx.fillText('Aldera · Dock',sx+21,sy-9);
    for(const feld of sys.felder){
      const [x,y]=proj(feld.x,feld.y);
      ctx.strokeStyle=feld.ware==='eis'?'#8dd9f4':'#c08c62';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(x,y,feld.radius*SC,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=ctx.strokeStyle;ctx.fillText(feld.ware==='eis'?'Eisfeld':'Erzfeld',x+7,y-14);
    }
    for(const ship of ships()) {
      const v=G.adapter(ship),[x,y]=proj(v.x,v.y);
      graph.schiff(v,x,y,ship.owner==='house'?0:1);
      ctx.fillStyle=ship.owner==='house'?'#aaf5ff':'#c7e4bc';
      ctx.fillText(ship.id+(ship.owner==='house'?' · Spieler':' · NPC'),x+14,y+23);
    }
    $('hud').textContent='Regel198 · Minute '+fmt(state.tick)+' · Sekunde '+state.flug.schritt+
      ' · '+(active()?'Eis-Pendel läuft':'kein aktiver Pendelauftrag');
  }
  function aktualisieren(force=false) {
    const own=player(),bot=npc(),a=active();
    $('kaufen').disabled=state.owners.house.cash<F.rules.economy.waren.miner.basis
      || !(state.stations.st_aldera.lager.miner>0);
    $('spieler').disabled=!own||a||!!mission(own);
    $('npc').disabled=!bot||a||!!mission(bot);
    $('pause').textContent=paused?'Weiter':'Pause';
    $('pause').setAttribute('aria-pressed',String(paused));
    $('tempo').textContent='Zeit '+speed+'×';
    const key=state.tick+'/'+state.flug.schritt+'/'+(a?'a':'-')+'/'+state.nextShip;
    if(!force&&key===statusKey)return;
    statusKey=key;
    const audit=F.audit(state);
    const label=(s)=>!s?'keiner':s.id+' · '+(mission(s)?.status||s.flug.lage)+
      ' · Eis im Schiff '+fmt(s.ladung.eis||0);
    $('status').textContent='Spieler: '+label(own)+'\nNPC: '+label(bot)+
      '\nEis am Dock: '+fmt(state.stations.st_aldera.lager.eis)+
      ' · Gesamtförderung: '+fmt(state.w5n.eisAbgebaut)+
      '\nTatsächlicher Verkauf: '+fmt(state.w5n.mineVerkauft)+
      ' · bezahlte Arbeit: '+fmt(state.w5n.mineLohn)+' ISK';
    $('bilanz').textContent='Spielerkasse '+fmt(state.owners.house.cash)+
      ' ISK · NPC '+fmt(state.owners.npc3.cash)+' ISK\nStationskasse '+fmt(state.owners.st_aldera.cash)+
      ' ISK · Weltgeld '+fmt(audit.total)+' / '+fmt(audit.expected)+
      ' ISK · Mint '+fmt(state.minted)+
      '\nWirtschaft, Ware und Flug: '+(audit.ok?'AUDIT OK':'AUDIT FEHLER: '+(audit.grund||audit.fehler));
  }
  function sicher(fn) {
    try{fn();}catch(e){paused=true;msg('F2b: '+e.message);}
    aktualisieren(true);
  }
  function start(s){
    if(!s){msg('Zuerst eigenen Miner bezahlen.');return;}
    const r=F.start(state,s.owner,s.id);
    msg(r.ok?'Pendelauftrag '+s.id+': reales Arbeitsgeld '+fmt(r.finanziert.arbeit)+
      ' ISK und Käuferetat '+fmt(r.finanziert.ankauf)+' ISK vorhanden.':
      'Auftrag abgelehnt: '+r.reason);
  }
  function frame(time) {
    if(last!==null && !paused){
      carry+=Math.min(250,Math.max(0,time-last))*20*speed/1000;
      const n=Math.min(90,Math.floor(carry));carry-=n;
      if(n) {
        try{F.fliegen(state,n);}
        catch(e){paused=true;carry=0;msg('Simulation angehalten: '+e.message);}
      }
    }
    last=time;zeichnen();aktualisieren();requestAnimationFrame(frame);
  }
  $('kaufen').addEventListener('click',()=>sicher(()=>{
    const r=F.execute(state,{type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'});
    msg(r.ok?'Spieler-Miner für 600 ISK regulär gekauft.':'Kauf abgelehnt: '+r.reason);
  }));
  $('spieler').addEventListener('click',()=>sicher(()=>start(player())));
  $('npc').addEventListener('click',()=>sicher(()=>start(npc())));
  $('pause').addEventListener('click',()=>{
    paused=!paused;last=null;carry=0;aktualisieren(true);
  });
  $('tempo').addEventListener('click',()=>{
    speed=speed===1?6:speed===6?24:1;aktualisieren(true);
  });
  $('minute').addEventListener('click',()=>sicher(()=>{
    F.minute(state);
    msg('Eine Wirtschaftsminute: 60 F0-Schritte, einmal Original-Rule195-Tick.');
  }));
  $('export').addEventListener('click',()=>sicher(()=>{
    const blob=new Blob([F.save(state)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='aphros-f2b-forschung-regel198.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    msg('Forschungsstand Rule198 als JSON exportiert.');
  }));
  $('import').addEventListener('change',async e=>{
    const input=e.target,file=input.files?.[0];
    if(!file)return;
    try {
      if(file.size>1024*1024)throw Error('Datei größer als 1 MiB');
      const next=F.load(await file.text());
      if(!window.confirm('Diese lokale F2b-Forschungssitzung ersetzen? Vorher gegebenenfalls exportieren.')){
        msg('Import abgebrochen, aktueller Forschungsstand erhalten.');return;
      }
      state=next;paused=true;last=null;carry=0;statusKey=null;
      msg('Regel198-Forschungsstand geladen; produktive Spielstände unverändert.');
    }catch(e){msg('Import abgewiesen: '+e.message);}
    finally{input.value='';aktualisieren(true);}
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){paused=true;carry=0;last=null;aktualisieren(true);}
  });
  window.F2bDemo=Object.freeze({
    zustand:()=>F.canonical(state),audit:()=>F.audit(state),rendern:zeichnen,
    cache:()=>graph.cache(),pause:()=>paused,
    // Nur reproduzierbare Forschungsabnahme, kein zweiter Simulationspfad.
    fliegen:n=>{if(!paused)throw Error('Zum deterministischen Test zuerst pausieren');F.fliegen(state,n);aktualisieren(true);}
  });
  aktualisieren(true);requestAnimationFrame(frame);
})();
