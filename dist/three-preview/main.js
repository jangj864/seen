import * as THREE from 'three';
import {OrbitControls} from '../vendor/three-0.187.0/OrbitControls.js';
import {createCinema} from './world.js';
import {createAvatar} from './avatar.js';
import {contactShadow} from './kit.js';

const canvas=document.querySelector('#scene'),stage=document.querySelector('#stage'),loading=document.querySelector('#loading');
const dialog=document.querySelector('#place-dialog'),tag=document.querySelector('#visitor-tag'),hoverLabel=document.querySelector('#hover-label');
const small=matchMedia('(max-width:700px)').matches,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'})}
catch{loading.innerHTML='이 기기에서는 3D 화면을 열 수 없어요. <a href="./">영화관으로 돌아가기 ↗</a>';throw new Error('3D context unavailable')}
renderer.setPixelRatio(Math.min(devicePixelRatio,small?1.5:1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.14;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.Fog('#e5e3d3',75,140);
const camera=new THREE.PerspectiveCamera(38,1,.1,150);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=false;
controls.minDistance=3.4;controls.maxDistance=90;controls.minPolarAngle=.35;controls.maxPolarAngle=1.35;controls.minAzimuthAngle=-.7;controls.maxAzimuthAngle=1.45;
controls.target.set(0,1.4,0);
scene.add(new THREE.HemisphereLight('#fff8e5','#859278',2.25));
const sun=new THREE.DirectionalLight('#fff0d4',3.1);sun.position.set(-9,18,12);sun.castShadow=true;
sun.shadow.mapSize.set(small?1024:2048,small?1024:2048);Object.assign(sun.shadow.camera,{left:-15,right:15,top:13,bottom:-13,near:1,far:50});sun.shadow.bias=-.00015;sun.shadow.normalBias=.035;sun.shadow.radius=4;scene.add(sun);
const fill=new THREE.DirectionalLight('#d4e3d7',.9);fill.position.set(10,7,-7);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshStandardMaterial({color:'#dce0ca',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.57;ground.receiveShadow=true;scene.add(ground);
await document.fonts.load('600 24px Pretendard').catch(()=>{});
const world=createCinema();scene.add(world.group);
const variants=[
 {shirt:'#c77858',skin:'#e9bb94',hair:'#43392f',style:'swoop',pants:'#e7dac0',name:'YOU'},
 {shirt:'#6c866e',skin:'#c98e67',hair:'#332d29',style:'crop',pants:'#e4cfaa',name:'YOU'},
 {shirt:'#a29bb7',skin:'#edc2a5',hair:'#6c4936',style:'bob',pants:'#dddcc7',name:'YOU'}
].map(options=>createAvatar(options));
let avatarIndex=0,avatar=variants[0];
const player={x:.4,y:2.0},keys=new Set(),velocity=new THREE.Vector2(),route=[];
let heading=.4,jumpTime=0,jumping=false,pending=null,view=small?'avatar':'lobby',cameraTween=null,last=performance.now(),elapsed=0;
const avatarShadow=contactShadow(.48,.3,.42);scene.add(avatarShadow,avatar.group);
const npcDefinitions=[
 {name:'Mia',x:-4.8,z:-2.12,shirt:'#a95f4d',skin:'#f1c6a1',hair:'#4a3b30',style:'bob',heading:.15},
 {name:'Leo',x:5.45,z:-1.65,shirt:'#6d846e',skin:'#c2926b',hair:'#352f2b',style:'crop',heading:.1},
 {name:'Sam',x:1.8,z:1.0,shirt:'#b4a077',skin:'#e6ba92',hair:'#795c3b',style:'swoop',heading:-.7}
];
const npcs=npcDefinitions.map(def=>{const model=createAvatar(def);model.group.position.set(def.x,.055,def.z);const shadow=contactShadow(.45,.28,.36);shadow.position.set(def.x,.06,def.z);scene.add(model.group,shadow);return{...def,model}});
// The large forms cast the silhouette; tiny face details do not need separate shadow draws.
for(const model of [...variants,...npcs.map(n=>n.model)])model.group.traverse(object=>{if(object.isMesh){object.geometry.computeBoundingSphere();if(object.geometry.boundingSphere.radius*Math.max(...object.scale.toArray())<.18)object.castShadow=false}});
const obstacles=[...world.colliders.map(r=>({left:r.left-.27,right:r.right+.27,top:r.top-.27,bottom:r.bottom+.27})),...npcs.map(n=>({left:n.x-.43,right:n.x+.43,top:n.z-.43,bottom:n.z+.43}))];
const navigation=window.createSeenRoomNavigation([],obstacles);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),-.06),intersection=new THREE.Vector3();
const interactive=[...world.doors,...world.pointsOfInterest];
for(const point of interactive)point.group.userData.place=point;
for(const npc of npcs)npc.model.group.userData.person=npc;
const targets=[...interactive.map(item=>item.group),...npcs.map(npc=>npc.model.group)];
const marker=new THREE.Mesh(new THREE.RingGeometry(.15,.2,40),new THREE.MeshBasicMaterial({color:'#b97659',transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.position.y=.07;marker.visible=false;scene.add(marker);

function goTo(x,z,place=null){
 const requested={x:THREE.MathUtils.clamp(x,-7.95,7.95),y:THREE.MathUtils.clamp(z,-4.1,4.45)},end=navigation.destination(player,requested);
 const next=end?navigation.route(player,end):[];if(!next.length)return false;
 route.splice(0,route.length,...next);velocity.set(0,0);keys.clear();pending=place;marker.position.set(end.x,.07,end.y);marker.visible=true;canvas.focus({preventScroll:true});return true;
}
const storyIds=['table','ladybird','yang','minari'],storyTitles=['식탁의 한 자리','우리 사이의 거리','우리가 간직하는 것들','아직 만들어지는 집'];
function openPlace(point){
 keys.clear();velocity.set(0,0);route.length=0;pending=null;marker.visible=false;
 const screen=world.doors.indexOf(point),data=screen>=0?{title:storyTitles[screen],kicker:`상영관 0${screen+1}`,description:'좋은 이야기는 영화가 끝난 뒤에도 이어져요. 자리에 앉아 이 상영관의 기사를 읽어보세요.',href:`./#read/${storyIds[screen]}`,action:'기사 읽기 ↗'}:{
  tickets:{title:'어서 오세요, SEEN입니다.',description:'네 개의 상영관에서 네 가지 이야기가 기다리고 있어요. 마음이 가는 문을 골라보세요.',href:'./',action:'영화관 입장 ↗'},
  arcade:{title:'잠깐, 한 게임 어때요?',description:'영화 속 얼굴과 장면, 감독에 관한 작은 퀴즈를 준비했어요.',href:'./',action:'영화관에서 게임하기 ↗'},
  popcorn:{title:'영화 보기 전, 작은 즐거움.',description:'갓 만든 팝콘과 좋아하는 음료. 영화가 시작되기 전의 시간을 천천히 즐겨보세요.',href:'./',action:'영화관 둘러보기 ↗'},
  upcoming:{title:'다음에 만나게 될 영화들.',description:'새로운 이야기는 언제나 준비 중이에요. SEEN에서 개봉 예정 영화를 만나보세요.',href:'./magazine.html#watchlist',action:'영화 목록 보기 ↗'},
  person:{title:`${point.name}의 인사`,description:'영화는 함께 보면 더 좋죠. 반가워요! 어떤 이야기가 가장 궁금하세요?',href:'./',action:'SEEN에서 이야기 나누기 ↗'}
 }[point.person?'person':point.id];
 document.querySelector('#place-kicker').textContent=data.kicker||'SEEN CINEMA';document.querySelector('#place-title').textContent=data.title;document.querySelector('#place-description').textContent=data.description;
 const link=document.querySelector('#place-link');link.href=data.href;link.textContent=data.action;dialog.showModal();
}
dialog.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{keys.clear();canvas.focus({preventScroll:true})});
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close()}});
function setView(next,instant=false){
 view=next;document.body.dataset.cameraView=view;
 controls.minAzimuthAngle=view==='avatar'?-Infinity:-.7;controls.maxAzimuthAngle=view==='avatar'?Infinity:1.45;
 document.querySelectorAll('.views [data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
 const aspect=stage.clientWidth/stage.clientHeight;
 const distance=Math.max(25,32/aspect),target=view==='avatar'?new THREE.Vector3(player.x,1.2,player.y):new THREE.Vector3(0,1.65,-.1);
 const position=view==='avatar'?target.clone().add(new THREE.Vector3(2.8,1.25,5.3)):target.clone().add(new THREE.Vector3(.53,.48,.7).normalize().multiplyScalar(distance));
 if(instant||reduced){camera.position.copy(position);controls.target.copy(target);cameraTween=null;controls.update()}
 else cameraTween={from:camera.position.clone(),to:position,fromTarget:controls.target.clone(),target,t:0};
}
document.querySelectorAll('.views [data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));document.querySelector('#reset-camera').onclick=()=>setView('lobby');
controls.addEventListener('start',()=>{cameraTween=null});
document.querySelectorAll('[data-avatar]').forEach(button=>button.onclick=()=>{
 scene.remove(avatar.group);avatarIndex=+button.dataset.avatar;avatar=variants[avatarIndex];scene.add(avatar.group);
 document.querySelectorAll('[data-avatar]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button))});
});
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();setView(view,true)}
new ResizeObserver(resize).observe(stage);resize();
function ray(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera)}
function personPoint(npc){return{person:true,name:npc.name,position:npc.model.group.position,approach:new THREE.Vector3(npc.x,0,npc.z+1.1)}}
function interactNearby(){
 let nearest=null,distance=1.35;
 for(const point of [...interactive,...npcs.map(personPoint)]){const next=Math.hypot(player.x-point.approach.x,player.y-point.approach.z);if(next<distance){nearest=point;distance=next}}
 if(nearest)openPlace(nearest);
}
function hitPlace(event){
 ray(event);for(const hit of raycaster.intersectObjects(targets,true)){let object=hit.object;while(object){if(object.userData.place)return object.userData.place;if(object.userData.person)return personPoint(object.userData.person);object=object.parent}}
 return null;
}
let down=null;
canvas.addEventListener('pointerdown',event=>{if(event.isPrimary)down={x:event.clientX,y:event.clientY,t:performance.now()}});
canvas.addEventListener('pointerup',event=>{
 if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>7||performance.now()-down.t>650){down=null;return}down=null;
 if(dialog.open)return;const point=hitPlace(event);
 if(point){if(Math.hypot(player.x-point.approach.x,player.y-point.approach.z)<.65)openPlace(point);else goTo(point.approach.x,point.approach.z,point);return}
 ray(event);if(raycaster.ray.intersectPlane(floor,intersection))goTo(intersection.x,intersection.z);
});
canvas.addEventListener('pointercancel',()=>down=null);
canvas.addEventListener('pointermove',event=>{
 if(down||event.pointerType==='touch')return;const point=hitPlace(event);canvas.style.cursor=point?'pointer':'grab';
 if(!point){hoverLabel.hidden=true;return}const pos=point.position.clone();pos.y+=point.person?2.5:1.3;const projected=pos.project(camera);hoverLabel.style.left=(projected.x*.5+.5)*stage.clientWidth+'px';hoverLabel.style.top=(-projected.y*.5+.5)*stage.clientHeight+'px';hoverLabel.textContent=point.person?point.name:world.doors.includes(point)?`상영관 0${world.doors.indexOf(point)+1}`:({tickets:'티켓 부스',arcade:'게임방',popcorn:'팝콘',upcoming:'개봉 예정 영화'})[point.id];hoverLabel.hidden=false;
});canvas.addEventListener('pointerleave',()=>hoverLabel.hidden=true);
function jump(){if(!jumping){jumping=true;jumpTime=0}}
const keyMap={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
addEventListener('keydown',event=>{if(dialog.open||event.target.closest('button,a,input,select,textarea'))return;if(keyMap[event.code]){event.preventDefault();keys.add(keyMap[event.code]);route.length=0;pending=null;marker.visible=false}if(event.code==='Space'){event.preventDefault();if(!event.repeat)jump()}if(event.code==='Enter'){event.preventDefault();if(!event.repeat)interactNearby()}});
addEventListener('keyup',event=>keys.delete(keyMap[event.code]));addEventListener('blur',()=>{keys.clear();down=null});
document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear()});
document.querySelectorAll('[data-move]').forEach(button=>{button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys.add(button.dataset.move);route.length=0;pending=null;marker.visible=false});for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>keys.delete(button.dataset.move))});document.querySelector('#jump').onclick=jump;
function update(time){
 if(small&&time-last<1000/30*.95)return;
 const dt=Math.min((time-last)/1000,.05);last=time;if(document.hidden)return;elapsed+=dt;
 const before={...player};let dx=0,dz=0;
 if(!dialog.open){
  const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new THREE.Vector3(-forward.z,0,forward.x);
  if(keys.has('up')){dx+=forward.x;dz+=forward.z}if(keys.has('down')){dx-=forward.x;dz-=forward.z}if(keys.has('right')){dx+=right.x;dz+=right.z}if(keys.has('left')){dx-=right.x;dz-=right.z}
  const length=Math.hypot(dx,dz),ease=1-Math.exp(-12*dt);velocity.lerp(new THREE.Vector2(length?dx/length*2.6:0,length?dz/length*2.6:0),ease);
  if(length||velocity.length()>.03){
   route.length=0;const nx=THREE.MathUtils.clamp(player.x+velocity.x*dt,-7.95,7.95),ny=THREE.MathUtils.clamp(player.y+velocity.y*dt,-4.1,4.45);
   if(!navigation.blocked(nx,ny)){player.x=nx;player.y=ny}else{if(!navigation.blocked(nx,player.y))player.x=nx;if(!navigation.blocked(player.x,ny))player.y=ny}
  }else if(route.length){const next=navigation.advance(player,route,2.6*dt);player.x=next.x;player.y=next.y;if(!route.length){marker.visible=false;if(pending){const place=pending;pending=null;openPlace(place)}}}
 }
 const speed=Math.hypot(player.x-before.x,player.y-before.y)/Math.max(dt,.001),walking=speed>.05;
 if(walking)heading=Math.atan2(player.x-before.x,player.y-before.y);
 let jumpHeight=0;if(jumping){jumpTime+=dt;jumpHeight=Math.max(0,3.7*jumpTime-5.5*jumpTime*jumpTime);if(jumpTime>3.7/5.5)jumping=false}
 avatar.group.position.set(player.x,.055,player.y);avatar.update(elapsed,{walking,speed:speed/2.6,heading,jump:jumpHeight});avatarShadow.position.set(player.x,.06,player.y);avatarShadow.material.opacity=.42-jumpHeight*.14;
 for(const npc of npcs){const nearby=Math.hypot(player.x-npc.x,player.y-npc.z)<3;npc.model.update(elapsed,{heading:nearby?Math.atan2(player.x-npc.x,player.y-npc.z):npc.heading,talking:dialog.open&&nearby})}
 if(cameraTween){cameraTween.t=Math.min(1,cameraTween.t+dt/1.05);const t=cameraTween.t,k=t*t*(3-2*t);camera.position.lerpVectors(cameraTween.from,cameraTween.to,k);controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.target,k);if(t===1)cameraTween=null}
 else if(view==='avatar'&&walking){const delta=new THREE.Vector3(player.x-before.x,0,player.y-before.y);controls.target.add(delta);camera.position.add(delta)}
 controls.update();renderer.render(scene,camera);
 const projected=new THREE.Vector3(player.x,2.55+jumpHeight,player.y).project(camera);tag.style.left=(projected.x*.5+.5)*stage.clientWidth+'px';tag.style.top=(-projected.y*.5+.5)*stage.clientHeight+'px';tag.hidden=view==='avatar'||projected.z>1;
 canvas.dataset.position=`${player.x.toFixed(3)},${player.y.toFixed(3)}`;canvas.dataset.motion=walking?'walking':'idle';canvas.dataset.jump=jumpHeight.toFixed(3);
 if(!canvas.dataset.ready){canvas.dataset.ready='true';loading.hidden=true;document.body.dataset.ready='true'}
}
renderer.setAnimationLoop(update);
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();renderer.setAnimationLoop(null);loading.hidden=false;loading.textContent='화면이 잠시 쉬고 있어요. 새로고침하면 다시 들어갈 수 있어요.'});
// The preview can be inspected without attaching public presence or posting data.
window.Seen3DPreview={setView,goTo,project(x,y,z){const point=new THREE.Vector3(x,y,z).project(camera),rect=canvas.getBoundingClientRect();return{x:rect.left+(point.x*.5+.5)*rect.width,y:rect.top+(-point.y*.5+.5)*rect.height}},get state(){return{view,position:{...player},avatar:avatarIndex,ready:!!canvas.dataset.ready,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,characters:npcs.length+1}}};
