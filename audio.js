// Original procedural chiptune music and effects. No audio downloads required.
class ForestAudio {
  constructor() {
    this.enabled = true;
    try { this.enabled = localStorage.getItem('forest-audio') !== 'off'; } catch {}
    this.context = null;
    this.paused = false;
    this.theme = '';
    this.step = 0;
    this.nextNote = 0;
    this.lastEffect = new Map();
  }

  unlock() {
    if (!this.enabled) return;
    try {
      if (!this.context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        this.context = new Audio();
        this.master = this.context.createGain();
        this.music = this.context.createGain();
        this.effects = this.context.createGain();
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -14;
        limiter.ratio.value = 8;
        this.master.gain.value = this.paused ? 0 : .65;
        this.music.gain.value = .62;
        this.effects.gain.value = .8;
        this.music.connect(this.master);
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
    try { localStorage.setItem('forest-audio', enabled ? 'on' : 'off'); } catch {}
    if (enabled) this.unlock();
    this.setPaused(this.paused);
    this.nextNote = 0;
  }

  setPaused(paused) {
    this.paused = paused;
    if (!this.context) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.enabled && !paused ? .65 : 0, now, .015);
    if (paused) this.nextNote = 0;
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
    if (!this.enabled || this.paused || !this.context) return;
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
    if (!this.context) return;
    const now = this.context.currentTime;
    this.music.gain.setTargetAtTime(active ? .62 : 0, now, .04);
    if (!active || !this.enabled || this.paused || this.context.state !== 'running') { this.nextNote = 0; return; }
    if (theme !== this.theme) { this.theme = theme; this.step = 0; this.nextNote = now; }
    if (this.nextNote > now + .06) return;
    const finale = theme === 'finalBoss', boss = theme === 'boss', shop = theme === 'shop', crypt = theme === 'crypt', eclipse = theme === 'eclipse';
    const lead = finale ? [62,69,74,0,77,76,74,69,70,65,74,77,81,77,76,73,62,65,69,74,73,69,65,61,58,65,70,74,73,69,61,0] :
      boss ? [57, 0, 60, 57, 63, 0, 62, 60, 57, 0, 55, 57, 60, 62, 63, 60] :
      shop ? [72, 76, 79, 0, 76, 74, 72, 0, 69, 72, 76, 0, 74, 71, 67, 0] :
      crypt ? [57, 0, 0, 64, 60, 0, 59, 0, 53, 0, 60, 0, 59, 0, 56, 0] :
      eclipse ? [62, 0, 69, 0, 65, 0, 72, 0, 70, 0, 65, 0, 64, 0, 61, 0] :
      [69, 0, 76, 0, 74, 72, 0, 67, 69, 0, 72, 76, 74, 0, 71, 0, 65, 0, 72, 0, 76, 74, 72, 0, 67, 0, 71, 74, 72, 0, 69, 0];
    const interval = finale ? .205 : boss ? .24 : shop ? .28 : crypt ? .42 : eclipse ? .38 : .32;
    const delay = Math.max(0, this.nextNote - now), note = lead[this.step % lead.length];
    const hz = midi => 440 * 2 ** ((midi - 69) / 12);
    if (note) this.tone(hz(note), interval * 1.8, boss || finale ? 'square' : 'triangle', boss || finale ? .045 : .075, delay, hz(note), this.music);
    if (finale) {
      const root = [38,34,43,37][Math.floor(this.step / 8) % 4];
      const harmony = root + [12,19,24,19][this.step % 4];
      this.tone(hz(harmony), interval * .85, 'triangle', .045, delay, hz(harmony), this.music);
      if (this.step % 4 === 0) this.tone(85, .13, 'sine', .09, delay, 32, this.music);
      if (this.step % 4 === 2) this.tone(180, .065, 'triangle', .025, delay, 70, this.music);
    }
    if (this.step % 4 === 0) {
      const bass = (finale ? [38,34,43,37] : boss ? [33, 33, 36, 31] : shop ? [48, 45, 41, 43] : crypt ? [33, 29, 36, 32] : eclipse ? [38, 34, 41, 37] : [45, 41, 48, 43])[Math.floor(this.step / 8) % 4];
      this.tone(hz(bass), interval * 3.6, 'triangle', .1, delay, hz(bass), this.music);
      this.tone(hz(bass + 19), interval * 3, 'sine', .028, delay, hz(bass + 19), this.music);
    }
    this.step++;
    this.nextNote = Math.max(now, this.nextNote) + interval;
  }
}
