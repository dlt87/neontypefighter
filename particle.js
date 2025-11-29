// ========================================
// PARTICLE EFFECTS SYSTEM
// ========================================

class ParticleSystem {
    constructor() {
        this.container = document.getElementById('particles-container');
        this.themeManager = null; // Will be set by game
    }
    
    setThemeManager(themeManager) {
        this.themeManager = themeManager;
    }
    
    createExplosion(x, y, color, count = CONFIG.PARTICLE_COUNT) {
        for (let i = 0; i < count; i++) {
            this.createParticle(x, y, color);
        }
    }
    
    createParticle(x, y, color) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = color;
        particle.style.boxShadow = `0 0 10px ${color}`;
        
        // Random direction and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = CONFIG.PARTICLE_SPREAD + Math.random() * CONFIG.PARTICLE_SPREAD;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        
        this.container.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }
    
    createHitEffect(targetElement, color) {
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        this.createExplosion(centerX, centerY, color, CONFIG.PARTICLE_COUNT);
    }
    
    createCriticalEffect(targetElement, color) {
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Double particles for critical hits
        this.createExplosion(centerX, centerY, color, CONFIG.PARTICLE_COUNT * 2);
        
        // Add a ring effect
        this.createRingEffect(centerX, centerY, color);
    }
    
    createRingEffect(x, y, color) {
        const ring = document.createElement('div');
        ring.style.position = 'absolute';
        ring.style.left = x + 'px';
        ring.style.top = y + 'px';
        ring.style.width = '20px';
        ring.style.height = '20px';
        ring.style.border = `3px solid ${color}`;
        ring.style.borderRadius = '50%';
        ring.style.transform = 'translate(-50%, -50%)';
        ring.style.pointerEvents = 'none';
        ring.style.boxShadow = `0 0 20px ${color}`;
        ring.style.animation = 'ring-expand 0.6s ease-out forwards';
        
        this.container.appendChild(ring);
        
        setTimeout(() => {
            ring.remove();
        }, 600);
    }
    
    clear() {
        this.container.innerHTML = '';
    }
}

// Add ring expansion animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes ring-expand {
        0% {
            width: 20px;
            height: 20px;
            opacity: 1;
        }
        100% {
            width: 200px;
            height: 200px;
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
