const {test,before,after}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../dist');let browser;
before(async()=>{browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})});
after(async()=>{await browser?.close()});
// Every backend call stays inside this fixture; refresh tests never post public data.
const sdk=`window.backendQA={clients:0,moves:0,rejectSignals:false};
const channel={on(){return this},presenceState(){return {}},subscribe(callback){queueMicrotask(()=>callback('SUBSCRIBED'));return this},
 track(){return backendQA.rejectSignals?Promise.reject(Error('socket unavailable')):Promise.resolve()},
 send(message){if(message.event==='move')backendQA.moves++;return backendQA.rejectSignals?Promise.reject(Error('socket unavailable')):Promise.resolve()}};
window.supabase={createClient(){backendQA.clients++;return{channel(){return channel},from(){return{async insert(){return{error:null}},select(){return{eq(){return{order(){return{async limit(){return{data:[],error:null}}}}}}}}}},async rpc(){return{data:{entries:[],current:{rank:1,nickname:'Refresh QA',score:2,total:5}},error:null}}}}};`;
async function fixture(t,{width=1280,brokenArtwork=false,backend=false,blockedStorage=false}={}){
 const page=await browser.newPage({viewport:{width,height:850},reducedMotion:'reduce'}),errors=[],missing=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()===404)missing.push(response.url())});
 t.after(async()=>{await page.close();assert.deepEqual(errors,[],'no runtime errors or unhandled rejections');assert.deepEqual(missing,[],'no missing site resources')});
 if(blockedStorage)await page.addInitScript(()=>{for(const key of ['localStorage','sessionStorage'])Object.defineProperty(window,key,{get(){throw new DOMException('Blocked by browser','SecurityError')}})});
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.hostname!=='refresh.test')return route.fulfill({status:204,body:''});
  const name=decodeURIComponent(url.pathname.slice(1))||'index.html';
  if(name==='community-config.js')return route.fulfill({contentType:'text/javascript',body:backend?'window.SEEN_COMMUNITY={url:"https://mock.invalid",key:"test-only"};':'window.SEEN_COMMUNITY={};'});
  if(backend&&name.startsWith('vendor/supabase-'))return route.fulfill({contentType:'text/javascript',body:sdk});
  if(brokenArtwork&&/\.(jpg|png)$/.test(name))return route.abort('failed');
  const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
  return route.fulfill({contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
 });
 return page;
}
async function enter(page){await page.waitForFunction(()=>!document.querySelector('#welcome-enter').disabled);if(await page.locator('#welcome').isHidden())return;await page.locator('#welcome-name').fill('Refresh QA');await page.locator('#welcome-enter').click()}
const ready=page=>page.waitForFunction(()=>document.querySelector('#screen-article').open&&document.querySelector('#screen-article').dataset.readingReady==='true');
for(const width of [393,1440])test(`refresh and repeated scene entry recover cleanly at ${width}px`,async t=>{
 const page=await fixture(t,{width});
 for(const hash of ['','#read/table','#read/ladybird','#read/yang','#read/minari','#read/%ZZ','#read/missing']){
  await page.goto('https://refresh.test/'+hash);await enter(page);
  const article=/^#read\/(table|ladybird|yang|minari)$/.test(hash);
  if(article)await ready(page);
  await page.reload();await enter(page);
  if(article){await ready(page);assert.equal(new URL(page.url()).hash,hash);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#screen-article').open)}
  for(let i=0;i<2;i++){await page.evaluate(()=>{enterGame();openQuiz('eyes')});assert(await page.locator('#game-room').isVisible());await page.keyboard.press('Escape');await page.evaluate(()=>leaveArcade())}
  assert(await page.locator('#world').isVisible());assert(await page.locator('link[rel="icon"]').count());
 }
});
test('malformed saved ballots cannot stop magazine initialization, and new votes and drafts survive refresh',async t=>{
 const page=await fixture(t);await page.goto('https://refresh.test/magazine.html');
 await page.evaluate(()=>{
  localStorage.setItem('seen02:votes',JSON.stringify([null,{},42,{name:7,film:'Hexed'},{name:'Mia',film:'Sunrise on the Reaping'},{name:'Mia',film:'Hexed'},{name:'Old entry',film:'Removed film'}]));
  localStorage.setItem('seen02:card','[]');localStorage.setItem('seen02:watchlist','[null,{},"hexed"]');
 });
 await page.reload();assert.match(await page.locator('#vote-results').innerText(),/1 vote on this screen/);assert(await page.locator('#quiz-content [data-answer]').count());
 await page.locator('#voter').fill('Taylor');await page.locator('input[name="film"][value="Hexed"]').check();await page.locator('#vote-form button').click();
 await page.locator('#recipient').fill('  영화 친구  ');await page.locator('#recommend-film').fill('Lady Bird');await page.locator('#reason').fill('  이 장면을 함께 보고 싶어요.  ');
 await page.reload();assert.match(await page.locator('#vote-results').innerText(),/2 votes on this screen/);assert.equal(await page.locator('#recipient').inputValue(),'  영화 친구  ');assert.equal(await page.locator('#reason').inputValue(),'  이 장면을 함께 보고 싶어요.  ');
 assert.equal(await page.locator('[data-save="hexed"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-article="ladybird"]').first().click();assert(await page.locator('#article-dialog').isVisible());await page.keyboard.press('Escape');
});
for(const options of [{blockedStorage:true},{brokenArtwork:true}])test(`refresh stays interactive with ${options.blockedStorage?'blocked storage':'failed artwork'}`,async t=>{
 const page=await fixture(t,options);await page.goto('https://refresh.test/#read/ladybird');await enter(page);await ready(page);await page.reload();await enter(page);await ready(page);
 await page.locator('#screen-article textarea').fill('잠시 저장하는 감상');await page.keyboard.press('Escape');await page.evaluate(()=>openProgram());await ready(page);assert.equal(await page.locator('#screen-article textarea').inputValue(),'잠시 저장하는 감상');
 await page.goto('https://refresh.test/magazine.html');await page.reload();assert.equal(await page.locator('#quiz-content [data-answer]').count(),4);
});
test('one backend client serves repeated entry and scores while movement serialization stays throttled',async t=>{
 const page=await fixture(t,{backend:true});await page.goto('https://refresh.test/');await enter(page);await page.waitForFunction(()=>SeenHub.connected);
 await page.evaluate(async()=>{SeenHub.join('Repeated entry');await SeenScores.submit({mode:'all',answers:[0,1,2,3,0,1,2,3,0,1],runId:crypto.randomUUID(),nickname:SeenHub.name})});assert.equal(await page.evaluate(()=>backendQA.clients),1);
 const serialized=await page.evaluate(()=>{
  const stringify=JSON.stringify,now=performance.now.bind(performance),start=now();let count=0,clock=start;
  JSON.stringify=function(value,...args){if(value?.scene==='lobby')count++;return stringify(value,...args)};performance.now=()=>clock;
  try{for(let i=0;i<600;i++){clock=start+i*16;SeenHub.publish({scene:'lobby',x:9,y:4,heading:0,posture:0,jump:0,moving:false})}}finally{JSON.stringify=stringify;performance.now=now}
  return count;
 });assert(serialized<=80,`600 idle frames only serialize ${serialized} presence packets`);t.diagnostic(`Presence serialization: ${serialized} / 600 idle frames`);
 await page.evaluate(()=>{backendQA.rejectSignals=true;SeenHub.replySeat({requestId:'test-only',from:'test-only'},false)});await page.waitForTimeout(50);
});
test('AudioContext resume failures after switching tabs do not become unhandled rejections',async t=>{
 const page=await fixture(t);await page.addInitScript(()=>{
  const node=()=>({gain:{value:0,setTargetAtTime(){}},frequency:{value:0},connect(){return this},start(){},stop(){}});
  window.AudioContext=class{constructor(){this.currentTime=0;this.destination={}}createGain(){return node()}createOscillator(){return node()}resume(){return window.rejectAudio?Promise.reject(Error('Audio device unavailable')):Promise.resolve()}suspend(){return Promise.resolve()}};
 });await page.goto('https://refresh.test/');await enter(page);await page.locator('.sound-toggle').click();assert.equal(await page.locator('.sound-toggle').getAttribute('aria-pressed'),'true');
 await page.evaluate(()=>{window.rejectAudio=true;document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>document.querySelector('.sound-toggle').getAttribute('aria-label')==='SOUND UNAVAILABLE');assert.equal(await page.locator('.sound-toggle').getAttribute('aria-pressed'),'false');
});
