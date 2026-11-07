'use strict';
// Reading state stays in this tab; drafts never go to the server before posting.
const SeenReading=(()=>{
 const storageKey='seen-reading-v1',stateKey='seenReading';
 function articleFromHash(hash,ids){
  const match=/^#read\/([^/?#]+)$/.exec(hash||'');
  if(!match)return null;
  let id;try{id=decodeURIComponent(match[1])}catch{return null}
  return ids.includes(id)?id:null;
 }
 function createStore(storage){
  const entries=new Map();
  let restored;try{restored=JSON.parse(storage?.getItem(storageKey)||'[]')}catch{}
  if(Array.isArray(restored))for(const entry of restored){
   if(!Array.isArray(entry)||entry.length!==2)continue;
   const [id,value]=entry;
   if(typeof id!=='string'||!/^[a-z0-9-]{1,64}$/i.test(id)||!value||typeof value!=='object'||Array.isArray(value))continue;
   entries.set(id,{scroll:Number.isFinite(value.scroll)?Math.max(0,value.scroll):0,body:typeof value.body==='string'?value.body.slice(0,800):'',author:typeof value.author==='string'?value.author.slice(0,32):''});
  }
  function read(id){return{scroll:0,body:'',author:'',...entries.get(id)}}
  function save(id,patch){const value=read(id);if(Number.isFinite(patch.scroll))value.scroll=Math.max(0,patch.scroll);if(typeof patch.body==='string')value.body=patch.body;if(typeof patch.author==='string')value.author=patch.author;entries.set(id,value);try{storage?.setItem(storageKey,JSON.stringify([...entries]))}catch{}return{...value}}
  function posted(id,body){const value=read(id);if(value.body.trim()===body.trim())save(id,{body:''})}
  return{read,save,posted};
 }
 function createHistory({host,ids,onChange}){
  const history=host.history,location=host.location;
  let lastRoute='',started=false,visit='',visitStorageBlocked=false;
  const visitKey='seen-reading-visit-v1';
  function storedVisit(){if(visitStorageBlocked)return '';try{return host.sessionStorage?.getItem(visitKey)||''}catch{return ''}}
  function newVisit(){visit=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);try{host.sessionStorage?.setItem(visitKey,visit)}catch{visitStorageBlocked=true}return visit}
  function currentVisit(){return storedVisit()||visit||newVisit()}
  const marker=()=>history.state?.[stateKey];
  visit=storedVisit()||(marker()?.version===2?marker().visit:'')||'';
  const urlWithoutArticle=()=>location.pathname+location.search+(articleFromHash(location.hash,ids)?'':location.hash);
  function state(article,room,owned){return{...(history.state&&typeof history.state==='object'?history.state:{}),[stateKey]:{version:2,visit:currentVisit(),article,room,owned}}}
  function stale(){const saved=marker();return saved&&(saved.version!==2||saved.visit!==currentVisit())}
  function notify(force=false){
   // A home visit retires every older reader entry, including cached documents.
   // Read shared tab storage each time; a restored document can hold an old token.
   if(stale()){home();return}
   const article=articleFromHash(location.hash,ids),room=marker()?.room||null,key=article+'|'+room;if(!force&&lastRoute===key)return;lastRoute=key;onChange({article,room});
  }
  function home(){
   newVisit();
   history.replaceState(state(null,null,false),'',location.pathname+location.search);notify(true);
  }
  function start({resume=true}={}){
   if(started)return;started=true;
   let article=articleFromHash(location.hash,ids);
   if(!resume||!article||marker()?.version===2&&stale()){home();article=null}
   // A pasted link gets a local seats entry, so closing cannot leave the site.
   if(article&&!(marker()?.version===2&&marker()?.article===article&&marker()?.owned)){
    const url=location.pathname+location.search;
    history.replaceState(state(null,article,false),'',url);
    history.pushState(state(article,article,true),'',url+'#read/'+encodeURIComponent(article));
   }
   host.addEventListener('popstate',()=>notify());
   host.addEventListener('hashchange',()=>notify());
   notify(true);
  }
  function open(article){
   if(!ids.includes(article))return;
   if(articleFromHash(location.hash,ids)===article){notify(true);return}
   if(!articleFromHash(location.hash,ids))history.replaceState(state(null,article,false),'',urlWithoutArticle());
   history.pushState(state(article,article,true),'',location.pathname+location.search+'#read/'+encodeURIComponent(article));
   notify(true);
  }
  function close(){
   const article=articleFromHash(location.hash,ids);if(!article)return;
   if(marker()?.owned&&marker()?.article===article){history.back();return}
   history.replaceState(state(null,article,false),'',location.pathname+location.search);notify(true);
  }
  return{start,open,close,home,sync:()=>notify(true)};
 }
 return{articleFromHash,createStore,createHistory};
})();
