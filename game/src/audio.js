// Synthesized sound for Nightshade: no audio files, everything is made
// with the Web Audio API the first time the player interacts with the page.
// A soft pluck for a scroll, a low alarm swell while chased, a warm chord
// for clearing a level and a dull thud for being caught.

export function makeAudio() {
  let ctx = null;
  let muted = false;
  let alarmNodes = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    setMuted(m) {
      muted = m;
      if (m) this.stopAlarm();
    },
    pickup() {
      tone(660, 0.16, 'sine', 0.12);
      tone(990, 0.22, 'sine', 0.1, 0.07);
    },
    step() {
      tone(140, 0.05, 'triangle', 0.03);
    },
    spotted() {
      tone(220, 0.3, 'sawtooth', 0.08, 0, 330);
    },
    caught() {
      tone(160, 0.5, 'sawtooth', 0.14, 0, 55);
      tone(90, 0.6, 'triangle', 0.12, 0.05, 40);
    },
    clear() {
      tone(523, 0.25, 'sine', 0.11);
      tone(659, 0.25, 'sine', 0.11, 0.12);
      tone(784, 0.4, 'sine', 0.12, 0.24);
    },
    startAlarm() {
      const ac = ensure();
      if (!ac || muted || alarmNodes) return;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 196;
      lfo.type = 'sine';
      lfo.frequency.value = 2.2;
      lfoGain.gain.value = 40;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      g.gain.value = 0.035;
      osc.connect(g);
      g.connect(ac.destination);
      osc.start();
      lfo.start();
      alarmNodes = { osc, lfo, g };
    },
    stopAlarm() {
      if (!alarmNodes) return;
      try {
        alarmNodes.osc.stop();
        alarmNodes.lfo.stop();
      } catch (e) {
        // Already stopped; nothing to do.
      }
      alarmNodes = null;
    },
  };
}
