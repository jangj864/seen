'use strict';
const seenScenes=[...document.querySelectorAll('#scene-content > section')];
function isSceneOpen(id){const scene=document.getElementById(id);return !!scene&&!scene.hidden}
function showScene(id){
 const selected=document.getElementById(id);if(!seenScenes.includes(selected))return;
 for(const scene of seenScenes)scene.hidden=scene!==selected;
 document.body.dataset.scene=id;selected.scrollTop=0;
 // A scene change changes canvas layout even when the viewport itself stays the same.
 dispatchEvent(new Event('resize'));
}
function closeScene(id){
 const scene=document.getElementById(id);if(!scene||scene.hidden)return;
 showScene('lobby-scene');scene.dispatchEvent(new Event('close'));
}
// Keep one animation loop for the visible walking scene. Hidden scenes resume
// from their existing state when shown instead of polling every display frame.
function createSeenSceneLoop(scene,paint){
 let frame=null;
 const visible=()=>!scene.hidden&&!document.hidden;
 function schedule(){if(frame===null&&visible())frame=requestAnimationFrame(tick)}
 function tick(time){frame=null;if(!visible())return;paint(time);schedule()}
 function sync(){if(!visible()&&frame!==null){cancelAnimationFrame(frame);frame=null}else schedule()}
 new MutationObserver(sync).observe(scene,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',sync);schedule();
}
showScene('lobby-scene');

addEventListener('keydown',event=>{if(event.key!=='Escape'||document.querySelector('dialog[open]')||!document.querySelector('#directory').hidden)return;if(document.body.dataset.scene==='screening'){event.preventDefault();leaveScreening();return}if(document.body.dataset.scene==='arcade-room'){event.preventDefault();leaveArcade();return}const buttons={'film-details':'close-film'};const id=buttons[document.body.dataset.scene];if(id){event.preventDefault();document.getElementById(id).click()}});
