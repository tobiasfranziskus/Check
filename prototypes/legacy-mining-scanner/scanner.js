/* Darstellungsmuster: Void Echoes a8e2e36, 075/sc, 085/draw, 370/txHit.
 * Isolierter lesender Adapter; Herkunft und Anpassungen siehe Übernahmebericht. */
(function (global) {
  'use strict';
  const missing = 'Nicht im Snapshot enthalten';
  const text = v => typeof v === 'string' && v.trim() ? v : missing;
  const number = v => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
  const coordinate = v => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 1e9 ? v : null;
  const list = v => Array.isArray(v) ? v : null;
  const position = v => v && coordinate(v.x) !== null && coordinate(v.y) !== null ? {x:v.x, y:v.y} : null;
  const record = v => v && typeof v === 'object' ? v : {};
  function normalize(input) {
    const s = record(input);
    const resources = v => list(v)?.map(r => {
      r = record(r);
      return {name:text(r.name), amount:number(r.amount), unit:text(r.unit)};
    }) ?? null;
    const objects = (v, area) => list(v)?.map((raw, index) => {
      const o = record(raw);
      return {id:typeof o.id === 'string' && o.id ? o.id : '@'+index, name:text(o.name),
        position:position(o.position), radius:area ? number(o.radius) : null,
        resources:resources(o.resources), distance:number(o.distance), distanceUnit:text(o.distanceUnit),
        status:text(o.status), security:text(o.security), hazards:list(o.hazards)?.map(text) ?? null};
    }) ?? null;
    const asteroids = objects(s.asteroids, false);
    if (asteroids && new Set(asteroids.map(o => o.id)).size !== asteroids.length) throw new TypeError('Asteroiden-IDs müssen eindeutig sein');
    return {name:text(s.name), demonstration:s.demonstration === true, asteroids,
      fields:objects(s.fields, true), zones:objects(s.zones, true)};
  }
  // Gleiche Mittelpunktformel wie 075/sc; ausschließlich Darstellungskoordinaten.
  function project(p, camera, zoom, width, height) {
    return {x:width/2+(p.x-camera.x)*zoom, y:height/2+(p.y-camera.y)*zoom};
  }
  function layout(view, width, height) {
    const all = [...(view.asteroids || []), ...(view.fields || []), ...(view.zones || [])].filter(o => o.position);
    if (!all.length) return {camera:{x:0,y:0}, zoom:1};
    const minX = Math.min(...all.map(o => o.position.x-(o.radius || 0)));
    const maxX = Math.max(...all.map(o => o.position.x+(o.radius || 0)));
    const minY = Math.min(...all.map(o => o.position.y-(o.radius || 0)));
    const maxY = Math.max(...all.map(o => o.position.y+(o.radius || 0)));
    return {camera:{x:(minX+maxX)/2,y:(minY+maxY)/2},zoom:Math.min((width-100)/Math.max(1,maxX-minX),(height-100)/Math.max(1,maxY-minY))};
  }
  const resourceText = r => r === null ? missing : !r.length ? 'Keine bekannten Vorkommen (laut Snapshot)' : r.map(o => o.name+' · '+(o.amount === null ? missing : o.amount+' '+o.unit)).join('; ');
  const hazardText = h => h === null ? missing : h.length ? h.join('; ') : 'Keine bekannten Gefahren (laut Snapshot)';
  function mount(root, snapshot) {
    if (!root || !root.ownerDocument) throw new TypeError('DOM-Wurzel erforderlich');
    const doc = root.ownerDocument, win = doc.defaultView;
    let view = normalize(snapshot), selected = null, destroyed = false, targets = [];
    const el = (tag, value, className) => {const n=doc.createElement(tag); if(value !== undefined)n.textContent=value; if(className)n.className=className; return n;};
    const shell=el('section',undefined,'lms');
    const heading=el('h1','Bergbauscanner'), badge=el('p',undefined,'lms-badge');
    const intro=el('p','Lesende Momentaufnahme · Antippen zeigt vorhandene Informationen.');
    const grid=el('div',undefined,'lms-grid'), map=el('section',undefined,'lms-map');
    const canvas=el('canvas');canvas.setAttribute('aria-label','2D-Übersicht; alle Asteroiden sind auch über die Liste auswählbar');canvas.setAttribute('role','img');
    const caption=el('p'), legend=el('p','● Asteroid   ◌ Feld   ▧ Sicherheitszone   ! bekannte Gefahr · Farbe zeigt keine Rohstoffqualität.');
    const side=el('section'), title=el('h2','Asteroiden'), choices=el('div',undefined,'lms-choices');
    const detail=el('section',undefined,'lms-detail');detail.setAttribute('aria-live','polite');
    const areaInfo=el('section',undefined,'lms-areas');
    map.append(canvas,caption,legend);side.append(title,choices,detail);grid.append(map,side);
    shell.append(heading,badge,intro,grid,areaInfo);root.append(shell);
    function pair(parent, name, value) {const p=el('p');p.append(el('strong',name+': '),doc.createTextNode(value));parent.append(p);}
    function showDetails() {
      detail.replaceChildren(); const o=view.asteroids?.find(o=>o.id===selected);
      if(!o){detail.append(el('h2','Asteroid auswählen'));return;}
      detail.append(el('h2',o.name));
      pair(detail,'Entfernung',o.distance === null ? missing : o.distance+' '+o.distanceUnit);
      pair(detail,'Bekannte Vorkommen',resourceText(o.resources));pair(detail,'Abbaustatus',o.status);
      pair(detail,'Sicherheitszone',o.security);pair(detail,'Bekannte Gefahren',hazardText(o.hazards));
      pair(detail,'Position',o.position ? o.position.x+' / '+o.position.y+' (Snapshot-Koordinaten)' : missing);
    }
    function choose(id) {selected=id;for(const b of choices.children)b.setAttribute('aria-pressed',String(b.dataset.id===id));showDetails();draw();}
    function draw() {
      if(destroyed)return;
      const width=Math.max(200,canvas.clientWidth),height=canvas.clientHeight || 360,dpr=win.devicePixelRatio || 1;
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      const g=canvas.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#02040a';g.fillRect(0,0,width,height);
      g.strokeStyle='#152b3b';g.lineWidth=1;
      for(let x=20;x<width;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x,height);g.stroke();}
      for(let y=20;y<height;y+=40){g.beginPath();g.moveTo(0,y);g.lineTo(width,y);g.stroke();}
      const {camera,zoom}=layout(view,width,height);const sc=p=>project(p,camera,zoom,width,height);
      for(const [items,color,dash] of [[view.zones,'#7fb9e8',[3,5]],[view.fields,'#69c5a7',[8,6]]])for(const o of items || []){
        if(!o.position)continue;const p=sc(o.position);g.strokeStyle=color;g.fillStyle=color;g.setLineDash(dash);g.beginPath();g.arc(p.x,p.y,o.radius === null ? 6 : o.radius*zoom,0,Math.PI*2);g.stroke();g.setLineDash([]);g.font='12px system-ui';g.fillText(o.name,p.x+10,p.y-(o.radius === null ? 10 : o.radius*zoom+8));
      }
      targets=[];
      for(const o of view.asteroids || []){if(!o.position)continue;const p=sc(o.position);targets.push({...p,id:o.id});
        // 085/draw: Asteroidenkreis und Auswahlwinkel. Konstanter Radius,
        // kein Erz-abhängiger Radius, keine Förder-/Regenerationssimulation.
        g.fillStyle='#9e8066';g.beginPath();g.arc(p.x,p.y,8,0,Math.PI*2);g.fill();
        if(o.id===selected){g.strokeStyle='#fff';g.lineWidth=2;for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){g.beginPath();g.moveTo(p.x+a*23,p.y+b*15);g.lineTo(p.x+a*23,p.y+b*23);g.lineTo(p.x+a*15,p.y+b*23);g.stroke();}}
        g.fillStyle='#e0e9f0';g.font='12px system-ui';g.fillText(o.name,Math.max(8,Math.min(p.x+14,width-g.measureText(o.name).width-8)),p.y+4,width-16);
        if(o.hazards?.length){g.fillStyle='#ffba77';g.fillText('!',p.x-20,p.y+4);}
      }
    }
    function render() {
      heading.textContent='Bergbauscanner · '+view.name;badge.textContent=view.demonstration ? 'DEMONSTRATION · frei erfundene Beispielwelt' : 'Übergebener Snapshot · keine Live-Abfrage';
      const focused = choices.contains(doc.activeElement) ? doc.activeElement.dataset.id : null;
      const scroll = choices.scrollTop;
      choices.replaceChildren();
      if(view.asteroids === null)choices.append(el('p','Asteroiden: '+missing));
      else if(!view.asteroids.length)choices.append(el('p','Keine Asteroiden im Snapshot.'));
      for(const o of view.asteroids || []){const b=el('button',o.name+' · '+o.status);b.type='button';b.dataset.id=o.id;b.setAttribute('aria-pressed',String(o.id===selected));b.addEventListener('click',()=>choose(o.id));choices.append(b);}
      choices.scrollTop=scroll;
      if(focused !== null)Array.from(choices.children).find(b=>b.dataset.id===focused)?.focus({preventScroll:true});
      const hidden=(view.asteroids || []).filter(o=>!o.position).length;
      caption.textContent='Automatisch eingepasste Snapshot-Koordinaten; keine Entfernungsberechnung. '+hidden+' Asteroiden ohne Position nur in der Liste. Flächen ohne Radius werden nur als Mittelpunkt gezeigt.';
      areaInfo.replaceChildren(el('h2','Felder und Sicherheitszonen'));
      for(const [name,items] of [['Abbaugebiete',view.fields],['Sicherheitszonen',view.zones]]){
        areaInfo.append(el('h3',name));if(items===null)areaInfo.append(el('p',missing));else if(!items.length)areaInfo.append(el('p','Keine Einträge im Snapshot.'));
        for(const o of items || []){const box=el('article');box.append(el('h4',o.name));pair(box,'Sicherheit',o.security);pair(box,'Vorkommen',resourceText(o.resources));pair(box,'Gefahren',hazardText(o.hazards));pair(box,'Fläche',!o.position ? 'Position: '+missing : o.radius === null ? 'Radius: '+missing : 'Radius '+o.radius+' (Snapshot-Koordinaten)');areaInfo.append(box);}
      }
      showDetails();draw();
    }
    // CSS-Pixel-Treffertest nach 370/txHit, mindestens 48px Durchmesser.
    let press=null;
    const reset=()=>{press=null;};
    const down=e=>{if(!e.isPrimary || e.button!==0){reset();return;}press={id:e.pointerId,x:e.clientX,y:e.clientY};};
    const move=e=>{if(press && Math.hypot(e.clientX-press.x,e.clientY-press.y)>10)reset();};
    const up=e=>{if(!press || press.id!==e.pointerId)return;const start=press;reset();if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>10)return;
      const r=canvas.getBoundingClientRect();let best=null,distance=Infinity;for(const t of targets){const d=Math.hypot(e.clientX-r.left-t.x,e.clientY-r.top-t.y);if(d<=24 && d<distance){best=t;distance=d;}}if(best)choose(best.id);
    };
    const events=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',reset],['pointerleave',reset],['lostpointercapture',reset]];
    for(const [name,fn] of events)canvas.addEventListener(name,fn);
    win.addEventListener('blur',reset);doc.addEventListener('visibilitychange',reset);
    const observer=new win.ResizeObserver(draw);observer.observe(canvas);render();
    return {update(next){if(destroyed)return;const normalized=normalize(next);view=normalized;if(!view.asteroids?.some(o=>o.id===selected))selected=null;reset();render();},
      destroy(){if(destroyed)return;destroyed=true;observer.disconnect();for(const [name,fn] of events)canvas.removeEventListener(name,fn);win.removeEventListener('blur',reset);doc.removeEventListener('visibilitychange',reset);shell.remove();targets=[];press=null;}};
  }
  const api={mount,normalize,project,layout};
  if(typeof module==='object' && module.exports)module.exports=api;
  else global.LegacyMiningScanner=api;
})(typeof globalThis==='object' ? globalThis : this);
