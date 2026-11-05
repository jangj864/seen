const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.join(__dirname,'../dist');
// This suite serves repository files and disables the backend; it never posts a public comment.
test('cinema restores article progress and exact drafts across close, Back, Forward and reload',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='seen.test')return route.fulfill({status:204,body:''});
   let name=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
   if(name==='community-config.js')return route.fulfill({contentType:'text/javascript',body:'window.SEEN_COMMUNITY={};'});
   const file=path.join(root,name);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
   let body=fs.readFileSync(file);
   if(name==='index.html'){
    let html=body.toString();
    for(const source of ['film-catalog.js','world-camera.js','reading-state.js'])if(!html.includes('src="'+source))html=html.replace(/(<script[^>]*src="cinema\.js[^>]*>)/,'<script defer src="'+source+'"></script>$1');
    body=html;
   }
   const contentType=({'.js':'text/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'})[path.extname(name)]||'application/octet-stream';
   return route.fulfill({contentType,body});
  });
  async function enterWelcome(){if(errors.length)throw Error(errors.join(' | '));await page.waitForFunction(()=>!document.querySelector('#welcome-enter').disabled);await page.locator('#welcome-name').fill('Reading QA');await page.locator('#welcome-enter').click()}
  async function ready(){await page.waitForFunction(()=>document.querySelector('#screen-article').open&&document.querySelector('#screen-article').dataset.readingReady==='true')}
  async function close(){await page.locator('#back-to-seats').click();await page.waitForFunction(()=>!document.querySelector('#screen-article').open&&!location.hash)}
  const field=page.locator('#screen-article textarea[name="body"]');
  await page.goto('https://seen.test/#read/table');
  await enterWelcome();await ready();
  assert.equal(await page.evaluate(()=>currentRoom.article),'table');
  const draft='  내가 직접 쓴 감상\nYour name  ';
  await field.fill(draft);await page.evaluate(()=>document.querySelector('#screen-article-content').scrollTop=1100);
  await close();await page.evaluate(()=>openProgram());await ready();
  assert.equal(await field.inputValue(),draft);
  assert.ok(await page.evaluate(()=>document.querySelector('#screen-article-content').scrollTop)>1000);
  await page.evaluate(()=>SeenI18n.setLanguage('ko'));
  assert.equal(await field.inputValue(),draft);assert.equal(new URL(page.url()).hash,'#read/table');
  await close();await page.evaluate(()=>{near=rooms[1];enter();openProgram()});await ready();
  assert.equal(await field.inputValue(),'');assert.equal(await page.evaluate(()=>document.querySelector('#screen-article-content').scrollTop),0);
  await close();await page.evaluate(()=>{near=rooms[0];enter();openProgram()});await ready();
  assert.equal(await field.inputValue(),draft);
  await page.goBack();await page.waitForFunction(()=>!document.querySelector('#screen-article').open);
  assert.equal(await page.evaluate(()=>document.body.dataset.scene),'screening');
  await page.goForward();await ready();assert.equal(await field.inputValue(),draft);
  await page.reload();await enterWelcome();await ready();assert.equal(await field.inputValue(),draft);
  assert.ok(await page.evaluate(()=>document.querySelector('#screen-article-content').scrollTop)>900);
  await page.evaluate(()=>document.dispatchEvent(new CustomEvent('seen-comment-posted',{detail:{articleId:'table',body:'old submission'}})));
  assert.equal(await field.inputValue(),draft);
  await page.evaluate(value=>document.dispatchEvent(new CustomEvent('seen-comment-posted',{detail:{articleId:'table',body:value.trim()}})),draft);
  assert.equal(await field.inputValue(),'');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#screen-article').open&&!location.hash);
  await page.evaluate(()=>openProgram());await ready();assert.equal(await field.inputValue(),'');
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
