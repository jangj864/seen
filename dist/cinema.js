'use strict';
// Programmatic focus after touch must not draw keyboard-only focus rings.
 document.documentElement.dataset.input='pointer';
 document.addEventListener('pointerdown',()=>{document.documentElement.dataset.input='pointer'},true);
 document.addEventListener('keydown',e=>{if(e.key==='Tab')document.documentElement.dataset.input='keyboard'},true);

const lobbyJump=createSeenJump();
let lobbyRevision=0,lobbyPaintKey='';
const lobbyLocation=document.querySelector('#location'),screeningDialog=document.querySelector('#screening');
const canvas=document.querySelector('#world'),ctx=canvas.getContext('2d');
const rooms=[{n:'01',name:'A Seat at the Table',sub:'THE COVER STORY',x:2.25,y:.65,article:'table',img:'ladybird'},{n:'02',name:'The distance between us.',sub:'CLOSE READING / LADY BIRD',x:6.4,y:.65,article:'ladybird',img:'ladybird-mother'},{n:'03',name:'The things we keep.',sub:'MEMORY / AFTER YANG',x:10.55,y:.65,article:'yang',img:'yang'},{n:'04',name:'A home still taking shape.',sub:'BELONGING / MINARI',x:14.7,y:.65,article:'minari',img:'minari'}];
rooms.forEach(r=>{r.open=0});
const gameRoom=document.querySelector('#game-room'),arcadeRoom=document.querySelector('#arcade-room'),quizConfirm=document.querySelector('#game-confirm');let gameOpen=0,lobbyWaypoints=[];
const images={};rooms.forEach(r=>{const im=new Image();im.onload=()=>lobbyRevision++;im.src=`assets/${r.img}.jpg`;images[r.img]=im});
const upcomingFilms=[
{id:'hunger',title:'The Hunger Games: Sunrise on the Reaping',short:'SUNRISE ON THE REAPING',date:'20 November 2026',stamp:'20 NOV',director:'Francis Lawrence',studio:'Lionsgate',image:'hunger',synopsis:'A return to Panem, 24 years before the original Hunger Games. A young Haymitch Abernathy faces the Fiftieth Games, the Second Quarter Quell.',question:'Who gets to tell a story—and who has to live inside it?',url:'https://hungergames.movie/'},
{id:'hexed',title:'Hexed',short:'HEXED',date:'25 November 2026',stamp:'25 NOV',director:'Fawn Veerasunthorn & Jason Hand',studio:'Walt Disney Animation Studios',image:'hexed',synopsis:'Teenager Billie discovers magical powers that lead her into the witch realm of Hexe. With her mother Alice, she explores a family history with consequences for their new world.',question:'When did someone in your family surprise you?',url:'https://movies.disney.com/hexed'},
{id:'focker',title:'Focker-In-Law',short:'FOCKER-IN-LAW',date:'25 November 2026',stamp:'25 NOV',director:'John Hamburg',studio:'Universal Pictures',image:'focker-poster',synopsis:'Ben Stiller and Robert De Niro reunite in a new Meet the Parents chapter, joined by Ariana Grande. Another generation brings new introductions to the extended family.',question:'What makes somebody feel welcome before they know the rules?',url:'https://www.universalpictures.com/movies/focker-in-law/'}
];
upcomingFilms.push(
{id:'ebenezer',title:'Ebenezer',short:'EBENEZER',date:'13 November 2026',stamp:'13 NOV',director:'Ti West',studio:'Paramount Pictures',image:'ebenezer-poster',synopsis:'Johnny Depp plays Ebenezer Scrooge in Ti West’s take on Charles Dickens’s A Christmas Carol. A ghostly Christmas reckoning invites a man to confront the life he has made.',question:'What would you change if you could revisit one ordinary day?',url:'https://www.paramount.com/movies/ebenezer'},
{id:'godzilla',title:'Godzilla Minus Zero',short:'GODZILLA MINUS ZERO',date:'6 November 2026',stamp:'06 NOV',director:'Takashi Yamazaki',studio:'TOHO / GKIDS',image:'godzilla-poster',ext:'png',synopsis:'In 1949, two years after Godzilla Minus One, the Shikishima family faces another catastrophe as Japan struggles to rebuild. Takashi Yamazaki returns for the sequel.',question:'What does it mean to rebuild a home after everything changes?',url:'https://gkids.com/2026/10/06/tickets-now-on-sale-for-godzilla-minus-zero/'}
);
const posterPositions=[.25,4.15,8.30,12.45,16.85];
const posterLayer=document.querySelector('#wall-posters');
upcomingFilms.forEach((film,i)=>{const im=new Image();im.onload=()=>lobbyRevision++;im.src=`assets/${film.image}.${film.ext||'jpg'}`;images[film.image]=im;const button=document.createElement('button');button.className='wall-poster';button.dataset.film=film.id;button.setAttribute('aria-label',`View ${film.title}, in theaters ${film.date}`);button.title=`${film.title} · ${film.stamp} · Click for details`;posterLayer.append(button);film.button=button;});
let posterReturnFocus=null;
const filmDialog=document.querySelector('#film-details');
function openFilm(film){keys.clear();target=null;posterReturnFocus=film.button;document.querySelector('#film-title').textContent=film.title;const image=document.querySelector('#film-poster');image.src=`assets/${film.image}.${film.ext||'jpg'}`;image.alt=`${film.title} — official publicity artwork`;document.querySelector('#film-credit').textContent=`Artwork: ${film.studio}`;document.querySelector('#film-facts').replaceChildren();for(const [label,value]of [['US RELEASE',film.date],['DIRECTOR',film.director],['STUDIO',film.studio]]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;document.querySelector('#film-facts').append(dt,dd)}document.querySelector('#film-synopsis').textContent=film.synopsis;document.querySelector('#film-question').textContent=film.question;document.querySelector('#film-official').href=film.url;filmDialog.showModal();}
upcomingFilms.forEach(film=>film.button.addEventListener('click',()=>openFilm(film)));
document.querySelector('#close-film').onclick=()=>filmDialog.close();filmDialog.addEventListener('close',()=>{keys.clear();posterReturnFocus?.focus({preventScroll:true})});filmDialog.addEventListener('click',e=>{if(e.target===filmDialog){const r=filmDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)filmDialog.close()}});
let w=0,h=0,scale=1,ox=0,oy=0,player={x:9.4,y:4.5},target=null,near=null,keys=new Set(),last=0,phase=0,walk=false,lobbyHeading=-Math.PI/2,lobbyGait=0,lobbyVelocity={x:0,y:0};
// Collision bounds include the visitor's width and the rendered prop offsets.
const lobbyNavigation=createSeenCrowdNavigation(createSeenRoomNavigation([], [
 {left:3.42,right:6.78,top:6.32,bottom:7.77},
 {left:7.28,right:8.92,top:7.78,bottom:8.22},
 {left:8.90,right:11.48,top:6.80,bottom:7.88},
 {left:13.3,right:16.2,top:7.0,bottom:8.6},
 {left:11.78,right:12.77,top:7.18,bottom:8.17},
 {left:0,right:2.2,top:8.5,bottom:9}
]),()=>SeenHub.people('lobby'));
function walkLobbyTo(destination){
 const end=lobbyNavigation.destination(player,destination),route=end?lobbyNavigation.route(player,end):[];
 target=route.shift()||null;lobbyWaypoints=route;lobbyVelocity={x:0,y:0};
}
function propDepth(left,right,top,bottom){return Math.max(left,Math.min(right,player.x))+Math.max(top,Math.min(bottom,player.y))}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize(){lobbyRevision++;w=canvas.clientWidth;h=canvas.clientHeight;const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);scale=Math.min(w/(w<700?28:27),h/17.5);ox=w/2-4.2*scale;oy=h*.36-1.7*scale+(w<700&&h>650?h*.05:0);}
addEventListener('resize',resize);resize();
function p(x,y,z=0){return{x:ox+(x-y)*scale*.86,y:oy+(x+y)*scale*.43-z*scale}}
function poly(points,color,stroke){ctx.beginPath();points.forEach((a,i)=>{const q=p(...a);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.6;ctx.stroke()}}
function box(x,y,z,dx,dy,dz,top,front,side){poly([[x,y,z+dz],[x+dx,y,z+dz],[x+dx,y+dy,z+dz],[x,y+dy,z+dz]],top);poly([[x,y+dy,z],[x+dx,y+dy,z],[x+dx,y+dy,z+dz],[x,y+dy,z+dz]],front);poly([[x+dx,y,z],[x+dx,y+dy,z],[x+dx,y+dy,z+dz],[x+dx,y,z+dz]],side)}
// Lettering uses the same projected axes as the surface beneath it.
function text(t,x,y,z,size,color='#eee8db',plane='screen'){const q=p(x,y,z);ctx.save();if(plane==='wall')ctx.transform(.86,.43,0,1,q.x,q.y);else if(plane==='floor')ctx.transform(.86,-.43,.86,.43,q.x,q.y);else ctx.translate(q.x,q.y);ctx.fillStyle=color;ctx.font=`600 ${size*scale}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.fillText(t,0,0);ctx.restore()}
function shadow(x,y,dx,dy,opacity=.12){poly([[x-.08,y-.03,.012],[x+dx+.18,y-.03,.012],[x+dx+.38,y+dy+.21,.012],[x+.12,y+dy+.21,.012]],`rgba(55,44,28,${opacity})`)}
function ellipse(x,y,z,rx,ry,color){const q=p(x,y,z);ctx.beginPath();ctx.ellipse(q.x,q.y,rx*scale,ry*scale,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function poster(x,film){const a=p(x,.34,2.95),b=p(x+1.1,.34,2.95),c=p(x,.34,.7),im=images[film.image];ctx.save();ctx.transform((b.x-a.x)/100,(b.y-a.y)/100,(c.x-a.x)/150,(c.y-a.y)/150,a.x,a.y);ctx.fillStyle='#f0dfba';ctx.fillRect(-4,-4,108,158);ctx.fillStyle='#272722';ctx.fillRect(0,0,100,150);if(im.complete&&im.naturalWidth){ctx.drawImage(im,0,0,100,132)}ctx.fillStyle='#e6cda0';ctx.fillRect(0,132,100,18);ctx.fillStyle='#55382a';ctx.font='bold 7px sans-serif';ctx.textAlign='center';ctx.fillText('UPCOMING · '+film.stamp,50,144);ctx.restore();const transform=`matrix(${(b.x-a.x)/100},${(b.y-a.y)/100},${(c.x-a.x)/150},${(c.y-a.y)/150},${a.x},${a.y})`;if(film.button.style.transform!==transform)film.button.style.transform=transform;}
function door(r){const x=r.x,y=r.y,angle=r.open*Math.PI*.46;poly([[x+.16,y+.32,.008],[x+1.44,y+.32,.008],[x+1.44,y+1.4,.008],[x+.16,y+1.4,.008]],'#984732');poly([[x+.195,y+.35,.012],[x+1.405,y+.35,.012],[x+1.405,y+1.365,.012],[x+.195,y+1.365,.012]],'#b4533c');box(x-.02,y-.1,0,1.7,.25,2.65,'#f0d2a8','#7e2520','#642723');box(x+.14,y+.17,0,1.32,.08,2.35,'#b84030','#201f1b','#443128');
box(x+.16,y+.26,.012,1.28,.09,.018,'#d8c29b','#ad9873','#968367');
// Two hinged leaves swing into the lobby, revealing the dark auditorium opening.
function leaf(hinge,sign,color){const hx=x+hinge,hy=y+.27,tx=hx+sign*.56*Math.cos(angle),ty=hy+.56*Math.sin(angle);poly([[hx,hy,0],[tx,ty,0],[tx,ty,2.28],[hx,hy,2.28]],color);poly([[hx,hy,2.28],[tx,ty,2.28],[tx,ty+.035,2.28],[hx,hy+.035,2.28]],'#c46b4d');poly([[tx,ty,0],[tx,ty+.035,0],[tx,ty+.035,2.28],[tx,ty,2.28]],'#682d26');const handleX=hx+(tx-hx)*.87,handleY=hy+(ty-hy)*.87;const a=p(handleX,handleY+.04,.98),b=p(handleX,handleY+.04,1.27);ctx.strokeStyle='#eccb87';ctx.lineWidth=scale*.035;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
leaf(.20,1,'#a84432');leaf(1.36,-1,'#913a2d');box(x+.14,y+.25,2.45,1.32,.05,.35,'#f0d2a8','#f4deaa','#d5b584');text('SCREEN '+r.n,x+.8,y+.32,2.53,.2,'#652b24','wall');ctx.save();ctx.globalAlpha=1-r.open;text(r.n,x+.8,y+.34,1.45,.6,'#f5d49f','wall');ctx.restore();}
function gameEntrance(){const angle=gameOpen*Math.PI*.45;poly([[.35,5.26,.01],[1.72,5.26,.01],[1.72,6.74,.01],[.35,6.74,.01]],'#727d56');box(.12,5.1,0,.25,1.8,2.2,'#d8c89e','#344c3b','#263d31');poly([[.39,5.24,0],[.39,6.76,0],[.39,6.76,1.84],[.39,5.24,1.84]],'#182b23');
for(const [y,sign]of [[5.30,1],[6.70,-1]]){const tx=.42+.70*Math.sin(angle),ty=y+sign*.70*Math.cos(angle);poly([[.42,y,0],[tx,ty,0],[tx,ty,1.8],[.42,y,1.8]],sign===1?'#3e6a50':'#335c46');}
function sign(value,y,z,size,color){const q=p(.44,y,z);ctx.save();ctx.transform(.86,-.43,0,1,q.x,q.y);ctx.fillStyle=color;ctx.font=`700 ${size*scale}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.fillText(value,0,0);ctx.restore()}
box(.12,5.1,1.85,.28,1.8,.35,'#ddcda3','#516a46','#364e37');sign('GAME ROOM',6,1.95,.19,'#f3dfaa');ctx.save();ctx.globalAlpha=1-gameOpen;sign('?',6,1.03,.58,'#e2c78d');sign('SEEN QUIZ',6,.54,.14,'#e2c78d');ctx.restore();}
function walkToGame(){keys.clear();walkLobbyTo({x:.56,y:6});canvas.focus({preventScroll:true})}
const quizThemes={
 all:{title:'SEEN QUIZ',accent:'#b74239',light:'#f0b39d',onAccent:'#fff3dc',description:'Five questions about film directors.'},
 eyes:{title:'EYES ONLY',accent:'#428b7e',light:'#a4d4b2',onAccent:'#fff3dc',description:'Guess five actors from their eyes.'},
 films:{title:'FILM CLUB',accent:'#b1893e',light:'#efcf82',onAccent:'#172a20',description:'Five questions about film stories and settings.'}
};
function quizModeIcon(mode){const shapes={'all': '<rect x="7" y="3" width="14" height="18" rx="2"/><path d="M7 7H3v14h4M11 8h6M11 12h6M11 16h3"/>', 'eyes': '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>', 'films': '<path d="M3 11h18v10H3zM3 11 2 6l18-4 1 5-18 4ZM7 5l4 4m3-6 4 4M7 16h6"/>'};return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${shapes[mode]}</svg>`}
let requestedQuiz=null;
function applyQuizTheme(element,mode){const theme=quizThemes[mode];element.dataset.mode=mode;for(const [key,value]of Object.entries({accent:theme.accent,light:theme.light,'on-accent':theme.onAccent}))element.style.setProperty(`--game-${key}`,value)}
function requestQuiz(mode){
 if(!isSceneOpen('arcade-room')||gameRoom.open||quizConfirm.open||!quizThemes[mode])return;
 requestedQuiz=mode;applyQuizTheme(quizConfirm,mode);document.querySelector('.game-confirm-mark').innerHTML=quizModeIcon(mode);document.querySelector('#game-confirm-title').textContent=`Would you like to play ${quizThemes[mode].title}?`;document.querySelector('#game-confirm-description').textContent=quizThemes[mode].description;
 quizConfirm.showModal();document.querySelector('#confirm-game-start').focus({preventScroll:true});document.dispatchEvent(new Event('seen-quiz-open'));
}
function cancelQuizRequest(){requestedQuiz=null;quizConfirm.close();document.querySelector('#arcade-world').focus({preventScroll:true})}
document.querySelector('#cancel-game-start').onclick=cancelQuizRequest;
quizConfirm.addEventListener('cancel',event=>{event.preventDefault();cancelQuizRequest()});
document.querySelector('#confirm-game-start').onclick=()=>{const mode=requestedQuiz;requestedQuiz=null;quizConfirm.close();if(mode)openQuiz(mode)};
function updateQuizIndicators(total,complete){
 const dots=document.querySelector('#game-indicators');dots.replaceChildren();
 for(let i=0;i<total;i++){const dot=document.createElement('li'),current=!complete&&i===gameIndex,answered=complete||i<gameIndex||(current&&gameAnswered!==null);dot.className='quiz-dot';dot.classList.toggle('is-current',current);dot.classList.toggle('is-answered',answered);dot.setAttribute('aria-label',`Question ${i+1}: ${current?'current question':answered?'completed':'not answered yet'}`);if(current)dot.setAttribute('aria-current','step');dots.append(dot)}
}
let gameIndex=0,gameScore=0,gameAnswered=null,gameMode='all',gameQuestions=seenQuizQuestions.filter(q=>q.mode==='all');
function renderGame(){
 const total=gameQuestions.length,complete=gameIndex===total,q=gameQuestions[gameIndex],root=document.querySelector('#game-quiz');
 updateQuizIndicators(total,complete);
 document.querySelector('#game-progress').textContent=complete?'YOUR RESULT':`QUESTION ${String(gameIndex+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
 document.querySelector('#game-score').textContent=`SCORE ${gameScore}`;
 document.querySelector('#game-progress-bar').style.width=`${Math.min(gameIndex+1,total)/total*100}%`;
 root.dataset.state=complete?'complete':gameAnswered===null?'question':gameAnswered===q.answer?'correct':'wrong';
 root.replaceChildren();const question=document.createElement('div');question.className='game-question';
 const heading=document.createElement('h3');heading.textContent=complete?`${gameScore} / ${total}. ${gameScore===total?'You’ve been paying attention.':'Good company for a film night.'}`:q.q;question.append(heading);
 if(complete){
  question.classList.add('game-result');heading.textContent=gameScore===total?'Perfect screening!':gameScore>=3?'Great eye for cinema!':'There’s more to discover.';
  const art=document.createElement('div');art.className='result-art';art.innerHTML='<svg viewBox="0 0 180 140" aria-hidden="true"><circle cx="90" cy="68" r="57" fill="currentColor" opacity=".10"/><path d="M61 28h58v34c0 23-13 36-29 36S61 85 61 62Z" fill="currentColor"/><path d="M61 39H43v14c0 19 14 27 27 27M119 39h18v14c0 19-14 27-27 27" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/><path d="M90 95v20m-22 8h44" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><path d="m90 43 5 11 13 2-9 9 2 13-11-6-11 6 2-13-9-9 13-2Z" fill="#fff6dd"/><path d="m29 18 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Zm119 67 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="currentColor"/><path d="m145 25 7 5m-123 72 6-5M49 9l2 7m105 41 7-1" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>';
  const label=document.createElement('span');label.className='result-kicker';label.textContent='ROUND COMPLETE';
  const score=document.createElement('div');score.className='result-score';score.innerHTML=`<strong>${gameScore}</strong><span>/ ${total}</span>`;score.setAttribute('aria-label',`${gameScore} out of ${total} correct answers`);
  const stars=document.createElement('div');stars.className='result-stars';stars.setAttribute('aria-hidden','true');stars.innerHTML=Array.from({length:total},(_,i)=>`<svg class="${i<gameScore?'is-earned':''}" viewBox="0 0 24 24"><path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/></svg>`).join('');
  question.replaceChildren(art,label,score,stars,heading);
 }
 if(!complete&&q.kind==='eyes'){
  const ns='http://www.w3.org/2000/svg',visual=document.createElementNS(ns,'svg'),image=document.createElementNS(ns,'image');
  visual.classList.add('game-eyes');visual.setAttribute('viewBox',q.crop.join(' '));visual.setAttribute('role','img');visual.setAttribute('aria-label',gameAnswered===null?'Eye detail from a film publicity still. Choose the actor below.':`Eye detail: ${q.options[q.answer]}`);
  image.setAttribute('href',`assets/${q.image}.jpg`);image.setAttribute('width',String(q.imageSize?.[0]||2000));image.setAttribute('height',String(q.imageSize?.[1]||1125));visual.append(image);question.append(visual);
 }
 if(!complete){const options=document.createElement('div');options.className='game-options';q.options.forEach((value,i)=>{
  const button=document.createElement('button');button.dataset.gameAnswer=String(i);const letter=document.createElement('span');letter.textContent='ABCD'[i];const label=document.createElement('strong');label.textContent=value;button.append(letter,label);button.setAttribute('aria-pressed',String(gameAnswered===i));
  if(gameAnswered!==null){button.disabled=true;if(i===q.answer)button.classList.add('correct');if(i===gameAnswered&&i!==q.answer)button.classList.add('wrong');if(i!==q.answer&&i!==gameAnswered)button.classList.add('is-muted');if(i===q.answer||i===gameAnswered){const mark=document.createElement('b');mark.className='answer-mark';mark.textContent=i===q.answer?'✓':'×';mark.setAttribute('aria-label',i===q.answer?'Correct answer':'Incorrect answer');button.append(mark)}}
  button.onclick=()=>{if(gameAnswered!==null)return;gameAnswered=i;if(i===q.answer)gameScore++;SeenHub.fx(i===q.answer?'correct':'wrong');renderGame();root.querySelector('.game-next').focus({preventScroll:true})};options.append(button)
 });question.append(options)}root.append(question);
 const slot=document.createElement('div');slot.className='game-answer-slot';root.append(slot);
 if(complete||gameAnswered!==null){const feedback=document.createElement('p');feedback.className='game-feedback';feedback.setAttribute('role','status');feedback.textContent=complete?'Pass the quiz to a friend. There is always another film to discover.':`${gameAnswered===q.answer?'CORRECT! +1 POINT':'ANSWER: '+q.options[q.answer]} — ${q.note}`;
 const next=document.createElement('button');next.className='game-next';next.textContent=complete?'PLAY AGAIN ↻':gameIndex===total-1?'SEE YOUR RESULT →':'NEXT QUESTION →';next.onclick=()=>{if(complete){gameIndex=0;gameScore=0}else gameIndex++;gameAnswered=null;renderGame();root.querySelector('button').focus({preventScroll:true})};slot.append(feedback,next)}
}
function enterGame(){if(isSceneOpen('arcade-room'))return;keys.clear();target=null;lobbyWaypoints=[];lobbyVelocity={x:0,y:0};lobbyJump.reset();showScene('arcade-room');document.dispatchEvent(new Event('seen-arcade-enter'))}
function openQuiz(mode='all'){
 if(gameRoom.open||!quizThemes[mode])return;
 applyQuizTheme(gameRoom,mode);document.querySelector('#game-room .game-toolbar>span').textContent=quizThemes[mode].title;
 if(mode!==gameMode){gameMode=mode;gameQuestions=seenQuizQuestions.filter(q=>q.mode===mode);gameIndex=0;gameScore=0;gameAnswered=null}
 const titles={all:'SEEN<span>QUIZ</span>',eyes:'EYES<span>ONLY</span>',films:'FILM<span>CLUB</span>'};
 document.querySelector('#game-title').innerHTML=titles[mode];document.querySelector('.game-marquee p').textContent=`${gameQuestions.length} questions. ${gameQuestions.length} points. How closely were you watching?`;
 renderGame();gameRoom.showModal();document.querySelector('#leave-game').focus({preventScroll:true});document.dispatchEvent(new Event('seen-quiz-open'));
}
function leaveGame(){if(!gameRoom.open)return;gameRoom.close();document.querySelector('#arcade-world').focus({preventScroll:true})}
function leaveArcade(){if(quizConfirm.open){quizConfirm.close();requestedQuiz=null}if(gameRoom.open)gameRoom.close();closeScene('arcade-room');keys.clear();lobbyVelocity={x:0,y:0};target=null;lobbyWaypoints=[];player={x:1.8,y:6};setNear();canvas.focus({preventScroll:true})}
 document.querySelector('#leave-game').onclick=leaveGame;gameRoom.addEventListener('cancel',e=>{e.preventDefault();leaveGame()});arcadeRoom.addEventListener('cancel',e=>{e.preventDefault();leaveArcade()});

function roomApproach(r){return{x:r.x+.8,y:r.y+1.5}}
function person(){drawSeenCharacter({ctx,unit:scale,project:p,x:player.x,y:player.y,heading:lobbyHeading,nameTag:SeenHub.name,gait:reduced?0:lobbyGait,phase,jump:lobbyJump.height,jumpCrouch:lobbyJump.crouch,jumpTuck:lobbyJump.tuck,jumping:lobbyJump.active,tagColor:'#a44731',shadowColor:'#493e2826'})}
function offsetProp(paint,dx,dy){ctx.save();ctx.translate((dx-dy)*scale*.86,(dx+dy)*scale*.43);paint();ctx.restore()}
function upcomingSign(){shadow(.2,8.7,1.8,.25);for(const x of [.35,1.75])box(x,8.7,0,.075,.09,1.2,'#b69b6b','#8d7554','#736047');box(.2,8.67,.55,1.8,.12,.75,'#f0dfba','#d1bb93','#ac9064');const button=document.querySelector('#browse-upcoming'),q=p(.2,8.8,1.3);button.style.left=q.x+'px';button.style.top=q.y+'px';button.style.width=1.8*scale+'px';button.style.height=.75*scale+'px';button.style.fontSize=Math.max(4.5,scale*.18)+'px'}
function counter(){shadow(.7,5.6,2.8,.95);box(.7,5.6,0,2.8,.95,1.05,'#f1dfb7','#b64d36','#8d382b');for(let x=.85;x<3.4;x+=.18)box(x,6.56,.1,.045,.015,.77,'#edc793','#d38b60','#b66f4c');box(.6,5.5,1.05,3,.99,.13,'#3c4c40','#26382e','#243a2c');box(1.15,5.65,1.18,.5,.3,.35,'#e2c994','#e5b87c','#b48e58');text('TICKETS',2.1,6.59,.57,.29,'#f8e4b7','wall');for(const x of [.82,3.25])box(x,5.8,1.18,.065,.065,1.62,'#c6aa73','#9b804e','#836d44');box(.65,5.8,2.65,2.9,.15,.54,'#f7e5bc','#c84833','#9f3529');text('EVERYONE IS WELCOME',2.1,5.97,2.84,.18,'#ffe7b3','wall');}
function bench(){shadow(9.1,7,2.25,.72);for(const x of [9.26,11.03])for(const y of [7.10,7.55])box(x,y,0,.1,.12,.45,'#625e4c','#4f5043','#404337');for(const y of [7.04,7.27,7.50])box(9.1,y,.45,2.2,.19,.105,'#bb7950','#945537','#7f4932');for(const x of [9.27,11.03])box(x,7,.44,.075,.09,.65,'#6c6550','#5a5948','#484b3d');for(const z of [.69,.91])box(9.1,6.99,z,2.2,.09,.17,'#bd7950','#a26440','#805033');for(const x of [9.10,11.19]){box(x,7.06,.58,.065,.54,.07,'#746a50','#5b5b45','#4c503d');box(x,7.48,.48,.065,.065,.14,'#6b614a','#565741','#434935');}}
function planter(x,y){shadow(x,y,.55,.55,.09);box(x,y,0,.55,.55,.55,'#d2b986','#b79162','#9a774d');for(let j=0;j<5;j++){const q=p(x+.25+(j-2)*.1,y+.25,.65+j%3*.23);ctx.strokeStyle=j%2?'#647351':'#7d8558';ctx.lineWidth=scale*.09;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p(x+.25,y+.25,.5).x,p(x+.25,y+.25,.5).y);ctx.quadraticCurveTo(q.x-scale*.17,q.y-scale*.3,q.x,q.y);ctx.stroke()}}
function queuePosts(){for(const x of [4.5,5.7]){ellipse(x,7,.01,.15,.065,'#574d3c30');ellipse(x,7,.035,.12,.06,'#94815a');box(x-.02,6.98,.035,.04,.04,.72,'#d1b77e','#b49b62','#927e50');ellipse(x,7,.79,.065,.065,'#d6b77b')}const a=p(4.5,7,.72),b=p(5.7,7,.72);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2+scale*.12,b.x,b.y);ctx.strokeStyle='#a94b36';ctx.lineWidth=scale*.055;ctx.lineCap='round';ctx.stroke();}
function draw(){ctx.clearRect(0,0,w,h);const glow=ctx.createRadialGradient(w*.55,h*.55,0,w*.55,h*.55,w*.6);glow.addColorStop(0,'#fbf5e8');glow.addColorStop(1,'#eee8db');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
poly([[0,0,-.2],[18.8,0,-.2],[18.8,9,-.2],[0,9,-.2]],'#a99b80');box(0,0,-.15,18.8,9,.15,'#d5c5a6','#c0ab86','#b49d7b');for(let x=0;x<19;x++)for(let y=0;y<9;y++)if(x<18.8)poly([[x,y,.005],[Math.min(x+1,18.8),y,.005],[Math.min(x+1,18.8),y+1,.005],[x,y+1,.005]],(x+y)%2?'#d9cdb7':'#e8dfca','#cabc9e');
// Cutaway architecture: the entire lobby is visible, with real floor-space navigation.
box(-.16,-.15,0,18.96,.35,3.3,'#eddfc3','#b8b49c','#93947c');box(-.16,0,0,.28,7.1,1.25,'#e0d4b9','#bdaf8d','#a79a7a');
for(let x=.4;x<18.4;x+=.55)box(x,.22,.2,.025,.025,2.8,'#b2ac94','#a4a38c','#a4a38c');
text('S E E N   C I N E M A',posterPositions[Math.floor(posterPositions.length/2)]+.55,.26,3.06,.30,'#a84832','wall');
upcomingFilms.forEach((film,i)=>poster(posterPositions[i],film));rooms.forEach(door);gameEntrance();
// Side screening room, brought into the open as a freestanding entrance.

// Draw movable and freestanding pieces back-to-front on the shared floor plane.
const props=[{depth:propDepth(0,2.2,8.5,9),paint:upcomingSign},...SeenHub.drawPeople({ctx,unit:scale,project:p,scene:'lobby'}),{depth:propDepth(13.5,16,7.2,8.4),paint:popcornShop},{depth:propDepth(3.6,6.6,6.5,7.58),paint:()=>offsetProp(counter,3,1)},{depth:propDepth(7.5,8.7,7.98,8.02),paint:()=>offsetProp(queuePosts,3,1)},{depth:17.1,paint:bench},{depth:20,paint:()=>planter(12,7.4)},{depth:player.x+player.y,paint:person}];
if(target){ellipse(target.x,target.y,.025,.24,.10,'#d74a3538');ellipse(target.x,target.y,.027,.07,.03,'#d74a35')}
props.sort((a,b)=>a.depth-b.depth).forEach(item=>item.paint());positionDoorPreview();

}
function setNear(){const next=rooms.find(r=>{const a=roomApproach(r);return Math.hypot(player.x-a.x,player.y-a.y)<1.1})||null;{near=next;if(near)showDoorPreview(near);else if(!hoveredDoor)preview.hidden=true;seenSetText(lobbyLocation,Math.hypot(player.x-1.4,player.y-6)<1.4?'OUTSIDE THE GAME ROOM':near?`OUTSIDE SCREEN ${near.n}`:'YOU ARE IN THE LOBBY')}}
function frame(t){const dt=Math.min((t-last)/1000,.04);last=t;if(document.hidden){requestAnimationFrame(frame);return}const paused=!SeenHub.entered||!!document.querySelector('dialog[open]')||isSceneOpen('arcade-room')||gameRoom.open||filmDialog.open||isSceneOpen('screening')||!directory.hidden;let vx=0,vy=0;
if(!paused)lobbyJump.step(dt);
if(!paused){if(keys.has('ArrowUp')||keys.has('w')){vx--;vy--}if(keys.has('ArrowDown')||keys.has('s')){vx++;vy++}if(keys.has('ArrowLeft')||keys.has('a')){vx--;vy++}if(keys.has('ArrowRight')||keys.has('d')){vx++;vy--}const manual=!!(vx||vy),before={...player};
if(manual){
 target=null;lobbyWaypoints=[];
 const len=Math.hypot(vx,vy),factor=1-Math.exp(-dt*12);lobbyVelocity.x+=(vx/len*3.5-lobbyVelocity.x)*factor;lobbyVelocity.y+=(vy/len*3.5-lobbyVelocity.y)*factor;
 const nx=Math.max(.5,Math.min(18.2,player.x+lobbyVelocity.x*dt)),ny=Math.max(rooms.some(r=>Math.abs(nx-(r.x+.8))<.50)?1.04:1.8,Math.min(8.5,player.y+lobbyVelocity.y*dt));
 if(!lobbyNavigation.blocked(nx,ny)){player.x=nx;player.y=ny}else{if(!lobbyNavigation.blocked(nx,player.y))player.x=nx;else lobbyVelocity.x=0;if(!lobbyNavigation.blocked(player.x,ny))player.y=ny;else lobbyVelocity.y=0}
}else{
 lobbyVelocity={x:0,y:0};if(target){const route=[target,...lobbyWaypoints];player=lobbyNavigation.advance(player,route,3.5*dt);target=route.shift()||null;lobbyWaypoints=route}
}
const distance=Math.hypot(player.x-before.x,player.y-before.y);walk=distance>.0005;lobbyGait+=(Math.min(1,distance/Math.max(dt,.001)/2.8)-lobbyGait)*(1-Math.exp(-dt*12));if(walk){phase+=distance*12;const angle=Math.atan2(player.y-before.y,player.x-before.x),difference=Math.atan2(Math.sin(angle-lobbyHeading),Math.cos(angle-lobbyHeading));lobbyHeading+=difference*(reduced?1:1-Math.exp(-dt*12))}setNear();}else{walk=false;lobbyVelocity={x:0,y:0};lobbyGait=0;}
gameOpen+=((Math.hypot(player.x-.5,player.y-6)<2?1:0)-gameOpen)*(reduced?1:1-Math.exp(-dt*10));if(!paused&&player.x<.78&&Math.abs(player.y-6)<.58&&gameOpen>.65)enterGame();
for(const r of rooms){const open=Math.hypot(player.x-(r.x+.8),player.y-(r.y+.65))<1.9?1:0;r.open+=(open-r.open)*(reduced?1:1-Math.exp(-dt*10));}if(!paused){const passage=rooms.find(r=>Math.abs(player.x-(r.x+.8))<.45&&player.y<r.y+.70&&r.open>.65);if(passage){near=passage;enter();}}
seenSetData(canvas,'jumpPhase',lobbyJump.active?'active':'idle');seenSetData(canvas,'jumpCrouch',lobbyJump.crouch.toFixed(3));seenSetData(canvas,'jumpTuck',lobbyJump.tuck.toFixed(3));seenSetData(canvas,'jump',lobbyJump.height.toFixed(3));seenSetData(canvas,'gameDoor',gameOpen.toFixed(2));seenSetData(canvas,'doors',rooms.map(r=>r.open.toFixed(2)).join(','));seenSetData(canvas,'position',`${player.x.toFixed(3)},${player.y.toFixed(3)}`);seenSetData(canvas,'motion',walk?'walking':'idle');
// Repaint only when projected geometry, images, fonts, or navigation change.
if(isSceneOpen('lobby-scene')&&SeenHub.entered)SeenTalk?.nearby({scene:'lobby',x:player.x,y:player.y,project:p,canvas});
if(!paused)SeenHub.publish({scene:'lobby',x:player.x,y:player.y,heading:lobbyHeading,posture:0,jump:lobbyJump.height,moving:walk});
const paintKey=[SeenHub.revision,lobbyRevision,seenFontRevision,lobbyJump.height.toFixed(3),lobbyJump.crouch.toFixed(3),lobbyJump.tuck.toFixed(3),canvas.dataset.position,canvas.dataset.doors,canvas.dataset.gameDoor,lobbyHeading.toFixed(3),lobbyGait.toFixed(3),phase.toFixed(3),target?.x,target?.y].join('|');
if(paintKey!==lobbyPaintKey){draw();lobbyPaintKey=paintKey} requestAnimationFrame(frame)}requestAnimationFrame(frame);
canvas.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button>0)return;if(e.pointerType==='touch')e.preventDefault();const rect=canvas.getBoundingClientRect(),px=e.clientX-rect.left,py=e.clientY-rect.top;const host=SeenHub.hitPerson({scene:'lobby',project:p,unit:scale,px,py});if(host){keys.clear();target=null;lobbyWaypoints=[];if(SeenTalk.staff(host)===false)walkLobbyTo({x:host.x,y:host.y});return}const ga=p(.44,6.9,2.2),gb=p(.44,5.1,2.2),gc=p(.44,6.9,0),gu=(px-ga.x)/(gb.x-ga.x),gv=(py-ga.y-gu*(gb.y-ga.y))/(gc.y-ga.y);if(gu>=0&&gu<=1&&gv>=0&&gv<=1){walkToGame();return}lobbyWaypoints=[];for(const r of rooms){const a=p(r.x+.14,r.y+.3,2.4),b=p(r.x+1.46,r.y+.3,2.4),c=p(r.x+.14,r.y+.3,0),u=(px-a.x)/(b.x-a.x),v=(py-a.y-u*(b.y-a.y))/(c.y-a.y);if(u>=0&&u<=1&&v>=0&&v<=1){preview.hidden=true;hoveredDoor=null;walkLobbyTo({x:r.x+.8,y:r.y+.48});canvas.focus({preventScroll:true});return}}const sx=(px-ox)/scale/.86,sy=(py-oy)/scale/.43;walkLobbyTo({x:Math.max(.6,Math.min(18.1,(sx+sy)/2)),y:Math.max(1.1,Math.min(8.4,(sy-sx)/2))});canvas.focus({preventScroll:true});});
addEventListener('keydown',e=>{if(!SeenHub.entered||isSceneOpen('arcade-room')||gameRoom.open||filmDialog.open||isSceneOpen('screening')||!document.querySelector('#directory').hidden||seenTypingTarget(e.target))return;const key=seenNavigationKey(e);if(e.code==='Space'||e.key===' '){e.preventDefault();if(!e.repeat)lobbyJump.start();canvas.focus({preventScroll:true});return}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(key)){e.preventDefault();keys.add(key);canvas.focus({preventScroll:true})}if(key==='Enter'&&Math.hypot(player.x-1.4,player.y-6)<1.5&&document.activeElement===canvas){e.preventDefault();enterGame();return}if(key==='Enter'&&near&&document.activeElement===canvas){e.preventDefault();enter()}});addEventListener('keyup',e=>keys.delete(seenNavigationKey(e)));addEventListener('blur',()=>keys.clear());
let currentRoom=null;
const seatChoices=new Map();
const seatRows=document.querySelector('#seat-rows');
seatRows.innerHTML=['A','B','C','D','E'].map((row,ri)=>`<div class="seat-row" style="--row:${ri}"><span class="row-letter">${row}</span>${Array.from({length:10},(_,i)=>`<button class="cinema-seat ${i===5?'after-aisle':''}" data-seat="${row}${String(i+1).padStart(2,'0')}" aria-label="Choose seat ${row}${i+1}" aria-pressed="false"><span class="seat-back"><small>${i+1}</small></span><span class="seat-cushion"></span><span class="seat-leg"></span></button>`).join('')}<span class="row-letter">${row}</span></div>`).join('');
function updateSeat(){const selected=seatChoices.get(currentRoom.n);seatRows.querySelectorAll('[data-seat]').forEach(b=>{const yes=b.dataset.seat===selected;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes))});document.querySelector('#seat-label').textContent=selected?`SCREEN ${currentRoom.n} / ${selected}`:'CHOOSE A SEAT';}
seatRows.addEventListener('click',e=>{const seat=e.target.closest('[data-seat]');if(!seat||!currentRoom)return;seatChoices.set(currentRoom.n,seat.dataset.seat);updateSeat()});
function enter(){if(!near)return;lobbyJump.reset();keys.clear();target=null;currentRoom=near;document.querySelector('#screening-title').textContent=`SCREEN ${near.n} / ${near.name.toUpperCase()}`;document.querySelector('#screen-name').textContent=near.name;document.querySelector('#screen-category').textContent=`SCREEN ${near.n} / ${near.sub}`;document.querySelector('#screen-still').src=`assets/${near.img}.jpg`;document.querySelector('#auditorium').hidden=false;updateSeat();showScene('screening');document.dispatchEvent(new Event('seen-room-enter'));}
const screenArticle=document.querySelector('#screen-article');
function openProgram(){if(!currentRoom||screenArticle.open)return;const article=screeningArticles[currentRoom.article];if(!article)return;document.querySelector('#screen-article-room').textContent=`SCREEN ${currentRoom.n} / SEEN · ISSUE 02`;const content=document.querySelector('#screen-article-content');content.replaceChildren();const header=document.createElement('header');header.className='screen-article-header';const tag=document.createElement('span');tag.className='screen-article-tag';tag.textContent=article.tag;const title=document.createElement('h2');title.id='screen-article-title';title.innerHTML=article.title;const deck=document.createElement('p');deck.textContent=article.deck;header.append(tag,title,deck);content.append(header);if(article.image){const figure=document.createElement('figure'),image=document.createElement('img'),caption=document.createElement('figcaption');image.src=`assets/${article.image}.jpg`;image.alt=article.credit;caption.textContent=article.credit;figure.append(image,caption);content.append(figure)}const body=document.createElement('div');body.className='screen-article-body';body.innerHTML=article.body;content.append(body);SeenHub.mountComments(content,currentRoom.article);screenArticle.showModal();screenArticle.scrollTop=0;document.querySelector('#back-to-seats').focus({preventScroll:true});}
document.querySelector('#projection').onclick=openProgram;document.querySelector('#start-program').onclick=openProgram;
document.querySelector('#back-to-seats').onclick=()=>screenArticle.close();screenArticle.addEventListener('close',()=>{keys.clear();document.querySelector('#room-world').focus({preventScroll:true})});screenArticle.addEventListener('click',e=>{if(e.target===screenArticle){const r=screenArticle.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)screenArticle.close()}});
function leaveScreening(){closeScene('screening');canvas.focus({preventScroll:true})}document.querySelector('#screening').addEventListener('close',()=>{keys.clear();target=null;lobbyVelocity={x:0,y:0};if(currentRoom){const a=roomApproach(currentRoom);player={x:a.x,y:a.y+.35};}setNear();});
const directory=document.querySelector('#directory'),toggle=document.querySelector('#index-toggle');function closeIndex(){directory.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus()}toggle.onclick=()=>{directory.hidden=!directory.hidden;toggle.setAttribute('aria-expanded',String(!directory.hidden));if(!directory.hidden)document.querySelector('#close-index').focus()};document.querySelector('#close-index').onclick=closeIndex;document.querySelector('#room-list').innerHTML=rooms.map((r,i)=>`<button data-room="${i}"><b>${r.n}</b><span><strong>${r.name}</strong><small>${r.sub}</small></span><span style="margin-left:auto">↗</span></button>`).join('')+'<button data-game-room><b>G</b><span><strong>The Game Room</strong><small>PLAY THE SEEN QUIZ</small></span><span style="margin-left:auto">↗</span></button>';document.querySelector('#room-list').onclick=e=>{if(!e.target.closest('[data-game-room],[data-room]'))return;if(isSceneOpen('screening'))closeScene('screening');if(isSceneOpen('arcade-room'))leaveArcade();if(filmDialog.open)filmDialog.close();if(e.target.closest('[data-game-room]')){closeIndex();walkToGame();return}const b=e.target.closest('[data-room]');if(!b)return;const r=rooms[Number(b.dataset.room)];closeIndex();near=r;preview.hidden=true;enter();canvas.focus({preventScroll:true})};addEventListener('keydown',e=>{if(e.key==='Escape'&&!directory.hidden)closeIndex()});
const touchMap={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};document.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(touchMap[b.dataset.dir])});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(touchMap[b.dataset.dir]))});

