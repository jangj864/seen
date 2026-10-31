const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');

// Run separately with Playwright available: node --test tests/textarea-localization.browser.cjs
test('Korean localizes form hints without changing drafts or authored comments',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('http://seen.test/**',route=>{
   const name=new URL(route.request().url()).pathname.slice(1);
   if(name==='i18n.js'||name==='i18n-data.js')return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(__dirname,'../dist',name),'utf8')});
   return route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"><script defer src="/i18n-data.js"></script><script defer src="/i18n.js"></script></head><body>
    <textarea id="static" placeholder="Share a thought about the article…" aria-label="Your name">Your name</textarea>
    <input id="name" placeholder="Your name" aria-label="Your name" value="Your name">
    <article class="reader-comment"><strong>Your name</strong><div><p>Share a thought about the article…</p><textarea placeholder="Your name">Your name</textarea></div></article>
    <div contenteditable="true" aria-label="Your name">Your name</div>
   </body></html>`});
  });
  await page.addInitScript(()=>localStorage.setItem('seen-language','ko'));
  await page.goto('http://seen.test/');
  assert.equal(await page.locator('#static').getAttribute('placeholder'),'기사에 관한 생각을 나눠주세요…');
  assert.equal(await page.locator('#static').getAttribute('aria-label'),'이름');
  assert.equal(await page.locator('#static').inputValue(),'Your name');
  assert.equal(await page.locator('#static').textContent(),'Your name');
  assert.equal(await page.locator('#name').getAttribute('placeholder'),'이름');
  assert.equal(await page.locator('#name').inputValue(),'Your name');
  await page.evaluate(()=>{
   const field=document.createElement('textarea');
   field.id='dynamic';
   field.placeholder='Share a thought about the article…';
   field.setAttribute('aria-label','Your name');
   field.textContent='Your name';
   document.body.append(field);
  });
  await page.waitForFunction(()=>document.querySelector('#dynamic').placeholder==='기사에 관한 생각을 나눠주세요…');
  assert.equal(await page.locator('#dynamic').getAttribute('aria-label'),'이름');
  assert.equal(await page.locator('#dynamic').inputValue(),'Your name');
  await page.locator('#dynamic').fill('내가 쓴 감상 — Your name');
  await page.evaluate(()=>SeenI18n.setLanguage('en'));
  assert.equal(await page.locator('#dynamic').getAttribute('placeholder'),'Share a thought about the article…');
  assert.equal(await page.locator('#dynamic').getAttribute('aria-label'),'Your name');
  await page.evaluate(()=>SeenI18n.setLanguage('ko'));
  assert.equal(await page.locator('#dynamic').inputValue(),'내가 쓴 감상 — Your name');
  assert.equal(await page.locator('#static').inputValue(),'Your name');
  assert.equal(await page.locator('.reader-comment strong').textContent(),'Your name');
  assert.equal(await page.locator('.reader-comment p').textContent(),'Share a thought about the article…');
  assert.equal(await page.locator('.reader-comment textarea').getAttribute('placeholder'),'Your name');
  assert.equal(await page.locator('[contenteditable]').textContent(),'Your name');
  assert.equal(await page.locator('[contenteditable]').getAttribute('aria-label'),'Your name');
  await page.evaluate(()=>document.querySelector('#dynamic').placeholder='Share a thought after the screening.');
  await page.waitForFunction(()=>document.querySelector('#dynamic').placeholder==='감상 후 생각을 나눠보세요.');
  await page.evaluate(()=>SeenI18n.setLanguage('en'));
  assert.equal(await page.locator('#dynamic').getAttribute('placeholder'),'Share a thought after the screening.');
  assert.equal(await page.locator('#dynamic').inputValue(),'내가 쓴 감상 — Your name');
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
