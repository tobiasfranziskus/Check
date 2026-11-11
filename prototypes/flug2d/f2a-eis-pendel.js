/* Aphros Void F2a [DRAFT] – physisch überprüfter Eis-Pendelauftrag.
 * Weder zweite Wirtschafts-Engine noch freie Rohstoffe: ausschliesslich
 * F1Kopplung (Original-Rule195-Engine) + F0-Positionen im selben Zustand.
 *
 * Der originale W5n-Core verkauft bei einer 50er-Eischarge automatisch:
 * bewusst 48 Eis (48 bezahlte Minuten) abbauen, rechtzeitig pausieren,
 * zur Station fliegen und mit ORIGINAL-shipSellIce erst am Dock verkaufen.
 * Das ist ein kleiner echter End-to-End-F2-Nachweis, KEIN W5-Balancing.
 */
(function (scope) {
'use strict';
const F1 = typeof module === 'object' && module.exports
  ? require('./f1-kopplung.js') : scope.F1Kopplung;
if (!F1?.erstellen) throw Error('F2a braucht denselben F1-Wirtschaftskern');
const PROFIL = 197, WARE = 'eis', CHARGE = 48;
const STUFEN = Object.freeze(['abdocken', 'anflug', 'abbau', 'rueck', 'abnahme', 'fertig']);
const AKTIONEN = Object.freeze(new Set(['shipMine','shipSellIce','shipWait']));

function erstellen(startkapital = {}, researchOptions = {}) {
  const voll = researchOptions?.researchProfile === 198 && researchOptions?.charge === 50
    && Object.keys(researchOptions).sort().join() === 'charge,researchProfile';
  if (!researchOptions || typeof researchOptions!=='object' || Array.isArray(researchOptions)
    || (Object.keys(researchOptions).length && !voll))
    throw TypeError('F2a: nur das explizite Forschungsprofil 198/50 erlaubt');
  const profil = voll ? 198 : PROFIL, charge = voll ? 50 : CHARGE;
  const f1 = F1.erstellen(startkapital, voll
    ? {researchProfile:198,dockOnlyIce:true} : {researchProfile:PROFIL});
  const K = f1.flugKern, rules = f1.rules;
  if (rules.rulesVersion !== profil || rules.w5n.charge !== 50
    || rules.economy.miningRate !== 1 || rules.w5n.mineLohn !== 2
    || rules.w5n.eisPreis !== 5)
    throw Error('F2a: die belegte Eis-Teilcharge passt nicht zu den Forschungsparametern');

  // Kein eigener Wirtschaftsablauf: diese Kommandos bleiben beim alten Core.
  const wirtschaftsBefehl = (state, type, sh, extra = {}) => {
    const r = f1.execute(state, {type, owner:sh.owner, schiff:sh.id, ...extra});
    if (!r.ok) throw Error('F2a Originalbefehl '+type+': '+r.reason);
  };
  const mListe = state => state.f2a?.missionen || {};
  const leer = s => Object.values(s.ladung).every(n => n === 0);
  function synchronisieren(state) {
    for (const s of Object.values(state.ships)) {
      if (s.klasse !== 'miner') continue;
      if (s.auftrag === 'foerdern'
        && (!mListe(state)[s.id] || mListe(state)[s.id].status === 'fertig'))
        wirtschaftsBefehl(state, 'shipWait', s);
    }
  }
  function createState(seed = rules.startSeed) {
    const state = f1.createState(seed);
    state.f2a = {missionen:{}};
    // Die Original-Rule195-Initialisierung startet NPC-Erzabbau bereits am Dock.
    // F2a stoppt genau diesen Auftrag, bevor die erste Wirtschaftsminute läuft.
    synchronisieren(state);
    if (!audit(state).ok) throw Error('F2a: ungültiger Anfangszustand');
    return state;
  }
  function pruefen(state) {
    if (state?.rulesVersion !== profil || state?.schema !== 8)
      throw Error('F2a: fremde Forschungsregel/Schema, keine Migration');
    const buch=state.f2a;
    if (!buch || typeof buch!=='object' || Array.isArray(buch)
      || Object.keys(buch).join()!=='missionen'
      || !buch.missionen || typeof buch.missionen!=='object'
      || Array.isArray(buch.missionen))
      throw Error('F2a: Missionsbuch fehlt');
    // Ein gefälschter Forschungsstand darf keinem ungeprüften Miner
    // einen dockgebundenen Altauftrag zum kostenlosen Ortswechsel geben.
    for(const sh of Object.values(state.ships)) {
      if(sh.klasse==='miner' && sh.auftrag==='foerdern'
        && buch.missionen[sh.id]?.status!=='abbau')
        throw Error('F2a: unbelegter Bergbauauftrag außerhalb der Feldphase '+sh.id);
    }
    for(const [id,m] of Object.entries(buch.missionen)) {
      const s=state.ships[id];
      const fields=['owner','ware','status','menge','start','ende','verkauft','minedVorher','soldVorher','arbeitVorher'];
      if(!s || s.klasse!=='miner' || !s.flug || !m || typeof m!=='object'
        || Object.keys(m).sort().join()!==fields.sort().join()
        || s.owner!==m.owner || m.ware!==WARE || m.menge!==charge
        || !STUFEN.includes(m.status)
        || !Number.isSafeInteger(m.start) || m.start<0 || m.start>state.tick
        || !(m.ende===null || Number.isSafeInteger(m.ende)&&m.ende>=m.start&&m.ende<=state.tick)
        || !Number.isSafeInteger(m.verkauft)||m.verkauft<0||m.verkauft>charge
        || ![m.minedVorher,m.soldVorher,m.arbeitVorher].every(n=>Number.isSafeInteger(n)&&n>=0))
        throw Error('F2a: ungültiges Missionsbuch für '+id);
      if(m.status==='fertig' && (m.ende===null || m.verkauft!==charge || s.flug.lage!=='angedockt'
        || (s.ladung.eis||0)!==0 || s.phase!=='dock'))
        throw Error('F2a: Lieferung nicht belegbar '+id);
      if(m.status!=='fertig' && m.ende!==null)
        throw Error('F2a: vorzeitig abgeschlossener Auftrag '+id);
      if(m.status==='abbau' && (!K.imFeld(s,WARE)||s.flug.lage!=='frei'||s.phase!=='dock'))
        throw Error('F2a: Förderung außerhalb des Eisfelds '+id);
      if(m.status==='anflug' && s.flug.lage!=='frei')
        throw Error('F2a: Anflug nicht frei '+id);
      if(m.status==='abdocken' && s.flug.lage!=='abdocken')
        throw Error('F2a: Abdockphase ohne Abdocken '+id);
      if(m.status==='abnahme' && (s.flug.lage!=='angedockt'||s.phase!=='dock'))
        throw Error('F2a: Eisabnahme nur wirklich am Dock '+id);
      const abgebaut=state.w5n.eisAbgebaut-m.minedVorher;
      const verkauft=state.w5n.mineVerkauft-m.soldVorher;
      if(abgebaut<0 || verkauft<0 || verkauft>abgebaut || verkauft<m.verkauft)
        throw Error('F2a: finanzielle Eisstatistik inkonsistent '+id);
      if(m.status!=='fertig' && (abgebaut>charge || verkauft!==0
        || (s.ladung.eis||0)!==abgebaut))
        throw Error('F2a: Ladung oder vorzeitiger Verkauf nicht belegbar '+id);
      if(m.status==='fertig' && (abgebaut<charge || verkauft<charge
        || state.w5n.mineMinuten-m.arbeitVorher<charge))
        throw Error('F2a: unvollständige echte Förderung/Abnahme '+id);
      if(['abdocken','anflug','rueck'].includes(m.status) && s.phase!=='flug')
        throw Error('F2a: Fliegen ist nicht der Stations-Dockzustand '+id);
      if(s.ladung.eis>charge && m.status!=='fertig')
        throw Error('F2a: vorzeitige volle Eischarge '+id);
    }
    return true;
  }
  function audit(state) {
    try {
      pruefen(state);
      const wirtschaft = f1.audit(state);
      return {...wirtschaft,ok:wirtschaft.ok, f2a:{ok:true, missionen:Object.keys(mListe(state)).length}};
    } catch(e) {return {ok:false,grund:e.message};}
  }
  function start(state, owner, id) {
    pruefen(state);
    const s=state.ships[id];
    if (!s || s.owner!==owner || s.klasse!=='miner'
      || s.system!=='aldera' || s.phase!=='dock'
      || s.flug?.lage!=='angedockt' || !leer(s)
      || mListe(state)[id]) return {ok:false,reason:'Nur eigener, leerer Miner im Aldera-Dock'};
    const mindestArbeitsgeld=(charge/rules.economy.miningRate)*rules.w5n.mineLohn;
    const mindestKaufgeld=charge*rules.w5n.eisPreis;
    if(state.owners[owner].cash<mindestArbeitsgeld ||
       state.owners.st_aldera.cash<mindestKaufgeld)
      return {ok:false,reason:'Arbeitsgeld oder Stations-Kaufetat nicht finanziert'};
    if(Object.values(mListe(state)).some(m=>m.status!=='fertig'))
      return {ok:false,reason:'F2a: nur ein vorfinanzierter Pendelauftrag gleichzeitig'};
    if(s.auftrag==='foerdern') wirtschaftsBefehl(state,'shipWait',s);
    const r=f1.execute(state,{type:'shipUndock',owner,schiff:id});
    if(!r.ok)return r;
    // Im Original-Core bedeutet phase=dock auch Arbeitsbereitschaft. Unterwegs
    // nutzen wir eine getrennte, unbewegte Forschungsphase: dadurch kann weder
    // NPC-Wiederanlauf noch Originalfoerderung beim Rückflug versehentlich starten.
    s.phase = 'flug';
    state.f2a.missionen[id] = {
      owner,ware:WARE,status:'abdocken',menge:charge,start:state.tick,ende:null,verkauft:0,
      minedVorher:state.w5n.eisAbgebaut,soldVorher:state.w5n.mineVerkauft,
      arbeitVorher:state.w5n.mineMinuten,
    };
    return {ok:true,schiff:id,ziel:WARE,finanziert:{arbeit:mindestArbeitsgeld,ankauf:mindestKaufgeld}};
  }
  // Die Flugsteuerung über die Original-F0-Befehle; kein eigener Integrator.
  function vor(state) {
    for(const id of Object.keys(mListe(state)).sort()){
      const m=mListe(state)[id],s=state.ships[id],b=s.flug;
      if(m.status==='abdocken'&&b.lage==='frei') {
        wirtschaftsBefehl(state,'shipApproach',s,{zielArt:'feld',ziel:'aldera:eis'});
        m.status='anflug';
      }
      if(m.status==='anflug'&&K.imFeld(s,WARE)) {
        // Dieselbe Original-Wirtschaft: am *echten* Feld ist die einzelne
        // Minute bergbaufähig. Für NPC-Dock/Investor gilt nach Rückflug wieder
        // die gesonderte Forschungsphase 'flug'. Kein W5n-Doppelpfad.
        s.phase='dock';
        wirtschaftsBefehl(state,'shipMine',s,{ware:WARE});
        m.status='abbau';
      }
      if(m.status==='abbau' && !K.imFeld(s,WARE)) {
        if(s.auftrag==='foerdern')wirtschaftsBefehl(state,'shipWait',s);
        s.phase='flug';
        // Der vorhandene F0-Anflug darf den Miner zurück zum Eisfeld steuern.
        wirtschaftsBefehl(state,'shipApproach',s,{zielArt:'feld',ziel:'aldera:eis'});
        m.status='anflug';
      }
      if(m.status==='abbau'&&(s.ladung.eis||0)>=charge) {
        if(s.auftrag==='foerdern')wirtschaftsBefehl(state,'shipWait',s);
        s.phase='flug';
        wirtschaftsBefehl(state,'shipDock',s,{station:'st_aldera'});
        m.status='rueck';
      }
      if(m.status==='rueck'&&b.lage==='angedockt'){
        s.phase='dock';m.status='abnahme';
      }
      if(m.status==='abnahme') {
        if(b.lage!=='angedockt'||s.phase!=='dock')
          throw Error('F2a: Abnahme außerhalb des Docks strikt verweigert');
        const menge=s.ladung.eis||0;
        if(menge>0){
          // Kein Verkauf vor dem Andocken, keine selbst berechneten Handelsbeträge.
          const r=f1.execute(state,{type:'shipSellIce',owner:s.owner,schiff:s.id,menge});
          if(!r.ok)continue; // Kaeufer kann pleitegehen – Ware bleibt beim Miner.
          m.verkauft=menge;
        }
        if(m.verkauft>0){
          m.status='fertig';m.ende=state.tick;
        }
      }
    }
  }
  function nach(state) {
    // Sobald die Charge produziert wurde, Originalauftrag vor dem nächsten
    // W5n-Tick pausieren – verhindert automatische 50er-Sofortabnahme im Feld.
    vor(state);
    // NPC-Investition darf nach der 68-Minuten-Lieferung keinen neuen
    // ungeprüften Dock-Erzauftrag bis zum Folgetick stehen lassen.
    if(state.flug.schritt===0)synchronisieren(state);
  }
  function teilschritt(state) {
    pruefen(state);
    vor(state);
    const r=f1.teilschritt(state);
    nach(state);
    if(!audit(state).ok)throw Error('F2a: Flug-/Wirtschafts-Audit nach Teilschritt');
    return r;
  }
  function fliegen(state,n) {
    if(!Number.isSafeInteger(n)||n<0||n>60*rules.maxAdvanceSteps)
      throw RangeError('F2a: ungültige Flugschrittzahl');
    for(let i=0;i<n;i++)teilschritt(state);
  }
  function minute(state) {
    // Auch im Stillstand exakt 60 F0-Teilschritte mit nur EINEM Original-Core-Tick;
    // bei vollendetem Auftrag darf F1 den angedockten Schnellpfad verwenden.
    if(Object.values(mListe(state)).every(m=>m.status==='fertig')){
      const r=f1.minute(state);synchronisieren(state);return r;
    }
    let result=null;
    for(let i=0;i<60;i++){const r=teilschritt(state);if(r!==null)result=r;}
    return result;
  }
  function advance(state,n) {
    if(!Number.isSafeInteger(n)||n<0||n>rules.maxAdvanceSteps)
      throw RangeError('F2a: ungültige Wirtschaftsminuten');
    for(let i=0;i<n;i++)minute(state);
  }
  function execute(state,cmd) {
    pruefen(state);
    if (cmd && AKTIONEN.has(cmd.type))
      return {ok:false,reason:'F2a: Bergbau/Abnahme ausschließlich über örtlich geprüften Pendelauftrag'};
    const m=cmd?.schiff && mListe(state)[cmd.schiff];
    if(m && m.status!=='fertig' && typeof cmd.type==='string'
      && Object.hasOwn(K.BEFEHLE,cmd.type))
      return {ok:false,reason:'F2a: laufender Pendelauftrag kontrolliert Flug und Andocken'};
    const r=f1.execute(state,cmd);
    if(r.ok)synchronisieren(state);
    return r;
  }
  function submit(state,cmd) {
    pruefen(state);
    if(cmd&&AKTIONEN.has(cmd.type))
      return {ok:false,reason:'F2a: keine ungeprüften Abbau-/Abnahmekommandos in Wirtschaftsqueue'};
    const m=cmd?.schiff && mListe(state)[cmd.schiff];
    if(m && m.status!=='fertig')
      return {ok:false,reason:'F2a: laufender Pendelauftrag gesperrt für externe Kommandos'};
    return f1.submit(state,cmd);
  }
  function save(state) {
    if(!audit(state).ok)throw Error('F2a: unprüfbarer Forschungsstand');
    return f1.save(state);
  }
  function load(json) {
    const s=f1.load(json);
    if(!audit(s).ok)throw Error('F2a: Flug-/Missions-/Finanzierungsprüfung ungültig');
    return s;
  }
  return Object.freeze({
    rules,createState,start,execute,submit,teilschritt,fliegen,minute,advance,
    save,load,audit,hash:f1.hash,canonical:f1.canonical,flugKern:K
  });
}
const api=Object.freeze({erstellen,PROFIL,WARE,CHARGE});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.F2aEisPendel=api;
})(globalThis);
