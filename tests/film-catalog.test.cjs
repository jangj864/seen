const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const dist=path.join(__dirname,'../dist');
const app=fs.readFileSync(path.join(dist,'app.js'),'utf8');
function loadCatalog(){
 const context=vm.createContext({});
 vm.runInContext(fs.readFileSync(path.join(dist,'film-catalog.js'),'utf8')+';globalThis.catalog=SeenFilmCatalog;',context);
 return context;
}

test('cinema and magazine share all five releases, official links and real artwork files',()=>{
 const {catalog}=loadCatalog();
 const upcoming=catalog.createUpcoming(),magazine=catalog.magazine.filter(film=>film.type==='new');
 assert.deepEqual(Array.from(upcoming,film=>film.id),['hunger','hexed','focker','ebenezer','godzilla']);
 assert.deepEqual(Array.from(magazine,film=>film.id),Array.from(upcoming,film=>film.id));
 for(const film of upcoming){
  const card=magazine.find(item=>item.id===film.id);
  assert.equal(card.link,film.url,film.id);
  assert.equal(card.date,film.stamp,film.id);
  assert.equal(card.prompt,film.question,film.id);
  assert.equal(card.image,film.image,film.id);
  assert.ok(fs.existsSync(path.join(dist,`assets/${card.image}.${card.ext}`)),film.id);
 }
 assert.equal(magazine.find(film=>film.id==='godzilla').ext,'png');
 assert.equal(magazine.find(film=>film.id==='hunger').title,'Sunrise on the Reaping','Existing local ballots retain their film title');
 assert.deepEqual(Array.from(catalog.magazine.filter(film=>film.type==='revisit'),film=>film.id),['ladybird','yang','minari']);
});

test('scene DOM attachments cannot mutate the canonical releases or another scene',()=>{
 const {catalog}=loadCatalog(),first=catalog.createUpcoming(),second=catalog.createUpcoming();
 first[0].button={scene:'lobby'};first[0].title='Scene-specific title';
 assert.equal(second[0].button,undefined);
 assert.equal(catalog.upcoming[0].button,undefined);
 assert.equal(second[0].title,catalog.upcoming[0].title);
 assert.ok(Object.isFrozen(catalog.upcoming));
 assert.ok(Object.isFrozen(catalog.magazine));
 assert.ok(catalog.upcoming.every(Object.isFrozen));
});

test('all eight poster entries carry sourced Korean titles and original synopsis adaptations',()=>{
 const {catalog}=loadCatalog(),credits=JSON.parse(fs.readFileSync(path.join(dist,'assets/film-poster-sources.json'),'utf8'));
 assert.equal(catalog.magazine.length,8);assert.equal(credits.posters.length,8);
 for(const film of catalog.magazine){
  assert.match(film.korean.title,/[가-힣]/);assert(film.korean.synopsis.length>=60,film.id);assert.match(film.korean.source,/^https:\/\//);assert(Object.isFrozen(film.korean));
  assert(credits.posters.some(p=>p.file===`${film.image}.${film.ext||'jpg'}`),film.id);
 }
 assert.equal(catalog.upcoming[0].korean.title,'헝거게임 50번째 추첨의 날');assert.equal(catalog.upcoming[1].korean.title,'헥스: 마녀왕국');
});

test('magazine consumes the shared articles while retaining colophon and source register',()=>{
 const context=loadCatalog();
 vm.runInContext(fs.readFileSync(path.join(dist,'articles.js'),'utf8'),context);
 vm.runInContext(app.slice(app.indexOf('const films ='),app.indexOf('let saved='))+';globalThis.films=films;',context);
 vm.runInContext(app.slice(app.indexOf('const articles='),app.indexOf('let returnFocus='))+';globalThis.editorial=articles;globalThis.original=screeningArticles;',context);
 assert.equal(context.films,context.catalog.magazine);
 for(const id of ['table','ladybird','yang','minari'])assert.equal(context.editorial[id],context.original[id],id);
 assert.equal(context.editorial.about.tag,'COLOPHON / ISSUE 02');
 assert.equal(context.editorial.credits.tag,'SOURCE REGISTER / ISSUE 02');
 assert.match(context.editorial.credits.body,/https:\/\/a24films\.com\/films\/minari/);
});

function loadCardWrapping(){
 const context=vm.createContext({});
 vm.runInContext(app.slice(app.indexOf('function wrapCardText('),app.indexOf('let toastTimer;'))+';globalThis.wrap=wrapCardText;',context);
 return context.wrap;
}

test('recommendation PNG wraps long Korean and Latin tokens without losing characters',()=>{
 const wrap=loadCardWrapping(),ctx={measureText:text=>({width:Array.from(text).length*10})};
 for(const text of ['가나다라마바사아자차카타파하'.repeat(12),'a'.repeat(140)]){
  const lines=wrap(ctx,text,90);
  assert.ok(lines.length>1);
  assert.ok(lines.every(line=>ctx.measureText(line).width<=90));
  assert.equal(lines.join(''),text);
 }
 assert.deepEqual(Array.from(wrap(ctx,'One film. One person.',110)),['One film.','One person.']);
 const emoji='👨‍👩‍👧‍👦';
 const graphemeCtx={measureText:text=>({width:[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text)].length*10})};
 const lines=wrap(graphemeCtx,emoji.repeat(8),30);
 assert.ok(lines.every(line=>line.split(emoji).join('')===''),'Grapheme clusters stay intact');
 assert.equal(lines.join(''),emoji.repeat(8));
});

test('maximum-length Korean recommendation fields stay within the PNG text area',async()=>{
 const draws=[],ctx={font:'',fillStyle:'',strokeStyle:'',fillRect(){},strokeRect(){},fillText(text,x,y){draws.push({text,x,y,size:Number(this.font.match(/([\d.]+)px/)[1])})},measureText(text){return {width:Array.from(text).length*Number(this.font.match(/([\d.]+)px/)[1])}}};
 let download;
 const canvas={getContext:()=>ctx,toBlob:callback=>callback({})};
 const context=vm.createContext({
  $:()=>({addEventListener:(_event,handler)=>{download=handler}}),
  getCard:()=>({recipient:'가'.repeat(65),'recommend-film':'영'.repeat(90),reason:'한'.repeat(500)}),
  document:{fonts:{ready:Promise.resolve()},createElement:type=>type==='canvas'?canvas:{click(){}}},
  SeenI18n:{t:text=>text},URL:{createObjectURL:()=>'',revokeObjectURL(){}},setTimeout(){},toast(){}
 });
 vm.runInContext(app.slice(app.indexOf('function wrapCardText('),app.indexOf('let toastTimer;')),context);
 vm.runInContext(app.slice(app.indexOf("$('#download-card').addEventListener('click'"),app.indexOf('let scheduled=false;')),context);
 await download();
 const body=draws.filter(line=>/^[가영한]+$/.test(line.text));
 assert.ok(body.length>3);
 assert.equal(body.map(line=>line.text).join(''),'가'.repeat(65)+'영'.repeat(90)+'한'.repeat(500));
 assert.ok(body.every(line=>line.x+line.text.length*line.size<=1080));
 assert.ok(body.every(line=>line.y<1180),'Body text stops above the footer');
});
