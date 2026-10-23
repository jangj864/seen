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
showScene('lobby-scene');

addEventListener('keydown',event=>{if(event.key!=='Escape'||document.querySelector('dialog[open]')||!document.querySelector('#directory').hidden)return;const buttons={screening:'leave-room','arcade-room':'leave-arcade','film-details':'close-film'};const id=buttons[document.body.dataset.scene];if(id){event.preventDefault();document.getElementById(id).click()}});
