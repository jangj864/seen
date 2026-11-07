const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'../dist');let browser;
const artifacts=process.env.SEEN_SCREENSHOT_DIR;
before(async()=>{browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})});after(async()=>{await browser?.close()});
async function fixture(t,width,height){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));t.after(async()=>{await page.close();assert.deepEqual(errors,[])});
 await page.addInitScript(()=>{window.posterQA={};const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image instanceof HTMLImageElement&&/-poster\.(jpg|png)$/.test(image.src)){const m=this.getTransform();posterQA[image.src.split('/').at(-1)]={args,natural:[image.naturalWidth,image.naturalHeight],matrix:[m.a,m.b,m.c,m.d]}}return draw.call(this,image,...args)}});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='poster.test')return route.fulfill({status:204,body:''});const name=decodeURIComponent(url.pathname.slice(1))||'index.html';if(name==='community-config.js')return route.fulfill({contentType:'text/javascript',body:'window.SEEN_COMMUNITY={};'});const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)})});return page;
}
async function fits(image){return image.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{fit:s.objectFit,ratio:r.width/r.height,natural:e.naturalWidth/e.naturalHeight,transform:s.transform}})}
for(const [width,height]of [[320,700],[393,852],[844,390],[1440,1000]])test(`complete posters and Korean film copy stay consistent at ${width}×${height}`,async t=>{
 const page=await fixture(t,width,height);await page.goto('https://poster.test/');await page.waitForFunction(()=>!document.querySelector('#welcome-enter').disabled);await page.locator('#welcome-name').fill('Poster QA');await page.locator('#welcome-enter').click();await page.evaluate(()=>SeenI18n.setLanguage('ko'));
 await page.waitForFunction(()=>Object.keys(posterQA).length===5);
 for(const record of Object.values(await page.evaluate(()=>posterQA))){assert.equal(record.args.length,4,'wall posters draw the complete image');assert(Math.abs(record.args[2]/record.args[3]-record.natural[0]/record.natural[1])<.001,'source pixels keep their proportions');assert(Math.abs(record.matrix[0]/.86-record.matrix[3])<.001,'the wall plane uses matching physical scales')}
 const upcoming=await page.evaluate(()=>SeenFilmCatalog.upcoming);
 for(const film of upcoming){
  await page.evaluate(id=>openFilm(upcomingFilms.find(film=>film.id===id)),film.id);await page.waitForFunction(title=>document.querySelector('#film-title').textContent===title,film.korean.title);
  assert.equal(await page.locator('#film-synopsis').textContent(),film.korean.synopsis);await page.locator('#film-poster').evaluate(e=>e.decode());
  const layout=await fits(page.locator('#film-poster'));assert.equal(layout.fit,'contain');assert(Math.abs(layout.ratio-2/3)<.01);assert(layout.natural>.6&&layout.natural<.72,'the source is a portrait poster');
  assert.equal(await page.locator('#film-title-note').isHidden(),film.korean.titleStatus!=='transliterated');
  assert(await page.locator('#film-details').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  if(artifacts&&film.id==='hunger'&&(width===393||width===1440))await page.screenshot({path:`${artifacts}/seen-posters-detail-${width}.png`});
  await page.evaluate(()=>SeenI18n.setLanguage('en'));assert.equal(await page.locator('#film-title').textContent(),film.title);assert.equal(await page.locator('#film-synopsis').textContent(),film.synopsis);assert(await page.locator('#film-title-note').isHidden());
  await page.keyboard.press('Escape');await page.evaluate(()=>SeenI18n.setLanguage('ko'));
 }
 await page.evaluate(()=>browse('upcoming'));
 for(const image of await page.locator('#lobby-board .program-cards img').all()){await image.evaluate(e=>e.decode());assert(await image.isVisible());const layout=await fits(image);assert.equal(layout.fit,'contain');assert(Math.abs(layout.ratio-2/3)<.01)}
 if(artifacts&&(width===393||width===1440))await page.screenshot({path:`${artifacts}/seen-posters-program-${width}.png`});
 await page.goto('https://poster.test/magazine.html');const films=await page.evaluate(()=>SeenFilmCatalog.magazine);
 for(const [index,film]of films.entries()){
  const card=page.locator('#films .film-card').nth(index),image=card.locator('img');await card.scrollIntoViewIfNeeded();await image.evaluate(e=>e.decode());
  assert.equal(await card.locator('h3').textContent(),film.korean.title);assert.equal(await card.locator(':scope > p').first().textContent(),film.korean.synopsis);
  const layout=await fits(image);assert.equal(layout.fit,'contain');assert(Math.abs(layout.ratio-2/3)<.01);assert(layout.natural>.6&&layout.natural<.72);
  await card.hover();assert.equal((await fits(image)).transform,'none','hover does not trim the poster');
  if(artifacts&&index===0&&(width===393||width===1440))await card.screenshot({path:`${artifacts}/seen-posters-magazine-${width}.png`});
 }
 await page.evaluate(()=>SeenI18n.setLanguage('en'));assert.deepEqual(await page.locator('#films .film-card h3').allTextContents(),films.map(film=>film.title));
});
