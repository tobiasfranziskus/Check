/* Ausschließlich Demonstrationsdaten; keine Produktregeln oder realen Vorkommen. */
const demoSnapshot = {
  demonstration:true, name:'Aphros · Demonstrationssektor',
  asteroids:[
    {id:'demo-a',name:'Asteroid A',position:{x:-180,y:-80},resources:[{name:'Erz',amount:120,unit:'Einheiten'}],distance:320,distanceUnit:'m',status:'Unberührt (Demo)',security:'Zone Alpha (Demo)',hazards:[]},
    {id:'demo-b',name:'Asteroid B',position:{x:170,y:90},resources:[{name:'Eis',amount:40,unit:'Einheiten'}],distance:640,distanceUnit:'m',status:'Teilweise abgebaut (Demo)',security:'Unbewertet (Demo)',hazards:['Gemeldete Trümmer (Demo)']},
    {id:'demo-c',name:'Asteroid C',position:{x:90,y:-120}},
    {id:'demo-d',name:'Asteroid ohne Positionsdaten'}
  ],
  fields:[{name:'Abbaugebiet Nord (Demo)',position:{x:-120,y:-60},radius:130,resources:[{name:'Erz'}],hazards:[]}],
  zones:[{name:'Zone Alpha (Demo)',position:{x:-180,y:-80},radius:190,security:'Als gesichert gemeldet (Demo)',hazards:[]}]
};
LegacyMiningScanner.mount(document.getElementById('scanner'), demoSnapshot);
