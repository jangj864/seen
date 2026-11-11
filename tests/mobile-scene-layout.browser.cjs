const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'../dist'),browsers={};
before(async()=>{browsers.chrome=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});browsers.webkit=await webkit.launch()});
after(async()=>{await Promise.all(Object.values(browsers).map(browser=>browser.close()))});
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function fixture(t,engine,width,height,motion='reduce'){
 const page=await browsers[engine].newPage({viewport:{width,height},hasTouch:true,isMobile:true,reducedMotion:motion}),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));t.after(async()=>{await page.close();assert.deepEqual(errors,[])});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='layout.test')return route.fulfill({status:204,body:''});const name=decodeURIComponent(url.pathname.slice(1))||'index.html';if(name==='community-config.js')return route.fulfill({contentType:'text/javascript',body:'window.SEEN_COMMUNITY={};'});const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)})});
 await page.goto('https://layout.test/');await page.waitForFunction(()=>!document.querySelector('#welcome-enter').disabled);await page.locator('#welcome-name').fill('Layout QA');await page.locator('#welcome-enter').click();await page.evaluate(()=>document.fonts.ready);return page;
}
async function checkLayout(page,scene){
 await frame(page);const layout=await page.evaluate(scene=>{
  const section=document.querySelector(scene==='screening'?'#auditorium':'.arcade-scene'),rect=e=>e.getBoundingClientRect().toJSON(),visible=e=>!!e.getClientRects().length;
  return{map:rect(section.querySelector('.scene-map')),header:rect(section.querySelector('.room-help,.arcade-room-intro')),dock:rect(section.querySelector('.scene-dock')),canvas:rect(section.querySelector('.scene-map>canvas')),nameLayer:rect(section.querySelector('.seen-name-layer')),tools:rect(section.querySelector('.scene-view-tools')),text:[...section.querySelectorAll('.room-context,.arcade-room-intro>strong,.mobile-room-hint')].filter(visible).map(rect),controls:[...section.querySelectorAll('.scene-actions button,.scene-actions select,.touch-stick,.touch-jump')].filter(visible).map(e=>({name:e.textContent,rect:rect(e),font:parseFloat(getComputedStyle(e).fontSize),receivesPointer:(()=>{const r=rect(e),target=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return target===e||e.contains(target)})()})),pageOverflow:document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1,sceneOverflow:section.scrollHeight>section.clientHeight+1||section.scrollWidth>section.clientWidth+1};
 },scene);
 assert.equal(layout.pageOverflow,false);assert.equal(layout.sceneOverflow,false);assert(layout.map.height>=95,'the map retains a visible viewport even on a short phone');assert(layout.header.bottom<=layout.map.top+.5);assert(layout.map.bottom<=layout.dock.top+.5,'controls never cover the map');
 assert.deepEqual(layout.canvas,layout.map,'rendering and hit testing share the map viewport');for(const key of ['x','y','width','height'])assert(Math.abs(layout.nameLayer[key]-layout.canvas[key])<=1,'nameplates share the map viewport within one CSS pixel of fractional layout rounding');
 for(const text of layout.text){assert(text.bottom<=layout.map.top+.5);const a=text,b=layout.tools;assert(Math.min(a.right,b.right)-Math.max(a.left,b.left)<.5||Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)<.5,'the camera button never covers guidance or the title')}
 for(const {rect,name,receivesPointer}of layout.controls){assert(rect.height>=44&&rect.width>=44,name+' keeps a touch target');assert(rect.top>=layout.dock.top-.5&&rect.bottom<=layout.dock.bottom+.5);assert(receivesPointer,name+' receives taps without an overlay intercepting them')}
 for(const [i,a]of layout.controls.entries())for(const b of layout.controls.slice(i+1)){assert(Math.min(a.rect.right,b.rect.right)-Math.max(a.rect.left,b.rect.left)<.5||Math.min(a.rect.bottom,b.rect.bottom)-Math.max(a.rect.top,b.rect.top)<.5,'controls stay separate')}
 if(scene==='screening'){
  const screen=await page.evaluate(()=>{const detail={frame:null};document.dispatchEvent(new CustomEvent('seen-capture-screen',{detail}));return detail.frame?.matrix});assert(screen,'the projection remains available');
  if(await page.locator('#screening .scene-view-toggle').getAttribute('data-view')==='overview')for(const [x,y]of [[0,0],[800,0],[0,450],[800,450]]){const px=screen[4]+screen[0]*x,py=screen[5]+screen[1]*x+screen[3]*y;assert(px>=layout.map.left&&px<=layout.map.right&&py>=layout.map.top&&py<=layout.map.bottom,'the complete wall screen fits inside its viewport')}
  assert(await page.locator('#seat-picker').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))>=16,'Safari can focus the select without zooming the page');
 }
 return layout;
}
for(const engine of ['chrome','webkit'])for(const [width,height]of [[320,480],[320,568],[393,700],[430,780],[844,390],[768,1024]])test(`${engine}: room content stays separate from controls at ${width}×${height}`,async t=>{
 const page=await fixture(t,engine,width,height);
 for(const scene of ['screening','arcade']){
  await page.evaluate(scene=>{if(scene==='screening'){near=rooms[3];enter()}else{leaveScreening();enterGame()}},scene);
  if(scene==='arcade')await page.waitForFunction(()=>{const position=document.querySelector('#arcade-world').dataset.position;const previous=window.layoutPositionQA;window.layoutPositionQA={position,frames:previous&&position&&previous.position===position?previous.frames+1:0};return window.layoutPositionQA.frames>=5});
  for(const language of ['en','ko']){await page.evaluate(language=>SeenI18n.setLanguage(language),language);await checkLayout(page,scene)}
  const canvas=page.locator(scene==='screening'?'#room-world':'#arcade-world'),position=await canvas.getAttribute('data-position');
  await page.locator((scene==='screening'?'#screening':'#arcade-room')+' .scene-view-toggle').click();await frame(page);assert.equal(await canvas.getAttribute('data-position'),position,'changing camera never moves the character');
  await page.locator((scene==='screening'?'#screening':'#arcade-room')+' .scene-view-toggle').click();await checkLayout(page,scene);
  if(process.env.SEEN_SCREENSHOT_DIR&&width===393)await page.screenshot({path:path.join(process.env.SEEN_SCREENSHOT_DIR,`seen-space-${engine}-${scene}-393.png`)});
 }
});
for(const engine of ['chrome','webkit'])test(`${engine}: browser toolbar and orientation changes preserve room state and input alignment`,async t=>{
 const page=await fixture(t,engine,393,852);await page.evaluate(()=>{near=rooms[1];enter()});await page.locator('#seat-picker').selectOption('C04');await page.waitForFunction(()=>document.querySelector('#room-world').dataset.motion==='seated');
 for(const viewport of [{width:393,height:650},{width:844,height:390},{width:393,height:700}]){await page.setViewportSize(viewport);await checkLayout(page,'screening');assert.equal(await page.locator('#seat-picker').inputValue(),'C04');assert.equal(await page.locator('#room-world').getAttribute('data-motion'),'seated')}
 const source=await page.evaluate(()=>{const detail={frame:null};document.dispatchEvent(new CustomEvent('seen-capture-screen',{detail}));const m=detail.frame.matrix;return{x:m[4]+m[0]*400,y:m[5]+m[1]*400+m[3]*225}});await page.mouse.click(source.x,source.y);await page.waitForFunction(()=>document.querySelector('#screen-article').open&&document.querySelector('#screen-article').dataset.readingReady==='true');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#screen-article').open);await checkLayout(page,'screening');
});
test('two-finger movement and jumping release capture when a dialog, rotation or scene change interrupts touch',async t=>{
 const page=await fixture(t,'chrome',393,700,'no-preference');await page.evaluate(()=>{near=rooms[0];enter()});await frame(page);const client=await page.context().newCDPSession(page);
 async function hold(){const stick=await page.locator('#screening .touch-stick').boundingBox(),jump=await page.locator('#screening .touch-jump').boundingBox();await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:stick.x+stick.width*.8,y:stick.y+stick.height/2},{id:2,x:jump.x+jump.width/2,y:jump.y+jump.height/2}]});await page.waitForFunction(()=>document.querySelector('#screening .touch-stick').classList.contains('is-held')&&document.querySelector('#screening .touch-jump').classList.contains('is-held'))}
 async function clear(){await page.waitForFunction(()=>!document.querySelector('#screening .touch-stick').classList.contains('is-held')&&!document.querySelector('#screening .touch-jump').classList.contains('is-held'));await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
 await hold();await page.waitForFunction(()=>document.querySelector('#room-world').dataset.jumpPhase==='active');await page.evaluate(()=>openQuiz('all'));await clear();await page.keyboard.press('Escape');
 await hold();await page.setViewportSize({width:393,height:650});await clear();
 await hold();await page.evaluate(()=>leaveScreening());await clear();await page.evaluate(()=>{near=rooms[0];enter()});await page.waitForTimeout(150);assert.equal(await page.locator('#room-world').getAttribute('data-motion'),'idle');
});
