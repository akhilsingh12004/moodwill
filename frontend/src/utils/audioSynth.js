/**
 * Web Audio API Ambient Synthesizer for Moodwill.
 * Generates natural soundscapes procedurally in the browser.
 */
class AmbientAudioController {
  constructor() {
    this.ctx = null;
    this.sources = {};
    this.gains = {};
    // Volumes stored as values between 0.0 and 1.0
    this.volumes = { rain: 0.6, lofi: 0.8, cafe: 0.4, noise: 0.5 };
    this.playing = { rain: false, lofi: false, cafe: false, noise: false };
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
  }

  // Create White Noise buffer (uncorrelated random points)
  createWhiteNoiseBuffer() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Create Brown Noise buffer (integrated white noise, -6dB/octave)
  createBrownNoiseBuffer() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Compensate for loss of volume
    }
    return buffer;
  }

  // Create Pink Noise buffer (-3dB/octave, using Paul Kellet's refined method)
  createPinkNoiseBuffer() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // Estimate gain compensation
      b6 = white * 0.115926;
    }
    return buffer;
  }

  startRain() {
    this.init();
    if (this.sources.rain) return;

    // Pink noise filtered down to sound like gentle rain
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = this.createPinkNoiseBuffer();
    noiseNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1100;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = this.volumes.rain;

    // Rain drop crackles (random impulses on high frequency)
    const crackleNode = this.ctx.createBufferSource();
    crackleNode.buffer = this.createWhiteNoiseBuffer();
    crackleNode.loop = true;

    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = "peaking";
    crackleFilter.frequency.value = 7500;
    crackleFilter.Q.value = 7;
    crackleFilter.gain.value = 15;

    const crackleGain = this.ctx.createGain();
    
    // Slow LFO to sweep rain drop frequency to sound more dynamic
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.25; // 4 seconds cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.03;

    lfo.connect(lfoGain);
    lfoGain.connect(crackleGain.gain);
    crackleGain.gain.value = 0.04; // Base rain drop density

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    crackleNode.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(this.ctx.destination);

    noiseNode.start(0);
    crackleNode.start(0);
    lfo.start(0);

    this.sources.rain = { noiseNode, crackleNode, lfo, gainNode };
    this.gains.rain = gainNode;
  }

  stopRain() {
    if (!this.sources.rain) return;
    try {
      this.sources.rain.noiseNode.stop();
      this.sources.rain.crackleNode.stop();
      this.sources.rain.lfo.stop();
    } catch (e) {}
    delete this.sources.rain;
    delete this.gains.rain;
  }

  startLofi() {
    this.init();
    if (this.sources.lofi) return;

    // Binaural focus drone: Detuned waves producing a 6Hz theta frequency difference
    const osc1 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 136.1; // Om frequencies

    const osc2 = this.ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 142.1; // Detuned to theta frequency

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 220; // Filter out high harmonic buzz

    const gainNode = this.ctx.createGain();
    // Keep drone relatively soft and deep
    gainNode.gain.value = this.volumes.lofi * 0.35;

    // Breathing LFO
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.07; // Very slow breathing rhythm
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.15;

    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(0);
    osc2.start(0);
    lfo.start(0);

    this.sources.lofi = { osc1, osc2, lfo, gainNode };
    this.gains.lofi = gainNode;
  }

  stopLofi() {
    if (!this.sources.lofi) return;
    try {
      this.sources.lofi.osc1.stop();
      this.sources.lofi.osc2.stop();
      this.sources.lofi.lfo.stop();
    } catch (e) {}
    delete this.sources.lofi;
    delete this.gains.lofi;
  }

  startCafe() {
    this.init();
    if (this.sources.cafe) return;

    // Café/Cozy Fireplace simulation: deep rumble + crackle sparks
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = this.createBrownNoiseBuffer();
    noiseNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 350;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = this.volumes.cafe;

    // Spark oscillator
    const sparkOsc = this.ctx.createOscillator();
    sparkOsc.type = "triangle";
    sparkOsc.frequency.value = 45;

    const sparkFilter = this.ctx.createBiquadFilter();
    sparkFilter.type = "bandpass";
    sparkFilter.frequency.value = 3000;

    const sparkGain = this.ctx.createGain();
    sparkGain.gain.value = 0;

    // Synthesize wood snaps at randomized intervals
    const intervalTimer = setInterval(() => {
      if (Math.random() > 0.45 && this.ctx && this.ctx.state !== "suspended") {
        const time = this.ctx.currentTime;
        sparkGain.gain.setValueAtTime(0, time);
        // Instant pop
        sparkGain.gain.linearRampToValueAtTime(Math.random() * 0.18 + 0.05, time + 0.001);
        // Exponential decay
        sparkGain.gain.exponentialRampToValueAtTime(0.0001, time + Math.random() * 0.06 + 0.02);
      }
    }, 280);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    sparkOsc.connect(sparkFilter);
    sparkFilter.connect(sparkGain);
    sparkGain.connect(this.ctx.destination);
    
    sparkOsc.start(0);

    this.sources.cafe = { noiseNode, sparkOsc, intervalTimer, gainNode };
    this.gains.cafe = gainNode;
  }

  stopCafe() {
    if (!this.sources.cafe) return;
    try {
      this.sources.cafe.noiseNode.stop();
      this.sources.cafe.sparkOsc.stop();
      clearInterval(this.sources.cafe.intervalTimer);
    } catch (e) {}
    delete this.sources.cafe;
    delete this.gains.cafe;
  }

  startNoise() {
    this.init();
    if (this.sources.noise) return;

    // Pure calming Brown Noise (rumble blocking distraction)
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = this.createBrownNoiseBuffer();
    noiseNode.loop = true;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = this.volumes.noise * 0.75;

    noiseNode.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    noiseNode.start(0);

    this.sources.noise = { noiseNode, gainNode };
    this.gains.noise = gainNode;
  }

  stopNoise() {
    if (!this.sources.noise) return;
    try {
      this.sources.noise.noiseNode.stop();
    } catch (e) {}
    delete this.sources.noise;
    delete this.gains.noise;
  }

  setVolume(id, vol) {
    const val = vol / 100;
    this.volumes[id] = val;
    if (this.gains[id]) {
      const scale = id === "lofi" ? 0.35 : 1;
      this.gains[id].gain.value = val * scale;
    }
  }

  toggle(id) {
    this.init();
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    if (this.playing[id]) {
      if (id === "rain") this.stopRain();
      if (id === "lofi") this.stopLofi();
      if (id === "cafe") this.stopCafe();
      if (id === "noise") this.stopNoise();
      this.playing[id] = false;
    } else {
      if (id === "rain") this.startRain();
      if (id === "lofi") this.startLofi();
      if (id === "cafe") this.startCafe();
      if (id === "noise") this.startNoise();
      this.playing[id] = true;
    }
    return this.playing[id];
  }

  // Plays a soft audio tone for breathing guides/cues
  playBreatheTone(pitch = 220, duration = 0.5) {
    try {
      this.init();
      if (this.ctx.state === "suspended") this.ctx.resume();
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.value = pitch;
      
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch(e) {}
  }

  stopAll() {
    this.stopRain();
    this.stopLofi();
    this.stopCafe();
    this.stopNoise();
    this.playing = { rain: false, lofi: false, cafe: false, noise: false };
  }
}

export const ambientAudio = new AmbientAudioController();
