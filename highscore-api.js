// ========================================
// HIGH SCORE API CLIENT
// ========================================

class HighScoreAPI {
    constructor(serverUrl = 'https://neontypefighter-production.up.railway.app') {
        this.serverUrl = serverUrl;
    }
    
    async submitScore(userId, userName, score, stats, token) {
        try {
            const response = await fetch(`${this.serverUrl}/api/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    userName,
                    score,
                    stats,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 403 && errorData.error === 'Email verification required') {
                    throw new Error('EMAIL_NOT_VERIFIED');
                }
                throw new Error(errorData.error || 'Failed to submit score');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error submitting score:', error);
            throw error;
        }
    }
    
    async getLeaderboard(limit = 10) {
        try {
            const response = await fetch(`${this.serverUrl}/api/leaderboard?limit=${limit}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    }
    
    async getUserBestScore(userId, token) {
        try {
            const response = await fetch(`${this.serverUrl}/api/scores/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user score');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching user score:', error);
            return null;
        }
    }
    
    async getGlobalStats() {
        try {
            const response = await fetch(`${this.serverUrl}/api/stats`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            return null;
        }
    }
}