document.querySelector('#jump-lobby').onclick=()=>{if(isSceneOpen('arcade-room')||gameRoom.open||filmDialog.open||isSceneOpen('screening')||!directory.hidden)return;lobbyJump.start();canvas.focus({preventScroll:true})};

createSeenTouchGamepad({scene:document.querySelector("#lobby-scene"),keys,active:()=>SeenHub.entered&&!document.querySelector("#lobby-scene").hidden&&!document.querySelector("dialog[open]")&&directory.hidden,jump:()=>lobbyJump.start()});

function popcornShop(){
 box(13.5,7.2,0,2.5,1.1,.95,'#e4c185','#aa493a','#783c32');box(13.45,7.16,.95,2.6,1.2,.13,'#f2ddb5','#e3bf83','#aa8756');
 for(let x=13.7;x<15.9;x+=.28)box(x,8.31,.12,.08,.02,.7,'#f0d5a1','#efcea0','#b3855b');
 box(13.65,7.35,1.08,.8,.65,.85,'#dfbe73','#d9af6155','#b1885544');box(13.61,7.31,1.93,.88,.73,.12,'#e3be73','#aa493a','#783c32');
 for(let i=0;i<18;i++)ellipse(13.74+(i%5)*.12,7.46+Math.floor(i/5)*.12,1.26+(i%3)*.05,.06,.025,'#f4deb0');
 for(const x of [14.75,15.2]){box(x,7.6,1.08,.28,.28,.42,'#f3dca7','#bd503c','#e5b778');ellipse(x+.14,7.75,1.52,.18,.07,'#f4dfb2')}
 text('POPCORN',14.75,8.34,.46,.26,'#f8e7c5','wall');
}
const preview=document.querySelector('#door-preview'),board=document.querySelector('#lobby-board');let previewRoom=null,hoveredDoor=null;
function positionDoorPreview(){}
function showDoorPreview(r){if(!r||!board.hidden||!SeenHub.entered)return;previewRoom=r;preview.hidden=true;const note=document.querySelector('.corner-note'),article=screeningArticles[r.article];note.replaceChildren();note.append(document.createTextNode('SCREEN '+r.n+' / NOW SHOWING'));const title=document.createElement('strong'),deck=document.createElement('span');title.textContent=r.name;deck.textContent=article.deck;note.append(title,deck)}
function doorUnderPointer(px,py){return rooms.find(r=>{const a=p(r.x-.08,r.y+.3,2.85),b=p(r.x+1.65,r.y+.3,2.85),c=p(r.x-.08,r.y+.3,0),u=(px-a.x)/(b.x-a.x),v=(py-a.y-u*(b.y-a.y))/(c.y-a.y);return u>=0&&u<=1&&v>=0&&v<=1})||null}
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||!SeenHub.entered||!isSceneOpen('lobby-scene'))return;const r=canvas.getBoundingClientRect();hoveredDoor=doorUnderPointer(e.clientX-r.left,e.clientY-r.top);if(hoveredDoor)showDoorPreview(hoveredDoor);else if(!near)preview.hidden=true});canvas.addEventListener('pointerleave',()=>{hoveredDoor=null;if(!near)preview.hidden=true});
function browse(kind){const control=document.querySelector(kind==='stories'?'#browse-stories':'#browse-upcoming');if(!board.hidden&&board.dataset.kind===kind){closeUpcoming();return}board.dataset.kind=kind;board.replaceChildren();preview.hidden=true;const heading=document.createElement('h2');heading.id='upcoming-title';heading.textContent=kind==='stories'?'Pick your next conversation.':'Coming to the cinema.';const close=document.createElement('button');close.className='board-close';close.textContent='×';close.setAttribute('aria-label','Close program');close.onclick=closeUpcoming;const toolbar=document.createElement('div');toolbar.className='upcoming-toolbar';toolbar.append(heading,close);board.append(toolbar);const grid=document.createElement('div');grid.className='program-cards';for(const item of kind==='stories'?rooms:upcomingFilms){const card=document.createElement('button'),image=document.createElement('img'),meta=document.createElement('small'),title=document.createElement('strong'),deck=document.createElement('span');if(kind==='stories'){const article=screeningArticles[item.article];image.src=`assets/${article.image}.jpg`;meta.textContent='SCREEN '+item.n;title.textContent=item.name;deck.textContent=article.deck;card.onclick=()=>showDoorPreview(item,true)}else{image.src=`assets/${item.image}.${item.ext||'jpg'}`;meta.textContent='UPCOMING · '+item.date;title.textContent=item.title;deck.textContent='Film details & trailer ↗';card.onclick=()=>openFilm(item)}image.alt='';card.append(image,meta,title,deck);grid.append(card)}board.append(grid);board.hidden=false;keys.clear();target=null;lobbyWaypoints=[];lobbyVelocity={x:0,y:0};board.showModal();control.setAttribute('aria-expanded','true')}
function closeUpcoming(){board.close();board.hidden=true;document.querySelector('#browse-upcoming').setAttribute('aria-expanded','false')}
board.addEventListener('cancel',e=>{e.preventDefault();closeUpcoming()});
board.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code))e.stopPropagation()});
board.addEventListener('close',()=>{board.hidden=true;document.querySelector('#browse-upcoming').setAttribute('aria-expanded','false')});
document.querySelector('#browse-upcoming').onclick=()=>browse('upcoming');

document.addEventListener('seen-conversation-open',()=>{keys.clear();target=null;lobbyWaypoints=[];lobbyVelocity={x:0,y:0}});
