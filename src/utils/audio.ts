import * as Tone from 'tone';

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

// Pentatonic Scale frequencies (C Major Pentatonic across 3 octaves: C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6)
const PENTATONIC_NOTES = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6'];
const FREESTYLE_CHORDS = [
  ['C4', 'E4', 'G4', 'B4'], // Cmaj7
  ['F4', 'A4', 'C5', 'E5'], // Fmaj7
  ['G4', 'B4', 'D5', 'F5'], // G7
  ['A4', 'C5', 'E5', 'G5'], // Am7
  ['E4', 'G4', 'B4', 'D5'], // Em7
];

class AudioEngine {
  private initialized = false;

  // Main Instruments
  private synth: Tone.PolySynth | null = null;
  private kick: Tone.MembraneSynth | null = null;
  private snare: Tone.NoiseSynth | null = null;
  private hat: Tone.NoiseSynth | null = null;
  private tom: Tone.MembraneSynth | null = null;
  private clap: Tone.MetalSynth | null = null;
  private cowbell: Tone.MetalSynth | null = null;
  
  // Musical Freestyle Suite Synths
  private fmLead: Tone.FMSynth | null = null;
  private chordSynth: Tone.PolySynth | null = null;
  private subBass: Tone.MonoSynth | null = null;
  private bellChime: Tone.MetalSynth | null = null;

  private filter: Tone.Filter | null = null;
  private reverb: Tone.Reverb | null = null;
  private volumeNode: Tone.Volume | null = null;
  private recorder: Tone.Recorder | null = null;

  private soundEnabled = true;
  private volumeLevel = 0.8;
  private isRecording = false;

  private lastLeadNoteTime = 0;
  private lastPulseTime = 0;
  private currentNoteIndex = -1;

  public async init() {
    if (this.initialized) return;

    try {
      this.volumeNode = new Tone.Volume(Tone.gainToDb(this.volumeLevel)).toDestination();
      
      // Live Audio Recorder connected directly to master destination output
      this.recorder = new Tone.Recorder();
      this.volumeNode.connect(this.recorder);

      this.reverb = new Tone.Reverb({ decay: 2.2, wet: 0.35 });
      await this.reverb.generate();

      // Dynamic Filter for Hand Tilt Modulation
      this.filter = new Tone.Filter({ frequency: 1200, type: 'lowpass', Q: 3 });
      this.filter.connect(this.reverb);
      this.reverb.connect(this.volumeNode);

      // 1. Main Polyphonic Piano Synth
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fattriangle', count: 2, spread: 15 },
        envelope: { attack: 0.005, decay: 0.8, sustain: 0.2, release: 1.2 },
      }).connect(this.reverb);

