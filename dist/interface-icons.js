'use strict';
// Interface arrows are vector strokes, independent of the platform emoji font.
const SeenUI=(()=>{
 const angles={'→':0,'↗':-45,'↑':-90,'↖':-135,'←':180,'↙':135,'↓':90,'↘':45},pattern=/[↗↖↘↙→←↑↓]\ufe0f?/g;
 const targets='a,button,.screen-reading-cue,.scoreboard-scroll-hint,.exit-sign';
 function canIconize(node){return /[↗↖↘↙→←↑↓]/.test(node.nodeValue)&&!!node.parentElement?.closest(targets)&&!node.parentElement.closest('script,style,svg,textarea,[data-no-translate],.reader-comment,[contenteditable="true"],[data-i18n-icon-label]')}
 function fillLabel(host,value){
  const fragment=document.createDocumentFragment();let start=0;
  for(const match of String(value).matchAll(pattern)){
   fragment.append(document.createTextNode(value.slice(start,match.index)));
   const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
   svg.classList.add('ui-arrow');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.dataset.direction=match[0][0];path.setAttribute('d','M5 12h14m-6-6 6 6-6 6');path.setAttribute('transform',`rotate(${angles[match[0][0]]} 12 12)`);svg.append(path);fragment.append(svg);start=match.index+match[0].length;
  }
  fragment.append(document.createTextNode(value.slice(start)));host.replaceChildren(fragment);
 }
 function paintLabel(ctx,value,x,y){
  const size=Number(ctx.font.match(/([\d.]+)px/)?.[1]||12),parts=String(value).split(/([↗↖↘↙→←↑↓]\ufe0f?)/),widths=parts.map(part=>angles[part[0]]!==undefined?size:ctx.measureText(part).width),total=widths.reduce((a,b)=>a+b,0);
  let left=x-(ctx.textAlign==='center'?total/2:ctx.textAlign==='right'||ctx.textAlign==='end'?total:0);
  ctx.save();ctx.textAlign='left';
  parts.forEach((part,index)=>{if(angles[part[0]]===undefined)ctx.fillText(part,left,y);else{ctx.save();ctx.translate(left+size/2,y-size*.35);ctx.rotate(angles[part[0]]*Math.PI/180);ctx.scale(size/24,size/24);ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(7,0);ctx.moveTo(1,-6);ctx.lineTo(7,0);ctx.lineTo(1,6);ctx.stroke();ctx.restore()}left+=widths[index]});ctx.restore();
 }
 function enhanceStatic(root){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())if(canIconize(walker.currentNode))nodes.push(walker.currentNode);for(const node of nodes){const label=document.createElement('span');label.className='ui-label';fillLabel(label,node.nodeValue);node.replaceWith(label)}}
 return Object.freeze({canIconize,fillLabel,paintLabel,enhanceStatic});
})();
document.addEventListener('DOMContentLoaded',()=>{if(typeof SeenI18n==='undefined')SeenUI.enhanceStatic(document.body)},{once:true});
