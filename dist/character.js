'use strict';
const seenCloseIcon='<svg class="close-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg>';
function seenNavigationKey(event){return ({KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d'})[event.code]||(/^[wasd]$/i.test(event.key)?event.key.toLowerCase():event.key)}
function seenTypingTarget(target){return target instanceof Element&&!!target.closest('input,textarea,select,[contenteditable="true"]')}

// Avoid replacing text nodes or attributes when the visible state has not changed.
function seenSetText(node,value){if(node.textContent!==value)node.textContent=value}
function seenSetData(node,key,value){if(node.dataset[key]!==value)node.dataset[key]=value}
let seenFontRevision=0;
document.fonts.ready.then(()=>{seenFontRevision++});

function createSeenJump(){
 const prepare=.14,flight=11.6/14,land=.20,total=prepare+flight+land;
 let elapsed=total;
 const smooth=t=>t*t*(3-2*t);
 return {
  get active(){return elapsed<total},
  get height(){const t=elapsed-prepare;return t>0&&t<flight?Math.max(0,5.8*t-7*t*t):0},
  get crouch(){if(elapsed>=total)return 0;if(elapsed<prepare)return smooth(elapsed/prepare);if(elapsed<prepare+flight)return 1-smooth(Math.min(1,(elapsed-prepare)/.12));return Math.sin(Math.PI*(elapsed-prepare-flight)/land)*.7},
  get tuck(){return elapsed>prepare&&elapsed<prepare+flight?Math.sin(Math.PI*(elapsed-prepare)/flight):0},
  start(){if(elapsed>=total)elapsed=0},
  step(dt){elapsed=Math.min(total,elapsed+dt)},
  reset(){elapsed=total}
 };
}

// A single visitor model keeps the lobby and every auditorium visually consistent.
function drawSeenCharacter({ctx:g,unit,project:point,x,y,heading,posture:blend=0,gait=0,phase:tick=0,jump=0,jumpCrouch=0,jumpTuck=0,jumping=false,tagColor='#e2c797',shadowColor='#0004'}){
function oval(x,y,z,rx,ry,color){const p=point(x,y,z);g.beginPath();g.ellipse(p.x,p.y,rx*unit,ry*unit,0,0,Math.PI*2);g.fillStyle=color;g.fill()}
function label(value,x,y,z,size,color){const p=point(x,y,z);g.save();g.font=`600 ${size*unit}px "Barlow Condensed",sans-serif`;g.textAlign='center';g.fillStyle=color;g.fillText(value,p.x,p.y);g.restore()}
gait*=jumping ? .15 : 1;
const fx=Math.cos(heading),fy=Math.sin(heading),rx=-fy,ry=fx;const stride=Math.sin(tick)*.18*gait*(1-blend),lift=Math.abs(Math.cos(tick))*.06*gait*(1-blend),bob=Math.abs(Math.sin(tick))* .025*gait*(1-blend);oval(x+.02,y+.04,.015,.27,.1,shadowColor);
function local(side,forward,z){return point(x+rx*side+fx*forward,y+ry*side+fy*forward,z+jump)}
function bone(a,b,r,color){g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineWidth=unit*r;g.lineCap='round';g.strokeStyle=color;g.stroke()}
const hip=.63-.12*blend+bob-.17*jumpCrouch,shoulder=hip+.39;const limbs=[-1,1].map(sign=>{const footForward=sign*stride*(1-blend)+.34*blend-.06*jumpTuck,footZ=.055+Math.max(0,sign*Math.cos(tick))*.10*gait*(1-blend)+.15*jumpTuck,kneeForward=sign*stride*.5*(1-blend)+.31*blend+.22*jumpCrouch+.25*jumpTuck,kneeZ=.34+.16*blend-.08*jumpCrouch+.12*jumpTuck;return{sign,depth:(rx*sign*.11+fx*footForward)+(ry*sign*.11+fy*footForward),hip:local(sign*.105,0,hip),knee:local(sign*.105,kneeForward,kneeZ),foot:local(sign*.105,footForward,footZ)}}).sort((a,b)=>a.depth-b.depth);
for(const leg of limbs){bone(leg.hip,leg.knee,.12,'#b4ac93');bone(leg.knee,leg.foot,.105,leg.sign<0?'#c7bfa6':'#ada68f');const shoe=local(leg.sign*.105,(leg.sign*stride*(1-blend)+.34*blend-.06*jumpTuck)+.04,.055+Math.max(0,leg.sign*Math.cos(tick))*.10*gait*(1-blend)+.15*jumpTuck);bone(leg.foot,shoe,.125,'#373d32')}
const swing=Math.sin(tick)*.13*gait*(1-blend);const far=(rx+ry)>0?-1:1;
function arm(sign){const a=local(sign*.205,0,shoulder-.03),elbow=local(sign*.235,-sign*swing*.6+.15*blend-.10*jumpCrouch+.18*jumpTuck,shoulder-.19+.15*jumpTuck),hand=local(sign*.22,-sign*swing+.26*blend-.18*jumpCrouch+.30*jumpTuck,hip+.05+.43*jumpTuck);bone(a,elbow,.13,sign<0?'#c45c40':'#df7651');bone(elbow,hand,.085,'#e4b18a')}
arm(far);const center=local(0,0,hip+.20);g.save();g.translate(center.x,center.y);g.rotate((point(fx*.1,fy*.1,0).x-point(0,0,0).x)/unit*.12*(1-blend));const shirt=g.createLinearGradient(-unit*.2,0,unit*.2,0);shirt.addColorStop(0,'#ba5039');shirt.addColorStop(.6,'#e77950');shirt.addColorStop(1,'#c05b3f');g.fillStyle=shirt;g.beginPath();g.roundRect(-unit*.18,-unit*.23,unit*.36,unit*.44,[unit*.10,unit*.10,unit*.065,unit*.065]);g.fill();g.restore();arm(-far);
const neck=local(0,0,shoulder+.06);bone(local(0,0,shoulder),neck,.09,'#dba780');const head=local(0,.015,shoulder+.22),backFacing=(fx+fy)<-.1;g.save();g.translate(head.x,head.y);const skin=g.createLinearGradient(-unit*.14,0,unit*.14,0);skin.addColorStop(0,'#cb9974');skin.addColorStop(1,'#edc49c');g.fillStyle=skin;g.beginPath();g.ellipse(0,0,unit*.145,unit*.175,0,0,Math.PI*2);g.fill();g.fillStyle='#383e30';g.beginPath();g.ellipse(-unit*.008,-unit*.085,unit*.155,unit*(backFacing ? .16 : .10),0,Math.PI,backFacing?Math.PI*3:Math.PI*2);g.fill();if(!backFacing){g.fillStyle='#84634a';const face=point(fx,fy);const origin=point(0,0);const side=Math.sign(face.x-origin.x);g.beginPath();g.arc(side*unit*.075,-unit*.005,unit*.012,0,Math.PI*2);g.fill()}g.restore();label('YOU',x,y,shoulder+.65+jump,.12,tagColor)
}
