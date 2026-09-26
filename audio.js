// Local music tracks and procedural sound effects.
class ForestAudio {
  constructor() {
    this.enabled = true;
    try { this.enabled = localStorage.getItem('forest-audio') !== 'off'; } catch {}
    this.musicEnabled=this.enabled;this.effectsEnabled=this.enabled;
    try {this.musicEnabled=this.enabled&&localStorage.getItem('forest-music')!=='off';this.effectsEnabled=this.enabled&&localStorage.getItem('forest-effects')!=='off';}catch{}
    this.context = null;
    this.paused = false;
    this.theme = '';
    this.musicVolume=.5;this.effectsVolume=.5;
    for(const channel of ['music','effects'])try{const saved=localStorage.getItem('forest-'+channel+'-volume');if(saved!==null&&saved!==undefined&&Number.isFinite(Number(saved)))this[channel+'Volume']=Math.max(0,Math.min(1,Number(saved)));}catch{}
    this.lastMusicTime=null;
    this.lastEffect = new Map();
    this.tracks=new Map();this.activeTrack=null;this.musicPlaying=false;this.unlocked=false;
    this.trackFiles={exploration:'Exploration.mp3',battle:'Battle.mp3',shop:'Shop.mp3',boss:'Boss.mp3',finalBoss:'Final Boss.mp3'};
  }

  unlock() {
    this.unlocked=true;for(const track of this.tracks.values())track._blocked=false;this.syncTrack();
    if (!this.enabled) return;
    try {
      if (!this.context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        this.context = new Audio();
        this.master = this.context.createGain();
        this.effects = this.context.createGain();
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -14;
        limiter.ratio.value = 8;
        this.master.gain.value = this.paused ? 0 : .65;
        this.effects.gain.value = this.effectsEnabled ? this.effectsVolume*2 : 0;
        this.effects.connect(this.master);
        this.master.connect(limiter);
        limiter.connect(this.context.destination);
        this.noise = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
        const samples = this.noise.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      }
      this.context.resume().catch(() => {});
    } catch { /* Gameplay remains available without Web Audio. */ }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.musicEnabled=enabled;this.effectsEnabled=enabled;
    this.saveChannels();
    try { localStorage.setItem('forest-audio', enabled ? 'on' : 'off'); } catch {}
    if (enabled) this.unlock();
    this.setPaused(this.paused);
  }
  saveChannels(){
    this.syncTrack();
    try{localStorage.setItem('forest-music',this.musicEnabled?'on':'off');localStorage.setItem('forest-effects',this.effectsEnabled?'on':'off');}catch{}
    if(this.context)this.effects.gain.setTargetAtTime(this.effectsEnabled?this.effectsVolume*2:0,this.context.currentTime,.015);
  }
  setChannel(channel,value){
    if(!['music','effects'].includes(channel))return;
    this[channel+'Enabled']=value;this.enabled=this.musicEnabled||this.effectsEnabled;
    try{localStorage.setItem('forest-audio',this.enabled?'on':'off');}catch{}
    if(this.enabled)this.unlock();this.saveChannels();this.setPaused(this.paused);
  }

