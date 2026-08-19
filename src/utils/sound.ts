// Web Audio API Synthesizer for Hasu Appa Sound Effects & Music

class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private bgmOsc: OscillatorNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgMusicAudio: HTMLAudioElement | null = null;
  private isPlayingRunnerGame: boolean = false;
  private heroAlomAudio: HTMLAudioElement | null = null;
  private customObstacleAudio: HTMLAudioElement | null = null;

  public playCustomObstacleHitSound() {
    if (this.isMuted) return;
    try {
      if (!this.customObstacleAudio) {
        this.customObstacleAudio = new Audio('https://res.cloudinary.com/cwrroxz3/video/upload/v1787033262/copy_0A5DF6A0-BF8C-49FA-8AA8-F24697C38670_qbquzw.mp3');
      }
      this.customObstacleAudio.currentTime = 0;
      this.customObstacleAudio.volume = 1.0;
      this.customObstacleAudio.play().catch(() => {
        const fallback = new Audio('https://res.cloudinary.com/cwrroxz3/video/upload/v1787033262/copy_0A5DF6A0-BF8C-49FA-8AA8-F24697C38670_qbquzw.mp3');
        fallback.play().catch(() => {});
      });
    } catch {
      // Ignore audio playback exceptions
    }
  }

  public playHeroAlomSound() {
    if (this.isMuted) return;
    try {
      if (!this.heroAlomAudio) {
        this.heroAlomAudio = new Audio('https://res.cloudinary.com/cwrroxz3/video/upload/copy_C1F19E60-2D90-4DEA-BAAE-289553DBB22C_u6mjqi.mp3');
      }
      this.heroAlomAudio.currentTime = 0;
      this.heroAlomAudio.volume = 0.9;
      this.heroAlomAudio.play().catch(() => {
        const fallback = new Audio('https://res.cloudinary.com/cwrroxz3/video/upload/copy_C1F19E60-2D90-4DEA-BAAE-289553DBB22C_u6mjqi');
        fallback.play().catch(() => {});
      });
    } catch {
      // Ignore audio playback exceptions
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playRunnerMusic() {
    this.isPlayingRunnerGame = true;
    if (this.isMuted) return;
    try {
      if (!this.bgMusicAudio) {
        this.bgMusicAudio = new Audio('https://res.cloudinary.com/cwrroxz3/video/upload/v1786598069/7E0FB3AE-3F38-484E-A123-8336057FFB1D_u0fmiy.mp3');
        this.bgMusicAudio.loop = true;
        this.bgMusicAudio.volume = 0.65;
      }
      this.bgMusicAudio.play().catch(() => {
        // Auto-play policy standard catch
      });
    } catch {
      // Ignore audio load exceptions
    }
  }

  public stopRunnerMusic() {
    this.isPlayingRunnerGame = false;
    if (this.bgMusicAudio) {
      this.bgMusicAudio.pause();
      this.bgMusicAudio.currentTime = 0;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isBgmPlaying) {
      this.stopBgm();
    }
    if (this.bgMusicAudio) {
      this.bgMusicAudio.muted = this.isMuted;
      if (this.isMuted) {
        this.bgMusicAudio.pause();
      } else if (this.isPlayingRunnerGame) {
        // Only resume if player is currently in the active runner gameplay
        this.bgMusicAudio.play().catch(() => {});
      }
    }
    return this.isMuted;
  }

  public playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playSlide() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.25);
  }

  public playGreenCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Multi-tone triumphant green coin sparkle
    const freqs = [784, 988, 1318, 1568]; // G5, B5, E6, G6
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.05);

      gain.gain.setValueAtTime(0.3, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.2);
    });
  }

  public playPowerup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [440, 554.37, 659.25, 880];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.value = f;

      gain.gain.setValueAtTime(0.15, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.06 + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + i * 0.06);
      osc.stop(now + (i + 1) * 0.06 + 0.1);
    });
  }

  public playHurt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.3);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.3);
  }

  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.05);
  }

  public playPuzzleSolve() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    melody.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.25);
    });
  }

  public stopBgm() {
    if (this.bgmOsc) {
      try {
        this.bgmOsc.stop();
      } catch {
        // ignore
      }
      this.bgmOsc = null;
    }
    this.isBgmPlaying = false;
  }
}

export const sound = new SoundManager();
