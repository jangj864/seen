const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/room-navigation.js'),'utf8'),context);
const chairs=Array.from({length:50},(_,i)=>{const row=Math.floor(i/10),col=i%10;return{x:col<5?1.35+col*.78:6.85+(col-5)*.78,y:4.1+row*1.3}});
const nav=context.createSeenRoomNavigation(chairs);
const approach=seat=>({x:seat.x+.33,y:seat.y-.33});
test('open floor uses a direct diagonal, without centre-aisle waypoints',()=>{
 const start={x:2,y:2},end={x:9,y:3};const path=nav.route(start,end);
 assert.equal(path.length,1);assert.equal(path[0].x,end.x);assert.equal(path[0].y,end.y);
});
test('every seat can reach every other seat without crossing a chair',()=>{
 for(const start of [{x:6,y:10.65},...chairs.map(approach)])for(const end of [...chairs.map(approach),{x:6,y:11.55}]){
  const route=nav.route(start,end);assert.ok(route.length,'destination is reachable');let prev=start;
  for(const point of route){assert.ok(nav.clear(prev,point),'segment avoids seats');for(let t=0;t<=1;t+=.05)assert.ok(!nav.blocked(prev.x+(point.x-prev.x)*t,prev.y+(point.y-prev.y)*t));prev=point}
  assert.equal(prev.x,end.x);assert.equal(prev.y,end.y);
 }
});
test('occupied destinations are rejected',()=>assert.equal(nav.route({x:6,y:10.65},chairs[0]).length,0));
test('a blocked click behind a row stays in the rear aisle',()=>{
 const start={x:3.24,y:7.5},target={x:3.3,y:7.2};
 const end=nav.destination(start,target);assert.ok(end.y>7.34);assert.ok(Math.abs(end.x-target.x)<.01);assert.equal(nav.route(start,end).length,1);
});
test('nearby unobstructed clicks retain the exact destination',()=>{
 const start={x:3.24,y:6.37},target={x:3.45,y:6.4};
 const end=nav.destination(start,target);assert.equal(end.x,target.x);assert.equal(end.y,target.y);assert.equal(nav.route(start,end).length,1);
});
test('movement consumes each corner without overshoot or leaving the route',()=>{
 for(const seat of chairs){
  const start={x:6,y:10.65},end=approach(seat),path=nav.route(start,end);
  const expected=path.reduce((sum,p,i)=>sum+Math.hypot(p.x-(i?path[i-1]:start).x,p.y-(i?path[i-1]:start).y),0);
  let position=start,travel=0,frames=0;
  while(path.length&&frames++<1000){const before=position;position=nav.advance(position,path,.117);const step=Math.hypot(position.x-before.x,position.y-before.y);assert.ok(step<=.117+1e-8);assert.ok(!nav.blocked(position.x,position.y));travel+=step}
  assert.ok(frames<1000,'route completes');assert.ok(travel<=expected+1e-7);assert.equal(position.x,end.x);assert.equal(position.y,end.y);
  const stopped=nav.advance(position,path,1);assert.equal(stopped.x,end.x);assert.equal(stopped.y,end.y);
 }
});
test('a replacement target never inherits the previous route',()=>{
 const start={x:6,y:10.65};const oldPath=nav.route(start,approach(chairs[0]));const halfway=nav.advance(start,oldPath,.5);
 const end={x:halfway.x+.15,y:halfway.y+.05},path=nav.route(halfway,end);const arrived=nav.advance(halfway,path,100);
 assert.equal(arrived.x,end.x);assert.equal(arrived.y,end.y);assert.equal(path.length,0);
});
test('lobby routes avoid the expanded counter and rope footprints',()=>{
 const lobby=context.createSeenRoomNavigation([],[{left:3.42,right:6.78,top:6.32,bottom:7.77},{left:7.28,right:8.92,top:7.78,bottom:8.22}]);
 const start={x:3,y:7},end={x:7,y:7},route=lobby.route(start,end);assert.ok(route.length>1);
 let position=start,frames=0;while(route.length&&frames++<1000){position=lobby.advance(position,route,.1);assert.ok(!lobby.blocked(position.x,position.y))}
 assert.equal(position.x,end.x);assert.equal(position.y,end.y);assert.equal(lobby.blocked(8,8),true);
});
