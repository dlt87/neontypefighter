// ========================================
// SOUND SYSTEM FOR NEON TYPING FIGHTER
// ========================================

class SoundManager {
    constructor() {
        this.enabled = true;
        this.musicEnabled = true;
        this.volume = 0.5;
        this.musicVolume = 0.2;
        
        // Audio contexts for Web Audio API
        this.audioContext = null;
        this.musicAudioContext = null;
        
        // Preloaded sounds (will be generated procedurally)
        this.sounds = {};
        this.music = null;
        this.currentMusicSource = null;
        
        this.init();
    }
    
    init() {
        // Initialize audio contexts on user interaction (required by browsers)
        document.addEventListener('click', () => this.initAudioContexts(), { once: true });
        document.addEventListener('keydown', () => this.initAudioContexts(), { once: true });
    }
    
    initAudioContexts() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.musicAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.generateSounds();
            console.log('🔊 Sound system initialized');
        }
    }
    
    // Generate procedural sound effects using Web Audio API
    generateSounds() {
        // These are procedurally generated to avoid loading external files
        this.sounds = {
            typing: () => this.generateTypingSound(),
            critical: () => this.generateCriticalSound(),
            hit: () => this.generateHitSound(),
            damage: () => this.generateDamageSound(),
            victory: () => this.generateVictorySound(),
            defeat: () => this.generateDefeatSound(),
            roundStart: () => this.generateRoundStartSound(),
            error: () => this.generateErrorSound()
        };
    }
    
    // Typing sound - short click
    generateTypingSound() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = 800 + Math.random() * 200;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
    }
    
    // Critical hit - ascending neon burst
    generateCriticalSound() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        
        // Multiple oscillators for richer sound
        for (let i = 0; i < 3; i++) {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(400 + i * 200, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200 + i * 400, ctx.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            
            oscillator.start(ctx.currentTime + i * 0.05);
            oscillator.stop(ctx.currentTime + 0.3 + i * 0.05);
        }
    }
    
    // Hit sound - impact
    generateHitSound() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
    }
    
    // Damage received - descending tone
    generateDamageSound() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(this.volume * 0.6, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    }
    
    // Victory - ascending fanfare
    generateVictorySound() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C (major chord)
        
        notes.forEach((freq, i) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.value = freq;
            
            const startTime = ctx.currentTime + i * 0.15;
            gainNode.gain.setValueAtTime(this.volume * 0.4, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.5);
        });
    }
    
    // Defeat - descending sequence
    generateDefeatSound() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const notes = [523.25, 493.88, 440.00, 392.00]; // C, B, A, G (descending)
        
        notes.forEach((freq, i) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.type = 'triangle';
            oscillator.frequency.value = freq;
            
            const startTime = ctx.currentTime + i * 0.2;
            gainNode.gain.setValueAtTime(this.volume * 0.4, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.6);
        });
    }
    
    // Round start - quick rising tone
    generateRoundStartSound() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.25);
    }
    
    // Error sound - quick buzz
    generateErrorSound() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 100;
        
        gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    }
    
    // Background synthwave music loop
    startBackgroundMusic() {
        if (!this.musicEnabled || !this.musicAudioContext) return;
        
        this.stopBackgroundMusic();
        
        const ctx = this.musicAudioContext;
        this.currentMusicSource = this.createSynthwaveLoop(ctx);
    }
    
    createSynthwaveLoop(ctx) {
        // Create a simple synthwave-style chord progression
        const chordProgression = [
            [261.63, 329.63, 392.00], // C major
            [293.66, 369.99, 440.00], // D minor
            [246.94, 329.63, 369.99], // G major
            [220.00, 277.18, 329.63]  // A minor
        ];
        
        const loopDuration = 8; // 8 seconds loop
        const chordDuration = loopDuration / chordProgression.length;
        
        const scheduleLoop = (startTime) => {
            chordProgression.forEach((chord, chordIndex) => {
                chord.forEach((freq, noteIndex) => {
                    const oscillator = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    const filter = ctx.createBiquadFilter();
                    
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.value = freq * 0.5; // Lower octave for ambient feel
                    
                    filter.type = 'lowpass';
                    filter.frequency.value = 800;
                    filter.Q.value = 1;
                    
                    const chordStart = startTime + chordIndex * chordDuration;
                    gainNode.gain.setValueAtTime(0, chordStart);
                    gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.1, chordStart + 0.5);
                    gainNode.gain.setValueAtTime(this.musicVolume * 0.1, chordStart + chordDuration - 0.5);
                    gainNode.gain.linearRampToValueAtTime(0, chordStart + chordDuration);
                    
                    oscillator.start(chordStart);
                    oscillator.stop(chordStart + chordDuration);
                });
            });
            
            // Schedule next loop
            if (this.musicEnabled) {
                setTimeout(() => scheduleLoop(ctx.currentTime), loopDuration * 1000 - 100);
            }
        };
        
        scheduleLoop(ctx.currentTime);
        
        return true;
    }
    
    stopBackgroundMusic() {
        if (this.currentMusicSource && this.musicAudioContext) {
            this.currentMusicSource = null;
            // Create new context to stop all scheduled sounds
            this.musicAudioContext.close();
            this.musicAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    // Public API for playing sounds
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        return this.musicEnabled;
    }
    
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }
    
    setMusicVolume(value) {
        this.musicVolume = Math.max(0, Math.min(1, value));
    }
}
