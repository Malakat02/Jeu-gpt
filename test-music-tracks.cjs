const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const tracks=[],storage=new Map();let now=0;
class Audio{constructor(src){this.src=src;this.paused=true;this.plays=0;tracks.push(this);}addEventListener(name,fn){this.metadata=fn;}play(){this.paused=false;this.plays++;return Promise.resolve();}pause(){this.paused=true;}}
const env={Date:{now:()=>now},window:{Audio},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};
vm.runInNewContext(fs.readFileSync('audio.js','utf8')+';globalThis.Engine=ForestAudio;',env);
const a=new env.Engine();const tick=(theme,n=12)=>{for(let i=0;i<n;i++){now+=100;a.update(true,theme);}};a.update(true,'exploration');assert.equal(tracks[0].plays,0,'no playback before gesture');a.unlock();assert.equal(tracks[0].plays,1);
for(const [theme,file] of Object.entries(a.trackFiles)){
  assert.ok(fs.statSync('Musics/'+file).size>0);
  a.update(true,theme);assert.equal(a.activeTrack.src,'Musics/'+encodeURIComponent(file));assert.equal(a.activeTrack.loop,true);
  const plays=a.activeTrack.plays;tick(theme);assert.equal(a.activeTrack.plays,plays,'frames do not restart playback');
  assert.equal(tracks.filter(t=>!t.paused).length,1,'only the selected theme plays after the fade');
}
tick('exploration');const previous=a.activeTrack;a.update(true,'battle');const incoming=a.activeTrack;
assert.equal(incoming.volume,0);assert.equal(previous.paused,false);
tick('battle',4);assert.ok(previous.volume>0&&previous.volume<.28);assert.ok(incoming.volume>0&&incoming.volume<.28);
assert.ok(Math.abs(previous.volume+incoming.volume-.28)<.00001,'crossfade preserves total gain');
const beforeSwitch=incoming.volume;a.update(true,'shop');assert.equal(incoming.volume,beforeSwitch,'rapid changes do not jump volumes');tick('shop');assert.equal(tracks.filter(t=>!t.paused).length,1);
a.setVolume('music',.1);assert.ok(Math.abs(a.activeTrack.volume-.056)<.00001);assert.equal(new env.Engine().musicVolume,.1);assert.equal(a.effectsVolume,.5);
a.setPaused(true);assert.ok(a.activeTrack.paused);a.setPaused(false);assert.ok(!a.activeTrack.paused);
a.setChannel('music',false);assert.ok(a.activeTrack.paused);assert.ok(a.effectsEnabled);
a.setChannel('music',true);assert.ok(!a.activeTrack.paused);a.update(false,'finalBoss');assert.ok(a.activeTrack.paused);
a.update(true,'exploration');assert.equal(tracks.length,5,'returning to a track reuses its playback position');
console.log('PASS: five tracks, smooth and interrupted crossfades, bounded gain, persistent volume, looping, pause/mute and end screens.');

a.update(true,'finalBoss');assert.equal(a.activeTrack.currentTime,20);a.activeTrack.metadata();assert.equal(a.activeTrack.currentTime,20);a.activeTrack.currentTime=35;a.setPaused(true);a.setPaused(false);a.update(true,'finalBoss');assert.equal(a.activeTrack.currentTime,35,'pause does not restart final theme');a.setVolume('music',.5);tick('finalBoss');assert.ok(Math.abs(a.activeTrack.volume-.28)<1e-9);
