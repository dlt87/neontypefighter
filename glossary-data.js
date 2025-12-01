// ========================================
// TECH GLOSSARY - Word Definitions & Relationships
// ========================================

const TECH_GLOSSARY = {
    // Programming Fundamentals
    'algorithm': {
        definition: 'A step-by-step procedure for solving a problem or performing a computation',
        category: 'fundamentals',
        related: ['code', 'compile', 'execute', 'debug']
    },
    'code': {
        definition: 'Instructions written in a programming language that a computer can execute',
        category: 'fundamentals',
        related: ['compile', 'debug', 'algorithm', 'syntax']
    },
    'compile': {
        definition: 'Convert source code into machine-readable executable format',
        category: 'fundamentals',
        related: ['code', 'execute', 'runtime', 'interpreter']
    },
    'debug': {
        definition: 'Process of finding and fixing errors or bugs in code',
        category: 'fundamentals',
        related: ['code', 'trace', 'patch', 'debugger']
    },
    'syntax': {
        definition: 'The rules that define the structure of valid statements in a programming language',
        category: 'fundamentals',
        related: ['code', 'parser', 'lexer', 'semantic']
    },
    
    // Hardware & Computer Architecture
    'cpu': {
        definition: 'Central Processing Unit - the brain of a computer that executes instructions',
        category: 'hardware',
        related: ['gpu', 'processor', 'core', 'chip']
    },
    'gpu': {
        definition: 'Graphics Processing Unit - specialized processor for rendering graphics and parallel computation',
        category: 'hardware',
        related: ['cpu', 'render', 'shader', 'processor']
    },
    'ram': {
        definition: 'Random Access Memory - temporary fast storage for active programs and data',
        category: 'hardware',
        related: ['memory', 'cache', 'storage', 'buffer']
    },
    'rom': {
        definition: 'Read-Only Memory - permanent storage that retains data when power is off',
        category: 'hardware',
        related: ['memory', 'storage', 'disk', 'boot']
    },
    'cache': {
        definition: 'High-speed temporary storage for frequently accessed data',
        category: 'hardware',
        related: ['memory', 'ram', 'buffer', 'storage']
    },
    'chip': {
        definition: 'Integrated circuit containing electronic components on a semiconductor material',
        category: 'hardware',
        related: ['cpu', 'processor', 'gpu', 'silicon']
    },
    'processor': {
        definition: 'Electronic circuit that performs operations on data according to instructions',
        category: 'hardware',
        related: ['cpu', 'gpu', 'core', 'multitask']
    },
    
    // Data Structures
    'array': {
        definition: 'Ordered collection of elements stored in contiguous memory locations',
        category: 'datastructures',
        related: ['list', 'stack', 'queue', 'index']
    },
    'stack': {
        definition: 'Last-In-First-Out (LIFO) data structure for storing elements',
        category: 'datastructures',
        related: ['queue', 'array', 'heap', 'push']
    },
    'queue': {
        definition: 'First-In-First-Out (FIFO) data structure for sequential processing',
        category: 'datastructures',
        related: ['stack', 'array', 'buffer', 'list']
    },
    'heap': {
        definition: 'Tree-based data structure where parent nodes are ordered relative to children',
        category: 'datastructures',
        related: ['tree', 'queue', 'memory', 'stack']
    },
    'tree': {
        definition: 'Hierarchical data structure with nodes connected by edges forming parent-child relationships',
        category: 'datastructures',
        related: ['graph', 'node', 'heap', 'binary']
    },
    'graph': {
        definition: 'Non-linear data structure of nodes connected by edges representing relationships',
        category: 'datastructures',
        related: ['tree', 'node', 'network', 'link']
    },
    'hash': {
        definition: 'Function that converts input data into fixed-size output for fast lookups',
        category: 'datastructures',
        related: ['key', 'value', 'map', 'index']
    },
    
    // Networking
    'network': {
        definition: 'Interconnected system of computers that can communicate and share resources',
        category: 'networking',
        related: ['internet', 'router', 'server', 'client']
    },
    'internet': {
        definition: 'Global network connecting millions of computers worldwide',
        category: 'networking',
        related: ['network', 'web', 'protocol', 'router']
    },
    'server': {
        definition: 'Computer or program that provides services to other computers on a network',
        category: 'networking',
        related: ['client', 'network', 'host', 'service']
    },
    'client': {
        definition: 'Computer or program that requests services from a server',
        category: 'networking',
        related: ['server', 'network', 'browser', 'request']
    },
    'router': {
        definition: 'Device that forwards data packets between computer networks',
        category: 'networking',
        related: ['network', 'gateway', 'switch', 'packet']
    },
    'protocol': {
        definition: 'Set of rules governing how data is transmitted over a network',
        category: 'networking',
        related: ['network', 'packet', 'tcp', 'http']
    },
    'packet': {
        definition: 'Unit of data transmitted over a network with header and payload',
        category: 'networking',
        related: ['protocol', 'network', 'router', 'transmission']
    },
    'bandwidth': {
        definition: 'Maximum data transfer rate of a network connection',
        category: 'networking',
        related: ['network', 'latency', 'throughput', 'speed']
    },
    'latency': {
        definition: 'Time delay between sending and receiving data over a network',
        category: 'networking',
        related: ['bandwidth', 'ping', 'network', 'delay']
    },
    'firewall': {
        definition: 'Security system that monitors and controls network traffic based on rules',
        category: 'networking',
        related: ['security', 'network', 'filter', 'gateway']
    },
    
    // Cybersecurity
    'encrypt': {
        definition: 'Convert data into coded form to prevent unauthorized access',
        category: 'security',
        related: ['decrypt', 'cipher', 'secure', 'key']
    },
    'decrypt': {
        definition: 'Convert encrypted data back to readable form',
        category: 'security',
        related: ['encrypt', 'cipher', 'key', 'decode']
    },
    'cipher': {
        definition: 'Algorithm for performing encryption or decryption',
        category: 'security',
        related: ['encrypt', 'decrypt', 'key', 'code']
    },
    'hack': {
        definition: 'Gain unauthorized access to computer systems or networks',
        category: 'security',
        related: ['exploit', 'breach', 'backdoor', 'security']
    },
    'exploit': {
        definition: 'Take advantage of a vulnerability in software or systems',
        category: 'security',
        related: ['hack', 'vulnerability', 'attack', 'breach']
    },
    'malware': {
        definition: 'Malicious software designed to damage or gain unauthorized access to systems',
        category: 'security',
        related: ['virus', 'trojan', 'worm', 'ransomware']
    },
    'virus': {
        definition: 'Self-replicating malware that spreads by attaching to other programs',
        category: 'security',
        related: ['malware', 'worm', 'trojan', 'infect']
    },
    'phishing': {
        definition: 'Fraudulent attempt to obtain sensitive information by disguising as trustworthy entity',
        category: 'security',
        related: ['attack', 'social', 'credential', 'spoofing']
    },
    
    // AI & Machine Learning
    'ai': {
        definition: 'Artificial Intelligence - simulation of human intelligence by machines',
        category: 'ai',
        related: ['neural', 'machine', 'learning', 'algorithm']
    },
    'neural': {
        definition: 'Relating to artificial neural networks inspired by biological brain structure',
        category: 'ai',
        related: ['ai', 'network', 'deep', 'learning']
    },
    'machine': {
        definition: 'In ML context: systems that learn from data without explicit programming',
        category: 'ai',
        related: ['learning', 'ai', 'model', 'training']
    },
    'model': {
        definition: 'Mathematical representation learned from data to make predictions',
        category: 'ai',
        related: ['training', 'ai', 'neural', 'algorithm']
    },
    
    // Web Development
    'web': {
        definition: 'The World Wide Web - system of interlinked hypertext documents on the internet',
        category: 'web',
        related: ['internet', 'browser', 'html', 'http']
    },
    'browser': {
        definition: 'Software application for accessing and viewing websites',
        category: 'web',
        related: ['web', 'client', 'http', 'render']
    },
    'html': {
        definition: 'HyperText Markup Language - standard language for creating web pages',
        category: 'web',
        related: ['web', 'css', 'javascript', 'markup']
    },
    'css': {
        definition: 'Cascading Style Sheets - language for styling the presentation of web pages',
        category: 'web',
        related: ['html', 'style', 'web', 'design']
    },
    'javascript': {
        definition: 'High-level programming language primarily used for web development',
        category: 'web',
        related: ['web', 'typescript', 'code', 'browser']
    },
    
    // Cyberpunk Terms
    'cyberspace': {
        definition: 'Virtual environment where computer networks and digital communications exist',
        category: 'cyberpunk',
        related: ['virtual', 'network', 'matrix', 'digital']
    },
    'matrix': {
        definition: 'In cyberpunk: the virtual reality dataspace or network grid',
        category: 'cyberpunk',
        related: ['cyberspace', 'virtual', 'network', 'grid']
    },
    'netrunner': {
        definition: 'Hacker who navigates cyberspace to access protected systems',
        category: 'cyberpunk',
        related: ['hack', 'cyberspace', 'cyberdeck', 'runner']
    },
    'cyberdeck': {
        definition: 'Portable computer used by netrunners to access cyberspace',
        category: 'cyberpunk',
        related: ['netrunner', 'interface', 'cyberspace', 'device']
    },
    'neon': {
        definition: 'Bright, glowing aesthetic typical of cyberpunk visual style',
        category: 'cyberpunk',
        related: ['cyberpunk', 'glow', 'aesthetic', 'style']
    },
    'chrome': {
        definition: 'In cyberpunk: cybernetic enhancements or high-tech implants',
        category: 'cyberpunk',
        related: ['cyber', 'augment', 'implant', 'enhance']
    },
    
    // System Operations
    'boot': {
        definition: 'Start up a computer and load the operating system',
        category: 'system',
        related: ['load', 'system', 'start', 'kernel']
    },
    'kernel': {
        definition: 'Core component of an operating system that manages hardware and system resources',
        category: 'system',
        related: ['system', 'os', 'core', 'boot']
    },
    'process': {
        definition: 'Instance of a program being executed by the operating system',
        category: 'system',
        related: ['thread', 'program', 'execute', 'runtime']
    },
    'thread': {
        definition: 'Smallest unit of execution within a process',
        category: 'system',
        related: ['process', 'concurrent', 'parallel', 'multitask']
    },
    'daemon': {
        definition: 'Background process that runs continuously without user interaction',
        category: 'system',
        related: ['service', 'background', 'process', 'system']
    },
    
    // Programming Concepts
    'async': {
        definition: 'Asynchronous operation that runs independently without blocking execution',
        category: 'programming',
        related: ['await', 'promise', 'concurrent', 'callback']
    },
    'await': {
        definition: 'Keyword that pauses execution until an asynchronous operation completes',
        category: 'programming',
        related: ['async', 'promise', 'future', 'defer']
    },
    'callback': {
        definition: 'Function passed as argument to be executed after another operation completes',
        category: 'programming',
        related: ['async', 'promise', 'handler', 'event']
    },
    'promise': {
        definition: 'Object representing eventual completion or failure of an asynchronous operation',
        category: 'programming',
        related: ['async', 'await', 'future', 'callback']
    },
    'loop': {
        definition: 'Programming construct that repeats a block of code until a condition is met',
        category: 'programming',
        related: ['iterate', 'repeat', 'while', 'for']
    },
    'function': {
        definition: 'Reusable block of code that performs a specific task',
        category: 'programming',
        related: ['method', 'procedure', 'call', 'return']
    },
    'variable': {
        definition: 'Named storage location that holds a value that can change',
        category: 'programming',
        related: ['constant', 'value', 'data', 'type']
    },
    'class': {
        definition: 'Blueprint for creating objects with shared properties and methods',
        category: 'programming',
        related: ['object', 'instance', 'inherit', 'method']
    },
    
    // Data & Storage
    'data': {
        definition: 'Information processed or stored by a computer',
        category: 'data',
        related: ['information', 'byte', 'storage', 'database']
    },
    'database': {
        definition: 'Organized collection of structured data stored electronically',
        category: 'data',
        related: ['data', 'storage', 'query', 'table']
    },
    'byte': {
        definition: 'Unit of digital information equal to 8 bits',
        category: 'data',
        related: ['bit', 'data', 'memory', 'storage']
    },
    'bit': {
        definition: 'Basic unit of information in computing, representing 0 or 1',
        category: 'data',
        related: ['byte', 'binary', 'data', 'digital']
    },
    'binary': {
        definition: 'Base-2 number system using only 0 and 1, the language of computers',
        category: 'data',
        related: ['bit', 'digital', 'hex', 'code']
    },
    'hex': {
        definition: 'Hexadecimal - base-16 number system using digits 0-9 and letters A-F',
        category: 'data',
        related: ['binary', 'octal', 'code', 'number']
    },
    
    // Graphics & Rendering
    'render': {
        definition: 'Generate an image from a model using computer graphics',
        category: 'graphics',
        related: ['gpu', 'shader', 'graphics', 'display']
    },
    'shader': {
        definition: 'Program that runs on GPU to determine how pixels are rendered',
        category: 'graphics',
        related: ['gpu', 'render', 'graphics', 'pixel']
    },
    'pixel': {
        definition: 'Smallest unit of a digital image or display',
        category: 'graphics',
        related: ['screen', 'render', 'image', 'display']
    },
    'texture': {
        definition: 'Image applied to the surface of a 3D model',
        category: 'graphics',
        related: ['render', 'graphics', 'image', 'surface']
    },
    
    // Version Control
    'git': {
        definition: 'Distributed version control system for tracking changes in code',
        category: 'tools',
        related: ['github', 'version', 'commit', 'branch']
    },
    'commit': {
        definition: 'Save changes to version control system with descriptive message',
        category: 'tools',
        related: ['git', 'push', 'version', 'save']
    },
    'branch': {
        definition: 'Separate line of development in version control',
        category: 'tools',
        related: ['git', 'merge', 'fork', 'version']
    },
    'merge': {
        definition: 'Combine changes from different branches in version control',
        category: 'tools',
        related: ['git', 'branch', 'conflict', 'pull']
    },
    'clone': {
        definition: 'Create a local copy of a remote repository',
        category: 'tools',
        related: ['git', 'repository', 'copy', 'remote']
    },
    'push': {
        definition: 'Upload local changes to a remote repository',
        category: 'tools',
        related: ['git', 'pull', 'remote', 'commit']
    },
    'pull': {
        definition: 'Download and integrate changes from a remote repository',
        category: 'tools',
        related: ['git', 'push', 'fetch', 'remote']
    },
    
    // Additional terms from word bank
    'fracture': {
        definition: 'Breaking or splitting into fragments, often used in graphics and data corruption',
        category: 'cyberpunk',
        related: ['glitch', 'corrupt', 'buffer', 'crash']
    },
    'quantum': {
        definition: 'Relating to quantum mechanics, used in quantum computing with qubits and superposition',
        category: 'ai',
        related: ['qubit', 'processor', 'encryption', 'algorithm']
    },
    'phantom': {
        definition: 'Ghost-like process or reference that appears but has no actual presence',
        category: 'cyberpunk',
        related: ['ghost', 'stealth', 'backdoor', 'trace']
    },
    'cipher': {
        definition: 'Algorithm for encryption or decryption of data',
        category: 'security',
        related: ['encrypt', 'decrypt', 'hash', 'key']
    },
    'voltage': {
        definition: 'Electric potential difference, power level in electronic circuits',
        category: 'hardware',
        related: ['power', 'circuit', 'signal', 'chip']
    },
    'impulse': {
        definition: 'Sudden electrical signal or burst of data transmission',
        category: 'hardware',
        related: ['signal', 'pulse', 'transmission', 'wave']
    },
    'nexus': {
        definition: 'Central connection point or hub in a network',
        category: 'networking',
        related: ['hub', 'node', 'network', 'gateway']
    },
    'matrix': {
        definition: 'Two-dimensional array structure or interconnected network system',
        category: 'datastructures',
        related: ['array', 'grid', 'network', 'cyberspace']
    },
    'vector': {
        definition: 'Direction and magnitude in space, or dynamic array in programming',
        category: 'datastructures',
        related: ['array', 'list', 'graphics', 'math']
    },
    'plasma': {
        definition: 'Ionized gas state or high-energy visual effect in graphics',
        category: 'graphics',
        related: ['particle', 'glow', 'render', 'shader']
    },
    'vortex': {
        definition: 'Spiral or whirling pattern, used in graphics and physics simulations',
        category: 'graphics',
        related: ['spiral', 'particle', 'physics', 'animation']
    },
    'prism': {
        definition: 'Optical element that refracts light, or data transformation layer',
        category: 'graphics',
        related: ['refract', 'spectrum', 'shader', 'lighting']
    },
    'fusion': {
        definition: 'Combining multiple elements or data sources into one unified system',
        category: 'fundamentals',
        related: ['merge', 'combine', 'integrate', 'compile']
    },
    'photon': {
        definition: 'Particle of light, used in fiber optics and quantum computing',
        category: 'hardware',
        related: ['laser', 'optic', 'quantum', 'transmission']
    },
    'daemon': {
        definition: 'Background process that runs continuously without user interaction',
        category: 'system',
        related: ['process', 'service', 'background', 'kernel']
    },
    'thread': {
        definition: 'Smallest sequence of programmed instructions that can be managed independently',
        category: 'system',
        related: ['process', 'multitask', 'concurrent', 'parallel']
    },
    'token': {
        definition: 'Smallest meaningful unit in code parsing or authentication credential',
        category: 'security',
        related: ['lexer', 'parser', 'auth', 'session']
    },
    'pragma': {
        definition: 'Compiler directive that provides additional instructions to the compiler',
        category: 'programming',
        related: ['compile', 'directive', 'macro', 'preprocessor']
    },
    'proxy': {
        definition: 'Intermediary that acts on behalf of another component or server',
        category: 'networking',
        related: ['gateway', 'forward', 'cache', 'router']
    },
    'facade': {
        definition: 'Design pattern providing simplified interface to complex subsystem',
        category: 'programming',
        related: ['interface', 'wrapper', 'abstraction', 'pattern']
    },
    'async': {
        definition: 'Asynchronous operation that runs independently without blocking',
        category: 'programming',
        related: ['await', 'promise', 'callback', 'concurrent']
    },
    'docker': {
        definition: 'Platform for developing and running applications in isolated containers',
        category: 'tools',
        related: ['container', 'virtual', 'deploy', 'orchestration']
    },
    'vertex': {
        definition: 'Point in 3D space defining corner of polygon in graphics',
        category: 'graphics',
        related: ['polygon', 'mesh', 'shader', 'geometry']
    },
    'raycast': {
        definition: 'Technique for detecting objects along a ray path in 3D space',
        category: 'graphics',
        related: ['collision', 'physics', 'trace', 'render']
    },
    'lidar': {
        definition: 'Light Detection and Ranging - remote sensing using laser pulses',
        category: 'hardware',
        related: ['sensor', 'laser', 'scan', 'radar']
    },
    'bandwidth': {
        definition: 'Maximum rate of data transfer across a network connection',
        category: 'networking',
        related: ['throughput', 'latency', 'network', 'transmission']
    },
    'qubit': {
        definition: 'Quantum bit that can exist in superposition of 0 and 1 simultaneously',
        category: 'ai',
        related: ['quantum', 'superposition', 'entanglement', 'processor']
    },
    'hologram': {
        definition: 'Three-dimensional image formed by light interference patterns',
        category: 'graphics',
        related: ['virtual', '3d', 'projection', 'display']
    },
    'firewall': {
        definition: 'Security system that monitors and controls network traffic',
        category: 'security',
        related: ['security', 'network', 'filter', 'protection']
    },
    'protocol': {
        definition: 'Set of rules governing data communication between systems',
        category: 'networking',
        related: ['network', 'communication', 'standard', 'transmission']
    },
    'interface': {
        definition: 'Point of interaction between components or user and system',
        category: 'programming',
        related: ['api', 'abstraction', 'contract', 'ui']
    },
    'synthetic': {
        definition: 'Artificially created or simulated, not naturally occurring',
        category: 'ai',
        related: ['artificial', 'simulation', 'generate', 'virtual']
    },
    'mainframe': {
        definition: 'Large powerful computer used by organizations for critical applications',
        category: 'hardware',
        related: ['server', 'computer', 'enterprise', 'legacy']
    },
    'terminal': {
        definition: 'Text-based interface for interacting with computer system',
        category: 'system',
        related: ['shell', 'console', 'command', 'cli']
    },
    'frequency': {
        definition: 'Rate at which something occurs over time, measured in Hertz',
        category: 'hardware',
        related: ['clock', 'signal', 'wave', 'processor']
    },
    'cascade': {
        definition: 'Series of stages where output of one becomes input of next',
        category: 'fundamentals',
        related: ['pipeline', 'chain', 'flow', 'sequence']
    },
    'velocity': {
        definition: 'Rate of change of position, speed with direction',
        category: 'fundamentals',
        related: ['speed', 'motion', 'physics', 'animation']
    },
    'disruptor': {
        definition: 'Technology or process that fundamentally changes existing systems',
        category: 'fundamentals',
        related: ['innovation', 'change', 'transform', 'breakthrough']
    },
    'amplifier': {
        definition: 'Device that increases strength or magnitude of a signal',
        category: 'hardware',
        related: ['signal', 'boost', 'gain', 'power']
    },
    'netrunner': {
        definition: 'Hacker who navigates and manipulates cyberspace networks',
        category: 'cyberpunk',
        related: ['hacker', 'cyberdeck', 'cyberspace', 'net']
    },
    'cyberdeck': {
        definition: 'Portable computer used for hacking and accessing cyberspace',
        category: 'cyberpunk',
        related: ['netrunner', 'hack', 'interface', 'cyber']
    },
    'exploit': {
        definition: 'Software or technique that takes advantage of vulnerability',
        category: 'security',
        related: ['vulnerability', 'attack', 'hack', 'breach']
    },
    'profiler': {
        definition: 'Tool that analyzes program performance and resource usage',
        category: 'tools',
        related: ['debug', 'optimize', 'performance', 'analyze']
    },
    'emulator': {
        definition: 'System that mimics behavior of another system or device',
        category: 'tools',
        related: ['virtual', 'simulate', 'compatibility', 'platform']
    },
    'simulator': {
        definition: 'Program that models real-world processes or systems',
        category: 'tools',
        related: ['emulator', 'model', 'virtual', 'test']
    },
    'optimizer': {
        definition: 'Tool or process that improves efficiency and performance',
        category: 'tools',
        related: ['compile', 'performance', 'improve', 'efficient']
    },
    'compression': {
        definition: 'Reducing data size by encoding information more efficiently',
        category: 'data',
        related: ['encode', 'zip', 'archive', 'reduce']
    },
    'latency': {
        definition: 'Time delay between action and response in a system',
        category: 'networking',
        related: ['delay', 'lag', 'response', 'performance']
    },
    'throughput': {
        definition: 'Amount of data processed or transmitted in given time period',
        category: 'networking',
        related: ['bandwidth', 'performance', 'capacity', 'speed']
    },
    'handshake': {
        definition: 'Automated negotiation process between two systems establishing connection',
        category: 'networking',
        related: ['connection', 'protocol', 'establish', 'negotiate']
    },
    'authentication': {
        definition: 'Verifying identity of user or system before granting access',
        category: 'security',
        related: ['auth', 'verify', 'login', 'credential']
    },
    'authorization': {
        definition: 'Granting specific permissions to authenticated user or system',
        category: 'security',
        related: ['permission', 'access', 'auth', 'privilege']
    },
    'blockchain': {
        definition: 'Distributed ledger technology with immutable linked records',
        category: 'data',
        related: ['crypto', 'distributed', 'ledger', 'chain']
    },
    'cryptocurrency': {
        definition: 'Digital currency using cryptography for secure transactions',
        category: 'data',
        related: ['blockchain', 'crypto', 'bitcoin', 'digital']
    },
    'vulnerability': {
        definition: 'Weakness in system that can be exploited by attackers',
        category: 'security',
        related: ['exploit', 'security', 'flaw', 'breach']
    },
    'ransomware': {
        definition: 'Malware that encrypts data and demands payment for decryption',
        category: 'security',
        related: ['malware', 'encrypt', 'attack', 'extortion']
    },
    'botnet': {
        definition: 'Network of infected computers controlled remotely for malicious purposes',
        category: 'security',
        related: ['malware', 'ddos', 'attack', 'zombie']
    },
    'phishing': {
        definition: 'Fraudulent attempt to obtain sensitive information by disguising as trustworthy',
        category: 'security',
        related: ['social', 'fraud', 'attack', 'deception']
    },
    'container': {
        definition: 'Lightweight isolated environment for running applications',
        category: 'tools',
        related: ['docker', 'virtual', 'isolate', 'deploy']
    },
    'orchestration': {
        definition: 'Automated coordination and management of complex systems',
        category: 'tools',
        related: ['container', 'deploy', 'kubernetes', 'automate']
    },
    'kubernetes': {
        definition: 'Open-source platform for automating container deployment and scaling',
        category: 'tools',
        related: ['container', 'orchestration', 'deploy', 'cluster']
    },
    'microservice': {
        definition: 'Architectural style with small independent services communicating via APIs',
        category: 'programming',
        related: ['api', 'service', 'distributed', 'architecture']
    },
    'serverless': {
        definition: 'Cloud computing model where provider manages server infrastructure',
        category: 'web',
        related: ['cloud', 'function', 'lambda', 'scalable']
    },
    'scalability': {
        definition: 'Ability of system to handle increased load by adding resources',
        category: 'fundamentals',
        related: ['performance', 'growth', 'capacity', 'elastic']
    },
    'redundancy': {
        definition: 'Duplication of critical components to increase reliability',
        category: 'fundamentals',
        related: ['backup', 'reliability', 'failover', 'availability']
    },
    'failover': {
        definition: 'Automatic switching to backup system when primary fails',
        category: 'system',
        related: ['backup', 'redundancy', 'availability', 'recovery']
    },
    'sharding': {
        definition: 'Database partitioning that splits data across multiple machines',
        category: 'data',
        related: ['partition', 'distributed', 'scale', 'database']
    },
    'indexing': {
        definition: 'Creating data structure to improve speed of data retrieval',
        category: 'data',
        related: ['database', 'search', 'optimize', 'query']
    },
    'refactoring': {
        definition: 'Restructuring code without changing external behavior to improve quality',
        category: 'programming',
        related: ['code', 'improve', 'clean', 'optimize']
    },
    'abstraction': {
        definition: 'Hiding complex implementation details behind simpler interface',
        category: 'programming',
        related: ['interface', 'encapsulation', 'simplify', 'layer']
    },
    'encapsulation': {
        definition: 'Bundling data and methods that operate on data within single unit',
        category: 'programming',
        related: ['abstraction', 'class', 'private', 'hide']
    },
    'polymorphism': {
        definition: 'Ability of objects to take multiple forms and respond differently',
        category: 'programming',
        related: ['inheritance', 'interface', 'override', 'oop']
    },
    'inheritance': {
        definition: 'Mechanism where new class derives properties from existing class',
        category: 'programming',
        related: ['class', 'extend', 'polymorphism', 'oop']
    },
    'javascript': {
        definition: 'High-level interpreted programming language primarily for web development',
        category: 'programming',
        related: ['web', 'browser', 'node', 'typescript']
    },
    'typescript': {
        definition: 'Strongly typed superset of JavaScript that compiles to plain JavaScript',
        category: 'programming',
        related: ['javascript', 'type', 'compile', 'web']
    },
    'python': {
        definition: 'High-level interpreted language known for readability and versatility',
        category: 'programming',
        related: ['script', 'interpret', 'ai', 'data']
    },
    'react': {
        definition: 'JavaScript library for building user interfaces with reusable components',
        category: 'web',
        related: ['javascript', 'ui', 'component', 'frontend']
    },
    'webpack': {
        definition: 'Module bundler for JavaScript applications',
        category: 'tools',
        related: ['bundle', 'build', 'module', 'javascript']
    },
    'vite': {
        definition: 'Fast build tool and development server for modern web projects',
        category: 'tools',
        related: ['build', 'bundle', 'dev', 'fast']
    }
};

// Category colors for visual distinction
const CATEGORY_COLORS = {
    'fundamentals': '#00ffff',      // Cyan
    'hardware': '#ff00ff',          // Magenta
    'datastructures': '#ffff00',    // Yellow
    'networking': '#00ff00',        // Green
    'security': '#ff0000',          // Red
    'ai': '#ff00aa',                // Pink
    'web': '#00aaff',              // Light Blue
    'cyberpunk': '#aa00ff',        // Purple
    'system': '#ff8800',           // Orange
    'programming': '#00ffaa',      // Teal
    'data': '#ffaa00',             // Gold
    'graphics': '#aa00aa',         // Violet
    'tools': '#aaff00'             // Lime
};

// Export to window for global access
window.TECH_GLOSSARY = TECH_GLOSSARY;
window.CATEGORY_COLORS = CATEGORY_COLORS;
