'use strict';
const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];
const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storage = {get(key,fallback){try{return JSON.parse(localStorage.getItem('seen02:'+key))??fallback}catch{return fallback}},set(key,value){try{localStorage.setItem('seen02:'+key,JSON.stringify(value));return true}catch{return false}}};
// Canvas text has no CSS wrapping: split oversized Korean/Latin tokens by grapheme.
function wrapCardText(ctx,text,maxWidth){
 const lines=[];let line='';
 const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
 for(const word of String(text).trim().split(/\s+/u)){
  if(!word)continue;
  const next=line?line+' '+word:word;
  if(ctx.measureText(next).width<=maxWidth){line=next;continue}
  if(line){lines.push(line);line=''}
  if(ctx.measureText(word).width<=maxWidth){line=word;continue}
  const characters=segmenter?[...segmenter.segment(word)].map(part=>part.segment):Array.from(word);
  for(const character of characters){
   if(line&&ctx.measureText(line+character).width>maxWidth){lines.push(line);line=''}
   line+=character;
  }
 }
 if(line)lines.push(line);
 return lines;
}
let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200)}
const films = SeenFilmCatalog.magazine;
let saved=storage.get('watchlist',[]);if(!Array.isArray(saved))saved=[];saved=[...new Set(saved.filter(id=>films.some(film=>film.id===id)))];
function renderFilms(filter='all'){$('#films').innerHTML=films.filter(f=>filter==='all'||f.type===filter).map((f,i)=>`<article class="film-card" data-type="${f.type}"><div class="film-top"><span>${String(i+1).padStart(2,'0')} / ${f.type==='new'?'COMING THIS MONTH':'FROM THE SHELF'}</span><span class="film-date">${f.date}</span></div><div class="film-art"><img src="assets/${f.image}.${f.ext||'jpg'}" alt="${escapeHTML(f.title)} — official publicity artwork" loading="lazy"><button class="save-film ${saved.includes(f.id)?'saved':''}" data-save="${f.id}" aria-pressed="${saved.includes(f.id)}">${saved.includes(f.id)?'✓ Saved':'+ My watchlist'}</button></div><h3>${f.title}</h3><div class="director">${f.director}</div><p>${f.note}</p><div class="film-prompt"><b>A QUESTION FOR YOU</b><br>${f.prompt}</div><a class="film-link" href="${f.link}" target="_blank" rel="noopener">${f.source} ↗</a></article>`).join('')}
renderFilms();
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{$$('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b?'true':'false')});renderFilms(b.dataset.filter)}));
$('#films').addEventListener('click',e=>{const b=e.target.closest('[data-save]');if(!b)return;const id=b.dataset.save;saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];const persisted=storage.set('watchlist',saved);const yes=saved.includes(id);b.classList.toggle('saved',yes);b.setAttribute('aria-pressed',String(yes));b.textContent=yes?'✓ Saved':'+ My watchlist';toast(persisted?(yes?'Added to your watchlist in this browser.':'Removed from your watchlist.'):'Watchlist updated for this visit; browser storage is unavailable.')});
const articles={...screeningArticles,
about:{"tag": "COLOPHON / ISSUE 02", "title": "About this edition", "deck": "The November issue of SEEN, adapted for the web.", "body": "<p>SEEN is a film magazine. This web edition turns the November issue into a small cinema: each screening room opens an article, the posters lead to upcoming films, and the arcade has three film quizzes.</p><h3>In this issue</h3><p>The four articles cover Lady Bird, After Yang and Minari, including an editor’s introduction. There are also five November release previews, a shared-screen film ballot and a recommendation card you can send as a link or image.</p><p>Publication and original visual direction: Jinhyeok Jang. Created for PSAM 2070 CD Studio: Multiple Editions, Fall 2026. The web edition and editorial text were developed with AI assistance. The articles are written analyses, not reports of Jinhyeok’s personal viewing experiences.</p><h3>Saved on this device</h3><p>The magazine’s saved films, votes and recommendation drafts stay in this browser when storage is available. The cinema’s reader comments and arcade rankings are public. A nickname is enough to enter; no account is required.</p><p>A recommendation link includes the name, film and note written on the card. Anyone with the link can read it. Use your device’s share menu, copy the link or download an image when you are ready to send it.</p>"},
credits:{tag:'SOURCE REGISTER / ISSUE 02',title:'Sources and image credits',deck:'Film information, release dates, and image credits.',body:`<p>These are US theatrical release dates, checked against distributor pages on 21 October 2026. Dates may change. The upcoming-film entries are previews.</p><h3>New this November.</h3><ul>${SeenFilmCatalog.upcoming.map(film=>{
 const label=film.id==='hexed'?'Disney':film.studio,url=film.id==='focker'?film.url+'synopsis/':film.url;
 const artwork=film.id==='hunger'?`Korean theatrical poster: Lionsgate / Nuri Pictures, via <a href="https://cine21.com/movie/info/?movie_id=63412" data-poster-source target="_blank" rel="noopener">Cine21</a>.`:film.id==='hexed'?`Poster: Disney / ${film.studio}.`:`Publicity artwork: ${film.studio}, official film site.`;
 const extra=film.id==='hexed'?' <a href="https://thewaltdisneycompany.com/news/disneys-hexed-billie-alice/" target="_blank" rel="noopener">Official story announcement</a>.':'';
 return `<li><a href="${url}" target="_blank" rel="noopener">${film.title} — ${label}</a>. Announced US release: ${film.date}. ${artwork}${extra}</li>`;
}).join('')}</ul><h3>From the shelf.</h3><ul><li><a href="https://a24films.com/films/lady-bird" target="_blank" rel="noopener">Lady Bird (2017), written and directed by Greta Gerwig</a>. Cover, article images, and film thumbnail: A24’s official film page.</li><li><a href="https://a24films.com/films/after-yang" target="_blank" rel="noopener">After Yang (2022), written and directed by Kogonada</a>. Article image and thumbnail: A24’s official film page.</li><li><a href="https://a24films.com/films/minari" target="_blank" rel="noopener">Minari (2021), written and directed by Lee Isaac Chung</a>. Article image and thumbnail: A24’s official film page.</li></ul><h3>Design & editorial.</h3><p>Visual reference: Jinhyeok Jang’s SEEN Issue 01 final print PDF. The October cover thumbnail is reproduced from the supplied publication. Film stills and publicity artwork remain the property of their respective copyright holders. Attribution does not constitute a new commercial licence. Images are resized and, where required, cropped for this student editorial publication.</p><p>The articles and interface copy were developed with AI assistance for this edition. Interpretations in the articles are editorial analysis; they are not statements attributed to the filmmakers.</p><p>Typefaces: DM Sans, Barlow Condensed, Libre Caslon Text, served by Google Fonts with system fallbacks. Digital edition: November 2026.</p>`}
};
let returnFocus=null;
function openArticle(id,updateHash=true){const a=articles[id];if(!a)return;returnFocus=document.activeElement;$('#article-content').innerHTML=`<header class="article-header"><span class="eyebrow">${a.tag}</span><h2 id="article-title">${a.title}</h2><p class="article-deck">${a.deck}</p><div class="article-meta">SEEN / NOVEMBER 2026 · ${id==='credits'?'SOURCE REGISTER':'DIGITAL EDITION'}</div></header>${a.image?`<img class="article-image" src="assets/${a.image}.jpg" alt="${escapeHTML(a.credit)}"><div class="article-image-caption">${a.credit}</div>`:''}<div class="article-body">${a.body}<button class="read-link icon-close" data-close-reading aria-label="Close article"><svg class="close-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>`;if(!$('#article-dialog').open)$('#article-dialog').showModal();$('#article-dialog').scrollTop=0;document.body.style.overflow='hidden';if(updateHash)history.pushState({article:id},'',`#read/${id}`)}
function closeArticle(){if($('#article-dialog').open)$('#article-dialog').close();document.body.style.overflow='';if(location.hash.startsWith('#read/'))history.replaceState(null,'',location.pathname+location.search+'#stories');if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-article]');if(b)openArticle(b.dataset.article);if(e.target.closest('[data-close-reading]'))closeArticle()});
$('#close-article').addEventListener('click',closeArticle);$('#dialog-home').addEventListener('click',e=>{e.preventDefault();closeArticle()});$('#article-dialog').addEventListener('cancel',e=>{e.preventDefault();closeArticle()});$('#article-dialog').addEventListener('click',e=>{if(e.target===$('#article-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeArticle()}});
window.addEventListener('popstate',()=>{if(location.hash.startsWith('#read/'))openArticle(location.hash.slice(6),false);else closeArticle()});
if(location.hash.startsWith('#read/'))openArticle(location.hash.slice(6),false);
$('.menu-button').addEventListener('click',()=>{const yes=$('#issue-menu').hidden;$('#issue-menu').hidden=!yes;$('.menu-button').setAttribute('aria-expanded',String(yes))});$$('#issue-menu a').forEach(a=>a.addEventListener('click',()=>{$('#issue-menu').hidden=true;$('.menu-button').setAttribute('aria-expanded','false')}));document.addEventListener('click',e=>{if(!e.target.closest('#issue-menu,.menu-button')){$('#issue-menu').hidden=true;$('.menu-button').setAttribute('aria-expanded','false')}});
// Keep ballot options aligned with the same upcoming records as both film views.
const ballotFilms=films.filter(film=>film.type==='new');
function restoreVotes(raw){
 const valid=new Map();
 if(Array.isArray(raw))for(const vote of raw){
  if(!vote||typeof vote.name!=='string'||!vote.name.trim()||!ballotFilms.some(film=>film.title===vote.film))continue;
  const name=vote.name.trim().slice(0,35);valid.set(name.toLowerCase(),{name,film:vote.film});
 }
 return [...valid.values()];
}
function renderBallotChoices(){const fieldset=$('#vote-form fieldset');fieldset.innerHTML=`<legend class="field-label">What are we watching?</legend>`+ballotFilms.map(f=>`<label><input type="radio" name="film" value="${escapeHTML(f.title)}" required><span>${escapeHTML(f.title)}</span><small>${f.date}</small></label>`).join('')}
renderBallotChoices();
let votes=restoreVotes(storage.get('votes',[]));
function renderVotes(){
 if(!votes.length){$('#vote-results').innerHTML='';return}
 const counts=new Map(ballotFilms.map(film=>[film.title,0]));
 for(const vote of votes)counts.set(vote.film,counts.get(vote.film)+1);
 const max=Math.max(...counts.values()),leaders=ballotFilms.filter(film=>counts.get(film.title)===max);
 $('#vote-results').innerHTML=`<p><strong>${votes.length} vote${votes.length===1?'':'s'} on this screen.</strong> ${leaders.length===1?'Leading: '+escapeHTML(leaders[0].title):'A tie. Let someone who hasn’t chosen recently decide.'}</p>`+ballotFilms.map(film=>`<div class="result-row"><span>${film.title}</span><b>${counts.get(film.title)}</b><i style="width:${counts.get(film.title)/votes.length*100}%"></i></div>`).join('');
}
renderVotes();
$('#vote-form').addEventListener('submit',e=>{e.preventDefault();const name=$('#voter').value.trim();if(!name){$('#voter').setCustomValidity(SeenI18n.t('Enter a name before voting.'));$('#voter').reportValidity();return}$('#voter').setCustomValidity('');const film=new FormData(e.target).get('film');const previous=votes.findIndex(v=>v.name.toLowerCase()===name.toLowerCase());if(previous>=0)votes[previous]={name,film};else votes.push({name,film});const persisted=storage.set('votes',votes);renderVotes();e.target.reset();toast(persisted?`${name}’s vote ${previous>=0?'updated':'counted'}. Pass the screen on.`:'Vote counted for this visit; browser storage is unavailable.')});$('#voter').addEventListener('input',()=>$('#voter').setCustomValidity(''));
let confirmReset=false;$('#reset-votes').addEventListener('click',()=>{if(!votes.length){toast('The ballot is already empty.');return}if(!confirmReset){confirmReset=true;$('#reset-votes').textContent='Confirm reset?';setTimeout(()=>{confirmReset=false;$('#reset-votes').textContent='Reset ballot'},4000);return}votes=[];storage.set('votes',votes);renderVotes();confirmReset=false;$('#reset-votes').textContent='Reset ballot';toast('A fresh ballot. Choose the next film together.')});
const questions=[
{q:'Who directed Lady Bird?',options:['Sofia Coppola','Greta Gerwig','Céline Sciamma','Kelly Reichardt'],answer:1,note:'Greta Gerwig wrote and directed Lady Bird (2017).'},
{q:'In After Yang, what starts Jake’s search?',options:['A missing photograph','A letter from his father','An A.I. companion malfunctions','A move to another city'],answer:2,note:'Yang’s malfunction leads Jake to discover a life he did not know about.'},
{q:'Which film follows a Korean American family making a home on a farm?',options:['Minari','Lady Bird','After Yang','Hexed'],answer:0,note:'Minari, directed by Lee Isaac Chung, follows a family’s move to a farm.'},
{q:'Which city does Lady Bird want to leave?',options:['San Francisco','Sacramento','Los Angeles','Seattle'],answer:1,note:'Sacramento is both the home she resists and a place she learns to see differently.'},
{q:'Which November film returns to the world of Panem?',options:['Hexed','Minari','Focker-In-Law','Sunrise on the Reaping'],answer:3,note:'Sunrise on the Reaping follows a young Haymitch in the Fiftieth Hunger Games.'},
{q:'Which feature lets you send a film to a friend?',options:['Rank every performance','Choose a perfect score','Make a recommendation card','Skip straight to another film'],answer:2,note:'Use the recommendation card to send a film title and a short note.'}
];let qi=0,score=0,answered=false;
function renderQuiz(){answered=false;$('#quiz-progress').textContent=qi<questions.length?`QUESTION ${String(qi+1).padStart(2,'0')} / 06`:'THE CREDITS / YOUR RESULT';$('#quiz-score').textContent=`SCORE ${score}`;$('.quiz-track span').style.width=`${Math.min(qi+1,6)/6*100}%`;if(qi===questions.length){$('#quiz-content').innerHTML=`<h3>${score} / 6.<br>${score===6?'All six correct.':score>=3?'Well played.':'Try another round.'}</h3><p class="quiz-feedback">${score===6?'You got every answer right. Want to try again?':'Your score is above. You can play again whenever you like.'}</p><button class="quiz-next" id="quiz-restart">Play again ↻</button>`;$('#quiz-restart').addEventListener('click',()=>{qi=0;score=0;renderQuiz()});return}const q=questions[qi];$('#quiz-content').innerHTML=`<h3>${q.q}</h3><div class="quiz-options">${q.options.map((x,i)=>`<button data-answer="${i}"><span>${'ABCD'[i]}</span>${x}</button>`).join('')}</div><div id="quiz-answer" aria-live="polite"></div>`;$$('[data-answer]').forEach(b=>b.addEventListener('click',()=>{if(answered)return;answered=true;const chosen=Number(b.dataset.answer);const right=chosen===q.answer;if(right)score++;$('#quiz-score').textContent=`SCORE ${score}`;$$('[data-answer]').forEach(x=>{x.disabled=true;const i=Number(x.dataset.answer);if(i===q.answer)x.classList.add('correct');if(i===chosen&&!right)x.classList.add('wrong')});$('#quiz-answer').innerHTML=`<p class="quiz-feedback"><strong>${right?'That’s it.':'Not quite.'}</strong> ${q.note}</p><button class="quiz-next" id="quiz-next">${qi===5?'See your result':'Next question'} →</button>`;$('#quiz-next').addEventListener('click',()=>{qi++;renderQuiz()});$('#quiz-next').focus({preventScroll:true})}))}
renderQuiz();
const draftKeys=['recipient','recommend-film','reason'];let draft=storage.get('card',{});if(!draft||typeof draft!=='object'||Array.isArray(draft))draft={};
try{const shared=new URLSearchParams(location.hash.startsWith('#card?')?location.hash.slice(6):'');if(shared.has('to')){draft={recipient:shared.get('to')?.slice(0,65),'recommend-film':shared.get('film')?.slice(0,90),reason:shared.get('why')?.slice(0,500)};setTimeout(()=>$('#pass-it-on').scrollIntoView(),300)}}catch{}
draftKeys.forEach(k=>{if(typeof draft[k]==='string')$('#'+k).value=draft[k];$('#'+k).addEventListener('input',()=>{draftKeys.forEach(x=>draft[x]=$('#'+x).value);storage.set('card',draft);$('#download-card').hidden=true;$('#share-status').textContent=''})});
function getCard(){return Object.fromEntries(draftKeys.map(k=>[k,$('#'+k).value.trim()]))}
$('#recommend-form').addEventListener('submit',async e=>{e.preventDefault();const c=getCard();if(Object.values(c).some(v=>!v)){toast('Add a recipient, a film, and your reason first.');return}const params=new URLSearchParams({to:c.recipient,film:c['recommend-film'],why:c.reason});const url=location.origin+location.pathname+'#card?'+params.toString();const text=`To ${c.recipient}: ${c['recommend-film']}. ${c.reason}`;$('#download-card').hidden=false;if(navigator.share){try{await navigator.share({title:'SEEN — Film recommendation',text,url});$('#share-status').textContent='Your card is ready to share.';return}catch(err){if(err.name==='AbortError'){$('#share-status').textContent='Card ready. You can share again or download it below.';return}}}try{await navigator.clipboard.writeText(url);$('#share-status').textContent='Link copied. Send it to your friend, or download the card below.';toast('Recommendation link copied.')}catch{$('#share-status').textContent='Card ready. Download the image below to send it.'}});
$('#download-card').addEventListener('click',async()=>{
 const c=getCard();await document.fonts.ready;
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1400;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#f6f2e8';ctx.fillRect(0,0,1200,1400);ctx.fillStyle='#ed2925';ctx.fillRect(0,0,1200,22);
 ctx.font='900 150px "DM Sans","Pretendard",Arial';ctx.fillText('SEEN',70,185);
 ctx.font='700 20px "DM Sans","Pretendard",Arial';ctx.fillText(SeenI18n.t('ISSUE 02 / NOVEMBER 2026'),75,235);
 ctx.strokeStyle='#ed2925';ctx.strokeRect(55,285,1090,995);
 const sections=[{label:'TO',text:c.recipient,size:34},{label:'ONE FILM',text:c['recommend-film'],size:38},{label:'WHY I RECOMMEND IT',text:c.reason,size:c.reason.length>280?25:30}];
 let layout,scale=1;
 do{
  layout=sections.map(section=>{const size=section.size*scale;ctx.font=`${size}px "Libre Caslon Text","Noto Serif KR",Georgia`;return {...section,size,lines:wrapCardText(ctx,section.text,990)}});
  if(layout.reduce((height,section)=>height+45+section.lines.length*section.size*1.5,50)<=815)break;
  scale*=.95;
 }while(scale>.25);
 let y=350;
 layout.forEach((section,index)=>{
  ctx.fillStyle='#ed2925';ctx.font='700 18px "DM Sans","Pretendard",Arial';ctx.fillText(SeenI18n.t(section.label),90,y);y+=45;
  ctx.fillStyle='#242220';ctx.font=`${section.size}px "Libre Caslon Text","Noto Serif KR",Georgia`;
  for(const line of section.lines){ctx.fillText(line,90,y);y+=section.size*1.5}
  if(index<layout.length-1)y+=25;
 });
 ctx.fillStyle='#242220';ctx.font='700 21px "DM Sans","Pretendard",Arial';ctx.fillText(SeenI18n.t('Notes from the screening room.'),90,1240);
 canvas.toBlob(blob=>{if(!blob){toast('Image could not be created. Try sharing the card link.');return}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='SEEN-this-one-is-for-you.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)},'image/png');
});
let scheduled=false;window.addEventListener('scroll',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{const range=document.documentElement.scrollHeight-innerHeight;$('.reading-progress').style.width=(range>0?scrollY/range*100:0)+'%';scheduled=false})},{passive:true});

window.addEventListener('hashchange',()=>{
 if(location.hash.startsWith('#card?')){try{const p=new URLSearchParams(location.hash.slice(6));const values={recipient:(p.get('to')||'').slice(0,65),'recommend-film':(p.get('film')||'').slice(0,90),reason:(p.get('why')||'').slice(0,500)};for(const [key,value] of Object.entries(values))$('#'+key).value=value;$('#share-status').textContent='This recommendation was sent to you. You can edit the card or make your own.';$('#download-card').hidden=false;$('#pass-it-on').scrollIntoView()}catch{}}
});
