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
