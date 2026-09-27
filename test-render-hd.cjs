const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const calls=[];
const context=()=>new Proxy({scale:(...args)=>calls.push(['scale',...args]),drawImage:(...args)=>calls.push(['image',...args]),fillRect:(...args)=>calls.push(['rect',...args])},{get:(obj,key)=>obj[key]??(()=>{})});
const canvas=()=>({width:0,height:0,getContext:()=>context()});
const env={document:{createElement:canvas}};
vm.runInNewContext(fs.readFileSync('renderer.js','utf8')+';globalThis.Renderer=ForestRenderer;',env);
const surface=canvas(),r=new env.Renderer(surface,canvas());
assert.equal(surface.width,1620);assert.equal(surface.height,1080);assert.equal(surface.width/surface.height,1.5);
let paints=0;r.paintTerrain=()=>paints++;
const room={width:960,height:640};r.terrain({room});r.terrain({room});assert.equal(paints,1,'static HD art is reused');
assert.deepEqual(calls.find(c=>c[0]==='scale'),['scale',1.6875,1.6875]);
const arena={width:1440,height:960};r.terrain({room:arena});
assert.ok(calls.some(c=>c[0]==='scale'&&c[1]===1.6875&&c[2]===1.6875),'final arena keeps native world pixel density');
assert.ok(calls.some(c=>c[0]==='image'&&c[4]===1440&&c[5]===960),'cached bitmap maps back to world size');
for(let i=0;i<30;i++)r.terrain({room:{width:960,height:640}});
assert.equal(r.terrainCache.size,6,'HD room memory stays bounded');
r.rect(1.25,2.75,3,4,'white');assert.deepEqual(calls.at(-1),['rect',1.25,2.75,3,4],'animation coordinates do not snap to old pixels');
for(const [x,y,expectedX,expectedY] of [[0,0,0,0],[900,700,420,380],[1910,1270,960,640]]){
  const view=r.camera({room:{width:1920,height:1280},player:{x,y}});assert.equal(view.x,expectedX);assert.equal(view.y,expectedY);
}
for(let i=0;i<4;i++)r.terrain({room:{width:1920,height:1280}});
assert.ok([...r.terrainCache.values()].reduce((sum,tile)=>sum+tile.width*tile.height,0)<=16000000,'large-room cache has a pixel memory budget');
console.log('PASS: 1080p canvas, proportional arena rendering, reusable bounded HD terrain cache and fractional animation positions.');
