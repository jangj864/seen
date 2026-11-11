'use strict';
// All walking scenes use the same mobile camera and keep projection/hit testing aligned.
function seenFitWorldView({width,height,bounds,padding=16}){
 const top=bounds.paddingTop??padding,usableHeight=Math.max(1,height-top-padding),unit=Math.min(Math.max(1,width-2*padding)/(bounds.right-bounds.left),usableHeight/(bounds.bottom-bounds.top));
 return{unit,ox:width/2-(bounds.left+bounds.right)/2*unit,oy:top+usableHeight/2-(bounds.top+bounds.bottom)/2*unit};
}
// Hidden canvases keep their bitmap; unchanged layouts never reallocate it.
function seenResizeWorldCanvas(canvas,context){
 const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return null;
 const ratio=Math.min(devicePixelRatio||1,2),pixelWidth=Math.round(width*ratio),pixelHeight=Math.round(height*ratio);
 if(canvas.width!==pixelWidth)canvas.width=pixelWidth;if(canvas.height!==pixelHeight)canvas.height=pixelHeight;
 context.setTransform(ratio,0,0,ratio,0,0);return{width,height};
}
function createSeenWorldCamera({scene,onChange,zoom=1.8,home=null,deadZone={x:0,y:0},startOverview=false,bounds=null,toolbar=scene}){
 const tools=document.createElement('div');tools.className='scene-view-tools';
 const button=document.createElement('button');button.type='button';button.className='scene-view-toggle';tools.append(button);toolbar.append(tools);
 let overview=startOverview,focus=null,previous=null;
 const compact=matchMedia('(any-pointer: coarse) and (max-width: 1100px), (max-height: 600px)');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function label(){seenSetText(button,overview?'Follow me':'Overview');button.setAttribute('aria-label',SeenI18n.t(overview?'Follow your visitor':'Show the whole map'));button.dataset.view=overview?'overview':'follow'}
 button.onclick=()=>{overview=!overview;focus=null;previous=null;label();onChange()};
 document.addEventListener('seen-language-change',label);label();
 return{view({width,height,unit,ox,oy,x,y,dt=1}){
  const mobile=(width<=700||!!bounds&&compact.matches)&&height>0;if(tools.hidden!==!mobile)tools.hidden=!mobile;
  if(!mobile||overview){focus=null;const next=mobile&&bounds?seenFitWorldView({width,height,bounds}):{unit,ox,oy};const changed=!previous||Object.keys(next).some(k=>previous[k]!==next[k]);previous=next;return{...next,changed}}
  if(bounds)unit=seenFitWorldView({width,height,bounds}).unit;
  if(home){x=home.x+Math.sign(x-home.x)*Math.max(0,Math.abs(x-home.x)-deadZone.x);y=home.y+Math.sign(y-home.y)*Math.max(0,Math.abs(y-home.y)-deadZone.y)}
  if(!focus||dt>=1)focus={x,y};
  const ease=reduced?1:1-Math.exp(-8*Math.max(0,dt));
  focus.x=Math.abs(x-focus.x)<.002?x:focus.x+(x-focus.x)*ease;focus.y=Math.abs(y-focus.y)<.002?y:focus.y+(y-focus.y)*ease;
  const next={unit:unit*zoom,ox:Math.round((width/2-(focus.x-focus.y)*unit*zoom*.86)*100)/100,oy:Math.round((height*.46-(focus.x+focus.y)*unit*zoom*.43)*100)/100};
  const changed=!previous||Object.keys(next).some(k=>previous[k]!==next[k]);previous=next;return{...next,changed}
 }};
}
