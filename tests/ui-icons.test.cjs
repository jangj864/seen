const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

test('cabinet and dialog share each pixel icon, with cached canvas paths',()=>{
 let created=0;
 const context=vm.createContext({Path2D:class{constructor(data){this.data=data;created++}}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/ui-icons.js'),'utf8')+';globalThis.icons=SeenIcons',context);
 const drawn=[],ctx={save(){},restore(){},translate(){},scale(){},fill(icon){drawn.push(icon)}};
 for(const mode of ['all','eyes','films']){
  const svg=context.icons.svg(mode),path=svg.match(/ d="([^"]+)"/)[1];
  context.icons.draw(ctx,mode,0,0,24,'#fff');
  context.icons.draw(ctx,mode,0,0,84,'#fff');
  assert.equal(drawn.at(-1).data,path,mode);
  assert.equal(drawn.at(-1),drawn.at(-2),mode);
  assert.match(svg,/viewBox="0 0 24 24" aria-hidden="true"/);
 }
 assert.equal(created,3);
 assert.equal(new Set(drawn.map(icon=>icon.data)).size,3);
 assert.equal(context.icons.svg('unknown'),'');
 context.icons.draw(ctx,'unknown',0,0,24,'#fff');
 assert.equal(drawn.length,6);
});
