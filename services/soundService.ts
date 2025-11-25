
class SoundService {
  private context: AudioContext | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        // Init voices
        this.loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
    }
  }

  private loadVoices() {
      this.voices = window.speechSynthesis.getVoices();
      this.voicesLoaded = true;
  }

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.context;
  }

  public playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1, startTime?: number) {
    const ctx = this.getContext();
    const start = startTime !== undefined ? startTime : ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration);
  }

  public playClick() {
    this.playTone(800, 'square', 0.05, 0.05);
  }

  public playReveal(count: number = 1) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    for (let i = 0; i < count; i++) {
        this.playTone(1200, 'sine', 0.3, 0.1, now + (i * 0.2));
    }
  }

  public playCorrect() {
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
    this.playTone(150, 'sawtooth', 0.4, 0.2);
  }
  
  public playWarning() {
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

  // --- TTS Logic ---

  public speakCharacter(text: string, character: string) {
      if (!this.voicesLoaded) this.loadVoices();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.volume = 1.0; // Full volume
      
      // Filter German voices
      const germanVoices = this.voices.filter(v => v.lang.startsWith('de'));
      
      // Identify high-quality specific voices often found in browsers
      // "Google Deutsch" is usually female and high quality
      // "Microsoft Stefan" is male, "Microsoft Katja" is female
      const googleVoice = germanVoices.find(v => v.name.includes('Google Deutsch'));
      const femaleVoice = germanVoices.find(v => v.name.includes('Katja') || v.name.includes('Anna') || v.name.includes('Lena') || v.name.includes('Female'));
      const maleVoice = germanVoices.find(v => v.name.includes('Stefan') || v.name.includes('Markus') || v.name.includes('Male'));
      
      // Fallbacks
      const primaryFemale = googleVoice || femaleVoice || germanVoices[0];
      const primaryMale = maleVoice || germanVoices.find(v => !v.name.includes('Google Deutsch') && !v.name.includes('Female')) || germanVoices[0];

      // Profile Settings - Improved for naturalness
      if (character === 'FREDERIC') {
          // Frederic: Male, Deeper, Calm, Authoritative
          utterance.voice = primaryMale;
          // Avoid going too low to prevent robotic artifacting
          utterance.pitch = 0.9; 
          utterance.rate = 0.9; 
      } else if (character === 'PETER') {
          // Peter: Male, Energetic, Standard
          utterance.voice = primaryMale;
          utterance.pitch = 1.05;
          utterance.rate = 1.1;
      } else if (character === 'MAREN') {
          // Maren: Female, Friendly, Standard
          utterance.voice = primaryFemale;
          // If we are forced to use a male voice for female char, pitch up significantly
          const isActuallyMale = primaryFemale === primaryMale; 
          utterance.pitch = isActuallyMale ? 1.4 : 1.0; 
          utterance.rate = 1.0;
      } else if (character === 'SONYA') {
          // Sonya: Female, High Energy, Bubbly
          utterance.voice = primaryFemale;
          const isActuallyMale = primaryFemale === primaryMale;
          utterance.pitch = isActuallyMale ? 1.6 : 1.2; 
          utterance.rate = 1.15;
      }

      // Fallback if no German voice found at all
      if (germanVoices.length === 0 && this.voices.length > 0) {
          utterance.voice = this.voices[0]; 
      }

      window.speechSynthesis.cancel(); // Stop previous speech to avoid overlap
      window.speechSynthesis.speak(utterance);
  }
}

export const soundService = new SoundService();
