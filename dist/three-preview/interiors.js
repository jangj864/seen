import * as THREE from 'three';
import {box,roundedBox,sphere,material,label,updateLabel} from './kit.js?v=rooms1';

const t=value=>typeof SeenI18n==='undefined'?value:SeenI18n.t(value);
const loader=new THREE.TextureLoader();
const brass='#c5a470',cream='#f2e5c6';
function lettering(parent,text,width,height,x,y,z,color=cream){
 const mesh=label(text,{width,height,color,fontSize:Math.round(1024*height/width*.68)});mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function floor(group,width,depth,colors){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
 for(let x=0;x<8;x++)for(let y=0;y<8;y++){ctx.fillStyle=colors[(x+y)%2];ctx.fillRect(x*64,y*64,64,64)}
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),new THREE.MeshStandardMaterial({map,roughness:.95}));mesh.rotation.x=-Math.PI/2;mesh.position.y=.052;mesh.receiveShadow=true;group.add(mesh);
 group.add(roundedBox(width+.4,.48,depth+.4,.18,colors[1],0,-.3,0));return mesh;
}
function exitDoor(group,x,z){
 const gate=new THREE.Group();gate.position.set(x,0,z);group.add(gate);
 for(const side of [-1,1])gate.add(roundedBox(.15,2.46,.18,.04,brass,side*.68,1.25,0));
 gate.add(roundedBox(1.55,.38,.25,.055,'#445d49',0,2.57,0));lettering(gate,'EXIT',1.25,.27,0,2.57,.14);
 gate.add(box(1.18,.025,1.1,'#6f805a',0,.075,-.3));
 return{id:'exit',kind:'exit',title:'← TO THE LOBBY',position:new THREE.Vector3(x,1.3,z),approach:new THREE.Vector3(x,0,z-.8),group:gate};
}
function glow(color,intensity=1){return new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.7})}
function finish(group){group.traverse(object=>{if(!object.isMesh)return;if(object.userData.hitOnly){object.castShadow=false;return}object.castShadow=object.geometry.type!=='PlaneGeometry'&&!object.material.transparent;object.receiveShadow=!object.material.transparent})}
function screenArtwork(program){
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;const ctx=canvas.getContext('2d'),map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const image=new Image();image.src=`assets/${program.article.image}.jpg`;
 function refresh(){
  ctx.fillStyle='#1e2925';ctx.fillRect(0,0,1600,900);
  if(image.complete&&image.naturalWidth){const scale=Math.max(1600/image.width,900/image.height);ctx.drawImage(image,(1600-image.width*scale)/2,(900-image.height*scale)/2,image.width*scale,image.height*scale)}
  const shade=ctx.createLinearGradient(0,0,1500,0);shade.addColorStop(0,'#0b1512e8');shade.addColorStop(1,'#0b151222');ctx.fillStyle=shade;ctx.fillRect(0,0,1600,900);
  ctx.fillStyle=cream;ctx.font='600 25px Pretendard';ctx.fillText(`SEEN / SCREEN ${program.number}`,95,125);
  ctx.font='800 69px Pretendard';const words=t(program.article.title).split(' ');let line='',y=390;
  for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>1000&&line){ctx.fillText(line,95,y);y+=94;line=word}else line=next}ctx.fillText(line,95,y);
  ctx.font='500 28px Pretendard';ctx.fillText(t('READ THE STORY ↗'),95,740);map.needsUpdate=true;
 }
 image.onload=refresh;refresh();return{map,refresh};
}

