const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.join(__dirname,'../dist');
let browser;
before(async()=>{browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})});
after(async()=>{await browser?.close()});

// Serve only repository files. Backend config and all external requests stay local.
async function fixture(t,viewport){
 const page=await browser.newPage({viewport,hasTouch:viewport.width<1000,isMobile:viewport.width<=700,reducedMotion:'reduce'});
 t.after(()=>page.close());
 const errors=[];page.on('pageerror',error=>errors.push(error.message));t.after(()=>assert.deepEqual(errors,[]));
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.hostname!=='seen.test')return route.fulfill({status:204,body:''});
  const name=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
  if(name==='community-config.js')return route.fulfill({contentType:'text/javascript',body:'window.SEEN_COMMUNITY={};'});
  const file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
  const contentType=({'.js':'text/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(name)]||'application/octet-stream';
  return route.fulfill({contentType,body:fs.readFileSync(file)});
 });
 await page.goto('https://seen.test/');
 await page.waitForFunction(()=>!document.querySelector('#welcome-enter').disabled);
 await page.locator('#welcome-name').fill('Scene controls QA');
 await page.locator('#welcome-enter').click();
 await page.evaluate(()=>document.fonts.ready);
 await frame(page);
 return page;
}
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'the document does not scroll horizontally')}
async function visibleControl(page,selector){
 const control=page.locator(selector);assert.equal(await control.isVisible(),true,selector+' is visible');
 const rect=await control.boundingBox(),viewport=page.viewportSize();
 assert.ok(rect.width>0&&rect.height>=35,selector+' has a usable hit area');
 assert.ok(rect.x>=0&&rect.x+rect.width<=viewport.width+1&&rect.y>=0&&rect.y+rect.height<=viewport.height+1,selector+' stays inside the viewport');
}

for(const viewport of [{width:320,height:568},{width:393,height:852},{width:844,height:390},{width:1440,height:900}]){
 test(`scene controls stay accessible and separate from touch navigation at ${viewport.width}×${viewport.height}`,async t=>{
  const page=await fixture(t,viewport);
  await noOverflow(page);
  if(viewport.width<=700){
   const toggle=page.locator('#lobby-scene .scene-view-toggle'),before=await page.evaluate(()=>({unit:scale,position:document.querySelector('#world').dataset.position}));
   assert.equal(await toggle.isVisible(),true);
   await toggle.focus();await page.keyboard.press('Space');
   await page.waitForFunction(unit=>scale<unit*.8,before.unit);
   assert.equal(await toggle.getAttribute('data-view'),'overview');
   assert.deepEqual(await page.evaluate(()=>({position:document.querySelector('#world').dataset.position,jump:document.querySelector('#world').dataset.jumpPhase})),{position:before.position,jump:'idle'});
  }
  await page.evaluate(()=>{near=rooms[0];enter()});await frame(page);
  for(const selector of ['#seat-picker','#return-lobby'])await visibleControl(page,selector);
  await noOverflow(page);
  assert.equal(await page.locator('#read-story').count(),0);
  const screen=await page.evaluate(()=>{const detail={frame:null};document.dispatchEvent(new CustomEvent('seen-capture-screen',{detail}));const m=detail.frame.matrix;return{x:m[4]+m[0]*400,y:m[5]+m[1]*400+m[3]*225}});
  await page.mouse.click(screen.x,screen.y);
  await page.waitForFunction(()=>document.querySelector('#screen-article').open&&document.querySelector('#screen-article').dataset.readingReady==='true');
  assert.ok(await page.locator('.screen-article-body').evaluate(element=>parseFloat(getComputedStyle(element).fontSize))>=16,'article text is at least 16px');
  await noOverflow(page);
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#screen-article').open&&!location.hash);await frame(page);
  assert.equal(await page.locator('#room-world').getAttribute('data-jump-phase'),'idle','clicking the screen reads without triggering a world jump');
  await page.locator('#return-lobby').click();
  assert.equal(await page.evaluate(()=>document.body.dataset.scene),'lobby-scene');
  await page.evaluate(()=>enterGame());await frame(page);
  for(let index=0;index<3;index++)await visibleControl(page,`[data-arcade-machine="${index}"]`);
  const overlaps=await page.evaluate(()=>{
   const controls=[...document.querySelectorAll('#arcade-room .touch-stick,#arcade-room .touch-jump')].filter(element=>element.getClientRects().length).map(element=>({name:element.className,rect:element.getBoundingClientRect()}));
   return [...document.querySelectorAll('[data-arcade-machine]')].flatMap(button=>{
    const a=button.getBoundingClientRect();
    return controls.filter(({rect:b})=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.5).map(({name})=>button.textContent+' overlaps '+name);
   });
  });
  assert.deepEqual(overlaps,[]);
  await noOverflow(page);
 });
}

test('touch adds a 44px person target while exact hits retain priority and mouse hits stay strict',async t=>{
 const page=await fixture(t,{width:393,height:852});
 const result=await page.evaluate(()=>{
  const first=SeenHub.people('lobby')[0];
  const isolated=(x,y,z=0)=>({x:100+(x-first.x)*1000,y:100+(y-first.y)*1000-z*10});
  const hit=(project,px,py,touch)=>SeenHub.hitPerson({scene:'lobby',project,unit:10,px,py,touch})?.id||null;
  // The narrow body is centred at x=100, y=92.55; the touch fallback extends 22px each way.
  const bounds={mouse:hit(isolated,121,92.55,false),touch:hit(isolated,122,92.55,true),outside:hit(isolated,122.1,92.55,true)};
  const shared=(x,y,z=0)=>({x:Math.abs(x-15.6)<.01?100:Math.abs(x-5.1)<.01?121:1000+x*100,y:100-z*10});
  // Leo is in front but only inside the fallback; Mia is an exact body hit behind him.
  return{first:first.id,bounds,exact:hit(shared,115,92.55,true)};
 });
 assert.equal(result.bounds.mouse,null);assert.equal(result.bounds.touch,result.first);assert.equal(result.bounds.outside,null);
 assert.equal(result.exact,'lobby:npc:0');
});
