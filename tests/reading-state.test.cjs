const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function load(){const context=vm.createContext({Map,JSON,Number,decodeURIComponent,encodeURIComponent});vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/reading-state.js'),'utf8')+';globalThis.reading=SeenReading',context);return context.reading}
function storage(){let raw='';return{getItem:()=>raw,setItem:(_key,value)=>{raw=value}}}
function host(url='https://seen.test/seen/'){
 const entries=[{url:new URL(url),state:null}],listeners={};let index=0;
 const api={location:entries[0].url,sessionStorage:storage(),addEventListener:(type,handler)=>(listeners[type]||=[]).push(handler)};
 const emit=()=>{for(const handler of listeners.popstate||[])handler();for(const handler of listeners.hashchange||[])handler()};
 // Keep a stable Location-like object, as a browser does.
 const location={};for(const key of ['pathname','search','hash'])Object.defineProperty(location,key,{get:()=>entries[index].url[key]});api.location=location;
 api.history={get state(){return entries[index].state},replaceState(state,_title,url){entries[index]={state,url:new URL(url,entries[index].url)}},pushState(state,_title,url){entries.splice(index+1);entries.push({state,url:new URL(url,entries[index].url)});index++},back(){if(index){index--;emit()}},forward(){if(index<entries.length-1){index++;emit()}}};
 return{api,entries,get index(){return index}};
}
test('reading progress and exact authored drafts are isolated per article and survive this tab reload',()=>{
 const reading=load(),saved=storage(),first=reading.createStore(saved);
 first.save('table',{scroll:1245,body:'  내가 쓴 감상\nYour name  ',author:'지수'});
 first.save('ladybird',{scroll:300,body:'Another thought',author:'Alex'});
 const restored=reading.createStore(saved);
 assert.equal(restored.read('table').body,'  내가 쓴 감상\nYour name  ');
 assert.equal(restored.read('table').scroll,1245);
 assert.equal(restored.read('ladybird').body,'Another thought');
 assert.equal(restored.read('yang').body,'');
 assert.equal(restored.read('yang').scroll,0);
});
test('successful posting clears only the matching draft; a later replacement is retained',()=>{
 const store=load().createStore(storage());store.save('table',{body:'First thought',scroll:900,author:'Alex'});
 store.posted('table','First thought');assert.equal(store.read('table').body,'');assert.equal(store.read('table').scroll,900);
 store.save('table',{body:'A replacement written while posting'});store.posted('table','First thought');
 assert.equal(store.read('table').body,'A replacement written while posting');
});
test('blocked or malformed session storage still permits in-memory progress and drafts',()=>{
 const reading=load(),store=reading.createStore({getItem(){throw Error('denied')},setItem(){throw Error('denied')}});
 store.save('table',{body:'My draft',scroll:55});assert.equal(store.read('table').body,'My draft');
 assert.equal(reading.createStore({getItem:()=>'{malformed'}).read('table').scroll,0);
});
test('article routes accept known IDs without interpreting malformed or unrelated hashes',()=>{
 const {articleFromHash}=load(),ids=['table','ladybird'];
 assert.equal(articleFromHash('#read/table',ids),'table');assert.equal(articleFromHash('#read/ladybird',ids),'ladybird');
 for(const hash of ['#read/missing','#read/%ZZ','#read/table/extra','#screen/table','#read/table?x=1'])assert.equal(articleFromHash(hash,ids),null);
});
test('opening, closing and Forward restore a route without duplicate article entries',()=>{
 const browser=host(),changes=[],history=load().createHistory({host:browser.api,ids:['table','ladybird'],onChange:route=>changes.push({...route})});
 history.start();history.open('table');history.open('table');
 assert.equal(browser.entries.length,2);assert.equal(browser.api.location.hash,'#read/table');
 history.close();assert.equal(browser.index,0);assert.equal(changes.at(-1).article,null);assert.equal(changes.at(-1).room,'table');
 browser.api.history.forward();assert.equal(changes.at(-1).article,'table');
 assert.equal(browser.entries.length,2);
});
test('a pasted deep link gets a seats entry so close stays on site, including after reload',()=>{
 const browser=host('https://seen.test/seen/?issue=2#read/ladybird'),reading=load();let current;
 const first=reading.createHistory({host:browser.api,ids:['table','ladybird'],onChange:route=>{current=route}});first.start();
 assert.equal(current.article,'ladybird');assert.equal(browser.entries.length,2);
 const reload=reading.createHistory({host:browser.api,ids:['table','ladybird'],onChange:route=>{current=route}});reload.start();
 assert.equal(browser.entries.length,2);reload.close();assert.equal(browser.api.location.pathname,'/seen/');
 assert.equal(browser.api.location.search,'?issue=2');assert.equal(browser.api.location.hash,'');assert.equal(current.article,null);
 browser.api.history.forward();assert.equal(current.article,'ladybird');
});

test('one damaged entry cannot discard other saved article drafts on reload',()=>{
 const raw=JSON.stringify([null,{},'old format',['broken',[]],['ladybird',{scroll:540,body:'  남겨 둔 초안  ',author:'지수'}]]);
 const store=load().createStore({getItem:()=>raw});
 assert.equal(store.read('ladybird').body,'  남겨 둔 초안  ');assert.equal(store.read('ladybird').scroll,540);assert.equal(store.read('broken').body,'');
});

test('returning to admission clears a historical article and room without creating another entry',()=>{
 const browser=host('https://seen.test/seen/?issue=2#read/ladybird'),changes=[];
 browser.api.history.replaceState({custom:'retained',seenReading:{version:1,article:'ladybird',room:'ladybird',owned:true}},'',browser.api.location.pathname+browser.api.location.search+browser.api.location.hash);
 const history=load().createHistory({host:browser.api,ids:['table','ladybird'],onChange:route=>changes.push({...route})});
 history.start({resume:false});assert.equal(browser.api.location.hash,'');assert.equal(browser.entries.length,1);assert.equal(changes.at(-1).article,null);assert.equal(changes.at(-1).room,null);assert.equal(browser.api.history.state.custom,'retained');
 history.sync();assert.equal(changes.at(-1).article,null);
 history.open('table');history.home();assert.equal(browser.api.location.hash,'');assert.equal(changes.at(-1).room,null);assert.equal(browser.entries.length,2);
});

test('home invalidates every earlier reader entry while keeping a newly opened article usable',()=>{
 const browser=host(),changes=[],history=load().createHistory({host:browser.api,ids:['table','ladybird'],onChange:route=>changes.push({...route})});
 history.start();history.open('table');history.open('ladybird');history.home();
 browser.api.history.back();assert.equal(changes.at(-1).article,null);assert.equal(changes.at(-1).room,null);assert.equal(browser.api.location.hash,'');
 browser.api.history.back();assert.equal(changes.at(-1).room,null);assert.equal(browser.api.location.hash,'');
 browser.api.history.forward();assert.equal(changes.at(-1).room,null);
 history.open('ladybird');assert.equal(changes.at(-1).article,'ladybird');history.close();assert.equal(changes.at(-1).article,null);
});
test('a new home visit prevents a restored document from synchronizing an old article',()=>{
 const browser=host(),changes=[],reading=load();
 const old=reading.createHistory({host:browser.api,ids:['table'],onChange:route=>changes.push({...route})});old.start();old.open('table');
 const saved=browser.api.history.state;
 const fresh=reading.createHistory({host:browser.api,ids:['table'],onChange:route=>changes.push({...route})});fresh.home();
 browser.api.history.replaceState(saved,'','#read/table');old.sync();
 assert.equal(browser.api.location.hash,'');assert.equal(changes.at(-1).room,null);
});
test('article refresh and close still work when session storage is unavailable',()=>{
 const browser=host('https://seen.test/seen/#read/table'),reading=load();
 Object.defineProperty(browser.api,'sessionStorage',{get(){throw Error('denied')}});
 const first=reading.createHistory({host:browser.api,ids:['table'],onChange:()=>{}});first.start();
 let current;const restored=reading.createHistory({host:browser.api,ids:['table'],onChange:route=>{current=route}});restored.start();
 assert.equal(current.article,'table');restored.close();assert.equal(current.article,null);
});
test('home still retires older articles when storage is readable but cannot accept writes',()=>{
 const browser=host();browser.api.sessionStorage={getItem:()=> 'previous-visit',setItem(){throw Error('quota exceeded')}};
 let current;const history=load().createHistory({host:browser.api,ids:['table','ladybird'],onChange:route=>{current=route}});
 history.start();history.open('table');history.open('ladybird');history.home();browser.api.history.back();
 assert.equal(current.article,null);assert.equal(current.room,null);assert.equal(browser.api.location.hash,'');
});
