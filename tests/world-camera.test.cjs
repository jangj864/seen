const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function fixture(options={}){
 const nodes=[],events={};
 const document={createElement(){const n={dataset:{},append(...items){this.children=items},setAttribute(k,v){this[k]=v}};nodes.push(n);return n},addEventListener(k,v){events[k]=v}};
 const context=vm.createContext({document,matchMedia:()=>({matches:false}),seenSetText:(n,v)=>n.textContent=v,SeenI18n:{t:v=>v}});
 vm.runInContext(fs.readFileSync('dist/world-camera.js','utf8'),context);
 let changes=0;const scene={append(){}};
 const camera=context.createSeenWorldCamera({scene,onChange:()=>changes++,...options});
 return{camera,context,button:nodes[1],changes:()=>changes};
}
test('desktop camera preserves the existing scene projection',()=>{
 const {camera}=fixture();const input={width:1440,height:798,unit:45.6,ox:528,oy:210,x:9.4,y:4.5};
 const view=camera.view(input);assert.equal(view.unit,input.unit);assert.equal(view.ox,input.ox);assert.equal(view.oy,input.oy);assert.equal(camera.view(input).changed,false);
});
test('mobile camera enlarges the scene around the visitor without moving the visitor',()=>{
 const {camera}=fixture(),input={width:393,height:762,unit:14,ox:130,oy:250,x:9.4,y:4.5};
 const before={...input},view=camera.view(input);
 assert(view.unit>input.unit);assert(Math.abs(view.ox+(input.x-input.y)*view.unit*.86-input.width/2)<.01);
 assert(Math.abs(view.oy+(input.x+input.y)*view.unit*.43-input.height*.46)<.01);assert.deepEqual(input,before);
 let settled;for(let i=0;i<200;i++)settled=camera.view({...input,x:11,dt:.04});
 assert.equal(settled.changed,false);
});
test('overview toggle restores the complete original map and can return to following',()=>{
 const {camera,button,changes}=fixture(),input={width:393,height:762,unit:14,ox:130,oy:250,x:9.4,y:4.5};
 camera.view(input);button.onclick();let view=camera.view(input);
 assert.equal(view.unit,input.unit);assert.equal(view.ox,input.ox);assert.equal(view.oy,input.oy);assert.equal(button.textContent,'Follow me');
 button.onclick();view=camera.view(input);assert(view.unit>input.unit);assert.equal(changes(),2);assert.equal(button.textContent,'Overview');
});

test('room overviews fit every floor and wall inside the actual map viewport',()=>{
 for(const bounds of [{left:-10.5,right:10.5,top:-5.4,bottom:10.5},{left:-10.5,right:10.5,top:-5.4,bottom:10.5,paddingTop:56},{left:-8.8,right:10.6,top:-4.3,bottom:9.7}]){
  for(const [width,height]of [[320,180],[393,340],[430,450],[680,140]]){
   const {camera,button}=fixture({bounds,startOverview:true}),input={width,height,unit:20,ox:0,oy:0,x:6,y:6},view=camera.view(input);
   for(const x of [bounds.left,bounds.right])assert(x*view.unit+view.ox>=15.99&&x*view.unit+view.ox<=width-15.99);
   for(const y of [bounds.top,bounds.bottom])assert(y*view.unit+view.oy>=(bounds.paddingTop??16)-.01&&y*view.unit+view.oy<=height-15.99);
   assert.equal(camera.view(input).changed,false);button.onclick();assert(camera.view(input).unit>view.unit,'visitors can still choose a closer camera');
  }
 }
});

test('unchanged or hidden canvases do not clear and reallocate their bitmap',()=>{
 const {context}=fixture();context.devicePixelRatio=2;
 let allocations=0,w=300,h=150;const canvas={clientWidth:320,clientHeight:200,get width(){return w},set width(value){allocations++;w=value},get height(){return h},set height(value){allocations++;h=value}},paint={setTransform(){}};
 context.seenResizeWorldCanvas(canvas,paint);assert.equal(allocations,2);assert.equal(w,640);assert.equal(h,400);
 context.seenResizeWorldCanvas(canvas,paint);assert.equal(allocations,2);
 canvas.clientWidth=0;assert.equal(context.seenResizeWorldCanvas(canvas,paint),null);assert.equal(allocations,2);
 canvas.clientWidth=320;context.devicePixelRatio=1;context.seenResizeWorldCanvas(canvas,paint);assert.equal(allocations,4);assert.equal(w,320);assert.equal(h,200);
});
