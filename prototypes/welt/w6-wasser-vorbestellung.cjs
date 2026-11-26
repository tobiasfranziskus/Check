'use strict';
// Research-only admission gate. Reads the authoritative world, never books
// cash, reserves cargo, advances time, or claims authenticated consent.
const {createHash}=require('node:crypto');
const hash=x=>createHash('sha256').update(x).digest('hex');
const fail=grund=>({ok:false,grund});
const integer=(n,min=0)=>Number.isSafeInteger(n)&&n>=min;
const equalKeys=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)
 &&Object.keys(x).sort().join(',')===keys.slice().sort().join(',');
function angebot(w,s,request){
 if(!equalKeys(request,['schiff','tarif','bestellungen'])||typeof request.schiff!=='string'
   ||!integer(request.tarif,1)||!Array.isArray(request.bestellungen)||!request.bestellungen.length)
   return fail('FORM');
 if(s.kanon.w6Gesamtwirtschaft!==true)return fail('PROFIL');
 const {rules,daten}=w,quelle=rules.w5n.zielStation,ziel=rules.w5n.quellStation;
 if(s.w3.auftrag||s.w5n.frachtauftrag||s.w5ac?.active||s.kanon.rueckfracht)
   return fail('STRECKE_BELEGT');
 const sh=s.ships[request.schiff];
 if(!sh||!['house','transport'].includes(sh.owner)||sh.klasse!=='frachter'
   ||!['aldera','nadir'].includes(sh.system)||w.stillgelegt(s,sh.id)
   ||sh.phase!=='dock'||sh.auftrag!=='halten'
   ||!w.flugKern.angedocktAn(sh,sh.system==='aldera'?ziel:quelle)
   ||Object.values(sh.ladung).some(x=>x!==0))return fail('SCHIFF');
 const hin=w.kern.route(rules.world,'aldera','nadir')?.zeit;
 const rueck=w.kern.route(rules.world,'nadir','aldera')?.zeit;
 if(!integer(hin,1)||!integer(rueck,1))return fail('ROUTE');
 const minuten=(sh.system==='aldera'?hin:0)+rueck;
 const rest=w.restAktivminuten(s,sh.id);
 if(rest!==null&&rest<minuten)return fail('RESTZEIT');
 const lohn=minuten*rules.w5n.fliegerLohn;
 const wertverzehr=Math.ceil(minuten*daten.verschleiss.milliJeMinute.frachter/1000);
 if(!integer(lohn)||!integer(wertverzehr))return fail('KOSTEN');
 const mindesttarif=lohn+wertverzehr;
 if(request.tarif<mindesttarif)return fail('TARIF_UNTERDECKT');
 const preis=daten.wasser.preisAldera,einkauf=rules.w5n.wasserPreis;
 const bestand=s.stations[quelle].lager.wasser||0,lager=s.stations[ziel].lager.wasser||0;
 const kapazitaet=Math.max(0,Math.min(rules.economy.cargo,bestand,
   daten.wasser.lagerAldera-lager,s.kanon.politik.wasserZielAldera-lager));
 let menge=0;
 const gesehen=new Set(),bestellungen=[];
 for(const b of request.bestellungen){
   if(!equalKeys(b,['owner','menge'])||typeof b.owner!=='string'||!integer(b.menge,1)
     ||gesehen.has(b.owner)||daten.haushalte[b.owner]!==ziel||!s.owners[b.owner])
     return fail('KAEUFER');
   gesehen.add(b.owner);
   if(b.menge>kapazitaet-menge)return fail('LAGER_ODER_KAPAZITAET');
   const kosten=b.menge*preis;
   if(!integer(kosten,1)||s.owners[b.owner].cash<kosten)return fail('KAEUFER_UNGEDECKT');
   // For NPCs, preserve their existing savings and current daily consumption
   // ceiling. A human player's explicit decision is not automatic demand.
   const privat=['pilot_house','eigner_house'].includes(b.owner);
   if(!privat){
     const p=s.kanon.politik,h=s.kanon.haushalte[b.owner],tag=Math.floor(s.tick/1440);
     const heute=h?.tag===tag?h.heute:0;
     if(!p.automatik||w.haushaltVerfuegbar(s,b.owner)<kosten
       ||(p.bedarfJeTag>0&&b.menge>Math.max(0,p.bedarfJeTag-heute)))
       return fail('NPC_BUDGET');
   }
   menge+=b.menge;
   bestellungen.push({owner:b.owner,menge:b.menge,kosten,privat});
 }
 bestellungen.sort((a,b)=>a.owner<b.owner?-1:a.owner>b.owner?1:0);
 const warenwert=menge*einkauf,vorbestellwert=menge*preis;
 const stationsmarge=vorbestellwert-warenwert-request.tarif;
 if(!integer(warenwert)||!integer(vorbestellwert)||!integer(stationsmarge))
   return fail('GESAMT_UNGEDECKT');
 const firma=w.bericht(s).firmen[sh.owner];
 const betriebsreserve=s.kanon.politik.betriebsreserve[sh.owner]||0;
 const freieKasse=Math.max(0,s.owners[sh.owner].cash-firma.ruecklage-betriebsreserve);
 // Conservative: carrier must be able to pay the whole wage reserve itself.
 // The quoted tariff is payable only after delivery; no loan is assumed.
 if(freieKasse<lohn)return fail('FLUGLOHN_UNGEDECKT');
 const datenblatt={tick:s.tick,weltHash:w.hash(s),saveHash:hash(w.save(s)),quelle,ziel,
   schiff:sh.id,frachtfuehrer:sh.owner,start:sh.system,minuten,rest,menge,
   preis,einkauf,tarif:request.tarif,lohn,wertverzehr,mindesttarif,
   warenwert,vorbestellwert,stationsmarge,
   frachtmarge:request.tarif-mindesttarif,bestellungen,
   parteien:[...new Set([quelle,ziel,sh.owner,...bestellungen.map(b=>b.owner)])].sort()};
 return {ok:true,angebot:{...datenblatt,id:hash(JSON.stringify(datenblatt))}};
}
function pruefeZustimmungen(w,s,request,signaturen){
 const q=angebot(w,s,request);
 if(!q.ok)return q;
 const a=q.angebot;
 if(!Array.isArray(signaturen)||signaturen.length!==a.parteien.length)
   return fail('ZUSTIMMUNG_FEHLT');
 const gesehen=new Set();
 for(const sig of signaturen){
   if(!equalKeys(sig,['owner','angebot'])||!a.parteien.includes(sig.owner)
     ||gesehen.has(sig.owner)||sig.angebot!==a.id)return fail('ZUSTIMMUNG_UNGUELTIG');
   gesehen.add(sig.owner);
 }
 // Pure prospective settlement: the actual core must authenticate all actors
 // and atomically reserve cash, goods and capacity before any future flight.
 const zahlungsplan={vorbestellTreuhand:a.vorbestellwert,
   warenlieferant:a.warenwert,lieferTarif:a.tarif,verkaufsstation:a.stationsmarge,
   fluglohnAusCarrierKasse:a.lohn,wertverzehrNurKalkulation:a.wertverzehr};
 return {ok:true,status:'ZULASSUNGSPRUEFUNG_NICHT_GEBUCHT',angebot:a,zahlungsplan};
}
module.exports={angebot,pruefeZustimmungen};
