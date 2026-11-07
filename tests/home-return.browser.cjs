const{test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'../dist');let browser;
before(async()=>{browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})});after(async()=>{await browser?.close()});
async function fixture(t,width){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));t.after(async()=>{await page.close();assert.deepEqual(errors,[])});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='home.test')return route.fulfill({status:204,body:''});const name=decodeURIComponent(url.pathname.slice(1))||'index.html';if(name==='community-config.js')return route.fulfill({contentType:'text/javascript',body:'window.SEEN_COMMUNITY={};'});const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)})});
 return page;
}
async function login(page){await page.waitForFunction(()=>!document.querySelector('#welcome-enter').disabled);await page.locator('#welcome-name').fill('Home return QA');await page.locator('#welcome-enter').click()}
async function ready(page){await page.waitForFunction(()=>document.querySelector('#screen-article').open&&document.querySelector('#screen-article').dataset.readingReady==='true')}
async function story(page){await page.evaluate(()=>{near=rooms[1];enter();openProgram()});await ready(page)}
async function assertHome(page){await page.waitForFunction(()=>document.body.dataset.scene==='lobby-scene'&&!document.querySelector('#screen-article').open);assert.equal(new URL(page.url()).hash,'');assert.equal(await page.locator('#welcome').isHidden(),true);assert(await page.locator('#world').isVisible());assert.equal(await page.evaluate(()=>history.state?.seenReading?.room??null),null)}
for(const width of [393,1440])for(const method of ['browser-back','home-logo','return-lobby'])test(`${method} and signing in again start at home at ${width}px`,async t=>{
 const page=await fixture(t,width);await page.goto('https://home.test/');await login(page);await story(page);
 const draft='  홈을 다녀와도 남는 감상  ';await page.locator('.comment-form textarea').fill(draft);
 if(method==='browser-back'){
  // Navigate to admission, then return to the older article document using Back.
  // Before the fix, signing in at this point automatically reopened that article.
  await page.goto('https://home.test/');await page.goBack();
  assert.equal(await page.evaluate(()=>performance.getEntriesByType('navigation')[0].type),'back_forward');
 }else{
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#screen-article').open&&!location.hash);
  if(method==='return-lobby'){await page.locator('#return-lobby').click();await assertHome(page)}
  await page.locator('.site-header .logo').click();
 }
 await login(page);await assertHome(page);
 await page.reload();await login(page);await assertHome(page);
 await story(page);assert.equal(await page.locator('.comment-form textarea').inputValue(),draft,'returning home preserves the unposted draft');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#screen-article').open&&!location.hash);
 await page.locator('#return-lobby').click();await assertHome(page);
});
test('direct article links, refresh and in-session Back/Forward still restore the selected article',async t=>{
 const page=await fixture(t,1280);await page.goto('https://home.test/#read/ladybird');await login(page);await ready(page);
 await page.reload();await login(page);await ready(page);assert.equal(new URL(page.url()).hash,'#read/ladybird');
 await page.goBack();await page.waitForFunction(()=>!document.querySelector('#screen-article').open);assert.equal(await page.evaluate(()=>document.body.dataset.scene),'screening');
 await page.goForward();await ready(page);assert.equal(new URL(page.url()).hash,'#read/ladybird');
});
