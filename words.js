// ========================================
// WORD POOL - Cyberpunk Themed Abilities
// ========================================

const CYBERPUNK_WORDS = [
    // Short words (3-5 letters)
    'flare', 'pulse', 'void', 'nova', 'surge', 'byte', 'hack', 'fire',
    'bolt', 'zap', 'rush', 'dash', 'slam', 'rage', 'fury', 'glow',
    'neon', 'grid', 'wave', 'beam', 'tech', 'core', 'link', 'sync',
    'data', 'code', 'port', 'node', 'ram', 'rom', 'cpu', 'gpu',
    'disk', 'chip', 'pixel', 'scan', 'ping', 'boot', 'load', 'save',
    'mesh', 'loop', 'array', 'stack', 'queue', 'heap', 'tree', 'graph',
    'hash', 'key', 'value', 'flag', 'bit', 'hex', 'bin', 'octal',
    'trace', 'debug', 'patch', 'merge', 'clone', 'fork', 'push', 'pull',
    'laser', 'mech', 'droid', 'bot', 'ai', 'app', 'web', 'net',
    'hub', 'pod', 'shell', 'bash', 'sudo', 'root', 'user', 'admin',
    'file', 'dir', 'path', 'home', 'var', 'tmp', 'bin', 'etc',
    'dev', 'proc', 'sys', 'mnt', 'opt', 'usr', 'lib', 'sbin',
    
    // Medium words (6-8 letters)
    'fracture', 'spire', 'blaze', 'quantum', 'phantom', 'cipher', 'reactor',
    'voltage', 'gravity', 'impulse', 'crimson', 'velvet', 'shadow', 'nexus',
    'matrix', 'vector', 'plasma', 'vortex', 'prism', 'chrome', 'signal',
    'neural', 'binary', 'fusion', 'photon', 'laser', 'cyber', 'turbo',
    'network', 'system', 'server', 'client', 'socket', 'packet', 'router',
    'daemon', 'kernel', 'buffer', 'cache', 'thread', 'process', 'memory',
    'storage', 'backup', 'restore', 'compile', 'execute', 'runtime', 'digital',
    'virtual', 'augment', 'enhance', 'upgrade', 'decrypt', 'encrypt', 'secure',
    'adapter', 'gateway', 'bridge', 'switch', 'modem', 'filter', 'parser',
    'scanner', 'lexer', 'token', 'syntax', 'semantic', 'pragma', 'macro',
    'module', 'package', 'library', 'archive', 'registry', 'service', 'agent',
    'handler', 'wrapper', 'proxy', 'facade', 'factory', 'builder', 'adapter',
    'observer', 'listener', 'callback', 'promise', 'async', 'await', 'yield',
    'console', 'logging', 'testing', 'jenkins', 'docker', 'vagrant', 'puppet',
    'gitlab', 'github', 'bitbucket', 'jira', 'slack', 'discord', 'twitch',
    'streaming', 'gaming', 'esports', 'viewport', 'render', 'shader', 'texture',
    'sprite', 'polygon', 'vertex', 'fragment', 'lighting', 'physics', 'collision',
    'raycast', 'pathfinding', 'animation', 'rigging', 'skeleton', 'motion', 'capture',
    'tracking', 'sensor', 'lidar', 'radar', 'sonar', 'infrared', 'ultraviolet',
    'spectrum', 'wavelength', 'bandwidth', 'gigabit', 'megabyte', 'terabyte', 'petabyte',
    'exabyte', 'zettabyte', 'yottabyte', 'quantum', 'qubit', 'superposition', 'entanglement',
    
    // Long words (9+ letters)
    'cybernetic', 'hologram', 'algorithm', 'firewall', 'bandwidth', 'protocol',
    'interface', 'digitize', 'synthetic', 'mainframe', 'overload', 'terminal',
    'accelerate', 'frequency', 'resonance', 'dimension', 'cascade', 'velocity',
    'electric', 'magnetic', 'radiation', 'disruptor', 'generator', 'amplifier',
    'cyberdeck', 'netrunner', 'datasphere', 'cyberspace', 'holonet', 'virtuality',
    'datastream', 'megacorp', 'technomancer', 'biomech', 'nanotech', 'darknet',
    'blackice', 'backdoor', 'rootkit', 'exploit', 'debugger', 'profiler',
    'emulator', 'simulator', 'framework', 'compiler', 'interpreter', 'optimizer',
    'processor', 'multitask', 'multithreading', 'encryption', 'decryption', 'compression',
    'decompression', 'transmission', 'latency', 'throughput', 'uplink', 'downlink',
    'crosslink', 'feedback', 'response', 'request', 'handshake', 'connection',
    'authentication', 'authorization', 'verification', 'validation', 'certificate', 'credential',
    'blockchain', 'cryptocurrency', 'artificial', 'intelligence', 'machinelearning', 'deeplearning',
    'neuralnetwork', 'cybersecurity', 'penetration', 'vulnerability', 'malicious', 'antimalware',
    'ransomware', 'trojan', 'worm', 'botnet', 'phishing', 'spoofing', 'hijacking',
    'sniffing', 'injection', 'overflow', 'shellcode', 'payload', 'escalation',
    'repository', 'container', 'orchestration', 'deployment', 'continuous', 'integration',
    'microservice', 'serverless', 'cloudnative', 'kubernetes', 'terraform', 'ansible',
    'monitoring', 'telemetry', 'observability', 'traceability', 'scalability', 'reliability',
    'availability', 'redundancy', 'failover', 'loadbalancer', 'distributed', 'decentralized',
    'consensus', 'replication', 'sharding', 'partitioning', 'indexing', 'optimization',
    'refactoring', 'abstraction', 'encapsulation', 'polymorphism', 'inheritance', 'composition',
    'javascript', 'typescript', 'python', 'golang', 'rust', 'kotlin', 'swift',
    'objective', 'assembly', 'fortran', 'cobol', 'pascal', 'ada', 'lisp',
    'haskell', 'erlang', 'elixir', 'clojure', 'scala', 'groovy', 'dart',
    'flutter', 'react', 'angular', 'vue', 'svelte', 'ember', 'backbone',
    'jquery', 'bootstrap', 'tailwind', 'sass', 'less', 'webpack', 'vite',
    'rollup', 'parcel', 'babel', 'eslint', 'prettier', 'jest', 'mocha',
    'cypress', 'selenium', 'puppeteer', 'playwright', 'storybook', 'chromatic', 'figma',
    'sketch', 'photoshop', 'illustrator', 'aftereffects', 'premiere', 'audition', 'lightroom',
    'blender', 'unity', 'unreal', 'godot', 'gamemaker', 'construct', 'phaser',
    'pixi', 'three', 'babylon', 'aframe', 'webgl', 'opengl', 'vulkan',
    'directx', 'metal', 'opencl', 'cuda', 'tensor', 'pytorch', 'tensorflow',
    'keras', 'scikit', 'pandas', 'numpy', 'matplotlib', 'jupyter', 'anaconda',
    'hadoop', 'spark', 'kafka', 'rabbitmq', 'redis', 'memcached', 'elasticsearch',
    'mongodb', 'postgresql', 'mysql', 'mariadb', 'oracle', 'sqlserver', 'cassandra',
    'dynamodb', 'firebase', 'supabase', 'planetscale', 'cockroachdb', 'timescaledb', 'influxdb',
    'prometheus', 'grafana', 'datadog', 'newrelic', 'splunk', 'logstash', 'kibana',
    'nginx', 'apache', 'tomcat', 'jetty', 'undertow', 'netty', 'vertx',
    'express', 'fastify', 'koa', 'hapi', 'restify', 'nestjs', 'nextjs',
    'nuxtjs', 'gatsby', 'astro', 'remix', 'sveltekit', 'solidstart', 'qwik'
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
