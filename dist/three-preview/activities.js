// Reading and quiz overlays share the publication's content, translations,
// reading history and score components. The WebGL scene stays mounted below.
export function createActivities({programs,pause,resume,ensureScreen,getNickname,setNickname}){
 const reader=document.querySelector('#reader'),content=document.querySelector('#reader-content'),nameDialog=document.querySelector('#player-name-dialog');
 let storage;try{storage=sessionStorage}catch{}
 const store=SeenReading.createStore(storage);let active=null,token=0,scrollTimer,queuedMode=null;
 const quiz=createSeenQuizPlayer({canRequest:()=>document.body.dataset.room==='arcade',onOpen:pause,onClose:resume,nickname:getNickname});
 const text=(node,value)=>SeenI18n.text(node,value);
 function save(){if(active)store.save(active,{scroll:reader.scrollTop})}
 function hide(){save();active=null;token++;if(reader.open)reader.close()}
 const history=SeenReading.createHistory({host:window,ids:programs.map(p=>p.id),onChange:async({article})=>{
  const mine=++token;if(!article){hide();return}
  const program=programs.find(p=>p.id===article);await ensureScreen(program.index);if(mine!==token)return;
  if(active===article&&reader.open)return;save();active=article;const savedScroll=store.read(article).scroll;content.replaceChildren();
  const header=document.createElement('header'),kicker=document.createElement('span'),title=document.createElement('h2'),deck=document.createElement('p');
  header.className='reader-heading';kicker.className='eyebrow';text(kicker,program.article.tag);title.id='reader-title';text(title,program.article.title);text(deck,program.article.deck);header.append(kicker,title,deck);content.append(header);
  const image=document.createElement('img'),caption=document.createElement('figcaption'),figure=document.createElement('figure');image.src=`assets/${program.article.image}.jpg`;image.alt=program.article.credit;image.width=1600;image.height=900;text(caption,program.article.credit);figure.append(image,caption);content.append(figure);
  const body=document.createElement('div');body.className='screen-article-body';body.innerHTML=program.article.body;content.append(body);
  text(document.querySelector('#reader-room'),`SCREEN ${program.number} / SEEN`);pause();if(!reader.open)reader.showModal();SeenI18n.refresh();
  const restore=()=>{if(mine===token&&reader.open)reader.scrollTop=savedScroll};requestAnimationFrame(restore);if(!image.complete)image.addEventListener('load',()=>requestAnimationFrame(restore),{once:true});
 }});
 document.querySelector('#close-reader').onclick=()=>history.close();reader.addEventListener('cancel',event=>{event.preventDefault();history.close()});reader.addEventListener('close',resume);
 reader.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(save,120)});addEventListener('pagehide',save);
 // A late image load must not move a reader who has already started scrolling.
 for(const event of ['wheel','touchstart','keydown'])reader.addEventListener(event,()=>{token++;},{passive:true});
 nameDialog.querySelector('form').onsubmit=event=>{
  event.preventDefault();const input=nameDialog.querySelector('input'),name=input.value.trim().replace(/\s+/g,' ');
  if([...name].length<2||[...name].length>20||/[\u0000-\u001f\u007f<>]/.test(name)){input.setCustomValidity(SeenI18n.t('Please use 2–20 characters without < or >.'));input.reportValidity();return}
  input.setCustomValidity('');setNickname(name);nameDialog.close();const mode=queuedMode;queuedMode=null;if(mode)quiz.request(mode);
 };
 nameDialog.querySelector('input').addEventListener('input',event=>event.target.setCustomValidity(''));
 nameDialog.querySelector('.close').onclick=()=>nameDialog.close();nameDialog.addEventListener('close',resume);
 return{start:()=>history.start(),read:program=>history.open(program.id),quiz(mode){
  if(!getNickname()){queuedMode=mode;nameDialog.querySelector('input').value='';pause();nameDialog.showModal();return}
  quiz.request(mode);
 },get open(){return!!document.querySelector('dialog[open]')},close(){if(reader.open)history.close();quiz.close();if(nameDialog.open)nameDialog.close()}};
}
