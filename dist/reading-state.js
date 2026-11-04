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
  try{for(const [id,value]of JSON.parse(storage?.getItem(storageKey)||'[]')){
   if(typeof id!=='string'||!/^[a-z0-9-]{1,64}$/i.test(id)||!value||typeof value!=='object')continue;
   entries.set(id,{scroll:Number.isFinite(value.scroll)?Math.max(0,value.scroll):0,body:typeof value.body==='string'?value.body.slice(0,800):'',author:typeof value.author==='string'?value.author.slice(0,32):''});
  }}catch{}
  function read(id){return{scroll:0,body:'',author:'',...entries.get(id)}}
  function save(id,patch){const value=read(id);if(Number.isFinite(patch.scroll))value.scroll=Math.max(0,patch.scroll);if(typeof patch.body==='string')value.body=patch.body;if(typeof patch.author==='string')value.author=patch.author;entries.set(id,value);try{storage?.setItem(storageKey,JSON.stringify([...entries]))}catch{}return{...value}}
  function posted(id,body){const value=read(id);if(value.body.trim()===body.trim())save(id,{body:''})}
  return{read,save,posted};
 }
 function createHistory({host,ids,onChange}){
  const history=host.history,location=host.location;
  let lastRoute='',started=false;
  const marker=()=>history.state?.[stateKey];
  const urlWithoutArticle=()=>location.pathname+location.search+(articleFromHash(location.hash,ids)?'':location.hash);
  function state(article,room,owned){return{...(history.state&&typeof history.state==='object'?history.state:{}),[stateKey]:{version:1,article,room,owned}}}
  function notify(force=false){const article=articleFromHash(location.hash,ids),room=marker()?.room||null,key=article+'|'+room;if(!force&&lastRoute===key)return;lastRoute=key;onChange({article,room})}
  function start(){
   if(started)return;started=true;
   const article=articleFromHash(location.hash,ids);
   // A pasted link gets a local seats entry, so closing cannot leave the site.
   if(article&&!(marker()?.version===1&&marker()?.article===article&&marker()?.owned)){
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
  return{start,open,close,sync:()=>notify(true)};
 }
 return{articleFromHash,createStore,createHistory};
})();
