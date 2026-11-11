const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
let browser;
before(async()=>{browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})});
after(async()=>{await browser?.close()});

// The hub is local to this fixture: no presence, seat requests, or replies leave the browser.
async function setup(t){
 const page=await browser.newPage();t.after(()=>page.close());
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setContent('<!doctype html><body data-scene="screening"><header class="site-header"></header><main id="scene-content"><canvas id="room-world" tabindex="0"></canvas></main></body>');
 await page.addScriptTag({content:`
  const seenCloseIcon='×',seenFontRevision=0;
  function seenSetStyle(element,name,value){element.style[name]=value}
  const pending=[],replies=[],held=new Set(),released=[],accepted=[],worldKeys=[];
  const SeenHub={
   people:()=>[],holdNpc:person=>{if(person?.npc)held.add(person.id)},
   releaseNpc:id=>{if(id){held.delete(id);released.push(id)}},
   requestSeat:(person,options)=>new Promise((resolve,reject)=>pending.push({person,options,resolve,reject})),
   replySeat:(req,yes)=>replies.push({id:req.requestId,yes})
  };
  function openSeat(id,npc=false){SeenTalk.askSeat({id,name:id,npc,x:.2,y:.2},{scene:'screen-01',seatId:'A01',onYes:()=>accepted.push(id)})}
  function openOther(){SeenTalk.staff({id:'other',name:'Other guest',npc:true,x:.2,y:.2})}
 `});
 await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'../dist/conversation.js'),'utf8')});
 await page.evaluate(()=>{
  SeenTalk.nearby({scene:'screen-01',x:0,y:0,project:()=>({x:300,y:420}),canvas:document.querySelector('#room-world')});
  window.addEventListener('keydown',event=>worldKeys.push(event.code));
 });
 t.after(()=>assert.deepEqual(errors,[]));
 return page;
}
const ask=page=>page.getByRole('button',{name:'Ask to change seats',exact:true}).click();

test('closing and reopening a live seat request ignores the old response',async t=>{
 const page=await setup(t);
 await page.evaluate(()=>openSeat('first'));await ask(page);
 await page.evaluate(()=>{SeenTalk.close();openOther()});
 const nextLine=await page.locator('#npc-line').textContent();
 await page.evaluate(()=>pending[0].resolve(true));
 assert.equal(await page.locator('#npc-line').textContent(),nextLine);
 assert.equal(await page.locator('#npc-dialog').getAttribute('aria-label'),'Other guest');
 assert.deepEqual(await page.evaluate(()=>accepted),[]);
 assert.deepEqual(await page.evaluate(()=>[...held]),['other']);
});

test('replaced requests cannot overwrite a newer seat request, including out-of-order replies',async t=>{
 const page=await setup(t);
 await page.evaluate(()=>openSeat('first'));await ask(page);
 await page.evaluate(()=>openSeat('second'));await ask(page);
 await page.evaluate(()=>pending[0].resolve(false));
 assert.equal(await page.locator('#npc-line').textContent(),'“Would you mind changing seats?”');
 await page.evaluate(()=>pending[1].resolve(true));
 await page.getByRole('button',{name:'Take the seat',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>accepted),['second']);
 assert.equal(await page.locator('#npc-dialog').evaluate(dialog=>dialog.open),false);
});

test('closing an NPC seat request cancels its delay without touching the replacement',async t=>{
 const page=await setup(t);
 await page.evaluate(()=>openSeat('screen-01:npc:0',true));await ask(page);
 await page.evaluate(()=>{SeenTalk.close();openOther()});
 const line=await page.locator('#npc-line').textContent();
 // Longer than the simulated NPC reply delay; live requests use no real timers here.
 await page.waitForTimeout(750);
 assert.equal(await page.locator('#npc-line').textContent(),line);
 assert.deepEqual(await page.evaluate(()=>[...held]),['other']);
 assert.deepEqual(await page.evaluate(()=>accepted),[]);
});

test('Escape declines an incoming request once and a replacement ignores detached buttons',async t=>{
 const page=await setup(t);
 await page.evaluate(()=>{
  SeenTalk.incoming({scene:'screen-01',from:'visitor',name:'Visitor',seatId:'B01',requestId:'incoming-1'},()=>accepted.push('incoming'));
  globalThis.oldAccept=document.querySelector('.talk-options button:last-child');
  openOther();oldAccept.click();
 });
 assert.deepEqual(await page.evaluate(()=>replies),[{id:'incoming-1',yes:false}]);
 assert.deepEqual(await page.evaluate(()=>accepted),[]);
 await page.evaluate(()=>SeenTalk.incoming({scene:'screen-01',from:'visitor',name:'Visitor',seatId:'B01',requestId:'incoming-2'},()=>accepted.push('incoming')));
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#npc-dialog').evaluate(dialog=>dialog.open),false);
 await page.evaluate(()=>{SeenTalk.close();openOther()});
 assert.deepEqual(await page.evaluate(()=>replies),[{id:'incoming-1',yes:false},{id:'incoming-2',yes:false}]);
 assert.deepEqual(await page.evaluate(()=>[...held]),['other']);
});

test('a failed current live request remains usable and lets the visitor choose another seat',async t=>{
 const page=await setup(t);
 await page.evaluate(()=>openSeat('unreachable'));await ask(page);
 await page.evaluate(()=>pending[0].reject(Error('offline')));
 assert.match(await page.locator('#npc-line').textContent(),/No reply yet/);
 await page.getByRole('button',{name:'Choose another seat',exact:true}).click();
 assert.equal(await page.locator('#npc-dialog').evaluate(dialog=>dialog.open),false);
 assert.deepEqual(await page.evaluate(()=>accepted),[]);
});

test('focused dialog buttons retain native Space and Enter activation while world keys pause',async t=>{
 const page=await setup(t);
 await page.evaluate(()=>openOther());
 await page.getByRole('button',{name:'Recommend a film',exact:true}).focus();
 await page.keyboard.press('Space');
 assert.match(await page.locator('#npc-line').textContent(),/Family, on screen/);
 await page.keyboard.press('ArrowRight');await page.keyboard.press('w');
 assert.deepEqual(await page.evaluate(()=>worldKeys),[]);
 await page.locator('.talk-close').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('#npc-dialog').evaluate(dialog=>dialog.open),false);
 await page.evaluate(()=>openOther());
 await page.locator('.talk-close').focus();await page.keyboard.press('Space');
 assert.equal(await page.locator('#npc-dialog').evaluate(dialog=>dialog.open),false);
 await page.locator('#room-world').focus();await page.keyboard.press('Space');
 assert.deepEqual(await page.evaluate(()=>worldKeys),['Space']);
});
