// Extracted from Check #164/#171 m_ui_miner2d; provenance: docs/W5_JAGD_GRAFIK_UEBERNAHME.md
const GX={parts:new Map()};
function sgPolygon(h,p){h.beginPath();h.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)h.lineTo(p[i][0],p[i][1]);h.closePath()}

const GX_MODELS={
 rookie:{body:[[25,0],[9,-7],[2,-6],[-7,-13],[-17,-12],[-12,-4],[-21,-3],[-21,3],[-12,4],[-17,12],[-7,13],[2,6],[9,7]],role:'scout',engines:[[-20,0]],scale:.92},
 interceptor:{body:[[30,0],[5,-7],[-13,-20],[-22,-18],[-12,-4],[-23,-3],[-23,3],[-12,4],[-22,18],[-13,20],[5,7]],role:'combat',engines:[[-20,-10],[-20,10]],scale:1},
 cruiser:{body:[[27,0],[19,-9],[7,-10],[-1,-20],[-19,-20],[-24,-13],[-17,-8],[-23,-5],[-23,5],[-17,8],[-24,13],[-19,20],[-1,20],[7,10],[19,9]],role:'combat',engines:[[-22,-12],[-22,12]],scale:1.08},
 prospector:{body:[[22,0],[10,-6],[-1,-6],[1,-18],[-20,-18],[-23,-12],[-9,-12],[-9,-7],[-20,-4],[-20,4],[-9,7],[-9,12],[-23,12],[-20,18],[1,18],[-1,6],[10,6]],role:'mining',engines:[[-18,-9],[-18,9]],scale:1.02},
 courier:{body:[[31,0],[12,-5],[-1,-5],[-13,-13],[-23,-11],[-16,-3],[-25,-2],[-25,2],[-16,3],[-23,11],[-13,13],[-1,5],[12,5]],role:'courier',engines:[[-24,0]],scale:.96},
 hauler:{body:[[24,-4],[19,-10],[8,-10],[8,-16],[-20,-16],[-25,-10],[-23,-5],[-23,5],[-25,10],[-20,16],[8,16],[8,10],[19,10],[24,4]],role:'cargo',engines:[[-23,-9],[-23,9]],scale:1.04},
 exhumer:{body:[[23,0],[12,-8],[6,-8],[6,-22],[-17,-22],[-25,-16],[-25,-10],[-9,-10],[-9,-6],[-23,-4],[-23,4],[-9,6],[-9,10],[-25,10],[-25,16],[-17,22],[6,22],[6,8],[12,8]],role:'mining',engines:[[-22,-8],[-22,8]],scale:1.08},
 miner:{body:[[22,0],[9,-5],[3,-17],[-17,-17],[-21,-10],[-7,-9],[-9,-4],[-20,0],[-9,4],[-7,9],[-21,10],[-17,17],[3,17],[9,5]],role:'mining',engines:[[-18,-6],[-18,6]],scale:.94},
 trader:{body:[[26,-3],[18,-8],[7,-8],[7,-14],[-19,-14],[-24,-8],[-21,-3],[-21,3],[-24,8],[-19,14],[7,14],[7,8],[18,8],[26,3]],role:'cargo',engines:[[-22,-7],[-22,7]],scale:1},
 hunter:{body:[[27,0],[7,-8],[-7,-17],[-21,-15],[-12,-3],[-23,0],[-12,3],[-21,15],[-7,17],[7,8]],role:'combat',engines:[[-19,-8],[-19,8]],scale:.96},
 pirate:{body:[[28,0],[6,-6],[-2,-17],[-13,-21],[-23,-15],[-13,-5],[-24,-2],[-24,2],[-13,5],[-23,15],[-13,21],[-2,17],[6,6]],role:'combat',engines:[[-21,-9],[-21,9]],scale:1}
};

function gxModel(kind){return GX_MODELS[kind]||GX_MODELS.rookie}

