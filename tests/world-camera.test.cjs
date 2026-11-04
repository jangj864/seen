const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function fixture(){
 const nodes=[],events={};
 const document={createElement(){const n={dataset:{},append(...items){this.children=items},setAttribute(k,v){this[k]=v}};nodes.push(n);return n},addEventListener(k,v){events[k]=v}};
 const context=vm.createContext({document,matchMedia:()=>({matches:false}),seenSetText:(n,v)=>n.textContent=v,SeenI18n:{t:v=>v}});
 vm.runInContext(fs.readFileSync('dist/world-camera.js','utf8'),context);
 let changes=0;const scene={append(){}};
 const camera=context.createSeenWorldCamera({scene,onChange:()=>changes++});
 return{camera,button:nodes[1],changes:()=>changes};
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
