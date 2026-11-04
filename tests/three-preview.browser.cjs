const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../dist');
async function pageFor(browser,width,height){
 const page=await browser.newPage({viewport:{width,height},hasTouch:width<700}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());if(url.origin!=='https://seen-3d.test')return route.abort();
  const file=path.resolve(root,decodeURIComponent(url.pathname.slice(1)));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Not found'});
  const contentType={'.js':'text/javascript','.html':'text/html','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
  return route.fulfill({contentType,body:fs.readFileSync(file)});
 });
 await page.goto('https://seen-3d.test/3d.html');await page.waitForFunction(()=>document.body.dataset.ready==='true',{},{timeout:30000});
 return{page,errors};
}
test('real 3D preview supports camera, model changes, walking, jump and a raycast door interaction',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{
  const {page,errors}=await pageFor(browser,1280,900);
  const initial=await page.evaluate(()=>Seen3DPreview.state);assert(initial.drawCalls>0);assert.equal(initial.characters,4);
  await page.locator('[data-view="avatar"]').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>Seen3DPreview.state.view==='avatar');
  assert.equal(await page.locator('#scene').getAttribute('data-jump'),'0.000');
  await page.locator('[data-avatar="2"]').click();assert.equal(await page.evaluate(()=>Seen3DPreview.state.avatar),2);
  await page.locator('#scene').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');await page.waitForTimeout(200);
  const moved=await page.evaluate(()=>Seen3DPreview.state.position);assert(Math.hypot(moved.x-initial.position.x,moved.y-initial.position.y)>.25);
  await page.keyboard.press('Space');await page.waitForFunction(()=>+document.querySelector('#scene').dataset.jump>.05);await page.waitForFunction(()=>document.querySelector('#scene').dataset.jump==='0.000',{},{timeout:4000});
  await page.evaluate(()=>Seen3DPreview.setView('lobby',true));
  const door=await page.evaluate(()=>Seen3DPreview.project(-1.8,1.7,-4.43));await page.mouse.click(door.x,door.y);
  await page.waitForFunction(()=>document.querySelector('#place-dialog').open,{},{timeout:15000});
  assert.equal(await page.locator('#place-title').textContent(),'우리 사이의 거리');assert.equal(await page.locator('#place-link').getAttribute('href'),'./#read/ladybird');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#place-dialog').evaluate(n=>n.open),false);
  await page.keyboard.press('Enter');assert.equal(await page.locator('#place-dialog').evaluate(n=>n.open),true);assert.equal(await page.locator('#place-title').textContent(),'우리 사이의 거리');assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
test('mobile model view and overview fit, with separate wardrobe and walking controls',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{for(const [width,height]of [[320,568],[393,852]]){
  const {page,errors}=await pageFor(browser,width,height);assert.equal(await page.evaluate(()=>Seen3DPreview.state.view),'avatar');
  const layout=await page.evaluate(()=>{
   const wardrobe=document.querySelector('.character-card').getBoundingClientRect(),jump=document.querySelector('#jump').getBoundingClientRect();
   return{overlap:wardrobe.left<jump.right&&wardrobe.right>jump.left&&wardrobe.top<jump.bottom&&wardrobe.bottom>jump.top,overflow:document.documentElement.scrollWidth>innerWidth};
  });assert.equal(layout.overlap,false);assert.equal(layout.overflow,false);
  await page.locator('[data-view="lobby"]').focus();await page.keyboard.press('Space');await page.waitForTimeout(1250);
  const corners=await page.evaluate(()=>[[-8.7,0,-5.2],[-8.7,0,5.2],[8.7,0,-5.2],[8.7,0,5.2]].map(p=>Seen3DPreview.project(...p)));
  for(const point of corners)assert(point.x>=-5&&point.x<=width+5,JSON.stringify({width,point}));assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close()}
});
test('all original character variants have finite geometry and feet at floor height',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{const {page}=await pageFor(browser,1000,800);const models=await page.evaluate(async()=>{
  const THREE=await import('three'),{createAvatar}=await import('./three-preview/avatar.js');
  return ['swoop','crop','bob'].map(style=>{const avatar=createAvatar({style});let finite=true,meshes=0;avatar.group.traverse(n=>{if(n.isMesh){meshes++;for(const key of ['position','normal'])for(const value of n.geometry.attributes[key]?.array||[])finite&&=Number.isFinite(value)}});const box=new THREE.Box3().setFromObject(avatar.group);return{style,finite,meshes,min:box.min.y,max:box.max.y}});
 });for(const model of models){assert(model.finite);assert(model.meshes<60);assert(Math.abs(model.min)<.02);assert(model.max>2&&model.max<2.5)}}finally{await browser.close()}
});
