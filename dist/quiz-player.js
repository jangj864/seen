'use strict';
// Every cabinet shares one question, answer and result renderer.
const SeenQuizThemes=Object.freeze({
 all:{title:'SEEN QUIZ',accent:'#b74239',light:'#f0b39d',onAccent:'#fff3dc',description:'Ten questions about film directors.'},
 eyes:{title:'EYES ONLY',accent:'#428b7e',light:'#a4d4b2',onAccent:'#fff3dc',description:'Guess ten actors from their eyes.'},
 films:{title:'FILM CLUB',accent:'#b1893e',light:'#efcf82',onAccent:'#172a20',description:'Ten questions about well-known films.'}
});
function createSeenQuizPlayer({canRequest=()=>true,onOpen=()=>{},onClose=()=>{},fx=()=>{},nickname=()=>undefined}={}){
const gameRoom=document.querySelector('#game-room'),quizConfirm=document.querySelector('#game-confirm'),quizThemes=SeenQuizThemes;
let requestedQuiz=null;
function applyQuizTheme(element,mode){const theme=quizThemes[mode];element.dataset.mode=mode;for(const [key,value]of Object.entries({accent:theme.accent,light:theme.light,'on-accent':theme.onAccent}))element.style.setProperty(`--game-${key}`,value)}
function requestQuiz(mode){
 if(!canRequest()||gameRoom.open||quizConfirm.open||!quizThemes[mode])return;
 requestedQuiz=mode;applyQuizTheme(quizConfirm,mode);document.querySelector('.game-confirm-mark').innerHTML=SeenIcons.svg(mode);document.querySelector('#game-confirm-title').textContent=`Would you like to play ${quizThemes[mode].title}?`;document.querySelector('#game-confirm-description').textContent=quizThemes[mode].description;
 quizConfirm.showModal();document.querySelector('#confirm-game-start').focus({preventScroll:true});onOpen();
}
function cancelQuizRequest(){requestedQuiz=null;quizConfirm.close();onClose()}
document.querySelector('#cancel-game-start').onclick=cancelQuizRequest;
quizConfirm.addEventListener('cancel',event=>{event.preventDefault();cancelQuizRequest()});
document.querySelector('#confirm-game-start').onclick=()=>{const mode=requestedQuiz;requestedQuiz=null;quizConfirm.close();if(mode)openQuiz(mode)};
function updateQuizIndicators(total,complete){
 const dots=document.querySelector('#game-indicators');dots.replaceChildren();
 for(let i=0;i<total;i++){const dot=document.createElement('li'),current=!complete&&i===gameIndex,answered=complete||i<gameIndex||(current&&gameAnswered!==null);dot.className='quiz-dot';dot.classList.toggle('is-current',current);dot.classList.toggle('is-answered',answered);dot.setAttribute('aria-label',`Question ${i+1}: ${current?'current question':answered?'completed':'not answered yet'}`);if(current)dot.setAttribute('aria-current','step');dots.append(dot)}
}
let gameIndex=0,gameScore=0,gameAnswered=null,gameMode='all',gameQuestions=seenQuizQuestions.filter(q=>q.mode==='all'),gameRound=SeenScoreboard.createRound('all',nickname());
function replayQuiz(){gameIndex=0;gameScore=0;gameAnswered=null;gameRound=SeenScoreboard.createRound(gameMode,nickname());renderGame();document.querySelector('#game-quiz button')?.focus({preventScroll:true})}
function renderGame(){
 document.querySelector('#game-photo-credits').hidden=gameMode!=='eyes';document.querySelector('#game-footer-brand').hidden=gameMode==='eyes';
 const total=gameQuestions.length,complete=gameIndex===total,q=gameQuestions[gameIndex],root=document.querySelector('#game-quiz');
 document.querySelectorAll('[data-cabinet-answer]').forEach(button=>button.disabled=complete||gameAnswered!==null);
 updateQuizIndicators(total,complete);
 document.querySelector('#game-progress').textContent=complete?'YOUR RESULT':`QUESTION ${String(gameIndex+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
 document.querySelector('#game-score').textContent=`SCORE ${gameScore}`;
 document.querySelector('#game-progress-bar').style.width=`${Math.min(gameIndex+1,total)/total*100}%`;
 root.dataset.state=complete?'complete':gameAnswered===null?'question':gameAnswered===q.answer?'correct':'wrong';
 if(complete){SeenScoreboard.show(root,{round:gameRound,score:gameScore,total,onReplay:replayQuiz});return}
 root.replaceChildren();const question=document.createElement('div');question.className='game-question';
 const heading=document.createElement('h3');heading.textContent=q.q;question.append(heading);
 if(!complete&&q.kind==='eyes'){
  const ns='http://www.w3.org/2000/svg',visual=document.createElementNS(ns,'svg'),crop=document.createElementNS(ns,'svg'),image=document.createElementNS(ns,'image'),[,,width,height]=q.crop;
  visual.classList.add('game-eyes');visual.setAttribute('viewBox',`0 0 ${width} ${height}`);visual.setAttribute('preserveAspectRatio','xMidYMid meet');visual.setAttribute('role','img');visual.setAttribute('aria-label',gameAnswered===null?'Eye detail. Choose the actor below.':`Eye detail: ${q.options[q.answer]}`);
  // Fit the complete eye pair at any screen ratio; the inner viewport hides the rest of the portrait.
  crop.setAttribute('viewBox',q.crop.join(' '));crop.setAttribute('width',String(width));crop.setAttribute('height',String(height));crop.setAttribute('overflow','hidden');
  image.setAttribute('href',`assets/${q.image}.${q.imageExt||'jpg'}`);image.setAttribute('width',String(q.imageSize?.[0]||2000));image.setAttribute('height',String(q.imageSize?.[1]||1125));crop.append(image);visual.append(crop);question.append(visual);
 }
 if(!complete){const options=document.createElement('div');options.className='game-options';q.options.forEach((value,i)=>{
  const button=document.createElement('button');button.dataset.gameAnswer=String(i);button.setAttribute('aria-keyshortcuts',`${'ABCD'[i]} ${i+1}`);const letter=document.createElement('span');letter.textContent='ABCD'[i];const label=document.createElement('strong');label.textContent=value;button.append(letter,label);button.setAttribute('aria-pressed',String(gameAnswered===i));
  if(gameAnswered!==null){button.disabled=true;if(i===q.answer)button.classList.add('correct');if(i===gameAnswered&&i!==q.answer)button.classList.add('wrong');if(i!==q.answer&&i!==gameAnswered)button.classList.add('is-muted');if(i===q.answer||i===gameAnswered){const mark=document.createElement('b');mark.className='answer-mark';mark.textContent=i===q.answer?'✓':'×';mark.setAttribute('aria-label',i===q.answer?'Correct answer':'Incorrect answer');button.append(mark)}}
  button.onclick=()=>{if(gameAnswered!==null)return;gameAnswered=i;gameRound.answers[gameIndex]=i;if(i===q.answer)gameScore++;fx(i===q.answer?'correct':'wrong');renderGame();root.querySelector('.game-next').focus({preventScroll:true})};options.append(button)
 });question.append(options)}root.append(question);
 const slot=document.createElement('div');slot.className='game-answer-slot';root.append(slot);
 if(gameAnswered!==null){const feedback=document.createElement('p');feedback.className='game-feedback';feedback.setAttribute('role','status');feedback.textContent=`${gameAnswered===q.answer?'CORRECT! +1 POINT':'ANSWER: '+q.options[q.answer]} — ${q.note}`;
 const next=document.createElement('button');next.className='game-next';next.textContent=gameIndex===total-1?'SEE YOUR RESULT →':'NEXT QUESTION →';next.onclick=()=>{gameIndex++;gameAnswered=null;renderGame();root.querySelector('button')?.focus({preventScroll:true})};slot.append(feedback,next)}else{const hint=document.createElement('p');hint.className='game-idle-hint';hint.textContent='Choose your answer.';slot.append(hint)}
}
function openQuiz(mode='all'){
 if(gameRoom.open||!quizThemes[mode])return;
 applyQuizTheme(gameRoom,mode);document.querySelector('#game-title').textContent=quizThemes[mode].title;document.querySelector('.cabinet-mode-icon').innerHTML=SeenIcons.svg(mode);
 if(mode!==gameMode){gameMode=mode;gameQuestions=seenQuizQuestions.filter(q=>q.mode===mode);gameIndex=0;gameScore=0;gameAnswered=null;gameRound=SeenScoreboard.createRound(mode,nickname())}
 if(gameIndex===0&&gameAnswered===null)gameRound.nickname=nickname();
 renderGame();gameRoom.showModal();document.querySelector('#leave-game').focus({preventScroll:true});onOpen();
}
function leaveGame(){if(!gameRoom.open)return;gameRoom.close();onClose()}
document.querySelector('#leave-game').onclick=leaveGame;
gameRoom.addEventListener('cancel',event=>{event.preventDefault();leaveGame()});
function chooseAnswer(index){const option=gameRoom.querySelector(`[data-game-answer="${index}"]`);if(!option||option.disabled)return false;option.click();return true}
gameRoom.querySelector('.cabinet-buttons').addEventListener('click',event=>{const button=event.target.closest('[data-cabinet-answer]');if(button)chooseAnswer(Number(button.dataset.cabinetAnswer))});
gameRoom.addEventListener('keydown',event=>{
 if(!gameRoom.open||event.repeat||event.altKey||event.ctrlKey||event.metaKey||seenTypingTarget(event.target))return;
 const key=event.key.toLowerCase(),index=/^[1-4]$/.test(key)?Number(key)-1:'abcd'.indexOf(key);
 if(index<0||!chooseAnswer(index))return;event.preventDefault();event.stopPropagation();
});
return{request:requestQuiz,open:openQuiz,close:leaveGame,cancel:cancelQuizRequest,render:renderGame};
}
