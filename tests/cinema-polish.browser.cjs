const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'../dist');
async function fixture(browser,width,height){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];page.on('pageerror',error=>errors.push(error.message));
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
