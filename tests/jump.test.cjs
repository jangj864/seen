const{test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({document:{fonts:{ready:{then(){}}}}});vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/character.js'),'utf8'),ctx);
test('jump anticipates, bends in flight, absorbs landing, and fully settles',()=>{
 const jump=ctx.createSeenJump();jump.start();jump.step(.10);assert.equal(jump.height,0);assert.ok(jump.crouch>.5);jump.step(.25);assert.ok(jump.height>.5);assert.ok(jump.tuck>.8);jump.step(.46);assert.equal(jump.height,0);assert.ok(jump.crouch>0);assert.equal(jump.active,true);jump.step(.3);assert.equal(jump.active,false);assert.equal(jump.crouch,0);assert.equal(jump.tuck,0);
});
test('repeated input cannot restart an airborne jump; reset clears the entire pose',()=>{const jump=ctx.createSeenJump();jump.start();jump.step(.3);const height=jump.height;jump.start();assert.equal(jump.height,height);jump.reset();assert.equal(jump.height,0);assert.equal(jump.crouch,0);assert.equal(jump.active,false)});
