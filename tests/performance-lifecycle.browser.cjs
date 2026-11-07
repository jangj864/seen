const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'../dist');let browser;
before(async()=>{browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})});after(async()=>{await browser?.close()});
async function fixture(t){
 const page=await browser.newPage({viewport:{width:1100,height:850},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));t.after(async()=>{await page.close();assert.deepEqual(errors,[])});
 await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.frameQA={count:0,raf};window.requestAnimationFrame=fn=>raf(time=>{frameQA.count++;fn(time)})});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='lifecycle.test')return route.fulfill({status:204,body:''});const name=decodeURIComponent(url.pathname.slice(1))||'index.html';if(name==='community-config.js')return route.fulfill({contentType:'text/javascript',body:'window.SEEN_COMMUNITY={};'});const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)})});
 await page.goto('https://lifecycle.test/');await page.waitForFunction(()=>!document.querySelector('#welcome-enter').disabled);await page.locator('#welcome-name').fill('Lifecycle QA');await page.locator('#welcome-enter').click();return page;
}
test('only the visible walking scene schedules animation frames',async t=>{
 const page=await fixture(t);
 for(const scene of ['lobby','screening','arcade','lobby']){
  await page.evaluate(scene=>{if(scene==='screening'){near=rooms[1];enter()}else if(scene==='arcade'){leaveScreening();enterGame()}else if(document.body.dataset.scene==='arcade-room')leaveArcade()},scene);
  const count=await page.evaluate(()=>new Promise(resolve=>{let frames=0;frameQA.count=0;const next=()=>{if(++frames===60)resolve(frameQA.count);else frameQA.raf(next)};frameQA.raf(next)}));
  assert(count>=55&&count<=70,`${scene}: ${count} callbacks for 60 displayed frames`);t.diagnostic(`${scene}: ${count} callbacks / 60 frames`);
 }
});
test('stationary camera and nameplate layout avoid repeated DOM style mutations',async t=>{
 const page=await fixture(t);
 for(const scene of ['lobby-scene','screening','arcade-room']){
  await page.evaluate(scene=>{if(scene==='screening'){near=rooms[0];enter()}else if(scene==='arcade-room'){leaveScreening();enterGame()}},scene);
  await page.evaluate(()=>new Promise(resolve=>frameQA.raf(()=>frameQA.raf(resolve))));
  const changes=await page.evaluate(scene=>new Promise(resolve=>{
  let count=0,frames=0;const observer=new MutationObserver(records=>count+=records.length);observer.observe(document.getElementById(scene),{subtree:true,attributes:true,attributeFilter:['hidden','style']});
  const next=()=>{if(++frames===60){observer.disconnect();resolve(count)}else frameQA.raf(next)};frameQA.raf(next);
 }),scene);assert(changes<=5,`${scene}: stationary layout changed ${changes} times`);t.diagnostic(`${scene}: ${changes} layout mutations / 60 frames`);
 }
});
test('a pending seat handoff cannot move the visitor in a later auditorium visit',async t=>{
 const page=await fixture(t);
 await page.evaluate(()=>{
  near=rooms[0];enter();const people=SeenHub.people.bind(SeenHub);let busy=true;
  const person={id:'test-live',npc:false,name:'Seat QA',scene:'screen-01',x:2.46,y:5.62,posture:1};
  SeenHub.people=scene=>scene.startsWith('screen-')?(busy&&scene==='screen-01'?[person]:[]):people(scene);
  SeenTalk.canTalk=()=>true;SeenTalk.askSeat=(_person,options)=>options.onYes();
  document.querySelector('#seat-picker').value='B02';document.querySelector('#seat-picker').dispatchEvent(new Event('change'));
  leaveScreening();near=rooms[1];enter();busy=false;
 });
 await page.waitForTimeout(500);
 assert.equal(await page.locator('#room-world').getAttribute('data-motion'),'idle');
 assert.equal(await page.locator('#seat-picker').inputValue(),'');
 assert.equal(await page.evaluate(()=>seatChoices.has('02')),false);
});
test('a current seat handoff still walks to the accepted seat after it becomes free',async t=>{
 const page=await fixture(t);
 await page.evaluate(()=>{
  near=rooms[0];enter();const people=SeenHub.people.bind(SeenHub);let busy=true;
  const person={id:'test-live',npc:false,name:'Seat QA',x:2.46,y:5.62,posture:1};
  SeenHub.people=scene=>scene==='screen-01'?(busy?[person]:[]):people(scene);
  SeenTalk.canTalk=()=>true;SeenTalk.askSeat=(_person,options)=>options.onYes();
  document.querySelector('#seat-picker').value='B02';document.querySelector('#seat-picker').dispatchEvent(new Event('change'));busy=false;
 });
 await page.waitForFunction(()=>document.querySelector('#room-world').dataset.motion==='seated'&&document.querySelector('#seat-picker').value==='B02');
 assert.equal(await page.evaluate(()=>seatChoices.get('01')),'B02');
});
test('visibility changes pause scene frames and resume the current scene once',async t=>{
 const page=await fixture(t);
 const counts=await page.evaluate(async()=>{
  const measure=()=>new Promise(resolve=>{frameQA.count=0;let frames=0;const next=()=>{if(++frames===30)resolve(frameQA.count);else frameQA.raf(next)};frameQA.raf(next)});
  Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));const hidden=await measure();
  delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));const visible=await measure();return{hidden,visible};
 });assert.equal(counts.hidden,0);assert(counts.visible>=25&&counts.visible<=35,JSON.stringify(counts));
});
