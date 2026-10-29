'use strict';
(()=>{
const world=document.querySelector('#room-world'),g=world.getContext('2d'),room=document.querySelector('#auditorium'),dialog=document.querySelector('#screening'),sit=document.querySelector('#sit-down'),picker=document.querySelector('#seat-picker'),status=document.querySelector('#room-status');
const held=new Set(),chairs=[];let width=0,height=0,unit=1,cx=0,cy=0,visitor={x:6,y:10.65},path=[],pendingSeat=null,seated=null,closeSeat=null,tick=0,previous=0,isWalking=false,heading=-Math.PI/2,velocity={x:0,y:0},autoSpeed=0,gait=0,posture=0,motion=null,afterStand=null,exiting=false;
for(let row=0;row<5;row++)for(let col=0;col<10;col++){const id='ABCDE'[row]+String(col+1).padStart(2,'0'),seat={id,x:col<5?1.35+col*.78:6.85+(col-5)*.78,y:4.1+row*1.3};chairs.push(seat);const option=document.createElement('option');option.value=id;option.textContent=`Seat ${id}`;picker.append(option)}
const articleDialog=document.querySelector('#screen-article'),screenStill=document.querySelector('#screen-still');
let roomRevision=0,roomPaintKey='';
screenStill.addEventListener('load',()=>roomRevision++);
const chairDrawOrder=[...chairs].sort((a,b)=>(a.x+a.y)-(b.x+b.y)),chairHitOrder=[...chairDrawOrder].reverse();
const chairById=new Map(chairs.map(seat=>[seat.id,seat]));
const navigation=createSeenRoomNavigation(chairs),roomJump=createSeenJump();
function jump(){if(!active()||seated||motion)return;roomJump.start();world.focus({preventScroll:true})}
const active=()=>!document.hidden&&isSceneOpen('screening')&&!room.hidden&&!articleDialog.open;
function size(){roomRevision++;width=world.clientWidth;height=world.clientHeight;if(!width||!height)return;const ratio=Math.min(devicePixelRatio||1,2);world.width=width*ratio;world.height=height*ratio;g.setTransform(ratio,0,0,ratio,0,0);unit=Math.min(width/22.5,height/18.3);cx=width/2;cy=Math.max(unit*5.3+12,height*.29);}
new ResizeObserver(size).observe(world);
function point(x,y,z=0){return{x:cx+(x-y)*unit*.86,y:cy+(x+y)*unit*.43-z*unit}}
function polygon(vertices,color){g.beginPath();vertices.forEach((v,i)=>{const p=point(...v);i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y)});g.closePath();g.fillStyle=color;g.fill()}
function cube(x,y,z,dx,dy,dz,top,front,side){polygon([[x,y,z+dz],[x+dx,y,z+dz],[x+dx,y+dy,z+dz],[x,y+dy,z+dz]],top);polygon([[x,y+dy,z],[x+dx,y+dy,z],[x+dx,y+dy,z+dz],[x,y+dy,z+dz]],front);polygon([[x+dx,y,z],[x+dx,y+dy,z],[x+dx,y+dy,z+dz],[x+dx,y,z+dz]],side)}
function oval(x,y,z,rx,ry,color){const p=point(x,y,z);g.beginPath();g.ellipse(p.x,p.y,rx*unit,ry*unit,0,0,Math.PI*2);g.fillStyle=color;g.fill()}
function label(text,x,y,z,font,color,wall=false){const p=point(x,y,z);g.save();g.translate(p.x,p.y);if(wall)g.transform(.86,.43,0,1,0,0);g.font=`600 ${font*unit}px "Barlow Condensed",sans-serif`;g.fillStyle=color;g.textAlign='center';g.fillText(text,0,0);g.restore()}
function drawCurtains(){
// Project the fabric onto the same wall plane as the screen.
function fabric(x,z,w,h,mirror=false,valance=false){const a=point(x,.30,z+h),b=point(x+w,.30,z+h),c=point(x,.30,z);g.save();g.transform((b.x-a.x)/200,(b.y-a.y)/200,(c.x-a.x)/400,(c.y-a.y)/400,a.x,a.y);if(mirror){g.translate(200,0);g.scale(-1,1)}g.beginPath();g.moveTo(0,0);g.lineTo(200,0);if(valance){g.lineTo(200,350);for(let i=200;i>0;i-=40)g.quadraticCurveTo(i-20,405,i-40,350)}else{g.bezierCurveTo(180,105,132,210,178,385);g.quadraticCurveTo(90,410,0,385)}g.closePath();g.clip();const velvet=g.createLinearGradient(0,0,200,0);for(let i=0;i<=10;i++){velvet.addColorStop(i/10,i%2?'#b94038':'#591e27')}g.fillStyle=velvet;g.fillRect(0,0,200,420);const shade=g.createLinearGradient(0,0,0,400);shade.addColorStop(0,'#240e2545');shade.addColorStop(.4,'#b4593a10');shade.addColorStop(1,'#260c2066');g.fillStyle=shade;g.fillRect(0,0,200,420);g.strokeStyle='#d6aa6a';g.lineWidth=valance?10:3;g.beginPath();if(valance){g.moveTo(0,348);for(let i=0;i<200;i+=40)g.quadraticCurveTo(i+20,403,i+40,348)}else{g.moveTo(0,380);g.quadraticCurveTo(90,405,178,380)}g.stroke();if(!valance){g.strokeStyle='#ca9b5e';g.lineWidth=5;g.beginPath();g.moveTo(4,250);g.quadraticCurveTo(88,282,151,255);g.stroke()}g.restore()}
cube(.18,.10,0,11.65,.65,.20,'#44302b','#292322','#201e1e');fabric(.22,.34,2.40,4.43);fabric(9.38,.34,2.40,4.43,true);fabric(.22,4.66,11.56,.35,false,true);}
// Local wall dimensions and image pixels share the same 16:9 aspect ratio.
const screenGeometry={left:2.8,right:9.2,top:4.5,bottom:.9,width:800,height:450};
function screenPoints(){const s=screenGeometry;return{a:point(s.left,.32,s.top),b:point(s.right,.32,s.top),c:point(s.left,.32,s.bottom)}}
function drawScreen(){
 const s=screenGeometry,{a,b,c}=screenPoints(),W=s.width,H=s.height;
 g.save();g.transform((b.x-a.x)/W,(b.y-a.y)/W,(c.x-a.x)/H,(c.y-a.y)/H,a.x,a.y);
 g.fillStyle='#090c0d';g.fillRect(-13,-13,W+26,H+26);
 const im=screenStill;if(im.complete&&im.naturalWidth){const ratio=16/9,ir=im.naturalWidth/im.naturalHeight;let sx=0,sy=0,sw=im.naturalWidth,sh=im.naturalHeight;if(ir>ratio){sw=sh*ratio;sx=(im.naturalWidth-sw)/2}else{sh=sw/ratio;sy=(im.naturalHeight-sh)/2}g.drawImage(im,sx,sy,sw,sh,0,0,W,H)}
 g.fillStyle='#101611a6';g.fillRect(0,0,W,H);g.fillStyle='#e3c18b';g.font='500 15px "DM Sans",sans-serif';g.fillText(`SEEN / SCREEN ${currentRoom?.n||'01'}`,40,65);
 g.fillStyle='#fff0d2';g.font='600 46px "Barlow Condensed",sans-serif';g.fillText(currentRoom?.name||'SEEN CINEMA',40,215,W-80);
 g.fillStyle='#ebc58e';g.font='500 14px "DM Sans",sans-serif';g.fillText('READ THE STORY  ↗',40,380);g.restore();
 polygon([[s.left,.38,s.bottom-.07],[s.right,.38,s.bottom-.07],[s.right,.47,s.bottom-.07],[s.left,.47,s.bottom-.07]],'#c9b085');
}
function chair(seat){const selected=seatChoices.get(currentRoom?.n)===seat.id,x=seat.x,y=seat.y;
oval(x+.23,y+.3,.015,.4,.14,'#0004');
cube(x+.06,y+.12,0,.10,.35,.29,'#343331','#242629','#242629');cube(x+.49,y+.12,0,.10,.35,.29,'#343331','#242629','#242629');
cube(x,y,.28,.65,.54,.18,selected?'#e2ba7a':'#a45a49',selected?'#ad8953':'#793e37',selected?'#907044':'#522e2c');
// Armrests stop before the back and are occluded by its opaque rear face.
for(const side of [-.025,.60]){cube(x+side,y+.16,.37,.065,.075,.13,'#665843','#514335','#423a32');cube(x+side,y+.09,.50,.075,.32,.065,'#71634c','#514335','#423a32');}
cube(x+.03,y+.46,.45,.59,.12,.56,selected?'#e8c88c':'#b06a54',selected?'#c69e63':'#904a40',selected?'#927347':'#5b3430');
label(seat.id,x+.32,y+.595,.73,.13,selected?'#59482d':'#deb28a',true)}
function character(){drawSeenCharacter({ctx:g,unit,project:point,x:visitor.x,y:visitor.y,heading,posture,gait:reduced?0:gait,phase:tick,jump:roomJump.height,jumpCrouch:roomJump.crouch,jumpTuck:roomJump.tuck,jumping:roomJump.active})}
const exitZone={x:6,y:11.55};
function drawExitMat(){polygon([[5.23,10.82,.018],[6.77,10.82,.018],[6.77,11.98,.018],[5.23,11.98,.018]],'#526343');polygon([[5.3,11.28,.024],[6.7,11.28,.024],[6.7,11.34,.024],[5.3,11.34,.024]],'#bca777')}
function drawExit(){for(const x of [5.23,6.65])cube(x,11.72,0,.12,.12,1.85,'#d4c49c','#c2ad81','#897e5d');cube(5.23,11.72,1.84,1.54,.12,.35,'#b6ad83','#516c49','#405739');label('EXIT',6,11.86,1.93,.24,'#f5e8ba',true);label('TO THE LOBBY',6,11.86,1.55,.12,'#d6cda6',true);}
function walkToExit(){requestAction(()=>{pendingSeat=null;autoSpeed=0;path=navigation.route(visitor,exitZone);status.textContent='Walking to the exit…'});world.focus({preventScroll:true})}
function leaveThroughExit(){if(exiting)return;exiting=true;held.clear();path=[];velocity={x:0,y:0};leaveScreening()}
function render(){if(!width||!height)return;g.clearRect(0,0,width,height);const gradient=g.createRadialGradient(width*.5,height*.4,0,width*.5,height*.4,width*.8);gradient.addColorStop(0,'#353d33');gradient.addColorStop(1,'#171d1b');g.fillStyle=gradient;g.fillRect(0,0,width,height);cube(0,0,-.14,12,12,.14,'#3c3731','#272c28','#212723');for(let y=0;y<12;y++)polygon([[0,y,.005],[12,y,.005],[12,y+.025,.005],[0,y+.025,.005]],'#d6b78209');cube(0,-.12,0,12,.24,5.1,'#51403a','#292326','#201e21');cube(-.12,0,0,.18,11.6,1.05,'#655b49','#374333','#29372d');drawScreen();drawCurtains();for(const x of [.8,5.65,6.4,11.1])for(let y=3;y<11.7;y+=.6)cube(x,y,.015,.035,.18,.02,'#bd9c5d','#bd9c5d','#bd9c5d');if(path.length){const dest=path[path.length-1];oval(dest.x,dest.y,.02,.22,.09,'#e8c28b55')}
drawExitMat();// Depth-sort seated hosts, live visitors, chairs, and the exit together.
const visitorDepth=seated&&posture>.45&&motion?.kind!=='transfer'?seated.x+seated.y+.45:visitor.x+visitor.y;
const figures=[...SeenHub.drawPeople({ctx:g,unit,project:point,scene:'screen-'+currentRoom.n}),{depth:visitorDepth,paint:character},{depth:17.9,paint:drawExit},...chairDrawOrder.map(seat=>({depth:seat.x+seat.y+.5,paint:()=>chair(seat)}))];figures.sort((a,b)=>a.depth-b.depth).forEach(o=>o.paint());}

function occupied(x,y){return navigation.blocked(x,y)}
function ease(t){return t*t*(3-2*t)}
function turnToward(angle,dt){let difference=Math.atan2(Math.sin(angle-heading),Math.cos(angle-heading));heading+=difference*(1-Math.exp(-dt*12))}
function stand(){if(motion)return;if(!seated){afterStand?.();afterStand=null;return}motion={kind:'stand',elapsed:0,duration:reduced ? .01 : .55,from:{...visitor},to:{x:seated.x+.33,y:seated.y-.33}};path=[];velocity={x:0,y:0};seenSetText(status,'Standing up…');sit.disabled=true;}
function requestAction(action){if(seated||motion){afterStand=action;if(!motion)stand()}else action()}
function hostSeat(s){return SeenHub.people('screen-'+currentRoom.n).some(v=>v.posture>.5&&Math.hypot(v.x-(s.x+.33),v.y-(s.y+.22))<.3)}
function nearest(){return chairs.find(s=>!hostSeat(s)&&Math.hypot(visitor.x-(s.x+.33),visitor.y-(s.y-.33))<.44)||null}
function sitHere(){if(motion)return;roomJump.reset();if(seated){stand();return}if(!closeSeat)return;if(hostSeat(closeSeat)){seenSetText(status,'This seat is occupied. Please choose another.');return}seated=closeSeat;seatChoices.set(currentRoom.n,seated.id);updateSeat();picker.value=seated.id;path=[];velocity={x:0,y:0};motion={kind:'sit',elapsed:0,duration:reduced ? .01 : .65,from:{...visitor},to:{x:seated.x+.33,y:seated.y+.22}};seenSetText(status,`Taking seat ${seated.id}…`);sit.disabled=true;}
function planSeat(id){const seat=chairById.get(id);if(!seat)return;if(hostSeat(seat)){seenSetText(status,'This seat is occupied. Please choose another.');return}
// Staying in the same seat needs no animation; neighbours share one short aisle transfer.
if(seated?.id===seat.id&&!motion){world.focus({preventScroll:true});return}
if(seated&&!motion&&seat.y===seated.y&&Math.abs(seat.x-seated.x)<1.6){
 const fromAisle={x:seated.x+.33,y:seated.y-.33},toAisle={x:seat.x+.33,y:seat.y-.33};
 if(navigation.clear(fromAisle,toAisle)){
  motion={kind:'transfer',elapsed:0,duration:reduced ? .01 : .75+Math.abs(seat.x-seated.x)*.24,from:{...visitor},fromAisle,toAisle,to:{x:seat.x+.33,y:seat.y+.22},seat};
  afterStand=null;pendingSeat=null;path=[];velocity={x:0,y:0};sit.disabled=true;
  seenSetText(status,`Moving to seat ${seat.id}…`);world.focus({preventScroll:true});return;
 }
}
requestAction(()=>{const y=seat.y-.33;autoSpeed=0;path=navigation.route(visitor,{x:seat.x+.33,y});pendingSeat=seat;});world.focus({preventScroll:true})}
picker.addEventListener('change',()=>planSeat(picker.value));sit.onclick=()=>{sitHere();world.focus({preventScroll:true})};
function loop(now){const dt=Math.min((now-previous)/1000,.04);previous=now;if(active()){
const wasAirborne=roomJump.height>0;roomJump.step(dt);
if(wasAirborne&&roomJump.height===0&&occupied(visitor.x,visitor.y)){
 const landing=navigation.landing(visitor);
 if(landing)visitor=landing;
}

let dx=0,dy=0;for(const [key,vx,vy]of [['ArrowUp',-1,-1],['w',-1,-1],['ArrowDown',1,1],['s',1,1],['ArrowLeft',-1,1],['a',-1,1],['ArrowRight',1,-1],['d',1,-1]])if(held.has(key)){dx+=vx;dy+=vy}
const manual=!!(dx||dy);if(manual){if(seated&&!motion){afterStand=null;stand()}path=[];pendingSeat=null;}
if(motion?.kind==='transfer'){
 const move=motion;move.elapsed+=dt;const t=Math.min(1,move.elapsed/move.duration);
 let start,end,progress;
 if(t<.25){start=move.from;end=move.fromAisle;progress=ease(t/.25);posture=1-progress;gait=0}
 else if(t<.75){start=move.fromAisle;end=move.toAisle;progress=ease((t-.25)/.5);posture=0;gait=Math.sin((t-.25)/.5*Math.PI);turnToward(Math.atan2(end.y-start.y,end.x-start.x),dt)}
 else{start=move.toAisle;end=move.to;progress=ease((t-.75)/.25);posture=progress;gait=0;turnToward(-Math.PI/2,dt)}
 const x=start.x+(end.x-start.x)*progress,y=start.y+(end.y-start.y)*progress;
 tick+=Math.hypot(x-visitor.x,y-visitor.y)*12;visitor={x,y};isWalking=t>=.25&&t<.75;
 if(t===1){seated=move.seat;motion=null;posture=1;gait=0;sit.disabled=false;sit.textContent='STAND UP';seatChoices.set(currentRoom.n,seated.id);updateSeat();picker.value=seated.id;seenSetText(status,`Seated at ${seated.id}. Enter or Stand up to explore.`);if(afterStand||manual)stand()}
}
else if(motion){gait*=Math.exp(-dt*15);motion.elapsed+=dt;const t=Math.min(1,motion.elapsed/motion.duration),k=ease(t);visitor.x=motion.from.x+(motion.to.x-motion.from.x)*k;visitor.y=motion.from.y+(motion.to.y-motion.from.y)*k;posture=motion.kind==='sit'?k:1-k;turnToward(-Math.PI/2,dt);isWalking=false;if(t===1){const kind=motion.kind;motion=null;sit.disabled=false;if(kind==='sit'){posture=1;seenSetText(status,`Seated at ${seated.id}. Enter or Stand up to explore.`);sit.textContent='STAND UP';if(afterStand||manual)stand()}else{posture=0;seated=null;sit.textContent='TAKE A SEAT';seenSetText(status,'Back in the aisle. Keep exploring.');const action=afterStand;afterStand=null;action?.()}}}
else if(!seated){
 const old={...visitor};
 if(!manual){
  velocity={x:0,y:0};
  if(path.length){
   let remaining=0,previous=visitor;for(const next of path){remaining+=Math.hypot(next.x-previous.x,next.y-previous.y);previous=next}
   const desired=Math.min(3.5,Math.sqrt(2*10*remaining));autoSpeed=Math.min(desired,autoSpeed+12*dt);
   visitor=navigation.advance(visitor,path,autoSpeed*dt);
   if(!path.length){autoSpeed=0;if(pendingSeat){closeSeat=pendingSeat;pendingSeat=null;sitHere()}}
  }else autoSpeed=0;
 }else{
  autoSpeed=0;const len=Math.hypot(dx,dy),factor=1-Math.exp(-dt*12);
  velocity.x+=(dx/len*3.5-velocity.x)*factor;velocity.y+=(dy/len*3.5-velocity.y)*factor;
  const nx=Math.max(.4,Math.min(11.6,visitor.x+velocity.x*dt)),ny=Math.max(1.4,Math.min(11.6,visitor.y+velocity.y*dt));
  // Feet must clear the chair back before movement may cross its footprint.
  const aboveSeats=roomJump.height>.98;
  if(aboveSeats||!occupied(nx,ny)){visitor.x=nx;visitor.y=ny}else{if(!occupied(nx,visitor.y))visitor.x=nx;else velocity.x=0;if(!occupied(visitor.x,ny))visitor.y=ny;else velocity.y=0}
 }
 const distance=Math.hypot(visitor.x-old.x,visitor.y-old.y);isWalking=distance>.0005;
 gait+=(Math.min(1,distance/Math.max(dt,.001)/2.8)-gait)*(1-Math.exp(-dt*12));
 if(isWalking){tick+=distance*12;turnToward(Math.atan2(visitor.y-old.y,visitor.x-old.x),dt)}
}
else{gait=0;isWalking=false;turnToward(-Math.PI/2,dt)}
closeSeat=seated||nearest();sit.hidden=!closeSeat&&!motion;if(!motion&&!seated&&closeSeat)seenSetText(status,`Seat ${closeSeat.id} nearby. Enter to sit.`);else if(!motion&&!seated&&!pendingSeat)seenSetText(status,'Walk the aisles or choose a seat.');
if(!seated&&!motion&&!exiting&&visitor.x>5.3&&visitor.x<6.7&&visitor.y>11.34){leaveThroughExit();requestAnimationFrame(loop);return}
seenSetData(world,'jumpPhase',roomJump.active?'active':'idle');seenSetData(world,'jumpCrouch',roomJump.crouch.toFixed(3));seenSetData(world,'jumpTuck',roomJump.tuck.toFixed(3));seenSetData(world,'jump',roomJump.height.toFixed(3));seenSetData(world,'motion',motion?.kind||(seated?'seated':isWalking?'walking':'idle'));seenSetData(world,'position',`${visitor.x.toFixed(3)},${visitor.y.toFixed(3)}`);
SeenHub.publish({scene:'screen-'+currentRoom.n,x:visitor.x,y:visitor.y,heading,posture,jump:roomJump.height,moving:isWalking});
const paintKey=[SeenHub.revision,roomRevision,seenFontRevision,roomJump.height.toFixed(3),roomJump.crouch.toFixed(3),roomJump.tuck.toFixed(3),currentRoom?.n,seatChoices.get(currentRoom?.n),world.dataset.position,heading.toFixed(3),gait.toFixed(3),posture.toFixed(3),tick.toFixed(3),path.at(-1)?.x,path.at(-1)?.y].join('|');
if(paintKey!==roomPaintKey){render();roomPaintKey=paintKey}}
requestAnimationFrame(loop)}requestAnimationFrame(loop);
// Test actual projected chair faces instead of a large rectangle covering nearby aisles.
function insideFace(px,py,vertices){let inside=false;for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){const a=vertices[i],b=vertices[j];if((a.y>py)!==(b.y>py)&&px<(b.x-a.x)*(py-a.y)/(b.y-a.y)+a.x)inside=!inside}return inside}
function chairHit(seat,px,py){
 for(const [x,y,z,dx,dy,dz]of [[seat.x+.03,seat.y+.46,.45,.59,.12,.56],[seat.x,seat.y,.28,.65,.54,.18],...[-.025,.60].map(side=>[seat.x+side,seat.y+.09,.50,.075,.32,.065])]){
  const vertices=[[x,y,z+dz],[x+dx,y,z+dz],[x+dx,y+dy,z+dz],[x,y+dy,z+dz],[x,y+dy,z],[x+dx,y+dy,z],[x+dx,y,z]].map(v=>point(...v));
  // Each visible cube face is a convex quadrilateral.
  for(const face of [[0,1,2,3],[3,2,5,4],[1,6,5,2]])if(insideFace(px,py,face.map(i=>vertices[i])))return true;
 }return false;
}
world.addEventListener('pointerdown',e=>{
 if(!active())return;const r=world.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;
 const sx=(px-cx)/unit/.86,sy=(py-cy)/unit/.43;
 const floor={x:Math.max(.5,Math.min(11.5,(sx+sy)/2)),y:Math.max(1.5,Math.min(11.5,(sy-sx)/2))};
 const nearbyFloor=!seated&&!motion&&Math.hypot(floor.x-visitor.x,floor.y-visitor.y)<.85&&!occupied(floor.x,floor.y)&&navigation.clear(visitor,floor);
 if(!nearbyFloor){
  const exitBottom=point(6,11.78,0),exitTop=point(6,11.78,2.2);
  if(Math.abs(px-exitBottom.x)<unit*.85&&py>exitTop.y-unit*.35&&py<exitBottom.y+unit*.5){walkToExit();return}
  const {a,b,c}=screenPoints(),u=(px-a.x)/(b.x-a.x),v=(py-a.y-u*(b.y-a.y))/(c.y-a.y);
  if(u>=0&&u<=1&&v>=0&&v<=1){document.querySelector('#start-program').click();return}
  const hit=chairHitOrder.find(seat=>chairHit(seat,px,py));if(hit){planSeat(hit.id);return}
 }
 requestAction(()=>{pendingSeat=null;const target=navigation.destination(visitor,floor);autoSpeed=0;path=target?navigation.route(visitor,target):[];velocity={x:0,y:0}});world.focus({preventScroll:true});
});
addEventListener('keydown',e=>{if(!active()||seenTypingTarget(e.target))return;const key=seenNavigationKey(e);if(e.code==='Space'||e.key===' '){e.preventDefault();if(!e.repeat)jump();return}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(key)){e.preventDefault();held.add(key);world.focus({preventScroll:true})}if(key==='Enter'&&document.activeElement===world){e.preventDefault();sitHere()}});addEventListener('keyup',e=>held.delete(seenNavigationKey(e)));addEventListener('blur',()=>held.clear());dialog.addEventListener('close',()=>held.clear());document.querySelector('#start-program').addEventListener('click',()=>{held.clear();velocity={x:0,y:0}});
const controls={up:'ArrowUp',left:'ArrowLeft',down:'ArrowDown',right:'ArrowRight'};document.querySelectorAll('[data-room-dir]').forEach(button=>{button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);held.add(controls[button.dataset.roomDir])});for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>held.delete(controls[button.dataset.roomDir]))});
document.addEventListener('seen-room-enter',()=>{held.clear();roomJump.reset();autoSpeed=0;exiting=false;visitor={x:6,y:10.65};path=[];seated=null;pendingSeat=null;closeSeat=null;motion=null;afterStand=null;posture=0;heading=-Math.PI/2;velocity={x:0,y:0};gait=0;sit.disabled=false;sit.textContent='TAKE A SEAT';picker.value=seatChoices.get(currentRoom.n)||'';size();world.focus({preventScroll:true});render()});
createSeenTouchGamepad({scene:dialog,keys:held,active,jump});
})();
