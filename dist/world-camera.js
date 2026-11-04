'use strict';
// All walking scenes use the same mobile camera and keep projection/hit testing aligned.
function createSeenWorldCamera({scene,onChange,zoom=1.8,home=null,deadZone={x:0,y:0}}){
 const tools=document.createElement('div');tools.className='scene-view-tools';
 const button=document.createElement('button');button.type='button';button.className='scene-view-toggle';tools.append(button);scene.append(tools);
 let overview=false,focus=null,previous=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function label(){seenSetText(button,overview?'Follow me':'Overview');button.setAttribute('aria-label',SeenI18n.t(overview?'Follow your visitor':'Show the whole map'));button.dataset.view=overview?'overview':'follow'}
 button.onclick=()=>{overview=!overview;focus=null;previous=null;label();onChange()};
 document.addEventListener('seen-language-change',label);label();
 return{view({width,height,unit,ox,oy,x,y,dt=1}){
  const mobile=width<=700&&height>0;tools.hidden=!mobile;
  if(!mobile||overview){focus=null;const next={unit,ox,oy};const changed=!previous||Object.keys(next).some(k=>previous[k]!==next[k]);previous=next;return{...next,changed}}
  if(home){x=home.x+Math.sign(x-home.x)*Math.max(0,Math.abs(x-home.x)-deadZone.x);y=home.y+Math.sign(y-home.y)*Math.max(0,Math.abs(y-home.y)-deadZone.y)}
  if(!focus||dt>=1)focus={x,y};
  const ease=reduced?1:1-Math.exp(-8*Math.max(0,dt));
  focus.x=Math.abs(x-focus.x)<.002?x:focus.x+(x-focus.x)*ease;focus.y=Math.abs(y-focus.y)<.002?y:focus.y+(y-focus.y)*ease;
  const next={unit:unit*zoom,ox:Math.round((width/2-(focus.x-focus.y)*unit*zoom*.86)*100)/100,oy:Math.round((height*.46-(focus.x+focus.y)*unit*zoom*.43)*100)/100};
  const changed=!previous||Object.keys(next).some(k=>previous[k]!==next[k]);previous=next;return{...next,changed}
 }};
}
