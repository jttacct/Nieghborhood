import { WeatherType } from '../types/game';

/**
 * Web Audio API Sound Synthesizer
 * Procedural retro and realistic sound synthesis for zero-asset neighborhood game
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.3;
  private activeSirenOsc: OscillatorNode | null = null;
  private activeSirenGain: GainNode | null = null;
  private sirenInterval: number | null = null;

  // Ambient Weather Audio System
  private currentWeather: WeatherType = 'sunny';
  private rainNoiseNode: AudioBufferSourceNode | null = null;
  private rainGainNode: GainNode | null = null;
  private rainFilterNode: BiquadFilterNode | null = null;
  private windOscNode: OscillatorNode | null = null;
  private windGainNode: GainNode | null = null;
  private windFilterNode: BiquadFilterNode | null = null;
  private windModOsc: OscillatorNode | null = null;
  private windModGain: GainNode | null = null;
  private ambientMasterGain: GainNode | null = null;
  private ambientStarted: boolean = false;
  private ambientInterval: number | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSiren();
      if (this.ambientMasterGain && this.ctx) {
        this.ambientMasterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    } else {
      if (this.ctx) {
        this.applyWeatherVolumes(this.currentWeather, true);
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && !this.isMuted) {
      this.applyWeatherVolumes(this.currentWeather, false);
    }
  }

  /**
   * Initializes procedural ambient weather generators:
   * 1. Pink/Brown noise generator for rainfall pitter-patter with resonant droplets
   * 2. Multiphonic filtered whistling oscillator with LFO frequency modulation for winter wind gusts & breeze
   */
  public startAmbientWeather(weather: WeatherType) {
    this.currentWeather = weather;
    this.initCtx();
    if (!this.ctx) return;

    if (!this.ambientStarted) {
      this.setupAmbientNodes();
      this.ambientStarted = true;
    }

    this.applyWeatherVolumes(weather, true);
  }

  public updateWeatherState(weather: WeatherType) {
    this.currentWeather = weather;
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ambientStarted) {
      this.startAmbientWeather(weather);
      return;
    }
    this.applyWeatherVolumes(weather, true);
  }

  private setupAmbientNodes() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Master Ambient Gain
    this.ambientMasterGain = this.ctx.createGain();
    this.ambientMasterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, now);
    this.ambientMasterGain.connect(this.ctx.destination);

    // --- 1. RAIN AMBIENCE (Pink/White noise with low-pass & band-pass filters for pitter-patter) ---
    // Generate 5-second looping brownian/pink noise buffer
    const bufferSize = this.ctx.sampleRate * 5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Filter towards brown/pink noise
      lastOut = (lastOut + 0.025 * white) / 1.025;
      output[i] = lastOut * 3.5;
    }

    this.rainNoiseNode = this.ctx.createBufferSource();
    this.rainNoiseNode.buffer = noiseBuffer;
    this.rainNoiseNode.loop = true;

    this.rainFilterNode = this.ctx.createBiquadFilter();
    this.rainFilterNode.type = 'lowpass';
    this.rainFilterNode.frequency.setValueAtTime(1400, now);
    this.rainFilterNode.Q.setValueAtTime(1.5, now);

    this.rainGainNode = this.ctx.createGain();
    this.rainGainNode.gain.setValueAtTime(0.0001, now);

    this.rainNoiseNode.connect(this.rainFilterNode);
    this.rainFilterNode.connect(this.rainGainNode);
    this.rainGainNode.connect(this.ambientMasterGain);
    this.rainNoiseNode.start(0);

    // --- 2. WIND WHISTLING AMBIENCE (Sine/Triangle with LFO gust modulation & bandpass) ---
    this.windOscNode = this.ctx.createOscillator();
    this.windOscNode.type = 'sine';
    this.windOscNode.frequency.setValueAtTime(320, now);

    // LFO for whistling gust swells
    this.windModOsc = this.ctx.createOscillator();
    this.windModOsc.type = 'sine';
    this.windModOsc.frequency.setValueAtTime(0.35, now); // ~3-second gust cycle

    this.windModGain = this.ctx.createGain();
    this.windModGain.gain.setValueAtTime(160, now); // modulate pitch by +/- 160Hz
    this.windModOsc.connect(this.windModGain);
    this.windModGain.connect(this.windOscNode.frequency);

    this.windFilterNode = this.ctx.createBiquadFilter();
    this.windFilterNode.type = 'bandpass';
    this.windFilterNode.frequency.setValueAtTime(380, now);
    this.windFilterNode.Q.setValueAtTime(3.0, now);

    this.windGainNode = this.ctx.createGain();
    this.windGainNode.gain.setValueAtTime(0.0001, now);

    this.windOscNode.connect(this.windFilterNode);
    this.windFilterNode.connect(this.windGainNode);
    this.windGainNode.connect(this.ambientMasterGain);

    this.windModOsc.start(0);
    this.windOscNode.start(0);

    // Subtle random pitter-patter droplet accents and wind gust variations
    if (this.ambientInterval) clearInterval(this.ambientInterval);
    this.ambientInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      if (this.currentWeather === 'rainy' || this.currentWeather === 'stormy') {
        this.triggerRainDropPlink();
      } else if (this.currentWeather === 'snowy' || this.currentWeather === 'breezy') {
        this.triggerWindGustSwell();
      }
    }, 700);
  }

  private triggerRainDropPlink() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    // Randomized high resonant droplet pitches (1800Hz - 3200Hz)
    const freq = 1800 + Math.random() * 1400;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.05);

    const dropletVol = this.volume * (this.currentWeather === 'stormy' ? 0.06 : 0.035);
    gain.gain.setValueAtTime(dropletVol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    if (this.ambientMasterGain) {
      gain.connect(this.ambientMasterGain);
    } else {
      gain.connect(this.ctx.destination);
    }
    osc.start(now);
    osc.stop(now + 0.06);
  }

  private triggerWindGustSwell() {
    if (!this.ctx || this.isMuted || !this.windFilterNode) return;
    const now = this.ctx.currentTime;
    // Vary the whistling resonance frequency slightly
    const targetFreq = (this.currentWeather === 'snowy' ? 440 : 280) + Math.random() * 160;
    this.windFilterNode.frequency.cancelScheduledValues(now);
    this.windFilterNode.frequency.linearRampToValueAtTime(targetFreq, now + 1.2);
  }

  private applyWeatherVolumes(weather: WeatherType, smooth: boolean = true) {
    if (!this.ctx || !this.rainGainNode || !this.windGainNode) return;
    const now = this.ctx.currentTime;
    const rampTime = smooth ? 1.5 : 0.1;

    let targetRainVol = 0.0001;
    let targetWindVol = 0.0001;
    let rainCutoff = 1400;
    let windFreq = 340;

    switch (weather) {
      case 'rainy':
        // Prominent soothing rain pitter-patter
        targetRainVol = this.volume * 0.16;
        targetWindVol = this.volume * 0.02; // soft background drift
        rainCutoff = 1600;
        windFreq = 260;
        break;
      case 'stormy':
        // Heavy, driving torrential rain with deeper windy roar
        targetRainVol = this.volume * 0.28;
        targetWindVol = this.volume * 0.12;
        rainCutoff = 2400;
        windFreq = 380;
        break;
      case 'snowy':
        // Whispering, chilly whistling wind howling gently through streets
        targetRainVol = 0.0001;
        targetWindVol = this.volume * 0.18;
        windFreq = 480; // higher whistling pitch
        break;
      case 'breezy':
        // Gentle rustling wind gust
        targetRainVol = 0.0001;
        targetWindVol = this.volume * 0.08;
        windFreq = 280;
        break;
      case 'sunny':
      default:
        // Clear, peaceful day (silent or negligible ambient)
        targetRainVol = 0.0001;
        targetWindVol = 0.0001;
        break;
    }

    if (this.isMuted) {
      targetRainVol = 0.0001;
      targetWindVol = 0.0001;
    }

    // Smooth exponential/linear ramps
    this.rainGainNode.gain.cancelScheduledValues(now);
    this.rainGainNode.gain.linearRampToValueAtTime(targetRainVol, now + rampTime);

    this.windGainNode.gain.cancelScheduledValues(now);
    this.windGainNode.gain.linearRampToValueAtTime(targetWindVol, now + rampTime);

    if (this.rainFilterNode) {
      this.rainFilterNode.frequency.cancelScheduledValues(now);
      this.rainFilterNode.frequency.linearRampToValueAtTime(rainCutoff, now + rampTime);
    }
    if (this.windFilterNode) {
      this.windFilterNode.frequency.cancelScheduledValues(now);
      this.windFilterNode.frequency.linearRampToValueAtTime(windFreq, now + rampTime);
    }
  }

  public playSiren(type: 'police' | 'fire' | 'ambulance') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    this.stopSiren();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);

    if (type === 'police') {
      // Wail siren (sweeps 600Hz to 1100Hz)
      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(650, now);
      let high = true;
      this.sirenInterval = window.setInterval(() => {
        if (!this.ctx || !this.activeSirenOsc) return;
        const t = this.ctx.currentTime;
        osc.frequency.cancelScheduledValues(t);
        osc.frequency.linearRampToValueAtTime(high ? 1150 : 650, t + 0.6);
        high = !high;
      }, 650);
    } else if (type === 'fire') {
      // Low dual pitch wail / rumble
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      let high = true;
      this.sirenInterval = window.setInterval(() => {
        if (!this.ctx || !this.activeSirenOsc) return;
        const t = this.ctx.currentTime;
        osc.frequency.cancelScheduledValues(t);
        osc.frequency.linearRampToValueAtTime(high ? 750 : 450, t + 0.8);
        high = !high;
      }, 850);
    } else {
      // Ambulance: classic Two-tone (high-low)
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      let tone = false;
      this.sirenInterval = window.setInterval(() => {
        if (!this.ctx || !this.activeSirenOsc) return;
        const t = this.ctx.currentTime;
        osc.frequency.setValueAtTime(tone ? 880 : 660, t);
        tone = !tone;
      }, 420);
    }

    osc.start();
    this.activeSirenOsc = osc;
    this.activeSirenGain = gain;
  }

  public stopSiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.activeSirenOsc) {
      try {
        this.activeSirenOsc.stop();
        this.activeSirenOsc.disconnect();
      } catch {
        // ignore
      }
      this.activeSirenOsc = null;
    }
    if (this.activeSirenGain) {
      try {
        this.activeSirenGain.disconnect();
      } catch {
        // ignore
      }
      this.activeSirenGain = null;
    }
  }

  public playMailboxChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Metallic latch clink
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playDogBark() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Dual woof tone
    [0, 0.16].forEach((delay) => {
      if (!this.ctx) return;
      const t = now + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.linearRampToValueAtTime(160, t + 0.12);

      gain.gain.setValueAtTime(this.volume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  public playCatMeow() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(680, now + 0.2);
    osc.frequency.linearRampToValueAtTime(540, now + 0.45);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playCatPurr() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, now);

    // Amplitude flutter for purr vibration
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(24, now);
    lfoGain.gain.setValueAtTime(0.08, now);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.7);
    osc.stop(now + 0.7);
  }

  public playChurchBell() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Multi-harmonic bell struck tone
    const partials = [
      { freq: 440, gain: 0.4, decay: 2.5 },
      { freq: 880, gain: 0.25, decay: 1.8 },
      { freq: 1100, gain: 0.15, decay: 1.2 },
      { freq: 1480, gain: 0.08, decay: 0.8 },
    ];

    partials.forEach((p) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq, now);

      gain.gain.setValueAtTime(this.volume * p.gain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + p.decay);
    });
  }

  public playSchoolBell() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Rapid ringing clapper
    for (let i = 0; i < 8; i++) {
      const t = now + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400 + (i % 2 === 0 ? 80 : 0), t);

      gain.gain.setValueAtTime(this.volume * 0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.075);
    }
  }

  public playInsectFlutter() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(420, now + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playInsectCatch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sparkly sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587, now);
    osc.frequency.exponentialRampToValueAtTime(1174, now + 0.2);

    gain.gain.setValueAtTime(this.volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playHonk() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    [340, 425].forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    });
  }

  public playWhistle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.linearRampToValueAtTime(2600, now + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playBasketballBounce() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(this.volume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playThunder() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.3);
  }

  public playCompleteFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Major chord arpeggio C - E - G - high C
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.volume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (idx === 3 ? 0.6 : 0.25));

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + (idx === 3 ? 0.6 : 0.25));
    });
  }
}

export const sound = new SoundEngine();
