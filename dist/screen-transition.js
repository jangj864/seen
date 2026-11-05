'use strict';
// Carry the actual wall projection into the reading view, then dissolve into it.
function createSeenScreenTransition({dialog,content}){
 let current=null;
 function cancel(){
  if(!current)return;const previous=current;current=null;previous.move?.cancel();previous.fade?.cancel();previous.image.remove();content.inert=previous.inert;delete dialog.dataset.screenTransition;previous.resolve?.();
 }
 function capture(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return null;
  const detail={frame:null};document.dispatchEvent(new CustomEvent('seen-capture-screen',{detail}));return detail.frame;
 }
 function open(frame){
  cancel();if(!frame||matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
  const paper=content.getBoundingClientRect(),bar=dialog.querySelector('.screen-article-toolbar').getBoundingClientRect(),seats=dialog.querySelector('.reading-seats').getBoundingClientRect();
  const top=Math.max(bar.bottom+18,Math.min(paper.top,innerHeight-120)),target={left:paper.left,top,width:paper.width,height:Math.max(80,Math.min(paper.height,innerHeight-top-Math.max(24,seats.height-12)))};
  if(target.width<1)return Promise.resolve();
  const image=document.createElement('img');image.className='reading-screen-flight';image.alt='';image.setAttribute('aria-hidden','true');image.src=frame.image;
  Object.assign(image.style,{width:'800px',height:'450px',transform:`matrix(${frame.matrix.join(',')})`});
  const session={image,inert:content.inert};const finished=new Promise(resolve=>session.resolve=resolve);current=session;content.inert=true;dialog.dataset.screenTransition='opening';dialog.append(image);
  session.move=image.animate([
   {width:'800px',height:'450px',transform:`matrix(${frame.matrix.join(',')})`},
   {width:`${target.width}px`,height:`${target.height}px`,transform:`matrix(1,0,0,1,${target.left},${target.top})`}
  ],{duration:780,easing:'cubic-bezier(.22,.7,.24,1)',fill:'forwards'});
  session.move.finished.then(()=>{
   if(current!==session||!dialog.open)return;dialog.dataset.screenTransition='handoff';
   session.fade=image.animate([{opacity:1},{opacity:0}],{duration:220,fill:'forwards'});
   session.fade.finished.then(()=>{if(current===session)cancel()},()=>{});
  },()=>{});
  return finished;
 }
 dialog.addEventListener('close',()=>{if(!dialog.open)cancel()});addEventListener('resize',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
 return{capture,open,cancel,get active(){return!!current}};
}
