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
        
        // Custom background music (HTML5 Audio)
        this.customMusic = null;
        this.useCustomMusic = true; // Default to custom music
        this.currentTrack = 'NEON3'; // Default track
        
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
    
    // Load a specific music track
    loadMusicTrack(trackName) {
        this.currentTrack = trackName;
        const wasPlaying = this.customMusic && !this.customMusic.paused;
        
        // Stop current music
        if (this.customMusic) {
            this.customMusic.pause();
            this.customMusic.currentTime = 0;
        }
        
        // Load new track
        this.customMusic = new Audio(`music/${trackName}.wav`);
        this.customMusic.volume = this.musicVolume;
        this.customMusic.loop = true;
        
        // Resume playing if music was playing before
        if (wasPlaying && this.musicEnabled) {
            this.customMusic.play().catch(err => console.log('Music autoplay blocked:', err));
        }
        
        console.log(`🎵 Loaded music track: ${trackName}`);
    }
    
    // Background synthwave music loop
    startBackgroundMusic() {
        if (!this.musicEnabled) return;
        
        // Use custom music if available
        if (this.useCustomMusic) {
            if (!this.customMusic) {
                this.loadMusicTrack(this.currentTrack);
            }
            this.customMusic.volume = this.musicVolume;
            this.customMusic.loop = true;
            this.customMusic.play().catch(err => console.log('Music autoplay blocked:', err));
            return;
        }
        
        // Otherwise use procedural music
        if (!this.musicAudioContext) return;
        this.stopBackgroundMusic();
        
        const ctx = this.musicAudioContext;
        this.currentMusicSource = this.createSynthwaveLoop(ctx);
    }
    
    createSynthwaveLoop(ctx) {
        // Create a smooth jazz fusion progression with rich harmonies
        const chordProgression = [
            [130.81, 164.81, 196.00, 246.94], // Cmaj7 (C E G B)
            [146.83, 174.61, 220.00, 277.18], // Dm9 (D F A C)
            [196.00, 246.94, 293.66, 349.23], // G13 (G B D F)
            [110.00, 138.59, 164.81, 207.65]  // Am7 (A C E G)
        ];
        
        const loopDuration = 12; // 12 seconds loop for more relaxed feel
        const chordDuration = loopDuration / chordProgression.length;
        
        const scheduleLoop = (startTime) => {
            // Add walking bass line
            const bassLine = [130.81, 146.83, 164.81, 110.00]; // Root notes
            
            chordProgression.forEach((chord, chordIndex) => {
                const chordStartTime = startTime + (chordIndex * chordDuration);
                
                // Walking bass (deep, smooth)
                const bass = ctx.createOscillator();
                const bassGain = ctx.createGain();
                const bassFilter = ctx.createBiquadFilter();
                
                bass.connect(bassFilter);
                bassFilter.connect(bassGain);
                bassGain.connect(ctx.destination);
                
                bass.type = 'sine';
                bass.frequency.value = bassLine[chordIndex];
                bassFilter.type = 'lowpass';
                bassFilter.frequency.value = 200;
                
                bassGain.gain.setValueAtTime(this.musicVolume * 0.5, chordStartTime);
                bassGain.gain.exponentialRampToValueAtTime(0.01, chordStartTime + chordDuration);
                
                bass.start(chordStartTime);
                bass.stop(chordStartTime + chordDuration);
                
                // Smooth chord pads
                chord.forEach((freq, noteIndex) => {
                    const oscillator = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    const chordFilter = ctx.createBiquadFilter();
                    
                    oscillator.connect(chordFilter);
                    chordFilter.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    oscillator.type = 'triangle';
                    oscillator.frequency.value = freq;
                    
                    chordFilter.type = 'lowpass';
                    chordFilter.frequency.value = 1200;
                    chordFilter.Q.value = 0.7;
                    
                    const chordStart = startTime + chordIndex * chordDuration;
                    gainNode.gain.setValueAtTime(0, chordStart);
                    gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.08, chordStart + 0.3);
                    gainNode.gain.setValueAtTime(this.musicVolume * 0.08, chordStart + chordDuration - 0.3);
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
        // Stop custom music if playing
        if (this.customMusic) {
            this.customMusic.pause();
            this.customMusic.currentTime = 0;
        }
        
        // Stop procedural music
        if (this.currentMusicSource && this.musicAudioContext) {
            this.currentMusicSource = null;
            // Create new context to stop all scheduled sounds
            this.musicAudioContext.close();
            this.musicAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    // Load custom background music from file
    loadCustomMusic(audioFilePath) {
        this.customMusic = new Audio(audioFilePath);
        this.customMusic.volume = this.musicVolume;
        this.customMusic.loop = true;
        this.useCustomMusic = true;
        console.log('🎵 Custom music loaded:', audioFilePath);
        
        // Start playing if music is enabled
        if (this.musicEnabled) {
            this.startBackgroundMusic();
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
        // Update custom music volume if loaded
        if (this.customMusic) {
            this.customMusic.volume = this.musicVolume;
        }
    }
}
