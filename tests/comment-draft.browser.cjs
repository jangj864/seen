const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.join(__dirname,'../dist');

// This replaces the SDK itself: every insert is held in this browser until the
// test resolves it, and no request can reach a real Supabase project.
const mockSdk=`
 window.commentMock={writes:[],reads:[],pending:[],forms:[],events:[],broadcasts:[]};
 document.addEventListener('seen-comment-posted',event=>commentMock.events.push({detail:event.detail,targetIsDocument:event.target===document}));
 const mockChannel={
  on(){return this},presenceState(){return {}},
  subscribe(callback){queueMicrotask(()=>callback('SUBSCRIBED'));return this},
  track(){return commentMock.rejectSignals?Promise.reject(Error('Socket unavailable')):Promise.resolve()},
  send(message){if(message.event==='comment')commentMock.broadcasts.push(message);return commentMock.rejectSignals?Promise.reject(Error('Socket unavailable')):Promise.resolve()}
 };
 window.supabase={createClient(){return {
  channel(){return mockChannel},
  from(table){if(table!=='seen_comments')throw Error('Unexpected mock table: '+table);return {
   select(columns){return {eq(column,articleId){return {order(){return {limit(){commentMock.reads.push({columns,column,articleId});return Promise.resolve({data:[],error:null})}}}}}}},
   insert(payload){commentMock.writes.push(payload);commentMock.forms.push(document.querySelector('#screen-article .comment-form'));return new Promise(resolve=>commentMock.pending.push(resolve))}
  }}
 }}};
 window.resolveComment=result=>{const resolve=commentMock.pending.shift();if(!resolve)throw Error('No comment insert pending');resolve(result)};
`;

test('actual comment submits preserve failed and newer drafts and notify reading state after detached form success',async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[],external=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='seen.test'){external.push({url:url.href,method:route.request().method()});return route.fulfill({status:204,body:''})}
   const name=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
   if(name==='community-config.js')return route.fulfill({contentType:'text/javascript',body:'window.SEEN_COMMUNITY={url:"https://mock.invalid",key:"test-only"};'});
   if(name.startsWith('vendor/supabase-'))return route.fulfill({contentType:'text/javascript',body:mockSdk});
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
  async function ready(){await page.waitForFunction(()=>document.querySelector('#screen-article').open&&document.querySelector('#screen-article').dataset.readingReady==='true')}
  async function close(){await page.locator('#back-to-seats').click();await page.waitForFunction(()=>!document.querySelector('#screen-article').open&&!location.hash)}
  async function reopen(){await page.evaluate(()=>openProgram());await ready()}
  const form=page.locator('#screen-article .comment-form'),field=form.locator('textarea[name="body"]'),button=form.locator('button[type="submit"]');
  async function submit(value,count){await field.fill(value);await button.click();await page.waitForFunction(number=>commentMock.writes.length===number,count);assert.equal(await button.isDisabled(),true)}
  async function settle(result,eventCount){await page.evaluate(value=>resolveComment(value),result);await page.waitForFunction(count=>commentMock.events.length===count,eventCount);await page.waitForFunction(()=>!document.querySelector('#screen-article .comment-form button').disabled)}
  async function savedBody(){return page.evaluate(()=>readingState.read('table').body)}

  await page.goto('https://seen.test/#read/table');
  await page.waitForFunction(()=>!document.querySelector('#welcome-enter').disabled);
  await page.locator('#welcome-name').fill('Comment QA');await page.locator('#welcome-enter').click();
  await ready();await page.waitForFunction(()=>SeenHub.connected);
  assert.deepEqual(errors,[]);

  const failed='  실패해도 남아 있어야 할 초안  ';
  await submit(failed,1);
  await settle({error:{code:'P0001'}},0);
  assert.equal(await field.inputValue(),failed);
  assert.equal(await savedBody(),failed);
  assert.equal(await page.locator('.comment-status').textContent(),'Please wait 30 seconds before posting again.');
  assert.equal(await page.evaluate(()=>commentMock.broadcasts.length),0);

  const matching='  등록할 감상\n확인  ';
  await submit(matching,2);await page.evaluate(()=>commentMock.rejectSignals=true);await settle({error:null},1);
  assert.equal(await field.inputValue(),'');assert.equal(await savedBody(),'');
  assert.deepEqual(await page.evaluate(()=>commentMock.events[0]),{detail:{articleId:'table',body:matching.trim(),author:'Comment QA'},targetIsDocument:true});
  await close();await reopen();assert.equal(await field.inputValue(),'');

  const old='먼저 등록한 감상',newer='  기다리는 동안 쓴 새로운 초안\n그대로 보존  ';
  await submit(old,3);await field.fill(newer);await settle({error:null},2);
  assert.equal(await field.inputValue(),newer);assert.equal(await savedBody(),newer);
  await close();await reopen();assert.equal(await field.inputValue(),newer);

  const detached='이전 폼에서 제출한 감상',reopened='  다시 연 폼의 새 초안\n이전 응답과 별개  ';
  await submit(detached,4);await close();await reopen();
  assert.equal(await page.evaluate(()=>commentMock.forms[3].isConnected),false);
  assert.equal(await field.inputValue(),detached);
  await field.fill(reopened);await settle({error:null},3);
  assert.equal(await field.inputValue(),reopened);assert.equal(await savedBody(),reopened);
  assert.equal(await page.evaluate(()=>commentMock.forms[3].elements.body.value),'','The detached matching textarea clears independently');
  assert.deepEqual(await page.evaluate(()=>commentMock.events[2]),{detail:{articleId:'table',body:detached,author:'Comment QA'},targetIsDocument:true});
  await close();await reopen();assert.equal(await field.inputValue(),reopened);

  const closed='닫은 뒤 등록이 끝난 감상';
  await submit(closed,5);await close();
  // Open another article so the submitted form really is disconnected and
  // the success event must update the saved draft without an active table form.
  await page.evaluate(()=>{near=rooms[1];enter();openProgram()});await ready();
  assert.equal(await page.evaluate(()=>commentMock.forms[4].isConnected),false);
  const other='다른 기사에 쓰는 감상';await field.fill(other);
  await settle({error:null},4);
  assert.equal(await field.inputValue(),other);
  assert.equal(await savedBody(),'');
  await close();await page.evaluate(()=>{near=rooms[0];enter();openProgram()});await ready();
  assert.equal(await field.inputValue(),'');

  assert.equal(await page.evaluate(()=>commentMock.writes.length),5);
  assert.equal(await page.evaluate(()=>commentMock.events.length),4);
  assert.equal(await page.evaluate(()=>commentMock.broadcasts.length),4);
  assert.ok((await page.evaluate(()=>commentMock.writes)).every(payload=>payload.article_id==='table'&&payload.author==='Comment QA'&&typeof payload.visitor_id==='string'));
  assert.ok(external.every(request=>request.method==='GET'),'No external writes, including from the mock SDK');
  assert.ok(external.every(request=>!request.url.includes('supabase')),'No Supabase network access');
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
