const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../dist');
async function pageFor(browser,width,height,hash=''){
 const page=await browser.newPage({viewport:{width,height},hasTouch:width<700}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());if(url.origin!=='https://seen-3d.test')return route.abort();
  if(url.pathname==='/community-config.js')return route.fulfill({contentType:'text/javascript',body:'window.SEEN_COMMUNITY={url:"https://example.test",key:"test-publishable"};'});
  if(url.pathname==='/vendor/supabase-2.118.0.js')return route.fulfill({contentType:'text/javascript',body:'window.__scoreWrites=[];window.supabase={createClient(){return{from(){return{async insert(row){window.__scoreWrites.push(row);return{error:null}}}},async rpc(){const row=window.__scoreWrites.at(-1),entry={rank:1,nickname:row.nickname,score:5,total:5,is_current:true};return{error:null,data:{entries:[entry],current:entry,total_players:1}}}}}};'});
  const file=path.resolve(root,decodeURIComponent(url.pathname.slice(1)));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Not found'});
  const contentType={'.js':'text/javascript','.html':'text/html','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
  return route.fulfill({contentType,body:fs.readFileSync(file)});
 });
 await page.goto('https://seen-3d.test/3d.html'+hash);await page.waitForFunction(()=>document.body.dataset.ready==='true',{},{timeout:30000});
 return{page,errors};
}
test('real 3D preview supports camera, model changes, walking, jump and a raycast door interaction',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{
  const {page,errors}=await pageFor(browser,1280,900);
  const initial=await page.evaluate(()=>Seen3DPreview.state);assert(initial.drawCalls>0);assert.equal(initial.characters,4);
  await page.locator('[data-view="avatar"]').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>Seen3DPreview.state.view==='avatar');
  assert.equal(await page.locator('#scene').getAttribute('data-jump'),'0.000');
  await page.locator('[data-avatar="2"]').click();assert.equal(await page.evaluate(()=>Seen3DPreview.state.avatar),2);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');await page.waitForTimeout(200);
  const moved=await page.evaluate(()=>Seen3DPreview.state.position);assert(Math.hypot(moved.x-initial.position.x,moved.y-initial.position.y)>.25);
  await page.locator('#scene').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>+document.querySelector('#scene').dataset.jump>.05);await page.waitForFunction(()=>document.querySelector('#scene').dataset.jump==='0.000',{},{timeout:4000});
  await page.evaluate(()=>Seen3DPreview.setView('lobby',true));
  const door=await page.evaluate(()=>Seen3DPreview.project(-1.8,1.7,-4.43));await page.mouse.click(door.x,door.y);
  await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>Seen3DPreview.state.room),'lobby','clicking a doorway walks there before entering');
  await page.waitForFunction(()=>Seen3DPreview.state.room==='screen-2'&&!Seen3DPreview.state.transitioning,{},{timeout:15000});
  assert.equal(await page.evaluate(()=>Seen3DPreview.state.seatCount),50);
  await page.locator('#read-story').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>document.querySelector('#reader').open);
  assert.equal(await page.locator('#reader-title').textContent(),'The distance between us.');assert.equal(new URL(page.url()).hash,'#read/ladybird');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#reader').open);assert.equal(await page.evaluate(()=>Seen3DPreview.state.room),'screen-2');assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
test('mobile model view and overview fit, with separate wardrobe and walking controls',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{for(const [width,height]of [[320,568],[393,852]]){
  const {page,errors}=await pageFor(browser,width,height);assert.equal(await page.evaluate(()=>Seen3DPreview.state.view),'avatar');
  const layout=await page.evaluate(()=>{
   const wardrobe=document.querySelector('.character-card').getBoundingClientRect(),jump=document.querySelector('#jump').getBoundingClientRect();
   return{overlap:wardrobe.left<jump.right&&wardrobe.right>jump.left&&wardrobe.top<jump.bottom&&wardrobe.bottom>jump.top,overflow:document.documentElement.scrollWidth>innerWidth};
  });assert.equal(layout.overlap,false);assert.equal(layout.overflow,false);
  await page.locator('[data-view="lobby"]').focus();await page.keyboard.press('Space');await page.waitForTimeout(1250);
  const corners=await page.evaluate(()=>[[-8.7,0,-5.2],[-8.7,0,5.2],[8.7,0,-5.2],[8.7,0,5.2]].map(p=>Seen3DPreview.project(...p)));
  for(const point of corners)assert(point.x>=-5&&point.x<=width+5,JSON.stringify({width,point}));assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close()}
});
test('all original character variants have finite geometry and feet at floor height',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{const {page}=await pageFor(browser,1000,800);const models=await page.evaluate(async()=>{
  const THREE=await import('three'),{createAvatar}=await import('./three-preview/avatar.js');
  return ['swoop','crop','bob'].map(style=>{const avatar=createAvatar({style});let finite=true,meshes=0;avatar.group.traverse(n=>{if(n.isMesh){meshes++;for(const key of ['position','normal'])for(const value of n.geometry.attributes[key]?.array||[])finite&&=Number.isFinite(value)}});const box=new THREE.Box3().setFromObject(avatar.group);return{style,finite,meshes,min:box.min.y,max:box.max.y}});
 });for(const model of models){assert(model.finite);assert(model.meshes<60);assert(Math.abs(model.min)<.02);assert(model.max>2&&model.max<2.5)}}finally{await browser.close()}
});

