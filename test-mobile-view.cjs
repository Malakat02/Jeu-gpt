const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map(),events={};let copies=0,reset=0,mode='play';
function node(id){if(!nodes.has(id)){const classes=new Set();nodes.set(id,{id,hidden:false,innerHTML:'',textContent:'',children:[],classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},appendChild(child){this.children.push(child);},setAttribute(k,v){this[k]=v;},getContext:()=>({drawImage(){copies++;}})});}return nodes.get(id);}
const document={getElementById:node,querySelector:()=>node('controls'),createElement:tag=>node(tag+nodes.size),body:node('body'),addEventListener:(type,fn)=>events[type]=fn,fullscreenElement:null};
node('pause').onclick=()=>mode='pause';node('floor-label').textContent='ÉTAGE 2 / 3';
// Model source-over copying: transparent pixels do not erase an old room.
const pixels=new Set(),sourcePixels=new Set(['old-room','shared-room']),mobileCanvas=node('mobile-map');
mobileCanvas.width=260;mobileCanvas.height=155;
mobileCanvas.getContext=()=>({
  clearRect(x,y,w,h){assert.deepEqual([x,y,w,h],[0,0,260,155]);pixels.clear();},
  drawImage(source){assert.equal(source,node('map'));copies++;for(const pixel of sourcePixels)pixels.add(pixel);}
});
const sandbox={document};vm.runInNewContext(fs.readFileSync('mobile-view.js','utf8')+';globalThis.View=ForestMobileView;',sandbox);
const view=new sandbox.View({onReset:()=>reset++,onMapOpen:()=>{if(mode!=='play')return false;mode='map';return true;},onMapClose:()=>mode='play'});
assert.ok(node('game-wrap').children.includes(node('controls')),'controls are inside the game surface');
node('mobile-map-toggle').onclick();assert.equal(mode,'map');assert.equal(copies,1);assert.equal(view.mapPanel.hidden,false);assert.equal(node('mobile-map-floor').textContent,'ÉTAGE 2 / 3');
node('mobile-map-toggle').onclick();assert.equal(mode,'play');assert.equal(view.mapPanel.hidden,true);assert.equal(node('mobile-map-toggle')['aria-expanded'],'false');
sourcePixels.delete('old-room');sourcePixels.add('new-room');node('floor-label').textContent='ÉTAGE 3 / 3';
for(let i=0;i<3;i++){
  node('mobile-map-toggle').onclick();assert.deepEqual([...pixels].sort(),['new-room','shared-room'],'reopening replaces the previous map, including transparent areas');assert.equal(node('mobile-map-floor').textContent,'ÉTAGE 3 / 3');
  node('mobile-map-close').onclick();assert.equal(mode,'play');
}
mode='pause';node('mobile-map-toggle').onclick();assert.equal(view.mapOpen,false,'opening map cannot resume an existing pause');mode='play';
node('mobile-map-toggle').onclick();events.keydown({key:'Escape'});assert.equal(mode,'play');assert.equal(view.mapOpen,false);
(async()=>{
  await view.toggleFullscreen();assert.ok(view.immersive);assert.ok(document.body.classList.contains('immersive-game'),'fallback works without native API');
  await view.toggleFullscreen();assert.equal(view.immersive,false);
  node('game-panel').requestFullscreen=async()=>{throw Error('unsupported');};await view.toggleFullscreen();assert.ok(view.immersive,'rejection retains usable immersive layout');await view.toggleFullscreen();
  node('game-panel').requestFullscreen=async()=>{document.fullscreenElement=node('game-panel');};document.exitFullscreen=async()=>{document.fullscreenElement=null;events.fullscreenchange();};
  await view.toggleFullscreen();assert.equal(view.nativeFullscreen,true);await view.toggleFullscreen();assert.equal(view.immersive,false);assert.equal(document.fullscreenElement,null);
  assert.ok(reset>=6,'map and fullscreen transitions clear held controls');console.log('PASS: map pause/resume, control placement, fullscreen entry/exit and unsupported-browser fallback.');
})().catch(e=>{console.error(e);process.exitCode=1;});
