const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map(),events={},storage=new Map();let mode='play',resets=0;
function node(id){if(!nodes.has(id)){const classes=new Set(),handlers={};nodes.set(id,{id,style:{},hidden:false,innerHTML:'',classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},appendChild(){},setPointerCapture(){},addEventListener:(type,fn)=>handlers[type]=fn,getBoundingClientRect(){return {left:parseFloat(this.style.left)||700,top:parseFloat(this.style.top)||250,width:60,height:50};},fire(type,pointerId,x,y){handlers[type]({pointerId,clientX:x,clientY:y,preventDefault(){},stopPropagation(){}});}});}return nodes.get(id);}
const window={innerWidth:844,innerHeight:390,addEventListener:(name,fn)=>events[name]=fn};
const document={getElementById:node,createElement:tag=>node(tag+nodes.size),addEventListener:(name,fn)=>events[name]=fn};
const sandbox={window,document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};
vm.runInNewContext(fs.readFileSync('touch-layout.js','utf8')+';globalThis.Layout=ForestTouchLayout;',sandbox);
const options={onReset:()=>resets++,onOpen:()=>{mode='layout';return true;},onClose:()=>mode='play'};
const layout=new sandbox.Layout(options),attack=node('touch-action');node('touch-layout-edit').onclick();assert.equal(mode,'layout');assert.ok(layout.editing);
attack.fire('pointerdown',1,720,270);attack.fire('pointermove',2,30,100);assert.equal(attack.style.left,'','unowned pointer cannot drag');
attack.fire('pointermove',1,30,100);assert.equal(attack.style.left,'10px','button can move into screen border outside the centered game');attack.fire('pointerup',1);node('touch-layout-done').onclick();assert.equal(mode,'play');assert.ok(storage.has('forest-touch-layout'));
const restored=new sandbox.Layout(options);assert.ok(attack.classList.contains('custom-position'));assert.equal(attack.style.left,'10px');
window.innerWidth=390;window.innerHeight=844;events.resize();assert.equal(attack.style.left,'','portrait retains independent default');
node('touch-layout-edit').onclick();attack.fire('pointerdown',3,720,270);attack.fire('pointermove',3,9999,9999);attack.fire('pointerup',3);assert.equal(attack.style.left,'326px');assert.equal(attack.style.top,'790px','buttons stay within the visible viewport');node('touch-layout-done').onclick();
window.innerWidth=844;window.innerHeight=390;events.resize();assert.equal(attack.style.left,'10px','returning to landscape restores prior placement');
node('touch-layout-edit').onclick();node('touch-layout-reset').onclick();assert.equal(attack.style.left,'');assert.ok(!attack.classList.contains('custom-position'));node('touch-layout-done').onclick();assert.equal(restored.editing,false);assert.ok(resets>0);
console.log('PASS: drag ownership, border placement, persistent positions, separate orientations, viewport bounds and default reset.');
