const{test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'../dist');let browser;
before(async()=>{browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})});after(async()=>{await browser?.close()});
// Local test data only: never insert scores or comments into the live service.
const sdk=`window.arcadeQA={writes:[]};const channel={on(){return this},presenceState(){return{}},subscribe(cb){queueMicrotask(()=>cb('SUBSCRIBED'));return this},track(){return Promise.resolve()},send(){return Promise.resolve()}};
window.supabase={
 createClient(){return{
  channel(){return channel},
  from(){return{async insert(row){arcadeQA.writes.push(row);return{error:null}}}},
  async rpc(){return{error:null,data:{entries:Array.from({length:10},(_,i)=>({rank:i+1,nickname:i?'Player '+(i+1):'Arcade QA',score:i?8:9,total:10,is_current:!i})),current:{rank:1,nickname:'Arcade QA',score:9,total:10}}}}
 }}
};`;
async function fixture(t,width,height){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));t.after(async()=>{await page.close();assert.deepEqual(errors,[])});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='cabinet.test')return route.fulfill({status:204,body:''});const name=decodeURIComponent(url.pathname.slice(1))||'index.html';
  if(name==='community-config.js')return route.fulfill({contentType:'text/javascript',body:'window.SEEN_COMMUNITY={url:"https://mock.invalid",key:"test-only"};'});
  if(name.startsWith('vendor/supabase-'))return route.fulfill({contentType:'text/javascript',body:sdk});
  const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
  return route.fulfill({contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
 });await page.goto('https://cabinet.test/');assert.equal(await page.evaluate(()=>typeof arcadeQA),'object','local score service is loaded');await page.waitForFunction(()=>!document.querySelector('#welcome-enter').disabled);await page.locator('#welcome-name').fill('Arcade QA');await page.locator('#welcome-enter').click();await page.evaluate(()=>enterGame());await page.mouse.move(0,0);return page;
}
async function cardsFit(page){
 const layout=await page.evaluate(()=>{
  const room=document.querySelector('#game-room'),screen=room.querySelector('.arcade-machine'),heading=room.querySelector('.game-question h3'),cards=[...room.querySelectorAll('[data-game-answer]')];
  return{room:room.getBoundingClientRect().toJSON(),screen:screen.getBoundingClientRect().toJSON(),heading:heading.getBoundingClientRect().toJSON(),cards:cards.map(e=>({rect:e.getBoundingClientRect().toJSON(),label:e.querySelector('strong').getBoundingClientRect().toJSON(),font:parseFloat(getComputedStyle(e.querySelector('strong')).fontSize)})),overflow:room.scrollWidth>room.clientWidth+1};
 });assert.equal(layout.overflow,false);assert(layout.room.top>=0&&layout.room.bottom<=page.viewportSize().height);assert.equal(layout.cards.length,4);
 assert(layout.heading.bottom<=layout.cards[0].rect.top-5,'question and answer cards never overlap');
 for(const {rect,label,font}of layout.cards){assert(rect.width>=90&&rect.height>=44,'cards keep usable touch targets');assert(font>=12);assert(label.top>=rect.top&&label.bottom<=rect.bottom+1,'answer text stays inside its card');assert(rect.left>=layout.screen.left&&rect.right<=layout.screen.right,JSON.stringify({rect,screen:layout.screen}))}
 return layout.screen;
}
async function eyeCropFits(page,index){
 const detail=await page.evaluate(async index=>{
  const q=seenQuizQuestions.filter(q=>q.mode==='eyes')[index],visual=document.querySelector('.game-eyes'),crop=visual.querySelector('svg'),image=crop.querySelector('image'),photo=new Image();photo.src=image.getAttribute('href');await photo.decode();
  const [x,y,w,h]=q.crop,matrix=image.getScreenCTM(),point=(x,y)=>new DOMPoint(x,y).matrixTransform(matrix);
  return{frame:visual.getBoundingClientRect().toJSON(),corners:[point(x,y),point(x+w,y+h)].map(p=>({x:p.x,y:p.y})),clip:crop.getAttribute('overflow'),viewBox:crop.getAttribute('viewBox'),expectedCrop:q.crop.join(' '),natural:[photo.naturalWidth,photo.naturalHeight],expectedSize:q.imageSize||[2000,1125]};
 },index);
 assert.equal(detail.clip,'hidden','letterboxing cannot reveal the rest of the face');assert.equal(detail.viewBox,detail.expectedCrop);assert.deepEqual(detail.natural,detail.expectedSize,'crop coordinates match the actual photo dimensions');
 for(const point of detail.corners){assert(point.x>=detail.frame.left-.5&&point.x<=detail.frame.right+.5,`question ${index+1}: the complete eye pair stays inside the horizontal frame`);assert(point.y>=detail.frame.top-.5&&point.y<=detail.frame.bottom+.5,`question ${index+1}: the complete eye pair stays inside the vertical frame`)}
}
for(const[width,height]of[[320,568],[393,852],[844,390],[1440,1000]])test(`all cabinets keep questions, feedback and rankings usable at ${width}×${height}`,async t=>{
 const page=await fixture(t,width,height);
 for(const language of ['en','ko'])for(const mode of ['all','eyes','films']){
  await page.evaluate(({language,mode})=>{SeenI18n.setLanguage(language);openQuiz(mode)},{language,mode});
  // Replaying creates a fresh round when returning to the same game mode.
  if(await page.locator('#game-quiz').getAttribute('data-state')==='complete')await page.locator('.scoreboard-actions .game-next').click();
  if(mode==='eyes')assert.equal(await page.locator('.game-eyes').getAttribute('preserveAspectRatio'),'xMidYMid meet','the complete eye crop fits its frame');
  const screen=await cardsFit(page);assert.equal(await page.locator('.cabinet-mode-icon svg').count(),1);
  for(let index=0;index<10;index++){
   await cardsFit(page);if(mode==='eyes')await eyeCropFits(page,index);
   const answer=await page.evaluate(({mode,index})=>seenQuizQuestions.filter(q=>q.mode===mode)[index].answer,{mode,index}),chosen=index===0?(answer+1)%4:answer;
   if(index===0&&width>700)await page.locator(`[data-cabinet-answer="${chosen}"]`).click();else await page.keyboard.press(index%2?'ABCD'[chosen]:String(chosen+1));
   assert.equal(await page.locator('#game-quiz').getAttribute('data-state'),index?'correct':'wrong');assert.equal(await page.locator('.game-options .correct').count(),1);assert.equal(await page.locator('.game-options .wrong').count(),index?0:1);
   assert.equal(await page.locator('.game-options button:disabled').count(),4);assert.equal(await page.locator('.game-options [aria-pressed="true"]').count(),1);
   const next=await page.locator('.game-answer-slot .game-next').boundingBox();assert(next.y>=screen.y&&next.y+next.height<=screen.y+screen.height,'next action stays on the screen');
   assert.deepEqual(await page.locator('.arcade-machine').boundingBox(),{x:screen.x,y:screen.y,width:screen.width,height:screen.height},'answering keeps the CRT frame fixed');
   await page.locator('.game-answer-slot .game-next').click();
  }
  await page.waitForFunction(()=>document.querySelector('.scoreboard-table tr.is-current'));
  assert.equal(await page.locator('.scoreboard-table tbody tr').count(),10);assert.equal(await page.locator('.scoreboard-table .is-current .scoreboard-player').innerText(),'Arcade QA'+(language==='ko'?'나':'YOU'));
  const table=page.locator('.scoreboard-table-scroll');await table.evaluate(e=>e.scrollTop=e.scrollHeight);assert(await page.locator('.scoreboard-table tbody tr:last-child').isVisible());
  assert.equal(await page.locator('.scoreboard-actions .game-next').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#game-room').isVisible(),false);
 }
 assert.equal(await page.evaluate(()=>arcadeQA.writes.length),6,'one score per completed round');assert((await page.evaluate(()=>arcadeQA.writes)).every(row=>row.nickname==='Arcade QA'&&row.answers.length===10));
});

// Regression: feedback used to shrink the question pane and clip the bottom cards.
test('eye answers keep complete card borders above the explanation after a wrong answer',async t=>{
 for(const [width,height]of [[1440,1000],[1280,800],[960,740],[960,680],[960,510],[393,700],[320,568]]){
  for(const language of ['en','ko']){
   const page=await fixture(t,width,height);
   await page.evaluate(language=>{SeenI18n.setLanguage(language);openQuiz('eyes')},language);
   const before=await page.locator('.game-question').boundingBox();
   await page.keyboard.press('4');await page.locator('.game-next').click();await page.keyboard.press('4');
   const layout=await page.evaluate(()=>{const rect=e=>e.getBoundingClientRect().toJSON(),question=document.querySelector('.game-question');return{question:rect(question),cards:[...document.querySelectorAll('[data-game-answer]')].map(rect),feedback:rect(document.querySelector('.game-answer-slot')),next:rect(document.querySelector('.game-next'))}});
   assert.equal(layout.question.height,before.height,'answering reserves the same space for the cards');
   for(const card of layout.cards){assert(card.top>=layout.question.top&&card.bottom+3<=layout.question.bottom,'all four card borders and shadows remain visible');assert(card.bottom+3<=layout.feedback.top||card.right+3<=layout.feedback.left,'feedback never covers the answer grid')}
   assert(layout.next.bottom<=height);await page.keyboard.press('Escape');
  }
 }
});
