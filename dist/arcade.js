'use strict';
(()=>{
 const canvas=document.querySelector('#arcade-world'),ctx=canvas.getContext('2d'),notice=document.querySelector('#arcade-near');
 const machines=[{x:1.5,y:1.3,title:'SEEN QUIZ',mode:'all',color:'#c25c3c',light:'#e9bb68',symbol:'?'},{x:5.2,y:1.3,title:'EYES ONLY',mode:'eyes',color:'#428b7e',light:'#a4d4b2',symbol:'eye'},{x:8.9,y:1.3,title:'FILM CLUB',mode:'films',color:'#b1893e',light:'#efcf82',symbol:'03'}];
 const navigation=createSeenRoomNavigation([],machines.map(m=>({left:m.x-.18,right:m.x+1.78,top:m.y-.18,bottom:m.y+1.55})));
 const held=new Set(),jump=createSeenJump();let visitor={x:6,y:8.1},path=[],pending=null,near=null,width=0,height=0,unit=1,ox=0,oy=0,last=0,phase=0,gait=0,heading=-Math.PI/2,paintKey='',revision=0;
 const active=()=>isSceneOpen('arcade-room')&&!gameRoom.open&&!document.hidden;
 function resize(){width=canvas.clientWidth;height=canvas.clientHeight;if(!width||!height)return;const d=Math.min(devicePixelRatio||1,2);canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);unit=Math.min(width/21,height/16);ox=width/2-unit;oy=height*.32;revision++}
 new ResizeObserver(resize).observe(canvas);
 function p(x,y,z=0){return{x:ox+(x-y)*unit*.86,y:oy+(x+y)*unit*.43-z*unit}}
 function polygon(points,color){ctx.beginPath();points.forEach((v,i)=>{const q=p(...v);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.closePath();ctx.fillStyle=color;ctx.fill()}
 function box(x,y,z,dx,dy,dz,top,front,side){polygon([[x,y,z+dz],[x+dx,y,z+dz],[x+dx,y+dy,z+dz],[x,y+dy,z+dz]],top);polygon([[x,y+dy,z],[x+dx,y+dy,z],[x+dx,y+dy,z+dz],[x,y+dy,z+dz]],front);polygon([[x+dx,y,z],[x+dx,y+dy,z],[x+dx,y+dy,z+dz],[x+dx,y,z+dz]],side)}
 function label(value,x,y,z,size,color){const q=p(x,y,z);ctx.save();ctx.transform(.86,.43,0,1,q.x,q.y);ctx.font=`700 ${unit*size}px "Barlow Condensed",sans-serif`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(value,0,0);ctx.restore()}
 function cabinet(m){
  const x=m.x,y=m.y;polygon([[x-.1,y+.1,.01],[x+1.8,y+.1,.01],[x+1.95,y+1.5,.01],[x-.1,y+1.5,.01]],'#0003');
  box(x+.06,y+.05,0,1.48,1.02,.19,'#26382b','#101e18','#101e18');
  // A shaped side panel wraps the recessed monitor, sloping deck and kick plate.
  const profile=[[0,.19],[1.08,.19],[1.08,.85],[1.38,1.04],[1.38,1.20],[1.04,1.35],[.70,2.28],[1.08,2.43],[1.08,2.77],[0,2.77]];
  polygon(profile.map(([dy,z])=>[x+1.6,y+dy,z]),'#20382d');
  polygon(profile.map(([dy,z])=>[x,y+dy,z]),m.color);
  box(x,y,.19,1.6,1.08,.66,m.color,m.color,'#20382d');
  polygon([[x+1.58,y+.16,.39],[x+1.58,y+.85,.39],[x+1.58,y+.85,.54],[x+1.58,y+.16,.54]],m.color);
  for(let z=.65;z<.99;z+=.085)polygon([[x+1.605,y+.18,z],[x+1.605,y+.52,z],[x+1.605,y+.52,z+.025],[x+1.605,y+.18,z+.025]],'#0f241b');
  // Side moulding follows the cabinet silhouette instead of a rectangular box.
  ctx.beginPath();profile.slice(1,9).forEach(([dy,z],i)=>{const q=p(x+1.605,y+dy,z);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.strokeStyle=m.color;ctx.lineWidth=unit*.055;ctx.lineJoin='round';ctx.stroke();

  const a=p(x+.16,y+.70,2.28),b=p(x+1.44,y+.70,2.28),c=p(x+.16,y+1.04,1.35);ctx.save();ctx.transform((b.x-a.x)/160,(b.y-a.y)/160,(c.x-a.x)/120,(c.y-a.y)/120,a.x,a.y);
  ctx.fillStyle='#101916';ctx.beginPath();ctx.roundRect(-9,-9,178,138,9);ctx.fill();ctx.strokeStyle='#567461';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.roundRect(0,0,160,120,7);ctx.clip();const glow=ctx.createRadialGradient(80,55,0,80,55,100);glow.addColorStop(0,m.mode==='eyes'?'#396a56':'#4b5539');glow.addColorStop(1,'#15291f');ctx.fillStyle=glow;ctx.fillRect(0,0,160,120);
  ctx.strokeStyle=m.light;ctx.lineWidth=2;if(m.symbol==='eye'){ctx.beginPath();ctx.moveTo(31,55);ctx.quadraticCurveTo(80,6,129,55);ctx.quadraticCurveTo(80,104,31,55);ctx.stroke();ctx.beginPath();ctx.arc(80,55,16,0,Math.PI*2);ctx.stroke()}else{ctx.fillStyle=m.light;ctx.font='700 58px "Barlow Condensed",sans-serif';ctx.textAlign='center';ctx.fillText(m.symbol,80,76)}
  ctx.fillStyle='#d9f4be0b';for(let line=3;line<120;line+=5)ctx.fillRect(0,line,160,1);ctx.fillStyle='#ffffff0c';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(110,0);ctx.lineTo(40,120);ctx.lineTo(0,120);ctx.fill();ctx.fillStyle=m.light;ctx.font='8px "DM Sans",sans-serif';ctx.textAlign='center';ctx.fillText('PRESS START',80,106);ctx.restore();
  box(x-.04,y,2.43,1.68,1.1,.34,m.light,m.color,'#284333');polygon([[x+.08,y+1.105,2.48],[x+1.52,y+1.105,2.48],[x+1.52,y+1.105,2.71],[x+.08,y+1.105,2.71]],'#23382d');label(m.title,x+.8,y+1.115,2.53,.21,m.light);
  // Sloped control deck with a recessed joystick and three individual buttons.
  polygon([[x-.04,y+.96,1.35],[x+1.64,y+.96,1.35],[x+1.64,y+1.40,1.14],[x-.04,y+1.40,1.14]],m.light);
  polygon([[x-.04,y+1.40,1.14],[x+1.64,y+1.40,1.14],[x+1.64,y+1.40,1.03],[x-.04,y+1.40,1.03]],'#182b23');
  const base=p(x+.37,y+1.19,1.24);ctx.fillStyle='#1c3026';ctx.beginPath();ctx.ellipse(base.x,base.y,unit*.13,unit*.055,0,0,Math.PI*2);ctx.fill();
  const shaft=p(x+.37,y+1.19,1.47);ctx.strokeStyle='#d6c79e';ctx.lineWidth=unit*.045;ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(shaft.x,shaft.y);ctx.stroke();ctx.fillStyle='#c64d38';ctx.beginPath();ctx.arc(shaft.x,shaft.y,unit*.085,0,Math.PI*2);ctx.fill();
  for(const [dx,dy,color]of [[.94,1.15,'#b84533'],[1.18,1.15,'#ead6a0'],[1.07,1.33,'#66855b']]){const q=p(x+dx,y+dy,1.26-(dy-1.15)*.48);ctx.fillStyle='#17291f';ctx.beginPath();ctx.ellipse(q.x,q.y+unit*.018,unit*.085,unit*.045,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(q.x,q.y,unit*.075,unit*.038,0,0,Math.PI*2);ctx.fill()}
  box(x+.54,y+1.085,.34,.52,.025,.36,'#73806a','#16291f','#16291f');box(x+.66,y+1.12,.52,.27,.012,.035,'#dcc69c','#dcc69c','#dcc69c');box(x+.72,y+1.12,.38,.15,.012,.07,'#394f3f','#394f3f','#394f3f');label('SEEN',x+.8,y+1.12,.76,.12,'#e7d3a0');

 }
 function draw(){
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#263a2e';ctx.fillRect(0,0,width,height);
  box(0,0,-.15,12,10,.15,'#b0aa83','#5e6b4c','#48583f');
  for(let x=0;x<12;x++)for(let y=0;y<10;y++)polygon([[x,y,.004],[x+1,y,.004],[x+1,y+1,.004],[x,y+1,.004]],(x+y)%2?'#718064':'#899174');
  box(-.1,-.15,0,12.2,.25,4.0,'#cfbc90','#344f3c','#203527');box(-.1,0,0,.18,7,1.2,'#c7b58d','#53664b','#344932');
  for(let x=.4;x<12;x+=.6)box(x,.12,.3,.025,.035,3.35,'#667c54','#2d4734','#2d4734');label('S E E N   A R C A D E',6,.16,3.45,.42,'#dec48d');label('NO COINS NEEDED. JUST CURIOSITY.',6,.16,2.98,.15,'#a5b18c');
  polygon([[5.2,8.9,.02],[6.8,8.9,.02],[6.8,10,.02],[5.2,10,.02]],'#c5b47e');
  if(path.length){const t=path.at(-1),q=p(t.x,t.y,.02);ctx.fillStyle='#f6df9b88';ctx.beginPath();ctx.ellipse(q.x,q.y,.2*unit,.08*unit,0,0,Math.PI*2);ctx.fill()}
  const objects=machines.map(m=>({depth:m.x+m.y+1,draw:()=>cabinet(m)}));objects.push({depth:visitor.x+visitor.y,draw:()=>drawSeenCharacter({ctx,unit,project:p,x:visitor.x,y:visitor.y,heading,gait:reduced?0:gait,phase,jump:jump.height,jumpCrouch:jump.crouch,jumpTuck:jump.tuck,jumping:jump.active})});objects.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
  for(const x of [5.2,6.65])box(x,9.75,0,.12,.12,1.6,'#d4c49b','#aa9d75','#8c8668');box(5.2,9.75,1.6,1.57,.12,.32,'#d5bc89','#3c593b','#2d4230');label('EXIT',6,9.90,1.69,.23,'#f3dfac');
 }
 function approach(m){return{x:m.x+.8,y:m.y+1.95}}
 function walkToMachine(i){held.clear();const m=machines[i];pending=m;path=navigation.route(visitor,approach(m));canvas.focus({preventScroll:true})}
 document.querySelectorAll('[data-arcade-machine]').forEach(button=>button.onclick=()=>walkToMachine(+button.dataset.arcadeMachine));
 function turn(angle,dt){heading+=Math.atan2(Math.sin(angle-heading),Math.cos(angle-heading))*(1-Math.exp(-12*dt))}
 function frame(t){const dt=Math.min((t-last)/1000,.04);last=t;if(active()){
  jump.step(dt);let dx=0,dy=0;if(held.has('ArrowUp')||held.has('w')){dx--;dy--}if(held.has('ArrowDown')||held.has('s')){dx++;dy++}if(held.has('ArrowLeft')||held.has('a')){dx--;dy++}if(held.has('ArrowRight')||held.has('d')){dx++;dy--}
  const before={...visitor},length=Math.hypot(dx,dy);if(length){path=[];pending=null;const x=Math.max(.6,Math.min(11.4,visitor.x+dx/length*3.5*dt)),y=Math.max(.7,Math.min(9.6,visitor.y+dy/length*3.5*dt));if(!navigation.blocked(x,y))visitor={x,y}}
  else if(path.length){visitor=navigation.advance(visitor,path,3.5*dt);if(!path.length&&pending){const m=pending;pending=null;openQuiz(m.mode)}}
  const moved=Math.hypot(visitor.x-before.x,visitor.y-before.y);gait+=(Math.min(1,moved/Math.max(dt,.001)/2.8)-gait)*(1-Math.exp(-12*dt));if(moved>.0005){phase+=moved*12;turn(Math.atan2(visitor.y-before.y,visitor.x-before.x),dt)}
  near=machines.find(m=>{const a=approach(m);return Math.hypot(visitor.x-a.x,visitor.y-a.y)<1})||null;seenSetText(notice,near?`${near.title} · Enter to play`:'Walk up to a machine.');
  seenSetData(canvas,'position',`${visitor.x.toFixed(3)},${visitor.y.toFixed(3)}`);
  if(visitor.x>5.3&&visitor.x<6.7&&visitor.y>9.15){leaveArcade();requestAnimationFrame(frame);return}
  const key=[revision,seenFontRevision,canvas.dataset.position,heading.toFixed(3),gait.toFixed(3),phase.toFixed(3),jump.height.toFixed(3),jump.crouch.toFixed(3),jump.tuck.toFixed(3),path.at(-1)?.x,path.at(-1)?.y].join('|');if(key!==paintKey){draw();paintKey=key}
 }requestAnimationFrame(frame)}requestAnimationFrame(frame);
 canvas.addEventListener('pointerdown',e=>{if(!active())return;const r=canvas.getBoundingClientRect(),px=e.clientX-r.x,py=e.clientY-r.y;for(const m of [...machines].reverse()){const a=p(m.x,m.y+1.16,2.85),b=p(m.x+1.6,m.y+1.16,2.85),c=p(m.x,m.y+1.16,0),u=(px-a.x)/(b.x-a.x),v=(py-a.y-u*(b.y-a.y))/(c.y-a.y);if(u>=0&&u<=1&&v>=0&&v<=1){walkToMachine(machines.indexOf(m));return}}const exit=p(6,9.9,1.1);if(Math.abs(px-exit.x)<unit*.9&&Math.abs(py-exit.y)<unit){pending=null;path=navigation.route(visitor,{x:6,y:9.5});return}const sx=(px-ox)/unit/.86,sy=(py-oy)/unit/.43,target=navigation.destination(visitor,{x:Math.max(.6,Math.min(11.4,(sx+sy)/2)),y:Math.max(.7,Math.min(9.6,(sy-sx)/2))});held.clear();pending=null;path=target?navigation.route(visitor,target):[];canvas.focus({preventScroll:true})});
 addEventListener('keydown',e=>{if(!active()||seenTypingTarget(e.target))return;const key=seenNavigationKey(e);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(key)){e.preventDefault();held.add(key);canvas.focus({preventScroll:true})}if(key==='Enter'&&document.activeElement===canvas&&near){e.preventDefault();openQuiz(near.mode)}if(e.code==='Space'){e.preventDefault();if(!e.repeat)jump.start()}});addEventListener('keyup',e=>held.delete(seenNavigationKey(e)));addEventListener('blur',()=>held.clear());document.addEventListener('seen-quiz-open',()=>{held.clear();path=[];pending=null});arcadeRoom.addEventListener('close',()=>{if(!isSceneOpen('arcade-room'))held.clear()});document.addEventListener('seen-arcade-enter',()=>{visitor={x:6,y:8.1};held.clear();path=[];pending=null;near=null;jump.reset();gait=0;resize();canvas.focus({preventScroll:true});draw()});
})();
