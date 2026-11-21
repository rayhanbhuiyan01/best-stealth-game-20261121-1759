// Nightshade — Shadow Courier: all sound is synthesized with WebAudio.
// No audio files, no network. The context is created lazily on the first
// sound so a page that never gets a gesture stays silent and error-free.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return true;
    }
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone(freq, dur, type, vol, slideTo) {
    if (this.muted || !this.ensure()) return;
    try {
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch {
      // Sound is garnish; a failed note never breaks the game.
    }
  }

  thump(vol) {
    if (this.muted || !this.ensure()) return;
    try {
      const t0 = this.ctx.currentTime;
      const dur = 0.07;
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(t0);
    } catch {
      // Ignore.
    }
  }

  footstep(sneaking) {
    this.thump(sneaking ? 0.05 : 0.16);
  }

  pickup() {
    this.tone(660, 0.12, 'sine', 0.25);
    setTimeout(() => this.tone(880, 0.2, 'sine', 0.25), 90);
  }

  // Fired once when a guard first spots the courier, never every frame.
  alert() {
    this.tone(196, 0.45, 'sawtooth', 0.3, 98);
    setTimeout(() => this.tone(147, 0.4, 'sawtooth', 0.22, 73), 120);
  }

  caught() {
    this.tone(330, 0.3, 'square', 0.2, 110);
    setTimeout(() => this.tone(220, 0.5, 'square', 0.18, 55), 180);
  }

  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.28, 'triangle', 0.25), i * 130));
  }

  levelClear() {
    const notes = [523, 659, 784];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.22), i * 110));
  }

  uiClick() {
    this.tone(520, 0.06, 'sine', 0.15);
  }
}
