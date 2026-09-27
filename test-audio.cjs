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
assert.equal(engine.musicVolume,.5);assert.equal(engine.effectsVolume,.5);
for(const effect of ['sword','hit','hurt','dash','boomerang','catch','coin','heal','treasure','relic','buy','key','door','clear','enemy','shot','enemyShot','enemyCharge','charge','boss','rage','win','death']){
  const before=voices.length;engine.play(effect);assert.ok(voices.length>before,`${effect} produces sound`);engine.context.currentTime++;
}
let before=voices.length;engine.update(true,'exploration');assert.equal(voices.length,before,'music no longer produces chiptune oscillators');
engine.setVolume('effects',.35);assert.equal(engine.effects.gain.value,1.75);assert.equal(engine.musicVolume,.5);
engine.setVolume('music',.12);assert.equal(engine.effects.gain.value,1.75);
const restored=new sandbox.Engine();assert.equal(restored.musicVolume,.12);assert.equal(restored.effectsVolume,.35);
engine.setChannel('effects',false);assert.equal(engine.effects.gain.value,0);before=voices.length;engine.play('sword');assert.equal(voices.length,before);
engine.setChannel('effects',true);assert.equal(engine.effects.gain.value,1.75);
engine.setPaused(true);engine.play('hit');assert.equal(voices.length,before);assert.equal(engine.master.gain.value,0);
engine.setPaused(false);engine.context.currentTime++;engine.play('coin');assert.ok(voices.length>before);
engine.setEnabled(false);assert.equal(engine.master.gain.value,0);assert.equal(new sandbox.Engine().enabled,false);
console.log('PASS: 23 effects, independent persistent volumes, mute/pause and no procedural music fallback.');

engine.setVolume('effects',.5);engine.setEnabled(true);assert.equal(engine.effects.gain.value,2.5,'effects now have stronger base gain');engine.setVolume('effects',1);assert.equal(engine.effects.gain.value,5);