export function createScreeningRoom(program){
 const group=new THREE.Group(),seats=[],colliders=[];group.name=`Screen ${program.number}`;
 const palette=[['#963f38','#bd6250'],['#405e53','#6f8d76'],['#555270','#8c7b9c'],['#7a583c','#b68b5f']][program.index];
 const floorMesh=floor(group,17,14,['#333e35','#2d372f']);
 group.add(roundedBox(17.1,6.3,.28,.1,'#39473c',0,3.12,-7.03));
 group.add(roundedBox(.28,2.5,14,.09,'#465444',-8.55,1.2,0));
 for(const x of [-8.32,8.32])group.add(box(.08,.10,13.6,brass,x,.14,0));
 group.add(roundedBox(15.6,.3,1.25,.1,'#322a25',0,.2,-5.92));
 group.add(roundedBox(12.1,4.25,.22,.08,'#151c19',0,3.22,-6.65));
 const artwork=screenArtwork(program),screen=new THREE.Mesh(new THREE.PlaneGeometry(10.95,3.62),new THREE.MeshBasicMaterial({map:artwork.map,toneMapped:false}));screen.position.set(0,3.22,-6.51);group.add(screen);
 for(const side of [-1,1]){
  // Soft folds are real geometry, so the velvet catches the same room light.
  const curtain=new THREE.PlaneGeometry(2.0,4.75,32,1),positions=curtain.attributes.position;
  for(let i=0;i<positions.count;i++)positions.setZ(i,Math.cos(positions.getX(i)*Math.PI*5)*.10);
  curtain.computeVertexNormals();const mesh=new THREE.Mesh(curtain,material(palette[0]));mesh.position.set(side*6.9,3.08,-6.28);group.add(mesh);
  group.add(roundedBox(2.12,.16,.26,.05,brass,side*6.9,.75,-6.26));
 }
 group.add(roundedBox(16.0,.42,.4,.08,palette[0],0,5.58,-6.45));
 group.add(box(11.0,.055,.08,glow('#b9cfb4',.6),0,1.24,-6.36));
 lettering(group,`SCREEN ${program.number}`,2.2,.32,0,6.0,-6.83,cream);
 // The central carpet and the gaps between rows remain completely walkable.
 group.add(box(1.65,.018,12.3,'#657052',0,.066,.3));
 for(const x of [-.86,.86])group.add(box(.035,.018,12.4,brass,x,.077,.3));
 for(let row=0;row<5;row++)for(let col=0;col<10;col++){
  const x=(col<5?-(5-col):(col-4))*1.4,z=-1.9+row*1.72,id=String.fromCharCode(65+row)+String(col+1).padStart(2,'0');
  const seat={id,kind:'seat',title:`Seat ${id}`,position:new THREE.Vector3(x,.65,z),approach:new THREE.Vector3(x,0,z-.88)};
  seats.push(seat);colliders.push({left:x-.53,right:x+.53,top:z-.43,bottom:z+.43});
 }
 // Six instanced parts render all 50 chairs, rather than hundreds of draws.
 const parts=[
  [.86,.16,.72,.07,palette[1],0,.34,0], [.86,.87,.18,.07,palette[0],0,.85,.32],
  [.12,.40,.74,.045,palette[0],-.48,.43,.01],[.12,.40,.74,.045,palette[0],.48,.43,.01],
  [.09,.25,.10,.025,'#252c29',-.32,.17,.18],[.09,.25,.10,.025,'#252c29',.32,.17,.18]
 ];
 const dummy=new THREE.Object3D();
 for(const [w,h,d,r,color,dx,y,dz]of parts){
  const model=roundedBox(w,h,d,r,color),mesh=new THREE.InstancedMesh(model.geometry,model.material,seats.length);
  seats.forEach((seat,i)=>{dummy.position.set(seat.position.x+dx,y,seat.position.z+dz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.computeBoundingSphere();group.add(mesh);
 }
 // Instanced hit shapes use the same matrices and seat ids as the visible chairs.
 const hit=new THREE.InstancedMesh(new THREE.BoxGeometry(1.03,1.45,.89),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),seats.length);hit.userData.instances=seats;hit.userData.hitOnly=true;
 seats.forEach((seat,i)=>{dummy.position.set(seat.position.x,.75,seat.position.z);dummy.updateMatrix();hit.setMatrixAt(i,dummy.matrix);seat.group=hit});hit.computeBoundingSphere();group.add(hit);
 for(let row=0;row<5;row++)for(const x of [-7.9,-.96,.96,7.9])group.add(box(.07,.045,.23,glow('#e8c98a',.7),x,.10,-1.9+row*1.72));
 for(const z of [-3.5,1.2,5.3]){
  group.add(roundedBox(.20,.7,.30,.05,brass,-8.28,1.8,z));group.add(sphere(.14,.20,.17,glow('#ecd7a7',.7),-8.17,1.9,z));
 }
 const exit=exitDoor(group,-7.2,6.25),projection={id:'projection',kind:'article',title:'READ THE STORY ↗',position:new THREE.Vector3(0,3.1,-6.4),approach:new THREE.Vector3(0,0,-3.9),group:screen};
 const npcDefinitions=[{seat:'B03',name:'Mia',shirt:'#cf9871',skin:'#e9bb94',hair:'#43392f',style:'bob'},{seat:'D08',name:'Sam',shirt:'#8d9a87',skin:'#c98e67',hair:'#332d29',style:'crop'}].map(npc=>{const seat=seats.find(seat=>seat.id===npc.seat);seat.occupied=true;return{...npc,x:seat.position.x,z:seat.position.z,sitting:1,heading:Math.PI}});
 finish(group);
 return{id:`screen-${program.index+1}`,kind:'screen',program,group,seats,colliders,npcDefinitions,doors:[],pointsOfInterest:[projection,exit,...seats],bounds:{left:-8.04,right:8.04,top:-4.65,bottom:6.6},spawn:{x:0,y:6.1},floorMeshes:[floorMesh],refresh:artwork.refresh};
}

function cabinet(mode,index){
 const theme=SeenQuizThemes[mode],color=['#ba6653','#65a28e','#c8a35d'][index],group=new THREE.Group();group.position.set((index-1)*4.9,0,-2.3);
 group.add(roundedBox(2.24,1.5,1.58,.14,color,0,.82,0));
 group.add(roundedBox(2.15,1.55,1.07,.12,color,0,2.13,-.28));
 group.add(roundedBox(2.4,.57,1.35,.12,color,0,3.15,-.20));
 group.add(roundedBox(1.97,.32,.055,.035,'#253830',0,3.16,.5));const title=lettering(group,t(theme.title),1.8,.25,0,3.16,.535,cream);
 group.add(roundedBox(1.94,1.35,.17,.09,'#25362e',0,2.23,.31));
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.66,1.08),glow('#244b40',.20));screen.position.set(0,2.23,.405);group.add(screen);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');SeenIcons.draw(ctx,mode,28,28,200,cream);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const icon=new THREE.Mesh(new THREE.PlaneGeometry(.8,.8),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false}));icon.position.set(0,2.25,.416);group.add(icon);
 const panel=roundedBox(2.36,.17,.95,.075,color,0,1.44,.48);panel.rotation.x=.14;group.add(panel);
 const stem=box(.065,.30,.065,'#e4d1a4',-.57,1.68,.62);group.add(stem);group.add(sphere(.14,.14,.14,'#bd5544',-.57,1.87,.62));group.add(sphere(.2,.03,.16,'#263d31',-.57,1.52,.62));
 for(const [x,z,c]of [[.28,.65,'#a74439'],[.62,.48,'#f1d492'],[.78,.77,'#7d9770']])group.add(sphere(.12,.045,.10,c,x,1.58,z));
 group.add(roundedBox(.72,.52,.06,.045,'#2b4035',0,.73,.82));group.add(box(.41,.045,.03,brass,0,.83,.865));
 group.add(roundedBox(2.1,.12,1.4,.04,'#25362f',0,.15,0));
 for(let row=0;row<3;row++)group.add(box(.43,.035,.02,'#344a3b',.68,.4+row*.10,.808));
 return{id:mode,kind:'cabinet',title:theme.title,position:new THREE.Vector3(group.position.x,2.1,-1.4),approach:new THREE.Vector3(group.position.x,0,-.25),group,refresh:()=>updateLabel(title,t(theme.title))};
}
export function createArcadeRoom(){
 const group=new THREE.Group();group.name='SEEN arcade';const floorMesh=floor(group,17,12,['#53536a','#46475e']);
 group.add(roundedBox(17.1,5.5,.28,.1,'#38374d',0,2.72,-6.02));group.add(roundedBox(.28,2.4,12,.1,'#45445c',-8.55,1.18,0));
 group.add(box(16.8,.07,.08,glow('#acbec8',.6),0,4.8,-5.83));lettering(group,'SEEN ARCADE',7.0,.74,0,4.03,-5.84,'#ead9e6');lettering(group,'NO COINS. JUST CURIOSITY.',4.3,.24,0,3.38,-5.84,'#b2c2b2');
 const machines=['all','eyes','films'].map(cabinet),colliders=machines.map(point=>({left:point.position.x-1.22,right:point.position.x+1.22,top:-3.4,bottom:-1.25}));machines.forEach(point=>group.add(point.group));
 for(const x of [-7.7,-2.45,2.45,7.7])group.add(box(.035,.02,9.7,glow('#9ab7b7',.4),x,.075,-.3));
 for(const [x,z]of [[-5.5,3.6],[-3.6,3.6]]){group.add(roundedBox(1.25,.45,1.1,.18,'#9e8fa4',x,.54,z));group.add(roundedBox(1.02,.32,.88,.12,'#3a4350',x,.22,z));colliders.push({left:x-.65,right:x+.65,top:z-.58,bottom:z+.58})}
 const exit=exitDoor(group,7.1,4.85);finish(group);
 return{id:'arcade',kind:'arcade',group,seats:[],colliders,doors:[],pointsOfInterest:[...machines,exit],npcDefinitions:[{name:'Leo',x:-7,z:1.2,shirt:'#ab9c7c',skin:'#c98e67',hair:'#332d29',style:'crop',heading:.5}],bounds:{left:-8.04,right:8.04,top:-5.3,bottom:5.55},spawn:{x:0,y:4.3},floorMeshes:[floorMesh],refresh:()=>machines.forEach(machine=>machine.refresh())};
}
