import * as THREE from 'three';
import {RoundedBoxGeometry} from '../vendor/three-0.187.0/RoundedBoxGeometry.js';

const materials=new Map(),geometries=new Map();
export function material(color,roughness=.8){const key=color+'|'+roughness;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness:0}));return materials.get(key)}
function geometry(key,build){if(!geometries.has(key))geometries.set(key,build());return geometries.get(key)}
function shape(geo,color,x,y,z){const object=new THREE.Mesh(geo,typeof color==='object'?color:material(color));object.position.set(x,y,z);object.castShadow=true;object.receiveShadow=true;return object}
export function roundedBox(w,h,d,radius,color,x=0,y=0,z=0){const r=Math.min(radius,Math.min(w,h,d)/2);return shape(geometry(`round:${w},${h},${d},${r}`,()=>new RoundedBoxGeometry(w,h,d,3,r)),color,x,y,z)}
export function box(w,h,d,color,x=0,y=0,z=0){return shape(geometry(`box:${w},${h},${d}`,()=>new THREE.BoxGeometry(w,h,d)),color,x,y,z)}
export function sphere(rx,ry,rz,color,x=0,y=0,z=0){const mesh=shape(geometry('sphere',()=>new THREE.SphereGeometry(1,24,16)),color,x,y,z);mesh.scale.set(rx,ry,rz);return mesh}
export function label(text,{width=2,height=.5,color='#f4e9ce',background='transparent',fontSize=72,fontFamily='Pretendard, Arial',weight=700}={}){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.max(128,Math.round(1024*height/width));const ctx=canvas.getContext('2d');
 if(background!=='transparent'){ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,canvas.height)}
 ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${weight} ${fontSize}px ${fontFamily}`;
 const lines=String(text).split('\n'),lineHeight=fontSize*1.35;lines.forEach((line,i)=>ctx.fillText(line,canvas.width/2,canvas.height/2+(i-(lines.length-1)/2)*lineHeight,canvas.width*.92));
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,transparent:background==='transparent',depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));return mesh;
}
let shadowTexture;
export function contactShadow(rx,rz,opacity=.25){
 if(!shadowTexture){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,2,64,64,62);gradient.addColorStop(0,'#242c27aa');gradient.addColorStop(.35,'#242c2777');gradient.addColorStop(1,'#242c2700');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);shadowTexture=new THREE.CanvasTexture(canvas)}
 const shadow=new THREE.Mesh(geometry('shadow-plane',()=>new THREE.PlaneGeometry(1,1)),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,opacity,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.set(rx*2,rz*2,1);shadow.position.y=.015;return shadow;
}
