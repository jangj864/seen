const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'../dist');
async function fixture(browser,width,height,motion='reduce'){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:motion}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='cinema-polish.test')return route.abort();const name=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.slice(1));if(name==='community-config.js')return route.fulfill({contentType:'text/javascript',body:'window.SEEN_COMMUNITY={};'});const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)})});
 await page.goto('https://cinema-polish.test/');await page.waitForFunction(()=>!document.querySelector('#welcome-enter').disabled);await page.locator('#welcome-name').fill('Head Anchor QA');await page.locator('#welcome-enter').click();return{page,errors};
}
test('KR/EN language labels, speaker icon states and the small-screen intro stay usable',async()=>{
 const browser=await chromium.launch({channel:'chrome'});try{for(const width of[320,393]){
  const{page,errors}=await fixture(browser,width,852),language=page.locator('.site-header [data-language-toggle]');assert.equal(await language.textContent(),'KR');await language.click();assert.equal(await language.textContent(),'EN');await language.click();assert.equal(await language.textContent(),'KR');
  const sound=page.locator('.sound-toggle');assert.equal(await sound.locator('svg').count(),1);assert.equal(await sound.textContent(),'');const off=await sound.locator('path').last().getAttribute('d');await sound.click();assert.equal(await sound.getAttribute('aria-pressed'),'true');assert.notEqual(await sound.locator('path').last().getAttribute('d'),off);await sound.click();assert.equal(await sound.getAttribute('aria-pressed'),'false');
  const layout=await page.locator('#lobby-scene .intro .eyebrow').evaluate(element=>{const r=element.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width,height:r.height,overflow:element.scrollWidth>element.clientWidth+1,documentOverflow:document.documentElement.scrollWidth>innerWidth+1}});assert(layout.left>=0&&layout.right<=width);assert(!layout.overflow&&!layout.documentOverflow);assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close()}
});
test('open arcade leaves swing inside the doorway and head labels use a foreground canvas',async()=>{
 const browser=await chromium.launch({channel:'chrome'});try{const{page,errors}=await fixture(browser,1440,1000);
  const leaves=await page.evaluate(()=>{const original=poly,polygons=[];poly=(points,color)=>{if(['#3e6a50','#335c46'].includes(color))polygons.push(points);original(points,color)};gameOpen=1;gameEntrance();poly=original;return polygons});assert.equal(leaves.length,2);for(const leaf of leaves)for(const point of leaf)assert(point[0]<=.421,'a door leaf must not swing toward the upcoming-film panel');
  await page.evaluate(()=>{player={x:1.25,y:6};gameOpen=1;draw()});const layer=page.locator('#lobby-scene .seen-name-layer');assert.equal(await layer.count(),1);assert.equal(await layer.evaluate(e=>getComputedStyle(e).pointerEvents),'none');assert(Number(await layer.evaluate(e=>getComputedStyle(e).zIndex))>Number(await page.locator('#browse-upcoming').evaluate(e=>getComputedStyle(e).zIndex||0)));
  await page.screenshot({path:'/tmp/seen-door-and-labels-fixed.png'});assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});

test('screen descriptions appear only while hovering a doorway, including after returning nearby',async()=>{
 const browser=await chromium.launch({channel:'chrome'});try{const{page,errors}=await fixture(browser,1440,1000),note=page.locator('#lobby-scene .corner-note');
  assert(await note.isHidden(),'no default description is shown on admission');
  await page.evaluate(()=>{player=roomApproach(rooms[0]);setNear();draw()});assert(await note.isHidden(),'standing near a room does not count as hovering');
  for(let index=0;index<4;index++){
   const pos=await page.evaluate(index=>{const room=rooms[index],q=p(room.x+.8,room.y+.3,1.7),rect=canvas.getBoundingClientRect();return{x:q.x+rect.left,y:q.y+rect.top,title:room.name}},index);
   await page.mouse.move(pos.x,pos.y);assert(await note.isVisible());assert.equal(await note.locator('strong').textContent(),pos.title);
   await page.mouse.move(10,10);assert(await note.isHidden(),'leaving the canvas removes the description even near a door');
  }
  await page.evaluate(()=>{near=rooms[0];enter();leaveScreening()});assert(await note.isHidden(),'returning to the lobby does not reopen the description');
  const pos=await page.evaluate(()=>{const room=rooms[0],q=p(room.x+.8,room.y+.3,1.7),rect=canvas.getBoundingClientRect();return{x:q.x+rect.left,y:q.y+rect.top}});await page.mouse.move(pos.x,pos.y);assert(await note.isVisible());
  await page.mouse.move(30,800);assert(await note.isHidden(),'moving onto the floor removes the description');assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});

test('screen entry opens curtains while keeping the projection at a fixed size',async()=>{
 const browser=await chromium.launch({channel:'chrome'});try{const{page,errors}=await fixture(browser,1440,1000,'no-preference');
  await page.evaluate(()=>{const ctx=document.querySelector('#room-world').getContext('2d'),draw=ctx.drawImage;window.__stageTransforms=[];ctx.drawImage=function(image,...args){if(image===document.querySelector('#screen-still'))window.__stageTransforms.push([...Object.values(this.getTransform().toJSON())]);return draw.call(this,image,...args)};near=rooms[0];enter()});
  await page.waitForFunction(()=>window.__stageTransforms.length>0);
  const initial=await page.locator('#room-world').evaluate(e=>({progress:+e.dataset.curtainProgress,position:e.dataset.position,rect:e.getBoundingClientRect().toJSON()}));assert(initial.progress<.1);
  await page.waitForFunction(()=>+document.querySelector('#room-world').dataset.curtainProgress>.2);
  const middle=await page.locator('#room-world').evaluate(e=>({progress:+e.dataset.curtainProgress}));assert(middle.progress<1);
  await page.evaluate(()=>document.querySelector('#screen-still').dispatchEvent(new Event('load')));assert((await page.locator('#room-world').evaluate(e=>+e.dataset.curtainProgress))>=middle.progress);
  await page.waitForFunction(()=>document.querySelector('#room-world').dataset.curtainState==='open');
  const final=await page.locator('#room-world').evaluate(e=>({progress:+e.dataset.curtainProgress,position:e.dataset.position,rect:e.getBoundingClientRect().toJSON()}));assert.equal(final.progress,1);assert.equal(final.position,initial.position);assert.deepEqual(final.rect,initial.rect);const matrices=await page.evaluate(()=>window.__stageTransforms);for(const matrix of matrices)assert.deepEqual(matrix,matrices[0],'the actual canvas projection matrix stays fixed while the curtains open');
  for(let i=1;i<4;i++){await page.evaluate(i=>{leaveScreening();near=rooms[i];enter()},i);assert.equal(await page.locator('#room-world').getAttribute('data-curtain-state'),'opening');assert.equal(await page.locator('#room-world').getAttribute('data-screen-scale'),null)}
  await page.locator('#read-story').click();const paused=await page.locator('#room-world').getAttribute('data-curtain-progress');await page.waitForTimeout(350);assert.equal(await page.locator('#room-world').getAttribute('data-curtain-progress'),paused);await page.locator('#back-to-seats').click();await page.waitForFunction(()=>document.querySelector('#room-world').dataset.curtainState==='open');assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});

test('reduced motion shows the fully opened stage immediately',async()=>{
 const browser=await chromium.launch({channel:'chrome'});try{const{page,errors}=await fixture(browser,393,852);
  await page.evaluate(()=>{near=rooms[0];enter()});assert.equal(await page.locator('#room-world').getAttribute('data-curtain-state'),'open');assert.equal(await page.locator('#room-world').getAttribute('data-curtain-progress'),'1.0000');assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});

test('the audience reading view fills the theater and keeps text and close controls usable on small screens',async()=>{
 const browser=await chromium.launch({channel:'chrome'});try{for(const[index,[width,height]]of [[320,568],[393,852],[844,390],[1440,1000]].entries()){
  const{page,errors}=await fixture(browser,width,height);await page.evaluate(index=>{near=rooms[index];enter();openProgram()},index);await page.waitForFunction(()=>document.querySelector('#screen-article').dataset.readingReady==='true');
  const layout=await page.evaluate(()=>{const dialog=document.querySelector('#screen-article'),paper=document.querySelector('#screen-article-content'),close=document.querySelector('#back-to-seats'),seat=document.querySelector('.reading-seats');return{dialog:dialog.getBoundingClientRect().toJSON(),paper:paper.getBoundingClientRect().toJSON(),close:close.getBoundingClientRect().toJSON(),seat:seat.getBoundingClientRect().toJSON(),overflow:dialog.scrollWidth>dialog.clientWidth+1,radius:parseFloat(getComputedStyle(dialog).borderRadius),text:parseFloat(getComputedStyle(document.querySelector('.screen-article-body')).fontSize),decor:getComputedStyle(document.querySelector('.reading-room')).pointerEvents}});
  assert.equal(layout.dialog.width,width);assert.equal(layout.dialog.height,height);assert.equal(layout.radius,0);assert.equal(layout.overflow,false);assert(layout.paper.left>=12&&layout.paper.right<=width-12);assert(layout.close.width>=40&&layout.close.height>=40);assert(layout.close.right<=width&&layout.close.top>=0);assert(layout.text>=16);assert.equal(layout.decor,'none');assert(layout.seat.top<height);
  assert.equal(new URL(page.url()).hash,['#read/table','#read/ladybird','#read/yang','#read/minari'][index]);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#screen-article').open);assert(await page.locator('#room-world').evaluate(e=>e===document.activeElement));assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close()}
});
