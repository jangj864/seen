const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../dist');
function files(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(directory,entry.name)):[path.join(directory,entry.name)])}
const sources=files(root);
test('all shipped classic scripts compile before deployment',()=>{
 for(const file of sources.filter(file=>file.endsWith('.js')))assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(file,'utf8'),{filename:path.relative(root,file)}));
});
test('HTML and CSS reference existing local resources, and both entry pages declare a favicon',()=>{
 function check(file,value){
  if(!value||value.startsWith('#')||/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value))return;
  const resource=decodeURIComponent(value.split(/[?#]/)[0]);if(!resource)return;
  const resolved=path.resolve(path.dirname(file),resource);
  assert(fs.existsSync(resolved),`${path.relative(root,file)} references missing resource ${value}`);
 }
 for(const file of sources){
  if(file.endsWith('.html')){
   const html=fs.readFileSync(file,'utf8');assert.match(html,/<link\b[^>]*rel=["']icon["']/i);
   for(const match of html.matchAll(/\b(?:src|href|poster)=("([^"]*)"|'([^']*)')/g))check(file,match[2]??match[3]);
  }else if(file.endsWith('.css'))for(const match of fs.readFileSync(file,'utf8').matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g))check(file,(match[1]??match[2]??match[3]).trim());
 }
});
