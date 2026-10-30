'use strict';
// One 24 px pixel grid supplies both the cabinet display and its game dialog.
const SeenIcons=(()=>{
 const pixels={
  all:[
   '000000000000',
   '000111111000',
   '001000000100',
   '001000000100',
   '000000000100',
   '000000001000',
   '000000110000',
   '000001000000',
   '000001000000',
   '000000000000',
   '000001000000',
   '000000000000'
  ],
  eyes:[
   '000000000000',
   '000000000000',
   '000000000000',
   '000011110000',
   '001100001100',
   '010001100010',
   '010001100010',
   '001100001100',
   '000011110000',
   '000000000000',
   '000000000000',
   '000000000000'
  ],
  films:[
   '000000000000',
   '011111111110',
   '011001001010',
   '010011011010',
   '011111111110',
   '010000000010',
   '010111100010',
   '010000000010',
   '010111111010',
   '010000000010',
   '011111111110',
   '000000000000'
  ]
 };
 const paths=Object.fromEntries(Object.entries(pixels).map(([mode,rows])=>[mode,rows.map((row,y)=>[...row.matchAll(/1+/g)].map(run=>`M${run.index*2} ${y*2}h${run[0].length*2}v2h-${run[0].length*2}z`).join('')).join('')]));
 const cachedPaths=new Map();
 function svg(mode){const path=paths[mode];return path?`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}" fill="currentColor" stroke="none"/></svg>`:''}
 function draw(ctx,mode,x,y,size,color){
  if(!paths[mode])return;
  if(!cachedPaths.has(mode))cachedPaths.set(mode,new Path2D(paths[mode]));
  ctx.save();ctx.translate(x,y);ctx.scale(size/24,size/24);ctx.fillStyle=color;ctx.fill(cachedPaths.get(mode));ctx.restore();
 }
 return Object.freeze({svg,draw});
})();
