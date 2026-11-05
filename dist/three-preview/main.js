import * as THREE from 'three';
import {OrbitControls} from '../vendor/three-0.187.0/OrbitControls.js';
import {createCinema} from './world.js?v=rooms1';
import {createScreeningRoom,createArcadeRoom} from './interiors.js?v=rooms1';
import {createAvatar} from './avatar.js?v=rooms1';
import {contactShadow} from './kit.js?v=rooms1';
import {createActivities} from './activities.js?v=rooms1';

const $=selector=>document.querySelector(selector),canvas=$('#scene'),stage=$('#stage'),loading=$('#loading'),dialog=$('#place-dialog'),hoverLabel=$('#hover-label'),tag=$('#visitor-tag');
const small=matchMedia('(max-width:700px)').matches,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const programs=['table','ladybird','yang','minari'].map((id,index)=>({id,index,number:String(index+1).padStart(2,'0'),article:screeningArticles[id]}));
const keys=new Set(),velocity=new THREE.Vector2(),route=[],player={x:.4,y:2},worlds=new Map();
let nickname='';try{nickname=localStorage.getItem('seen-name')||''}catch{}
if([...nickname].length<2||[...nickname].length>20||/[\u0000-\u001f\u007f<>]/.test(nickname))nickname='';
let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'})}catch{loading.innerHTML='3D 화면을 열 수 없어요. <a href="./">영화관으로 돌아가기 ↗</a>';throw Error('3D context unavailable')}
renderer.setPixelRatio(Math.min(devicePixelRatio,small?1.5:1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,160),controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=false;controls.minDistance=3.4;controls.maxDistance=100;controls.minPolarAngle=.35;controls.maxPolarAngle=1.35;
const ambient=new THREE.HemisphereLight('#fff8e5','#859278',2.25),sun=new THREE.DirectionalLight('#fff0d4',3.1),fill=new THREE.DirectionalLight('#d4e3d7',.9);scene.add(ambient,sun,fill);
sun.position.set(-9,18,12);sun.castShadow=true;sun.shadow.mapSize.set(small?1024:2048,small?1024:2048);Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:1,far:50});sun.shadow.bias=-.00015;sun.shadow.normalBias=.035;sun.shadow.radius=4;fill.position.set(10,7,-7);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),new THREE.MeshStandardMaterial({color:'#dce0ca',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.57;ground.receiveShadow=true;scene.add(ground);
await document.fonts.load('600 24px Pretendard').catch(()=>{});
const variants=[{shirt:'#c77858',skin:'#e9bb94',hair:'#43392f',style:'swoop',pants:'#e7dac0'},{shirt:'#6c866e',skin:'#c98e67',hair:'#332d29',style:'crop',pants:'#e4cfaa'},{shirt:'#a29bb7',skin:'#edc2a5',hair:'#6c4936',style:'bob',pants:'#dddcc7'}].map(options=>createAvatar({...options,name:'YOU'}));
let avatarIndex=0,avatar=variants[0],world,navigation,interactive=[],targets=[],view=small?'avatar':'lobby',heading=.4,last=performance.now(),elapsed=0,cameraTween=null,pending=null,jumpTime=0,jumping=false,sitting=null,seatMotion=null,transitioning=false;
const shadow=contactShadow(.48,.3,.42);scene.add(shadow,avatar.group);
const marker=new THREE.Mesh(new THREE.RingGeometry(.15,.2,40),new THREE.MeshBasicMaterial({color:'#c79461',transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.position.y=.08;marker.visible=false;scene.add(marker);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),-.06),intersection=new THREE.Vector3();
function softenShadows(model){model.group.traverse(object=>{if(object.isMesh){object.geometry.computeBoundingSphere();if(object.geometry.boundingSphere.radius*Math.max(...object.scale.toArray())<.18)object.castShadow=false}})}
variants.forEach(softenShadows);
function getWorld(id){
 if(worlds.has(id))return worlds.get(id);
 let next;
 if(id==='lobby'){
  next=createCinema();Object.assign(next,{id,kind:'lobby',seats:[],bounds:{left:-7.95,right:7.95,top:-4.1,bottom:4.45},spawn:{x:.4,y:2},npcDefinitions:[{name:'Mia',x:-4.8,z:-2.12,shirt:'#a95f4d',skin:'#f1c6a1',hair:'#4a3b30',style:'bob',heading:.15},{name:'Leo',x:5.45,z:-1.65,shirt:'#6d846e',skin:'#c2926b',hair:'#352f2b',style:'crop',heading:.1},{name:'Sam',x:1.8,z:1,shirt:'#b4a077',skin:'#e6ba92',hair:'#795c3b',style:'swoop',heading:-.7}]});
  next.doors.forEach((point,index)=>Object.assign(point,{kind:'screen-entry',index,title:`SCREEN 0${index+1}`}));next.pointsOfInterest.forEach(point=>{point.kind=point.id==='arcade'?'arcade-entry':'info';point.title=({tickets:'Ticket booth',arcade:'The Game Room',popcorn:'Popcorn',upcoming:'Upcoming films'})[point.id]});
 }else next=id==='arcade'?createArcadeRoom():createScreeningRoom(programs[Number(id.slice(-1))-1]);
 next.npcs=next.npcDefinitions.map(def=>{const model=createAvatar(def);softenShadows(model);model.group.position.set(def.x,.055,def.z);model.update(elapsed,{heading:def.heading,sitting:def.sitting||0});const floorShadow=contactShadow(.45,.28,.35);floorShadow.position.set(def.x,.065,def.z);next.group.add(model.group,floorShadow);const nameTag=document.createElement('div');nameTag.className='npc-tag visitor-tag';nameTag.textContent=def.name;nameTag.dataset.noTranslate='';nameTag.hidden=true;stage.append(nameTag);const npc={...def,model,nameTag};model.group.userData.person=npc;return npc});
 worlds.set(id,next);return next;
}
function stop(){keys.clear();velocity.set(0,0);route.length=0;pending=null;marker.visible=false}
function pause(){stop();jumping=false}
function resume(){keys.clear();if(!document.querySelector('dialog[open]'))canvas.focus({preventScroll:true})}
function activate(next,spawn=next.spawn){
 if(world){scene.remove(world.group);world.npcs.forEach(npc=>npc.nameTag.hidden=true)}stop();sitting=null;seatMotion=null;jumping=false;jumpTime=0;world=next;scene.add(next.group);Object.assign(player,spawn);heading=next.kind==='lobby'?.4:Math.PI;
 const obstacles=[...next.colliders.map(r=>({left:r.left-.26,right:r.right+.26,top:r.top-.26,bottom:r.bottom+.26})),...next.npcs.filter(n=>!n.sitting).map(n=>({left:n.x-.43,right:n.x+.43,top:n.z-.43,bottom:n.z+.43}))];navigation=window.createSeenRoomNavigation([],obstacles);
 interactive=[...next.doors,...next.pointsOfInterest];for(const point of interactive)if(!point.group.userData.instances)point.group.userData.place=point;targets=[...new Set([...interactive.map(p=>p.group),...next.npcs.map(n=>n.model.group)])];
 document.body.dataset.room=next.id;document.body.dataset.roomKind=next.kind;
 const dark=next.kind!=='lobby';scene.fog=new THREE.Fog(dark?'#28372f':'#e5e3d3',75,145);ground.material.color.set(dark?'#29372e':'#dce0ca');ambient.intensity=next.kind==='screen'?.85:next.kind==='arcade'?1.65:2.25;sun.intensity=next.kind==='screen'?1.0:next.kind==='arcade'?1.8:3.1;fill.intensity=next.kind==='screen'?.9:1;renderer.toneMappingExposure=next.kind==='screen'?1.28:1.14;
 fill.color.set(next.kind==='arcade'?'#d2bbef':'#d4e3d7');refreshUI();setView(small?'avatar':'lobby',true);
}
let roomChange=Promise.resolve();
function changeRoom(id,options={}){const request=roomChange.then(()=>performRoomChange(id,options));roomChange=request.catch(()=>{});return request}
async function performRoomChange(id,{instant=false,spawn}={}){
 if(transitioning)return false;if(world?.id===id)return true;transitioning=true;pause();hoverLabel.hidden=true;const curtain=$('#scene-transition');curtain.hidden=false;curtain.classList.add('is-covering');
 if(!instant&&!reduced)await new Promise(resolve=>setTimeout(resolve,190));activate(getWorld(id),spawn);await new Promise(requestAnimationFrame);curtain.classList.remove('is-covering');
 if(!instant&&!reduced)await new Promise(resolve=>setTimeout(resolve,190));curtain.hidden=true;transitioning=false;resume();return true;
}
const activities=createActivities({programs,pause,resume,ensureScreen:index=>changeRoom(`screen-${index+1}`,{instant:true}),getNickname:()=>nickname,setNickname:name=>{nickname=name;try{localStorage.setItem('seen-name',name)}catch{}}});
function stand(after){
 if(seatMotion)return false;if(!sitting){after?.();return true}stop();const seat=sitting;seatMotion={from:{...player},to:{x:seat.approach.x,y:seat.approach.z},t:0,entering:false,seat,after};sitting=null;refreshUI();return true;
}
function sit(seat){if(seat.occupied||seatMotion)return;if(sitting?.id===seat.id)return;stop();seatMotion={from:{...player},to:{x:seat.position.x,y:seat.position.z-.02},t:0,entering:true,seat};heading=Math.PI}
function goTo(x,z,point=null){
 if(transitioning||activities.open)return false;if(sitting)return stand(()=>goTo(x,z,point));if(seatMotion)return false;
 const b=world.bounds,requested={x:THREE.MathUtils.clamp(x,b.left,b.right),y:THREE.MathUtils.clamp(z,b.top,b.bottom)},end=navigation.destination(player,requested),next=end?navigation.route(player,end):[];
 if(!next.length){if(end&&Math.hypot(end.x-player.x,end.y-player.y)<.08&&point)interact(point);return false}
 stop();route.push(...next);pending=point;marker.position.set(end.x,.08,end.y);marker.visible=true;canvas.focus({preventScroll:true});return true;
}
function approach(point){if(!point||transitioning||activities.open)return;if(sitting||seatMotion){if(sitting)stand(()=>approach(point));return}if(Math.hypot(player.x-point.approach.x,player.y-point.approach.z)<.25)interact(point);else goTo(point.approach.x,point.approach.z,point)}
function personPoint(npc){return{kind:'person',name:npc.name,title:npc.name,person:true,position:npc.model.group.position,approach:new THREE.Vector3(npc.x,0,npc.z+(npc.sitting?-.88:1.1))}}
function info(point){
 pause();let data={title:`${point.name||'SEEN'}`,description:'Good films are even better together. Choose a screen and find your story.',action:'Close'};
 if(point.id==='tickets')data={title:'Welcome to SEEN.',description:'Four screens. Four stories. Pick the doorway that catches your eye.',action:'Close'};
 if(point.id==='popcorn')data={title:'A little joy before the film.',description:'Fresh popcorn, your favourite drink, and a moment before the lights go down.',action:'Close'};
 if(point.id==='upcoming')data={title:'Next on the big screen.',description:'Discover the films coming soon to SEEN.',href:'./magazine.html#watchlist',action:'Upcoming films ↗'};
 if(point.occupied)data={title:'This seat is taken.',description:'Choose an empty seat and make yourself comfortable.',action:'Close'};
 SeenI18n.text($('#place-title'),data.title);SeenI18n.text($('#place-description'),data.description);const link=$('#place-link');SeenI18n.text(link,data.action);link.href=data.href||'#';link.onclick=data.href?null:event=>{event.preventDefault();dialog.close()};dialog.showModal();
}
function interact(point){
 if(point.kind==='screen-entry')changeRoom(`screen-${point.index+1}`);
 else if(point.kind==='arcade-entry')changeRoom('arcade');
 else if(point.kind==='exit'){const old=world;const lobby=getWorld('lobby'),entry=old.kind==='arcade'?lobby.pointsOfInterest.find(p=>p.id==='arcade'):lobby.doors[old.program.index];changeRoom('lobby',{spawn:{x:entry.approach.x,y:entry.approach.z+.45}})}
 else if(point.kind==='seat')point.occupied?info(point):sit(point);
 else if(point.kind==='article')activities.read(world.program);
 else if(point.kind==='cabinet')activities.quiz(point.id);
 else info(point);
}
function refreshUI(){
 const kind=world.kind;$('#stage').setAttribute('aria-label',SeenI18n.t(kind==='lobby'?'3D cinema lobby':kind==='screen'?`SCREEN ${world.program.number}`:'SEEN ARCADE'));
 SeenI18n.text($('.intro .eyebrow'),kind==='lobby'?'A LITTLE MORE DIMENSION.':kind==='screen'?`SCREEN ${world.program.number} / NOW SHOWING`:'SEEN / THE ARCADE');
 SeenI18n.text($('.intro h1'),kind==='lobby'?'Take a walk through the cinema.':kind==='screen'?world.program.article.title:'CHOOSE YOUR GAME');
 SeenI18n.text($('.intro p'),kind==='lobby'?'Soft light, little expressions, and room for a conversation.':kind==='screen'?'WANDER THE AISLES. FIND YOUR SEAT.':'NO COINS NEEDED. JUST CURIOSITY.');
 $('#room-actions').hidden=kind==='lobby';$('#lobby-actions').hidden=kind!=='lobby';$('#screen-actions').hidden=kind!=='screen';$('#cabinet-actions').hidden=kind!=='arcade';$('#stand-up').hidden=!sitting;
 $('#scene-status').hidden=kind!=='screen';SeenI18n.text($('#scene-status'),sitting?`Seated at ${sitting.id}. Enter or Stand up to explore.`:'Choose a seat');
 const picker=$('#seat-picker');picker.replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=SeenI18n.t('Choose a seat');picker.append(placeholder);
 for(const seat of world.seats){const option=document.createElement('option');option.value=seat.id;option.textContent=SeenI18n.t(`Seat ${seat.id}`)+(seat.occupied?' · '+SeenI18n.t('Taken'):'');option.disabled=!!seat.occupied;picker.append(option)}picker.value=sitting?.id||'';
 world.refresh?.();const language=$('#language');language.textContent=SeenI18n.language==='en'?'KR':'EN';language.setAttribute('aria-label',SeenI18n.language==='en'?'한국어로 보기':'View in English');
}
function setView(next,instant=false){
 view=next;document.body.dataset.cameraView=view;controls.minAzimuthAngle=view==='avatar'?-Infinity:-.7;controls.maxAzimuthAngle=view==='avatar'?Infinity:1.45;
 document.querySelectorAll('.views [data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)));
 const aspect=stage.clientWidth/stage.clientHeight,distance=Math.max(world?.kind==='screen'?31:25,(world?.kind==='lobby'?32:37)/aspect),target=view==='avatar'?new THREE.Vector3(player.x,1.2,player.y):new THREE.Vector3(0,world?.kind==='screen'?1.8:1.65,-.1);
 const close=world?.kind==='lobby'?new THREE.Vector3(2.8,1.25,5.3):new THREE.Vector3(3.0,2.0,7.5),position=view==='avatar'?target.clone().add(close):target.clone().add(new THREE.Vector3(.53,.53,.75).normalize().multiplyScalar(distance));
 if(instant||reduced){camera.position.copy(position);controls.target.copy(target);cameraTween=null;controls.update()}else cameraTween={from:camera.position.clone(),to:position,fromTarget:controls.target.clone(),target,t:0};
}
function resize(){const width=stage.clientWidth,height=stage.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();if(world)setView(view,true)}
new ResizeObserver(resize).observe(stage);
for(const button of document.querySelectorAll('.views [data-view]'))button.onclick=()=>setView(button.dataset.view);$('#reset-camera').onclick=()=>setView('lobby');controls.addEventListener('start',()=>cameraTween=null);
$('#language').onclick=()=>SeenI18n.setLanguage(SeenI18n.language==='en'?'ko':'en');document.addEventListener('seen-language-change',()=>world&&refreshUI());
$('#room-picker').onchange=event=>{const id=event.target.value;event.target.value='';if(id)approach(id==='arcade'?world.pointsOfInterest.find(p=>p.id==='arcade'):world.doors[+id-1])};
$('#seat-picker').onchange=event=>{const seat=world.seats.find(seat=>seat.id===event.target.value);if(seat)approach(seat)};
$('#read-story').onclick=()=>activities.read(world.program);$('#stand-up').onclick=()=>stand();$('#return-lobby').onclick=()=>approach(world.pointsOfInterest.find(point=>point.kind==='exit'));
for(const button of document.querySelectorAll('[data-machine]'))button.onclick=()=>approach(world.pointsOfInterest.find(point=>point.id===button.dataset.machine));
for(const button of document.querySelectorAll('[data-avatar]'))button.onclick=()=>{scene.remove(avatar.group);avatarIndex=+button.dataset.avatar;avatar=variants[avatarIndex];scene.add(avatar.group);for(const item of document.querySelectorAll('[data-avatar]')){item.classList.toggle('selected',item===button);item.setAttribute('aria-pressed',String(item===button))}};
dialog.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('close',resume);
function ray(event){const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera)}
function hitPlace(event){
 ray(event);for(const hit of raycaster.intersectObjects(targets,true)){if(hit.object.userData.instances&&hit.instanceId!==undefined)return hit.object.userData.instances[hit.instanceId];let object=hit.object;while(object){if(object.userData.person)return personPoint(object.userData.person);if(object.userData.place)return object.userData.place;object=object.parent}}return null;
}
let down=null;canvas.addEventListener('pointerdown',event=>{if(event.isPrimary&&event.button===0)down={x:event.clientX,y:event.clientY,t:performance.now()}});
canvas.addEventListener('pointerup',event=>{if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>7||performance.now()-down.t>650){down=null;return}down=null;if(activities.open||transitioning)return;const point=hitPlace(event);if(point){approach(point);return}ray(event);if(raycaster.ray.intersectPlane(floor,intersection))goTo(intersection.x,intersection.z)});canvas.addEventListener('pointercancel',()=>down=null);
canvas.addEventListener('pointermove',event=>{if(down||event.pointerType==='touch'||transitioning)return;const point=hitPlace(event);canvas.style.cursor=point?'pointer':'grab';if(!point){hoverLabel.hidden=true;return}const pos=point.position.clone();pos.y+=point.person?2.5:1;const projected=pos.project(camera);hoverLabel.style.left=(projected.x*.5+.5)*stage.clientWidth+'px';hoverLabel.style.top=(-projected.y*.5+.5)*stage.clientHeight+'px';SeenI18n.text(hoverLabel,point.title);hoverLabel.hidden=false});canvas.addEventListener('pointerleave',()=>hoverLabel.hidden=true);
function jump(){if(!jumping&&!sitting&&!seatMotion&&!activities.open&&!transitioning){jumping=true;jumpTime=0}}
const keyMap={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
function interactNearby(){if(sitting){stand();return}let nearest=null,distance=1.18;for(const point of [...interactive,...world.npcs.map(personPoint)]){const d=Math.hypot(player.x-point.approach.x,player.y-point.approach.z);if(d<distance){nearest=point;distance=d}}if(nearest)approach(nearest)}
addEventListener('keydown',event=>{if(activities.open||transitioning||event.target.closest('input,select,textarea,[contenteditable="true"]'))return;if(keyMap[event.code]){event.preventDefault();if(sitting)stand();keys.add(keyMap[event.code]);route.length=0;pending=null;marker.visible=false}if(event.target.closest('button,a'))return;if(event.code==='Space'){event.preventDefault();if(!event.repeat)jump()}if(event.code==='Enter'){event.preventDefault();if(!event.repeat)interactNearby()}});
addEventListener('keyup',event=>keys.delete(keyMap[event.code]));addEventListener('blur',()=>{keys.clear();down=null});document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear()});
for(const button of document.querySelectorAll('[data-move]')){button.addEventListener('pointerdown',event=>{event.preventDefault();if(transitioning||activities.open)return;button.setPointerCapture(event.pointerId);if(sitting)stand();keys.add(button.dataset.move);route.length=0;pending=null;marker.visible=false});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(button.dataset.move))}$('#jump').onclick=jump;
function nameplate(model,node,name){const projected=model.headAnchor().project(camera);if(node.textContent!==name)node.textContent=name;node.style.left=(projected.x*.5+.5)*stage.clientWidth+'px';node.style.top=(-projected.y*.5+.5)*stage.clientHeight+'px';node.hidden=projected.z>1||projected.z<0}
function update(time){
 if(small&&time-last<1000/30*.95)return;const dt=Math.min((time-last)/1000,.05);last=time;if(document.hidden)return;elapsed+=dt;const before={...player};
 if(seatMotion){const motion=seatMotion;motion.t=Math.min(1,motion.t+dt/(reduced?.01:.5));const blend=motion.t*motion.t*(3-2*motion.t);player.x=THREE.MathUtils.lerp(motion.from.x,motion.to.x,blend);player.y=THREE.MathUtils.lerp(motion.from.y,motion.to.y,blend);if(motion.t===1){seatMotion=null;if(motion.entering)sitting=motion.seat;refreshUI();motion.after?.()}}
 else if(!activities.open&&!transitioning){
  const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new THREE.Vector3(-forward.z,0,forward.x);let dx=0,dz=0;
  if(keys.has('up')){dx+=forward.x;dz+=forward.z}if(keys.has('down')){dx-=forward.x;dz-=forward.z}if(keys.has('right')){dx+=right.x;dz+=right.z}if(keys.has('left')){dx-=right.x;dz-=right.z}
  const length=Math.hypot(dx,dz);velocity.lerp(new THREE.Vector2(length?dx/length*2.9:0,length?dz/length*2.9:0),1-Math.exp(-12*dt));
  if(!sitting&&(length||velocity.length()>.03)){route.length=0;const b=world.bounds,nx=THREE.MathUtils.clamp(player.x+velocity.x*dt,b.left,b.right),ny=THREE.MathUtils.clamp(player.y+velocity.y*dt,b.top,b.bottom);if(!navigation.blocked(nx,ny)){player.x=nx;player.y=ny}else{if(!navigation.blocked(nx,player.y))player.x=nx;if(!navigation.blocked(player.x,ny))player.y=ny}}
  else if(route.length){const next=navigation.advance(player,route,2.9*dt);player.x=next.x;player.y=next.y;if(!route.length){marker.visible=false;if(pending){const point=pending;pending=null;interact(point)}}}
 }
 const speed=Math.hypot(player.x-before.x,player.y-before.y)/Math.max(dt,.001),walking=speed>.05&&!seatMotion&&!sitting;if(walking)heading=Math.atan2(player.x-before.x,player.y-before.y);if(sitting||seatMotion)heading=Math.PI;
 let jumpHeight=0;if(jumping){jumpTime+=dt;jumpHeight=Math.max(0,3.7*jumpTime-5.5*jumpTime*jumpTime);if(jumpTime>3.7/5.5)jumping=false}
 const posture=sitting?1:seatMotion?(seatMotion.entering?seatMotion.t:1-seatMotion.t):0;
 avatar.group.position.set(player.x,.055,player.y);avatar.update(elapsed,{walking,speed:speed/2.9,heading,jump:jumpHeight,sitting:posture});shadow.position.set(player.x,.065,player.y);shadow.material.opacity=.42-jumpHeight*.14;
 for(const npc of world.npcs){const near=Math.hypot(player.x-npc.x,player.y-npc.z)<3;npc.model.update(elapsed,{heading:npc.sitting?Math.PI:near?Math.atan2(player.x-npc.x,player.y-npc.z):npc.heading,sitting:npc.sitting||0,talking:dialog.open&&near})}
 if(cameraTween){cameraTween.t=Math.min(1,cameraTween.t+dt/1.05);const t=cameraTween.t,k=t*t*(3-2*t);camera.position.lerpVectors(cameraTween.from,cameraTween.to,k);controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.target,k);if(t===1)cameraTween=null}
 else if(view==='avatar'&&(speed>.01||seatMotion)){const delta=new THREE.Vector3(player.x-before.x,0,player.y-before.y);controls.target.add(delta);camera.position.add(delta)}controls.update();renderer.render(scene,camera);
 nameplate(avatar,tag,nickname||SeenI18n.t('YOU'));for(const npc of world.npcs)nameplate(npc.model,npc.nameTag,npc.name);
 canvas.dataset.position=`${player.x.toFixed(3)},${player.y.toFixed(3)}`;canvas.dataset.motion=walking?'walking':'idle';canvas.dataset.jump=jumpHeight.toFixed(3);canvas.dataset.seat=sitting?.id||'';
 if(!canvas.dataset.ready){canvas.dataset.ready='true';loading.hidden=true;document.body.dataset.ready='true'}
}
activate(getWorld('lobby'));resize();renderer.setAnimationLoop(update);activities.start();
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();renderer.setAnimationLoop(null);loading.hidden=false;SeenI18n.text(loading,'Please refresh to return to the cinema.')});
window.Seen3DPreview={setView,goTo,approach,project(x,y,z){const point=new THREE.Vector3(x,y,z).project(camera),rect=canvas.getBoundingClientRect();return{x:rect.left+(point.x*.5+.5)*rect.width,y:rect.top+(-point.y*.5+.5)*rect.height}},get state(){return{view,room:world.id,position:{...player},avatar:avatarIndex,ready:!!canvas.dataset.ready,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,characters:world.npcs.length+1,seated:sitting?.id||null,transitioning,seatCount:world.seats.length,targets:interactive.map(point=>({id:point.id,kind:point.kind,position:point.position.toArray(),approach:point.approach.toArray()}))}}};
