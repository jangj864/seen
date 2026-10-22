'use strict';

// Route through visible gaps rather than forcing every trip through the centre aisle.
function createSeenRoomNavigation(chairs){
 const rectangles=[];
 for(const seat of [...chairs].sort((a,b)=>a.y-b.y||a.x-b.x)){
  const bounds={left:seat.x-.13,right:seat.x+.78,top:seat.y-.14,bottom:seat.y+.64},last=rectangles.at(-1);
  if(last&&last.top===bounds.top&&last.bottom===bounds.bottom&&bounds.left<=last.right)last.right=Math.max(last.right,bounds.right);
  else rectangles.push(bounds);
 }
 const blocked=(x,y)=>rectangles.some(r=>x>r.left&&x<r.right&&y>r.top&&y<r.bottom);
 function clear(a,b){
  for(const r of rectangles){
   let enter=0,leave=1;
   for(const [start,delta,min,max] of [[a.x,b.x-a.x,r.left,r.right],[a.y,b.y-a.y,r.top,r.bottom]]){
    if(Math.abs(delta)<1e-9){if(start<=min||start>=max){enter=1;leave=0;break}}
    else{const first=(min-start)/delta,second=(max-start)/delta;enter=Math.max(enter,Math.min(first,second));leave=Math.min(leave,Math.max(first,second))}
   }
   if(enter<leave)return false;
  }
  return true;
 }
 const margin=.08,corners=rectangles.flatMap(r=>[
  {x:r.left-margin,y:r.top-margin},{x:r.right+margin,y:r.top-margin},
  {x:r.left-margin,y:r.bottom+margin},{x:r.right+margin,y:r.bottom+margin}
 ]);
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const edges=corners.map(()=>[]);
 for(let i=0;i<corners.length;i++)for(let j=i+1;j<corners.length;j++)if(clear(corners[i],corners[j])){
  const cost=distance(corners[i],corners[j]);edges[i].push([j,cost]);edges[j].push([i,cost]);
 }
 function route(start,end){
  if(blocked(start.x,start.y)||blocked(end.x,end.y))return [];
  if(clear(start,end))return [{...end}];
  const points=[...corners,start,end],from=points.length-2,to=points.length-1,graph=edges.map(e=>e.slice());graph.push([],[]);
  for(let i=0;i<corners.length;i++)for(const endpoint of [from,to])if(clear(points[i],points[endpoint])){
   const cost=distance(points[i],points[endpoint]);graph[i].push([endpoint,cost]);graph[endpoint].push([i,cost]);
  }
  const costs=points.map(()=>Infinity),previous=points.map(()=>-1),visited=new Set();costs[from]=0;
  while(visited.size<points.length){
   let node=-1;for(let i=0;i<points.length;i++)if(!visited.has(i)&&(node<0||costs[i]<costs[node]))node=i;
   if(node<0||!Number.isFinite(costs[node]))return [];
   if(node===to)break;visited.add(node);
   for(const [next,cost]of graph[node])if(costs[node]+cost<costs[next]){costs[next]=costs[node]+cost;previous[next]=node}
  }
  const result=[];for(let node=to;node!==from;node=previous[node]){if(node<0)return [];result.unshift({...points[node]})}return result;
 }
 function destination(start,target){
  if(!blocked(target.x,target.y))return {...target};
  const r=rectangles.find(r=>target.x>r.left&&target.x<r.right&&target.y>r.top&&target.y<r.bottom),gap=.08;
  const candidates=[{x:r.left-gap,y:target.y},{x:r.right+gap,y:target.y},{x:target.x,y:r.top-gap},{x:target.x,y:r.bottom+gap}];
  let best=null,bestCost=Infinity;
  for(const point of candidates){const path=route(start,point);if(!path.length)continue;let travel=0,previous=start;for(const next of path){travel+=distance(previous,next);previous=next}const cost=distance(target,point)+travel*.2;if(cost<bestCost){best=point;bestCost=cost}}
  return best;
 }
 // Consume a distance budget along the route; never carry momentum past a corner or target.
 function advance(start,path,budget){
  let position={...start};
  while(path.length&&budget>0){
   const target=path[0],length=distance(position,target);
   if(length<1e-8){position={...target};path.shift();continue}
   const step=Math.min(length,budget),next={x:position.x+(target.x-position.x)*step/length,y:position.y+(target.y-position.y)*step/length};
   if(!clear(position,next))break;
   position=next;budget-=step;
   if(step===length){position={...target};path.shift()}
  }
  return position;
 }
 function landing(point){
  if(!blocked(point.x,point.y))return {...point};
  const r=rectangles.find(r=>point.x>r.left&&point.x<r.right&&point.y>r.top&&point.y<r.bottom),gap=.08;
  return [{x:point.x,y:r.top-gap},{x:point.x,y:r.bottom+gap},{x:r.left-gap,y:point.y},{x:r.right+gap,y:point.y}].filter(p=>!blocked(p.x,p.y)).sort((a,b)=>distance(point,a)-distance(point,b))[0]||null;
 }
 return {route,blocked,clear,destination,advance,landing};
}
