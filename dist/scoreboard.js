'use strict';
// A round owns one submission; remounting a result or changing language never
// creates another score. The API uses the same run id when a failed save retries.
const SeenScoreboard=(()=>{
 const activeViews=new Set();
 const translate=(node,source)=>typeof SeenI18n!=='undefined'?SeenI18n.text(node,source):node.textContent=source;
 function createRound(mode){return{mode,runId:crypto.randomUUID(),answers:[],status:'idle',data:null,promise:null}}
 function submit(round,retry=false){
  if(round.promise)return round.promise;
  if(round.status==='ready')return Promise.resolve(round.data);
  if(round.status==='error'&&!retry)return Promise.reject(new Error('Score unavailable'));
  round.status='loading';
  round.promise=Promise.resolve().then(()=>{
   if(typeof SeenScores==='undefined')throw new Error('Score service unavailable');
   return SeenScores.submit({mode:round.mode,answers:round.answers.slice(),runId:round.runId});
  }).then(data=>{round.data=data;round.status='ready';return data},error=>{round.status='error';throw error}).finally(()=>{round.promise=null});
  return round.promise;
 }
 function rankedEntries(entries){const ranks=new Map();for(const entry of entries||[]){const rank=Number(entry.rank);if(Number.isInteger(rank)&&rank>=1&&rank<=10&&!ranks.has(rank))ranks.set(rank,entry)}return Array.from({length:10},(_,i)=>({rank:i+1,entry:ranks.get(i+1)||null}))}
 function element(tag,className,source){const node=document.createElement(tag);if(className)node.className=className;if(source!==undefined)translate(node,source);return node}
 function nickname(node,value){node.dataset.noTranslate='';node.textContent=String(value??'');node.title=String(value??'')}
 function render(view){
  const {board,round,score,total,onReplay}=view;if(!board.isConnected)return;view.resizeObserver?.disconnect();
  const oldScroll=board.querySelector('.scoreboard-table-scroll')?.scrollTop||0;
  const header=element('div','scoreboard-heading'),titleGroup=element('div','scoreboard-title'),title=element('h3','','HIGH SCORES'),scrollHint=element('small','scoreboard-scroll-hint','SCROLL FOR TOP 10 ↓'),roundScore=element('div','scoreboard-round-score');scrollHint.hidden=true;titleGroup.append(title,scrollHint);
  roundScore.append(element('span','','THIS ROUND'),element('strong','',`${score} / ${total}`));header.append(titleGroup,roundScore);
  const tableRegion=element('div','scoreboard-table-scroll');tableRegion.tabIndex=0;translateAttribute(tableRegion,'aria-label','Top 10 scores');
  const table=element('table','scoreboard-table'),head=document.createElement('thead'),headRow=document.createElement('tr');
  for(const label of ['RANK','PLAYER','SCORE']){const cell=element('th','',label);cell.scope='col';headRow.append(cell)}head.append(headRow);table.append(head);
  const body=document.createElement('tbody');
  for(const {rank,entry} of rankedEntries(round.status==='ready'?round.data?.entries:[])){
   const row=element('tr',entry?.is_current?'is-current':'');
   if(entry?.is_current)row.setAttribute('aria-current','true');
   const place=element('td','scoreboard-rank'),name=element('td','scoreboard-player'),points=element('td','scoreboard-points');
   place.textContent=String(rank).padStart(2,'0');
   if(entry){nickname(name,entry.nickname);points.textContent=`${entry.score} / ${entry.total||5}`;if(entry.is_current){const you=element('span','scoreboard-you','YOU');name.append(you)}}else{name.textContent='—';points.textContent='—';row.classList.add('is-empty')}
   row.append(place,name,points);body.append(row);
  }
  table.append(body);tableRegion.append(table);
  const status=element('div','scoreboard-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  if(round.status==='ready'){
   const current=round.data?.current;
   if(current){const personal=element('p','scoreboard-personal');personal.append(element('span','','YOUR BEST'),element('strong','',`#${current.rank}`));const name=element('span','scoreboard-personal-name');nickname(name,current.nickname);personal.append(name,element('span','',`${current.score} / ${current.total||5}`));status.append(personal)}
   else status.append(element('p','','No score recorded yet.'));
  }else if(round.status==='error'){
   status.append(element('p','','Rankings unavailable. Please try again.'));
   const retry=element('button','scoreboard-retry','TRY AGAIN');retry.type='button';retry.onclick=()=>load(view,true);status.append(retry);
  }else status.append(element('p','','Saving your score…'));
  const actions=element('div','scoreboard-actions'),note=element('p','scoreboard-note','Best per nickname · Ties: first to score'),replay=element('button','game-next','PLAY AGAIN ↻');
  replay.type='button';replay.onclick=onReplay;actions.append(note,replay);
  board.replaceChildren(header,tableRegion,status,actions);tableRegion.scrollTop=oldScroll;view.resizeObserver=new ResizeObserver(()=>{scrollHint.hidden=tableRegion.scrollHeight<=tableRegion.clientHeight+1});view.resizeObserver.observe(tableRegion);
 }
 function translateAttribute(node,name,source){node.setAttribute(name,typeof SeenI18n!=='undefined'?SeenI18n.t(source):source)}
 function refresh(round){for(const view of activeViews){if(!view.board.isConnected){view.resizeObserver?.disconnect();activeViews.delete(view);continue}if(view.round===round)render(view)}}
 function load(view,retry=false){const promise=submit(view.round,retry);refresh(view.round);promise.then(()=>refresh(view.round),()=>refresh(view.round))}
 function show(root,options){
  for(const view of activeViews)if(!view.board.isConnected||view.board.parentElement===root){view.resizeObserver?.disconnect();activeViews.delete(view)};
  const board=element('section','seen-scoreboard');board.dataset.mode=options.round.mode;
  const view={board,...options};root.replaceChildren(board);activeViews.add(view);render(view);load(view);
 }
 document.addEventListener('seen-language-change',()=>{for(const view of activeViews){if(view.board.isConnected)render(view);else{view.resizeObserver?.disconnect();activeViews.delete(view)}}});
 return Object.freeze({createRound,show,submit,rankedEntries});
})();
