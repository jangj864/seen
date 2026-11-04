const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');

const dist=path.join(__dirname,'../dist');
const fixture=`<!doctype html><html><head><meta charset="utf-8"><title>SEEN Cinema — Issue 02</title>
 <script defer src="/i18n-data.js"></script><script defer src="/i18n.js"></script>
 <script defer src="/core.js"></script><script defer src="/onboarding.js"></script>
 </head><body class="is-entering"><header class="site-header"></header><main><canvas id="world" tabindex="0"></canvas></main><footer class="site-footer"></footer>
 <section id="welcome" tabindex="-1"><div class="welcome-top"></div><form id="welcome-form">
 <label for="welcome-name">WHAT SHOULD WE CALL YOU?</label><input id="welcome-name" maxlength="20">
 <label id="welcome-status" for="welcome-progress" role="status">Preparing the cinema…</label><progress id="welcome-progress" value="0" max="100"></progress>
 <button id="welcome-enter" disabled>PREPARING THE CINEMA…</button></form>
 <ol class="welcome-steps"><li><b>01</b><span id="welcome-controls"></span></li><li><b>02</b> Controls</li></ol></section></body></html>`;

async function openFixture(browser,{language='en',pending=true}={}){
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(value=>localStorage.setItem('seen-language',value),language);
 await page.route('http://seen.test/**',route=>{
  const name=new URL(route.request().url()).pathname.slice(1);
  if(name==='pending-poster.jpg'&&pending)return; // Deliberately never finishes.
  if(name.endsWith('.jpg'))return route.abort('failed');
  if(name==='core.js')return route.fulfill({contentType:'text/javascript',body:`
   const canvas=document.querySelector('#world');const images={poster:new Image(),missing:new Image()};
   images.poster.src='/pending-poster.jpg';images.missing.src='/missing-artwork.jpg';
   const SeenHub={name:'Guest QA',join:name=>{window.joinedName=name}};
   document.addEventListener('seen-welcome-complete',()=>window.admitted=true);
  `});
  if(['i18n-data.js','i18n.js','onboarding.js'].includes(name))return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(dist,name),'utf8')});
  return route.fulfill({contentType:'text/html',body:fixture});
 });
 await page.goto('http://seen.test/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!document.querySelector('#welcome-enter').disabled,{},{timeout:1500});
 return {page,errors};
}

test('a poster pending indefinitely does not block admission, validation or keyboard focus',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{
  const {page,errors}=await openFixture(browser);
  assert.equal(await page.locator('#welcome-enter').textContent(),'ENTER THE CINEMA ↗');
  assert.equal(await page.locator('#welcome-name').evaluate(input=>input===document.activeElement),true);
  assert.equal(await page.locator('main').evaluate(main=>main.inert),true);
  await page.waitForFunction(()=>document.querySelector('#welcome-progress').value===50);
  assert.equal(await page.locator('#welcome-progress').evaluate(bar=>bar.value),50,'Pending poster remains pending in the progress bar');
  assert.equal(await page.locator('#welcome-status').textContent(),'Ready to enter. Some artwork may finish loading inside.');
  await page.evaluate(()=>SeenI18n.setLanguage('ko'));
  assert.equal(await page.locator('#welcome-enter').textContent(),'영화관 입장 ↗');
  assert.equal(await page.locator('#welcome-status').textContent(),'입장할 준비가 됐어요. 일부 이미지는 입장 후에 표시될 수 있어요.');
  await page.locator('#welcome-name').fill('<');await page.locator('#welcome-enter').click();
  assert.equal(await page.locator('#welcome').isVisible(),true);
  assert.equal(await page.locator('#welcome-name').evaluate(input=>input.validationMessage),'<, >를 제외하고 2~20자로 입력하세요.');
  await page.locator('#welcome-name').fill('  영 화  ');await page.locator('#welcome-enter').click();
  assert.equal(await page.evaluate(()=>window.joinedName),'영 화');
  assert.equal(await page.evaluate(()=>window.admitted),true);
  assert.equal(await page.locator('#welcome').isVisible(),false);
  assert.equal(await page.locator('main').evaluate(main=>main.inert),false);
  assert.equal(await page.locator('#world').evaluate(canvas=>canvas===document.activeElement),true);
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});

test('failed artwork finishes progress without locking the Korean admission form',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{
  const {page,errors}=await openFixture(browser,{language:'ko',pending:false});
  await page.waitForFunction(()=>document.querySelector('#welcome-progress').value===100);
  assert.equal(await page.locator('#welcome-enter').isEnabled(),true);
  assert.equal(await page.locator('#welcome-status').textContent(),'입장할 준비가 됐어요. 일부 이미지는 입장 후에 표시될 수 있어요.');
  await page.locator('#welcome-name').fill('오류 확인');await page.locator('#welcome-name').press('Enter');
  assert.equal(await page.evaluate(()=>window.joinedName),'오류 확인');
  assert.equal(await page.locator('#welcome').isVisible(),false);
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