function gxParts(kind,tint){const key=kind+tint;if(GX.parts.has(key))return GX.parts.get(key);const m=gxModel(kind),ops=[{t:'poly',p:m.body,fill:'metal',stroke:'#abc1ce',w:.65},{t:'poly',p:[[21,0],[5,-3],[-13,-3],[-16,0],[-13,3],[5,3]],fill:'#243c50',stroke:'#7898ac',w:.5}];const rect=(x,y,w,h,fill,stroke)=>ops.push({t:'rect',x,y,w,h,fill,stroke});for(const e of m.engines){rect(e[0]-2,e[1]-2,5,4,'#142333','#7d9dad');rect(e[0]-2,e[1]-1,1.5,2,tint)}rect(6,-1.6,4,3.2,tint);rect(-5,-1,8,2,'#829daf');if(m.role==='cargo'){for(let x=-17;x<6;x+=7){rect(x,-12,5.5,8,'#7792a0','#b0c2c6');rect(x,4,5.5,8,'#3c596b','#8ba4ad');rect(x+1,-10,3,.7,'#d1b979')}}else if(m.role==='mining'){for(const y of [-16,13]){rect(-16,y,18,3,'#b7a378','#d5c7a5');rect(-9,y,1.5,3,'#344b5c');rect(-4,y,1.5,3,'#344b5c')}rect(-4,-7,9,3,'#677e8f');rect(-4,4,9,3,'#425d71')}else if(m.role==='combat'){for(const y of [-7,6]){rect(0,y,10,1.4,'#c2ced1');rect(-5,y-1,4,3,'#334a60','#91a8b5')}rect(-14,-10,7,2,'#6c899c');rect(-14,8,7,2,'#3c5b72')}else if(m.role==='courier'){rect(-13,-5,14,1,'#b4c7d0');rect(-13,4,14,1,'#607f95')}else{rect(-8,-7,6,2,'#a3b9c8');rect(-8,5,6,2,'#607f96')}GX.parts.set(key,ops);return ops}
function gxCanvas(h,kind,tint){const gradient=h.createLinearGradient(0,-24,0,24);gradient.addColorStop(0,'#9bb2c1');gradient.addColorStop(.42,'#58768c');gradient.addColorStop(1,'#22394c');for(const op of gxParts(kind,tint)){h.fillStyle=op.fill==='metal'?gradient:op.fill;if(op.t==='poly'){sgPolygon(h,op.p);h.fill();if(op.stroke){h.strokeStyle=op.stroke;h.lineWidth=op.w;h.stroke()}}else{h.fillRect(op.x,op.y,op.w,op.h);if(op.stroke){h.lineWidth=.45;h.strokeStyle=op.stroke;h.strokeRect(op.x,op.y,op.w,op.h)}}}}

function treffer(view,local,rect,x,y,radius) {
 if(!view||!rect.width||!rect.height||x<rect.left||y<rect.top||x>rect.left+rect.width||y>rect.top+rect.height)return null;
 let best=null,distance=Infinity;
 for(const o of view.entities){const px=rect.left+rect.width/2+(o.x-local.x)*local.zoom,py=rect.top+rect.height/2+(o.y-local.y)*local.zoom,d=Math.hypot(px-x,py-y);
 if(d<=Math.max(22,radius(o)+6)&&d<=distance){best=o;distance=d}}
 return best;
}
// UX01 gesture arbitration: tap selects only, pinch/drag/hold/cancel never submit commands.
function eingabe(canvas,local,select,context) {
 const points=new Map();let press=null,pinch=null,gesture=false;
 const clear=()=>{press=null;pinch=null;gesture=false;const ids=[...points.keys()];points.clear();for(const id of ids)try{if(canvas.hasPointerCapture?.(id))canvas.releasePointerCapture(id)}catch{}};
 const down=e=>{if(e.button!==undefined&&e.button!==0)return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});try{canvas.setPointerCapture(e.pointerId)}catch{}
  if(points.size>1){gesture=true;press=null;const p=[...points.values()];pinch=p.length===2?{d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),z:local.zoom}:null;return}
  press={id:e.pointerId,x:e.clientX,y:e.clientY,at:e.timeStamp,context:context(),z:local.zoom};};
 const move=e=>{if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size>1){gesture=true;press=null;const p=[...points.values()];if(pinch?.d>4&&p.length===2)local.zoom=Math.max(.03,Math.min(.5,pinch.z*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/pinch.d));return}if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>10)press=null;};
 const up=e=>{const p=press,g=gesture;press=null;points.delete(e.pointerId);pinch=null;if(!points.size)gesture=false;
  if(p&&p.id===e.pointerId&&!g&&p.context===context()&&p.z===local.zoom&&e.timeStamp-p.at<=600&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<=10)select(e.clientX,e.clientY);
  try{if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId)}catch{}};
 canvas.onpointerdown=down;canvas.onpointermove=move;canvas.onpointerup=up;canvas.onpointercancel=clear;canvas.onlostpointercapture=clear;
 return {clear,down,move,up};
}

export {gxCanvas,treffer,eingabe};