      // 2. Drum Synths
      this.kick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.4 },
      }).connect(this.volumeNode);

      this.snare = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
      }).connect(this.volumeNode);

      this.hat = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
      }).connect(this.volumeNode);

      this.tom = new Tone.MembraneSynth({
        pitchDecay: 0.08,
        octaves: 2,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
      }).connect(this.volumeNode);

      this.clap = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      }).connect(this.volumeNode);

      this.cowbell = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.2, release: 0.1 },
        harmonicity: 1.5,
        modulationIndex: 12,
        resonance: 2000,
        octaves: 0.8,
      }).connect(this.volumeNode);

      // 3. Freestyle Musical Synths
      // A. FM Theremin / Vocal Melodic Lead (locked to Pentatonic Scale)
      this.fmLead = new Tone.FMSynth({
        harmonicity: 2,
        modulationIndex: 3,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.6 },
        modulation: { type: 'triangle' },
      }).connect(this.filter);

      // B. Crystal Poly-Arpeggio Chords
      this.chordSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 1.2, sustain: 0.3, release: 1.5 },
      }).connect(this.reverb);

      // C. Sub-Bass & Rhythm Pulser
      this.subBass = new Tone.MonoSynth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.5 },
        filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.4, baseFrequency: 60, octaves: 3 },
      }).connect(this.volumeNode);

      // D. Cyber Bell Chime
      this.bellChime = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.4, release: 0.3 },
        harmonicity: 3.2,
        modulationIndex: 16,
        resonance: 3000,
        octaves: 1.2,
      }).connect(this.reverb);

      this.initialized = true;
    } catch (e) {
      console.warn('AudioEngine initialization delayed until user gesture:', e);
    }
  }

  public async startAudioContext() {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
    if (!this.initialized) {
      await this.init();
    }
  }

  public async startLiveRecording() {
    await this.startAudioContext();
    if (!this.recorder) return;
    try {
      if (this.recorder.state === 'started') return;
      this.recorder.start();
      this.isRecording = true;
    } catch (e) {
      console.error('Failed to start audio recording:', e);
    }
  }

  public async stopLiveRecordingAndDownload() {
    if (!this.recorder || this.recorder.state !== 'started') return;
    try {
      const recordingBlob = await this.recorder.stop();
      this.isRecording = false;

      // Trigger automatic browser download of recorded audio
      const url = URL.createObjectURL(recordingBlob);
      const anchor = document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = url;
      anchor.download = `Air_Instruments_Pro_Performance_${Date.now()}.webm`;
      document.body.appendChild(anchor);
      anchor.click();

      setTimeout(() => {
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (e) {
      console.error('Failed to stop and download recording:', e);
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setVolume(level: number) {
    this.volumeLevel = Math.max(0, Math.min(1, level));
    if (this.volumeNode) {
      if (this.volumeLevel === 0) {
        this.volumeNode.mute = true;
      } else {
        this.volumeNode.mute = false;
        this.volumeNode.volume.value = Tone.gainToDb(this.volumeLevel);
      }
    }
  }

  public getVolume(): number {
    return this.volumeLevel;
  }

  public playPianoNote(note: string, velocity: number = 0.85) {
    if (!this.soundEnabled) return;
    this.startAudioContext();
    try {
      this.synth?.triggerAttackRelease(note, '8n', undefined, velocity);
    } catch (e) {
      console.error('Piano note error:', e);
    }
  }

  public playDrum(type: string) {
    if (!this.soundEnabled) return;
    this.startAudioContext();
    try {
      switch (type.toLowerCase()) {
        case 'kick':
          this.kick?.triggerAttackRelease('C1', '8n');
          break;
        case 'snare':
          this.snare?.triggerAttackRelease('8n');
          break;
        case 'hi-hat':
        case 'hihat':
        case 'hat':
          this.hat?.triggerAttackRelease('16n');
          break;
        case 'tom':
          this.tom?.triggerAttackRelease('G2', '8n');
          break;
        case 'crash':
        case 'clap':
          this.clap?.triggerAttackRelease('C4', '8n');
          break;
        case '808 perc':
        case 'cowbell':
        case 'middle perc':
          this.cowbell?.triggerAttackRelease('E5', '8n');
          break;
        default:
          this.kick?.triggerAttackRelease('C1', '8n');
          break;
      }
    } catch (e) {
      console.error('Drum hit error:', e);
    }
  }

  // -------------------------------------------------------------
  // FREESTYLE MUSICAL SUITE ACTIONS
  // -------------------------------------------------------------

  /**
   * Action 1: Continuous Index Wand Sweep
   * Plays lush pentatonic melodies locked to scale as hand moves.
   */
  public playFreestyleMelodicWand(posY: number, posX: number, now: number) {
    if (!this.soundEnabled) return;
    this.startAudioContext();

    // Trigger melodic note every 120ms to create a fluid, beautiful arpeggiated stream
    if (now - this.lastLeadNoteTime > 120) {
      this.lastLeadNoteTime = now;
      
      const targetIdx = Math.floor(clamp((1.0 - posY) * PENTATONIC_NOTES.length, 0, PENTATONIC_NOTES.length - 1));
      if (targetIdx !== this.currentNoteIndex) {
        this.currentNoteIndex = targetIdx;
        const note = PENTATONIC_NOTES[targetIdx];
        try {
          this.fmLead?.triggerAttackRelease(note, '16n');
        } catch (e) {}
      }
    }
  }

  /**
   * Action 2: Index + Thumb Pinch Gesture (Chords)
   * Triggers lush crystal poly-arpeggio chords!
   */
  public playFreestylePinchChord(posY: number) {
    if (!this.soundEnabled) return;
    this.startAudioContext();

    const chordIdx = Math.floor(clamp((1.0 - posY) * FREESTYLE_CHORDS.length, 0, FREESTYLE_CHORDS.length - 1));
    const chord = FREESTYLE_CHORDS[chordIdx];
    try {
      this.chordSynth?.triggerAttackRelease(chord, '4n');
    } catch (e) {}
  }

  /**
   * Action 3: Dual Hand Proximity (Sub-Bass & Rhythm Pulser)
   * Distance between index fingertips modulates rhythm tempo and bass depth!
   */
  public updateFreestyleDualHandRhythm(distance: number, now: number) {
    if (!this.soundEnabled) return;
    this.startAudioContext();

    // Close (< 0.25): Fast 16th note rhythm pulse
    // Far (> 0.45): Deep sub-bass pulse
    const tempoInterval = distance < 0.25 ? 140 : 320;

    if (now - this.lastPulseTime > tempoInterval) {
      this.lastPulseTime = now;
      try {
        if (distance < 0.25) {
          // Fast rhythmic synth pulse
          this.subBass?.triggerAttackRelease('C3', '16n');
          this.hat?.triggerAttackRelease('32n');
        } else {
          // Deep sub-bass drone
          this.subBass?.triggerAttackRelease('C1', '8n');
        }
      } catch (e) {}
    }
  }

  /**
   * Action 4: Hand Tilt Filter Modulation
   * Tilting hand opens lowpass filter cutoff frequency for sparkling brightness.
   */
  public updateFreestyleTiltFilter(tiltRatio: number) {
    if (!this.filter) return;
    // tiltRatio: 0 (Horizontal) -> 400Hz (warm ambient); 1 (Vertical) -> 4500Hz (bright sparkle)
    const cutoffFreq = 400 + tiltRatio * 4100;
    this.filter.frequency.rampTo(cutoffFreq, 0.05);
  }

  /**
   * Action 5: Middle Finger + Thumb Pinch (Cyber Bell Chime)
   */
  public playFreestyleBellChime(posY: number) {
    if (!this.soundEnabled) return;
    this.startAudioContext();

    const noteIdx = Math.floor(clamp((1.0 - posY) * PENTATONIC_NOTES.length, 0, PENTATONIC_NOTES.length - 1));
    const note = PENTATONIC_NOTES[noteIdx];
    try {
      this.bellChime?.triggerAttackRelease(note, '8n');
    } catch (e) {}
  }

  public stopFreestyleTone() {
    this.currentNoteIndex = -1;
  }
}

export const audioEngine = new AudioEngine();
