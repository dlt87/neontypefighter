// ========================================
// WORD POOL - Cyberpunk Themed Abilities
// ========================================

const CYBERPUNK_WORDS = [
    // Short words (3-5 letters)
    'flare', 'pulse', 'void', 'nova', 'surge', 'byte', 'hack', 'fire',
    'bolt', 'zap', 'rush', 'dash', 'slam', 'rage', 'fury', 'glow',
    'neon', 'grid', 'wave', 'beam', 'tech', 'core', 'link', 'sync',
    
    // Medium words (6-8 letters)
    'fracture', 'spire', 'blaze', 'quantum', 'phantom', 'cipher', 'reactor',
    'voltage', 'gravity', 'impulse', 'crimson', 'velvet', 'shadow', 'nexus',
    'matrix', 'vector', 'plasma', 'vortex', 'prism', 'chrome', 'signal',
    'neural', 'binary', 'fusion', 'photon', 'laser', 'cyber', 'turbo',
    
    // Long words (9+ letters)
    'cybernetic', 'hologram', 'algorithm', 'firewall', 'bandwidth', 'protocol',
    'interface', 'digitize', 'synthetic', 'mainframe', 'overload', 'terminal',
    'accelerate', 'frequency', 'resonance', 'dimension', 'cascade', 'velocity',
    'electric', 'magnetic', 'radiation', 'disruptor', 'generator', 'amplifier'
];

const NAME_WORDS = [
    'michael', 'reentika', 'david', 'george', 'krista', 'heidi', 'emma', 'alisha', 'greenough', 'awasthi', 'ting', 'sleen', 'traboulay', 'leung', 'duong', 'siddiqui', 
];

// Default word pool (can be switched)
let WORD_POOL = [...CYBERPUNK_WORDS];

class WordManager {
    constructor() {
        this.usedWords = [];
        this.currentWord = null;
        this.nextWord = null;
        this.wordQueue = [];
        this.initializeQueue();
    }
    
    initializeQueue() {
        this.wordQueue = [];
        for (let i = 0; i < CONFIG.WORD_QUEUE_SIZE; i++) {
            this.wordQueue.push(this.getRandomWord());
        }
        // Set current and next words
        this.currentWord = this.getRandomWord();
        this.nextWord = this.getRandomWord();
    }
    
    getRandomWord() {
        // Filter out recently used words
        let availableWords = WORD_POOL.filter(word => !this.usedWords.includes(word));
        
        // Reset if we've used most words
        if (availableWords.length < 5) {
            this.usedWords = [];
            availableWords = [...WORD_POOL];
        }
        
        const word = availableWords[Math.floor(Math.random() * availableWords.length)];
        this.usedWords.push(word);
        
        // Keep usedWords array from growing too large
        if (this.usedWords.length > 20) {
            this.usedWords.shift();
        }
        
        return word;
    }
    
    getNextWord() {
        // Move nextWord to currentWord
        this.currentWord = this.nextWord;
        // Generate new nextWord
        this.nextWord = this.getRandomWord();
        // Also update the visual queue
        this.wordQueue.shift();
        this.wordQueue.push(this.getRandomWord());
        return this.currentWord;
    }
    
    getCurrentWord() {
        return this.currentWord;
    }
    
    getNextWordPreview() {
        return this.nextWord;
    }
    
    getQueue() {
        return this.wordQueue;
    }
    
    reset() {
        this.usedWords = [];
        this.currentWord = null;
        this.nextWord = null;
        this.initializeQueue();
    }
    
    setWordBank(bankType) {
        // bankType can be 'cyberpunk', 'names', or 'all'
        if (bankType === 'cyberpunk') {
            WORD_POOL = [...CYBERPUNK_WORDS];
        } else if (bankType === 'names') {
            WORD_POOL = [...NAME_WORDS];
        } else if (bankType === 'all') {
            WORD_POOL = [...CYBERPUNK_WORDS, ...NAME_WORDS];
        }
        this.reset();
    }
    
    getWordBank() {
        if (WORD_POOL.length === CYBERPUNK_WORDS.length && 
            WORD_POOL.every(w => CYBERPUNK_WORDS.includes(w))) {
            return 'cyberpunk';
        } else if (WORD_POOL.length === NAME_WORDS.length && 
                   WORD_POOL.every(w => NAME_WORDS.includes(w))) {
            return 'names';
        }
        return 'all';
    }
}
