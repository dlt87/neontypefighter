// ========================================
// AUTHENTICATION CLIENT
// ========================================

class AuthClient {
    constructor() {
        this.currentUser = null;
        this.onLogin = null;
        this.onLogout = null;
        this.apiUrl = 'https://neontypefighter-production.up.railway.app/api/auth';
        
        // Load saved session
        this.loadFromStorage();
    }
    
    async register(username, email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }
            
            // Auto-login after successful registration
            const user = {
                id: data.userId,
                sub: data.userId,
                name: username,
                email: email,
                token: data.token
            };
            
            this.currentUser = user;
            this.saveToStorage();
            
            if (this.onLogin) {
                this.onLogin(user);
            }
            
            console.log('✅ Registration successful:', username);
            return { success: true, user };
        } catch (error) {
            console.error('❌ Registration error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async login(emailOrUsername, password) {
        try {
            const response = await fetch(`${this.apiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ emailOrUsername, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            const user = {
                id: data.userId,
                sub: data.userId,
                name: data.username,
                email: data.email,
                emailVerified: data.emailVerified || false,
                token: data.token
            };
            
            this.currentUser = user;
            this.saveToStorage();
            
            if (this.onLogin) {
                this.onLogin(user);
            }
            
            console.log('✅ Login successful:', data.username);
            return { success: true, user };
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, error: error.message };
        }
    }
    
    signOut() {
        this.currentUser = null;
        localStorage.removeItem('neonTypingFighter_user');
        
        if (this.onLogout) {
            this.onLogout();
        }
        
        console.log('👋 User signed out');
    }
    
    saveToStorage() {
        if (this.currentUser) {
            localStorage.setItem('neonTypingFighter_user', JSON.stringify(this.currentUser));
        }
    }
    
    loadFromStorage() {
        const saved = localStorage.getItem('neonTypingFighter_user');
        if (saved) {
            try {
                this.currentUser = JSON.parse(saved);
                console.log('📂 Session loaded:', this.currentUser.name);
            } catch (error) {
                console.error('Error loading user from storage:', error);
            }
        }
    }
}