test('3D seats avoid chairs, preserve the seat while reading, and return through the exit',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{const {page,errors}=await pageFor(browser,1280,900);
  await page.locator('#room-picker').selectOption('1');await page.waitForFunction(()=>Seen3DPreview.state.room==='screen-1'&&!Seen3DPreview.state.transitioning,{},{timeout:15000});
  await page.locator('#seat-picker').selectOption('C04');await page.waitForFunction(()=>Seen3DPreview.state.seated==='C04',{},{timeout:20000});
  const seated=await page.evaluate(()=>Seen3DPreview.state.position);await page.locator('#read-story').click();await page.waitForFunction(()=>document.querySelector('#reader').open);await page.locator('#close-reader').click();await page.waitForFunction(()=>!document.querySelector('#reader').open);
  assert.equal(await page.evaluate(()=>Seen3DPreview.state.seated),'C04');assert.deepEqual(await page.evaluate(()=>Seen3DPreview.state.position),seated);
  await page.locator('#stand-up').click();await page.waitForFunction(()=>!Seen3DPreview.state.seated);await page.waitForTimeout(700);
  const from=await page.evaluate(()=>Seen3DPreview.state.position);await page.evaluate(from=>Seen3DPreview.goTo(from.x,from.y+.45),from);await page.waitForTimeout(600);
  const after=await page.evaluate(()=>Seen3DPreview.state.position);assert(after.y<.86,'a floor destination inside a chair stays outside its collision footprint');
  await page.locator('#return-lobby').click();await page.waitForFunction(()=>Seen3DPreview.state.room==='lobby'&&!Seen3DPreview.state.transitioning,{},{timeout:20000});
  await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>Seen3DPreview.state.room),'lobby');assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
test('the 3D arcade shares all three quizzes and saves one Top 10 result under the chosen nickname',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{const {page,errors}=await pageFor(browser,393,852);
  await page.locator('#room-picker').selectOption('arcade');await page.waitForFunction(()=>Seen3DPreview.state.room==='arcade'&&!Seen3DPreview.state.transitioning,{},{timeout:15000});
  await page.locator('[data-machine="all"]').click();await page.waitForFunction(()=>document.querySelector('#player-name-dialog').open,{},{timeout:15000});
  await page.locator('#player-name').fill('3D 관객');await page.locator('#player-name-dialog button[type="submit"]').click();await page.locator('#confirm-game-start').click();
  for(let i=0;i<5;i++){const answer=await page.evaluate(i=>seenQuizQuestions.filter(q=>q.mode==='all')[i].answer,i);await page.locator(`[data-game-answer="${answer}"]`).click();await page.locator('#game-quiz .game-next').click()}
  await page.waitForFunction(()=>document.querySelectorAll('.scoreboard-table tbody tr').length===10&&window.__scoreWrites.length===1);
  assert.equal(await page.locator('.scoreboard-player').first().textContent(),'3D 관객YOU');assert.equal(await page.evaluate(()=>window.__scoreWrites[0].nickname),'3D 관객');
  await page.locator('#game-room [data-language-toggle]').click();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__scoreWrites.length),1,'language switching does not resubmit a score');
  await page.locator('#leave-game').click();
  for(const mode of ['eyes','films']){await page.locator(`[data-machine="${mode}"]`).click();await page.waitForFunction(()=>document.querySelector('#game-confirm').open,{},{timeout:15000});await page.locator('#confirm-game-start').click();assert.equal(await page.locator('#game-room').getAttribute('data-mode'),mode);assert.equal(await page.locator('[data-game-answer]').count(),4);await page.keyboard.press('Escape')}
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});

test('all four 3D screenings open their own article route, and Back retains the room',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{for(const[index,id]of ['table','ladybird','yang','minari'].entries()){
  const{page,errors}=await pageFor(browser,393,852,'#read/'+id);await page.waitForFunction(()=>document.querySelector('#reader').open,{},{timeout:15000});assert.equal(await page.evaluate(()=>Seen3DPreview.state.room),`screen-${index+1}`);
  const expected=await page.evaluate(id=>screeningArticles[id].title,id);assert.equal(await page.locator('#reader-title').textContent(),expected);await page.goBack();await page.waitForFunction(()=>!document.querySelector('#reader').open);assert.equal(await page.evaluate(()=>Seen3DPreview.state.room),`screen-${index+1}`);assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close()}
});
