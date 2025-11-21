
class SoundService {
  private context: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.context;
  }

  public playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  public playClick() {
    // Wheel click
    this.playTone(800, 'square', 0.05, 0.05);
  }

  public playReveal() {
    // Ding for letter reveal
    this.playTone(1200, 'sine', 0.3, 0.1);
  }

  public playCorrect() {
    // Chime for correct guess
    const ctx = this.getContext();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.5);
    });
  }

  public playWrong() {
    // Buzz
    this.playTone(150, 'sawtooth', 0.4, 0.2);
  }
  
  public playWarning() {
     // Double low beep for unavailable actions
     const ctx = this.getContext();
     const t = ctx.currentTime;
     
     const osc = ctx.createOscillator();
     const gain = ctx.createGain();
     
     osc.type = 'square';
     osc.frequency.setValueAtTime(150, t);
     
     gain.gain.setValueAtTime(0.1, t);
     gain.gain.setValueAtTime(0, t + 0.1);
     gain.gain.setValueAtTime(0.1, t + 0.15);
     gain.gain.setValueAtTime(0, t + 0.25);
     
     osc.connect(gain);
     gain.connect(ctx.destination);
     
     osc.start(t);
     osc.stop(t + 0.3);
  }

  public playBankrupt() {
    // Sliding down whistle effect
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  }
  
  public playSolve() {
      // Fanfare
       const ctx = this.getContext();
    const now = ctx.currentTime;
    [523, 523, 523, 659, 783, 1046].forEach((freq, i) => {
        const delay = i < 3 ? i * 0.15 : 0.45 + (i-3) * 0.15;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, now + delay);
        gain.gain.linearRampToValueAtTime(0, now + delay + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.4);
    });
  }
}

export const soundService = new SoundService();
