// ========================================
// COSMETIC THEME SYSTEM
// ========================================

const THEMES = {
    vaporwave: {
        name: 'Vaporwave',
        primary: '#ff00ff',      // Pink/Magenta
        secondary: '#00ffff',     // Teal/Cyan
        accent: '#ff6ec7',        // Light Pink
        glow: '#ff00ff',
        particleColor: '#ff00ff',
        description: 'Classic neon pink and teal aesthetic'
    },
    glacier: {
        name: 'Glacier',
        primary: '#00d4ff',       // Ice Blue
        secondary: '#ffffff',     // White
        accent: '#b3f0ff',        // Light Ice
        glow: '#00d4ff',
        particleColor: '#00d4ff',
        description: 'Cool ice blue and crystalline white'
    },
    inferno: {
        name: 'Inferno',
        primary: '#ff4500',       // Orange-Red
        secondary: '#ffaa00',     // Orange
        accent: '#ff6600',        // Bright Orange
        glow: '#ff4500',
        particleColor: '#ff6600',
        description: 'Blazing orange and fierce red'
    }
};

class ThemeManager {
    constructor() {
        this.currentTheme = 'vaporwave'; // Default theme
        this.loadTheme();
        // Apply theme after a short delay to ensure DOM is ready
        setTimeout(() => this.applyTheme(), 100);
    }
    
    loadTheme() {
        // Load saved theme from localStorage
        const saved = localStorage.getItem('neonTypingFighter_theme');
        if (saved && THEMES[saved]) {
            this.currentTheme = saved;
        }
    }
    
    saveTheme() {
        localStorage.setItem('neonTypingFighter_theme', this.currentTheme);
    }
    
    setTheme(themeName) {
        if (!THEMES[themeName]) {
            console.error('Theme not found:', themeName);
            return false;
        }
        
        this.currentTheme = themeName;
        this.saveTheme();
        this.applyTheme();
        return true;
    }
    
    applyTheme() {
        const theme = THEMES[this.currentTheme];
        const root = document.documentElement;
        
        // Update CSS variables
        root.style.setProperty('--neon-cyan', theme.secondary);
        root.style.setProperty('--neon-magenta', theme.primary);
        root.style.setProperty('--neon-accent', theme.accent);
        root.style.setProperty('--theme-glow', theme.glow);
        
        // Update player colors
        this.updatePlayerColors();
        
        console.log('✨ Theme applied:', theme.name);
    }
    
    updatePlayerColors() {
        const theme = THEMES[this.currentTheme];
        
        // Update player 1 health bar
        const player1Health = document.getElementById('player1-health');
        if (player1Health) {
            player1Health.style.background = `linear-gradient(90deg, ${theme.secondary}, ${theme.accent})`;
            player1Health.style.boxShadow = `0 0 20px ${theme.secondary}`;
        }
        
        // Update player 1 info border
        const player1Info = document.querySelector('.player-left .player-info');
        if (player1Info) {
            player1Info.style.borderColor = theme.secondary;
            player1Info.style.boxShadow = `0 0 20px ${theme.secondary}40`;
        }
        
        // Update player 1 character
        const player1Character = document.querySelector('.player-left .character-sprite');
        if (player1Character) {
            player1Character.style.background = `radial-gradient(circle, ${theme.secondary} 0%, transparent 70%)`;
            player1Character.style.boxShadow = `0 0 50px ${theme.secondary}`;
        }
        
        // Update player 2 health bar
        const player2Health = document.getElementById('player2-health');
        if (player2Health) {
            player2Health.style.background = `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`;
            player2Health.style.boxShadow = `0 0 20px ${theme.primary}`;
        }
        
        // Update player 2 info border
        const player2Info = document.querySelector('.player-right .player-info');
        if (player2Info) {
            player2Info.style.borderColor = theme.primary;
            player2Info.style.boxShadow = `0 0 20px ${theme.primary}40`;
        }
        
        // Update player 2 character
        const player2Character = document.querySelector('.player-right .character-sprite');
        if (player2Character) {
            player2Character.style.background = `radial-gradient(circle, ${theme.primary} 0%, transparent 70%)`;
            player2Character.style.boxShadow = `0 0 50px ${theme.primary}`;
        }
        
        // Update typing input
        const typingInput = document.getElementById('typing-input');
        if (typingInput) {
            typingInput.style.borderColor = theme.secondary;
            typingInput.style.boxShadow = `0 0 20px ${theme.secondary}40`;
            typingInput.style.color = theme.secondary;
        }
        
        // Update word display
        const wordDisplay = document.querySelector('.word-display-container');
        if (wordDisplay) {
            wordDisplay.style.borderColor = theme.accent;
            wordDisplay.style.boxShadow = `0 0 30px ${theme.accent}40`;
        }
    }
    
    getCurrentTheme() {
        return THEMES[this.currentTheme];
    }
    
    getThemeName() {
        return this.currentTheme;
    }
    
    getAllThemes() {
        return THEMES;
    }
    
    getParticleColor() {
        return THEMES[this.currentTheme].particleColor;
    }
}
