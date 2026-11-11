const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.join(__dirname,'../dist');

test('magazine credits follow all five catalog releases and translate alongside the shared articles',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='seen.test')return route.fulfill({status:204,body:''});
   const name=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'magazine.html',file=path.join(root,name);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
   const contentType=({'.js':'text/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'})[path.extname(name)]||'application/octet-stream';
   return route.fulfill({contentType,body:fs.readFileSync(file)});
  });
  await page.goto('https://seen.test/magazine.html#read/credits',{waitUntil:'domcontentloaded'});
  const upcoming=page.locator('#article-content .article-body > ul').nth(0),shelf=page.locator('#article-content .article-body > ul').nth(1);
  assert.equal(await upcoming.locator('li').count(),5);
  assert.equal(await shelf.locator('li').count(),3);
  const catalog=await page.evaluate(()=>SeenFilmCatalog.upcoming.map(({id,title,studio,date,url})=>({id,title,studio,date,url})));
  const english=await upcoming.locator('li').allTextContents(),links=await upcoming.locator('li > a:first-child').evaluateAll(anchors=>anchors.map(anchor=>anchor.href));
  for(const [index,film]of catalog.entries()){
   assert.ok(english[index].includes(film.title),film.id);
   assert.ok(english[index].includes(film.date),film.id);
   assert.ok(english[index].includes(film.studio),film.id);
   assert.equal(links[index],film.id==='focker'?film.url+'synopsis/':film.url,film.id);
  }
  const extra=upcoming.locator('li').nth(1).locator('a').nth(1);
  assert.equal(await extra.textContent(),'Official story announcement');
  await page.evaluate(()=>SeenI18n.setLanguage('ko'));
  const translations=await page.evaluate(()=>window.SEEN_KO_CREDIT_LISTS);
  for(const [index,item]of translations['2'].entries()){
   const row=upcoming.locator('li').nth(index);
   assert.equal(await row.locator('a').first().textContent(),item[0]);
   assert.ok((await row.textContent()).includes(item[1]));
  }
  assert.deepEqual(await upcoming.locator('li > a:first-child').evaluateAll(anchors=>anchors.map(anchor=>anchor.href)),links,'Translation retains the canonical source links');
  assert.equal(await extra.textContent(),'공식 줄거리 발표');
  for(const [index,item]of translations['4'].entries())assert.equal(await shelf.locator('li').nth(index).locator('a').textContent(),item[0]);
  await page.evaluate(()=>SeenI18n.setLanguage('en'));
  assert.deepEqual(await upcoming.locator('li').allTextContents(),english,'English restores the full source register');
  await page.evaluate(()=>{closeArticle();openArticle('about');SeenI18n.setLanguage('ko')});
  const about=page.locator('#article-content .article-body');
  assert.match(await about.locator('p').first().textContent(),/^SEEN은 영화 잡지입니다/);
  assert.match(await about.locator('p').nth(1).textContent(),/개봉 예정작 다섯 편/);
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
