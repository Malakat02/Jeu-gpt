const vm=require('node:vm');
const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
const voices=[],storage=new Map();
function param(){return {value:0,setValueAtTime(value){this.value=value;},exponentialRampToValueAtTime(value){assert.ok(Number.isFinite(value)&&value>0);this.value=value;},setTargetAtTime(value){this.value=value;},cancelScheduledValues(){}};}
function node(){return {connect(){},disconnect(){},gain:param(),frequency:param(),threshold:param(),ratio:param(),start(t){assert.ok(t>=0);voices.push(this);},stop(t){assert.ok(Number.isFinite(t));}};}
class AudioContext {
  constructor(){this.currentTime=0;this.sampleRate=44100;this.destination={};this.state='running';}
  createGain(){return node();}createOscillator(){return node();}createBufferSource(){return node();}createBiquadFilter(){return node();}createDynamicsCompressor(){return node();}
  createBuffer(){return {getChannelData:()=>new Float32Array(44100)};}
  resume(){return Promise.resolve();}
}
const sandbox={Math,Map,window:{AudioContext},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};
vm.runInNewContext(readFileSync('audio.js','utf8')+'\nglobalThis.Engine=ForestAudio;',sandbox);
const engine=new sandbox.Engine();assert.equal(engine.context,null,'audio waits for a user gesture');engine.unlock();
for(const effect of ['sword','hit','hurt','dash','boomerang','catch','coin','heal','treasure','relic','buy','key','door','clear','enemy','shot','warning','charge','boss','rage','win','death']){
  const before=voices.length;engine.play(effect);assert.ok(voices.length>before,`${effect} produces sound`);engine.context.currentTime++;
}
for(const theme of ['forest','shop','boss']){
  const before=voices.length;for(let i=0;i<32;i++){engine.context.currentTime+=.33;engine.update(true,theme);}
  assert.ok(voices.length>before+20,`${theme} has a musical arrangement`);
}
engine.setEnabled(false);let before=voices.length;engine.play('sword');engine.update(true,'forest');assert.equal(voices.length,before);assert.equal(engine.master.gain.value,0);
assert.equal(new sandbox.Engine().enabled,false,'mute preference is remembered');
engine.setEnabled(true);engine.setPaused(true);before=voices.length;engine.play('hit');engine.update(true,'forest');assert.equal(voices.length,before);assert.equal(engine.master.gain.value,0);
engine.setPaused(false);engine.context.currentTime++;engine.play('coin');assert.ok(voices.length>before);
engine.update(false,'forest');assert.equal(engine.music.gain.value,0,'music stops on end screens');
console.log('PASS: all 22 effects, three music arrangements, delayed initialization, mute preference, pause/resume and end-screen music stop.');