  setPaused(paused) {
    this.paused = paused;
    this.syncTrack();
    if (!this.context) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.enabled && !paused ? .65 : 0, now, .015);
  }

  setVolume(channel,value){
    if(!['music','effects'].includes(channel)||!Number.isFinite(Number(value)))return;
    this[channel+'Volume']=Math.max(0,Math.min(1,Number(value)));
    try{localStorage.setItem('forest-'+channel+'-volume',String(this[channel+'Volume']));}catch{}
    this.saveChannels();
  }
  syncTrack(dt=0){
    const audible=this.unlocked&&this.enabled&&this.musicEnabled&&!this.paused&&this.musicPlaying;
    for(const track of this.tracks.values()){
      if(!audible){track._generation++;track.pause();track._started=false;track._mix=0;track.volume=0;continue;}
      const target=track===this.activeTrack?1:0;
      if(target&&!track._started&&!track._blocked){
        track.volume=track._mix*this.musicVolume*.56;track._started=true;
        const generation=++track._generation;
        track.play()?.catch(error=>{if(generation===track._generation){track._started=false;track._blocked=error?.name!=='AbortError';}});
      }
      // A 0.9-second crossfade, continuous even if rooms change mid-transition.
      const delta=Math.min(dt/.9,Math.abs(target-track._mix));
      track._mix+=Math.sign(target-track._mix)*delta;
      track.volume=Math.max(0,Math.min(1,track._mix*this.musicVolume*.56));
      if(!target&&track._mix===0&&track._started){track._generation++;track.pause();track._started=false;}
    }
  }
  updateTrack(playing,theme,dt){
    this.musicPlaying=playing;
    if(theme!==this.theme){
      this.theme=theme;
      if(!this.tracks.has(theme)){
        const track=new window.Audio('Musics/'+encodeURIComponent(this.trackFiles[theme]||this.trackFiles.exploration));
        track.loop=true;track.preload='metadata';track.volume=0;
        if(theme==='finalBoss'){
          const seekIntro=()=>{try{track.currentTime=20;}catch{}};
          track.addEventListener('loadedmetadata',seekIntro,{once:true});seekIntro();
        }
        track._mix=0;track._started=false;track._blocked=false;track._generation=0;
        this.tracks.set(theme,track);
      }
      this.activeTrack=this.tracks.get(theme);
    }
    this.syncTrack(dt);
  }

  tone(freq, duration, wave = 'triangle', volume = .08, delay = 0, endFreq = freq, bus = this.effects) {
    if (!this.context || !this.enabled || this.paused) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator(), gain = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(freq, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain); gain.connect(bus);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start); oscillator.stop(start + duration + .02);
  }

  hiss(duration, frequency, volume = .06, delay = 0) {
    if (!this.context || !this.enabled || this.paused) return;
    const start = this.context.currentTime + delay;
    const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter(), gain = this.context.createGain();
    source.buffer = this.noise; filter.type = 'bandpass'; filter.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter); filter.connect(gain); gain.connect(this.effects);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(start); source.stop(start + duration);
  }

  melody(notes, spacing = .1, wave = 'triangle', volume = .08) {
    notes.forEach((note, i) => this.tone(note, spacing * 2.5, wave, volume, i * spacing));
  }

  play(name) {
    if (!this.enabled || !this.effectsEnabled || this.paused || !this.context) return;
    const now = this.context.currentTime;
    // Prevent loud stacks when a swing hits several enemies at once.
    if (now - (this.lastEffect.get(name) ?? -100) < (name.startsWith('enemy') ? .16 : .045)) return;
    this.lastEffect.set(name, now);
    switch (name) {
      case 'sword': this.hiss(.14, 2100, .14); this.tone(620, .09, 'triangle', .055, 0, 160); break;
      case 'hit': this.hiss(.08, 850, .09); this.tone(155, .09, 'square', .055, 0, 65); break;
      case 'hurt': this.melody([294, 220, 147], .065, 'sawtooth', .07); break;
      case 'dash': this.hiss(.2, 3200, .1); this.tone(200, .15, 'sine', .045, 0, 650); break;
      case 'boomerang': this.tone(410, .2, 'triangle', .07, 0, 950); this.tone(950, .24, 'triangle', .045, .2, 410); break;
      case 'catch': this.tone(740, .07, 'sine', .05); break;
      case 'coin': this.melody([1047, 1568], .06, 'sine', .075); break;
      case 'heal': this.melody([523, 659, 784, 1047], .13, 'sine'); break;
      case 'treasure': this.melody([392, 494, 587, 784, 988], .13); break;
      case 'relic': this.melody([523, 784, 988, 1175], .14); break;
      case 'buy': this.melody([784, 988, 1319], .085); break;
      case 'key': this.melody([587, 784, 880, 1175], .12); break;
      case 'door': this.hiss(.22, 240, .16); this.tone(100, .18, 'triangle', .08, 0, 48); break;
      case 'clear': this.melody([392, 523, 659, 784], .11); break;
      case 'enemy': this.tone(150, .18, 'square', .04, 0, 40); break;
      case 'shot': this.tone(280, .13, 'triangle', .035, 0, 100); break;
      case 'enemyShot': this.tone(390, .09, 'sine', .022, 0, 190); break;
      case 'enemyCharge': this.hiss(.16, 650, .035); this.tone(95, .12, 'triangle', .018, 0, 60); break;
      case 'charge': this.hiss(.35, 380, .15); this.tone(100, .28, 'sawtooth', .06, 0, 45); break;
      case 'boss': this.melody([147, 139, 110], .23, 'sawtooth', .075); break;
      case 'rage': this.tone(110, .5, 'sawtooth', .07, 0, 220); break;
      case 'win': this.melody([392, 523, 659, 784, 659, 784, 1047], .17); break;
      case 'death': this.melody([392, 330, 294, 196], .24, 'triangle'); break;
    }
  }

  update(active, theme) {
    const now=Date.now()/1000,dt=this.lastMusicTime===null?0:Math.max(0,Math.min(.1,now-this.lastMusicTime));
    this.lastMusicTime=now;
    if(typeof window.Audio==='function')this.updateTrack(active,theme,dt);
  }
}
