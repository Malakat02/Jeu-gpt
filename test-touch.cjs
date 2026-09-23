const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const events={},classes=new Set();
function element(){const handlers={},pressed=new Set();return {handlers,style:{},classList:{add:c=>pressed.add(c),remove:c=>pressed.delete(c)},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:128,height:128}),addEventListener:(type,fn)=>handlers[type]=fn,fire(type,id,x=64,y=64){handlers[type]({pointerId:id,clientX:x,clientY:y,preventDefault(){}});}};}
const sandbox={window:{matchMedia:()=>({matches:true}),addEventListener:(name,fn)=>events[name]=fn},document:{body:{classList:{add:c=>classes.add(c)}}}};
vm.runInNewContext(fs.readFileSync('touch.js','utf8')+';globalThis.Controller=ForestTouch;',sandbox);
const stick=element(),knob=element(),action=element(),dodge=element(),boom=element();let attacks=0,releases=0,cancels=0,dashes=0,booms=0;
const c=new sandbox.Controller({stick,knob,action,dodge,boom,onAttack:()=>attacks++,onRelease:()=>releases++,onCancel:()=>cancels++,onDodge:()=>dashes++,onBoom:()=>booms++});
assert.ok(classes.has('touch-device'));
stick.fire('pointerdown',1,128,64);assert.equal(c.x,1);assert.equal(c.y,0);
action.fire('pointerdown',2);dodge.fire('pointerdown',3);boom.fire('pointerdown',4);assert.equal(attacks,1);assert.equal(dashes,1);assert.equal(booms,1);assert.ok(c.active);assert.equal(c.x,1);
action.fire('pointerup',1);assert.equal(releases,0,'another finger cannot release the held attack');
stick.fire('pointerup',1);assert.equal(c.x,0);assert.ok(c.active,'releasing joystick leaves charge held');
action.fire('pointerup',2);assert.equal(releases,1);action.fire('lostpointercapture',2);assert.equal(releases,1,'capture loss after release cannot fire twice');
action.fire('pointerdown',5);action.fire('pointercancel',5);assert.equal(cancels,1);assert.equal(releases,1,'cancel never launches a charged spin');
stick.fire('pointerdown',6,65,65);assert.equal(c.x,0,'dead zone prevents drift');stick.fire('pointermove',6,80,64);assert.ok(c.x>0&&c.x<1,'analog speed');stick.fire('pointermove',6,128,128);assert.ok(Math.abs(Math.hypot(c.x,c.y)-1)<1e-9);
action.fire('pointerdown',7);events.resize();assert.equal(c.x,0);assert.equal(c.y,0);assert.equal(c.active,false);assert.equal(c.buttons.size,0);assert.equal(c.stickId,null);
console.log('PASS: multitouch movement/attack/dodge/boomerang, analog dead zone, pointer ownership, cancellation and rotation reset.');
