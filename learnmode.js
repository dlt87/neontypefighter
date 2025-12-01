// ========================================
// LEARN MODE - Interactive Tech Quiz
// ========================================

class LearnMode {
    constructor(game) {
        this.game = game;
        this.currentCategory = 'all';
        this.score = 0;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.currentQuestion = null;
        this.usedWords = [];
        this.isActive = false;
        this.streakCount = 0;
        this.bestStreak = 0;
        
        // Track category-specific progress
        this.categoryStats = {};
    }
    
    setupUI() {
        // Category selection buttons
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.getAttribute('data-category');
                this.startLearnMode(category);
            });
        });
        
        // Answer input
        const input = document.getElementById('learn-input');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && input.value.trim()) {
                    this.checkAnswer(input.value.trim());
                    input.value = '';
                }
            });
            
            // Also accept number keys 1-4
            input.addEventListener('keypress', (e) => {
                if (e.key >= '1' && e.key <= '4') {
                    e.preventDefault();
                    this.checkAnswerByNumber(parseInt(e.key) - 1);
                    input.value = '';
                }
            });
        }
        
        // Option button clicks
        const optionButtons = document.querySelectorAll('.option-btn');
        optionButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.checkAnswerByNumber(index);
            });
        });
        
        // View in glossary button
        const glossaryBtn = document.getElementById('view-glossary-btn');
        if (glossaryBtn) {
            glossaryBtn.addEventListener('click', () => {
                this.viewInGlossary();
            });
        }
        
        // Back button
        const backBtn = document.getElementById('learn-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.exitLearnMode();
            });
        }
        
        // Home button
        const homeBtn = document.getElementById('learn-home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                this.exitLearnMode();
            });
        }
    }
    
    startLearnMode(category = 'all') {
        this.currentCategory = category;
        this.resetStats();
        this.isActive = true;
        
        // Show question area, hide category selection
        document.getElementById('learn-category-select').classList.add('hidden');
        document.getElementById('learn-question-area').classList.remove('hidden');
        
        // Update header to show selected category
        const categoryNames = {
            'all': 'All Categories',
            'fundamentals': 'Fundamentals',
            'hardware': 'Hardware',
            'datastructures': 'Data Structures',
            'networking': 'Networking',
            'security': 'Security',
            'ai': 'AI/ML',
            'web': 'Web Development',
            'cyberpunk': 'Cyberpunk',
            'system': 'System',
            'programming': 'Programming',
            'data': 'Data',
            'graphics': 'Graphics',
            'tools': 'Tools'
        };
        
        const header = document.querySelector('#learn-mode-screen h2');
        if (header) {
            header.textContent = `LEARN MODE: ${categoryNames[category]}`;
        }
        
        this.generateQuestion();
        
        // Focus input
        setTimeout(() => {
            const input = document.getElementById('learn-input');
            if (input) input.focus();
        }, 100);
    }
    
    resetStats() {
        this.score = 0;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.usedWords = [];
        this.streakCount = 0;
        this.updateStatsDisplay();
    }
    
    generateQuestion() {
        // Get glossary data
        const glossary = window.TECH_GLOSSARY || {};
        
        // Safety check
        if (Object.keys(glossary).length === 0) {
            console.error('❌ TECH_GLOSSARY is empty or not loaded!');
            alert('Error: Tech glossary data not loaded. Please refresh the page.');
            return;
        }
        
        // Convert to array format
        let pool = Object.keys(glossary).map(word => ({
            word: word,
            definition: glossary[word].definition,
            category: glossary[word].category,
            related: glossary[word].related || []
        }));
        
        console.log(`📚 Total words in glossary: ${pool.length}`);
        
        // Filter by category if not 'all'
        if (this.currentCategory !== 'all') {
            pool = pool.filter(item => item.category === this.currentCategory);
            console.log(`📂 Words in category '${this.currentCategory}': ${pool.length}`);
        }
        
        // Remove already used words
        pool = pool.filter(item => !this.usedWords.includes(item.word));
        
        // Reset if all words used
        if (pool.length === 0) {
            console.log('🔄 Resetting used words - all questions answered!');
            this.usedWords = [];
            pool = Object.keys(glossary).map(word => ({
                word: word,
                definition: glossary[word].definition,
                category: glossary[word].category,
                related: glossary[word].related || []
            }));
            
            if (this.currentCategory !== 'all') {
                pool = pool.filter(item => item.category === this.currentCategory);
            }
        }
        
        // Safety check for empty pool
        if (pool.length === 0) {
            console.error(`❌ No words found for category: ${this.currentCategory}`);
            alert(`No words found in category: ${this.currentCategory}. Try selecting a different category.`);
            this.exitLearnMode();
            return;
        }
        
        // Pick random word as correct answer
        const correct = pool[Math.floor(Math.random() * pool.length)];
        this.usedWords.push(correct.word);
        console.log(`❓ Question: ${correct.word} (${correct.category})`);
        
        // Generate 3 wrong answers
        const wrongAnswers = this.generateWrongAnswers(correct, pool, 3);
        
        // Shuffle all 4 options
        const options = this.shuffleArray([correct, ...wrongAnswers]);
        
        this.currentQuestion = {
            definition: correct.definition,
            correctWord: correct.word,
            options: options,
            correctIndex: options.findIndex(opt => opt.word === correct.word)
        };
        
        // Update UI
        this.displayQuestion();
    }
    
    generateWrongAnswers(correctItem, pool, count) {
        const wrongAnswers = [];
        
        // Filter out the correct answer
        let candidates = pool.filter(item => item.word !== correctItem.word);
        
        // Prioritize same category for more challenging questions
        let sameCategoryCandidates = candidates.filter(item => item.category === correctItem.category);
        
        // If not enough in same category, use all candidates
        if (sameCategoryCandidates.length < count) {
            sameCategoryCandidates = candidates;
        }
        
        // Shuffle and pick
        const shuffled = this.shuffleArray(sameCategoryCandidates);
        for (let i = 0; i < count && i < shuffled.length; i++) {
            wrongAnswers.push(shuffled[i]);
        }
        
        // If still not enough, fill with any remaining
        while (wrongAnswers.length < count && candidates.length > wrongAnswers.length) {
            const random = candidates[Math.floor(Math.random() * candidates.length)];
            if (!wrongAnswers.includes(random)) {
                wrongAnswers.push(random);
            }
        }
        
        return wrongAnswers;
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    displayQuestion() {
        // Update definition
        const definitionEl = document.getElementById('learn-definition');
        if (definitionEl) {
            definitionEl.textContent = this.currentQuestion.definition;
        }
        
        // Update options
        const optionButtons = document.querySelectorAll('.option-btn');
        optionButtons.forEach((btn, index) => {
            if (this.currentQuestion.options[index]) {
                const word = this.currentQuestion.options[index].word;
                btn.querySelector('.option-text').textContent = word;
                btn.classList.remove('correct', 'wrong', 'disabled');
                btn.disabled = false;
            }
        });
        
        // Hide feedback
        const feedback = document.getElementById('learn-feedback');
        if (feedback) {
            feedback.classList.add('hidden');
        }
        
        // Clear and focus input
        const input = document.getElementById('learn-input');
        if (input) {
            input.value = '';
            input.disabled = false;
            input.focus();
        }
    }
    
    checkAnswer(playerInput) {
        const normalizedInput = playerInput.toLowerCase().trim();
        const correctWord = this.currentQuestion.correctWord.toLowerCase();
        
        const isCorrect = normalizedInput === correctWord;
        
        this.processAnswer(isCorrect);
    }
    
    checkAnswerByNumber(optionIndex) {
        const isCorrect = optionIndex === this.currentQuestion.correctIndex;
        
        // Highlight the clicked option
        const optionButtons = document.querySelectorAll('.option-btn');
        const clickedButton = optionButtons[optionIndex];
        
        if (isCorrect) {
            clickedButton.classList.add('correct');
        } else {
            clickedButton.classList.add('wrong');
            // Also highlight the correct answer
            optionButtons[this.currentQuestion.correctIndex].classList.add('correct');
        }
        
        this.processAnswer(isCorrect);
    }
    
    processAnswer(isCorrect) {
        this.questionsAnswered++;
        
        // Disable input and buttons
        const input = document.getElementById('learn-input');
        if (input) input.disabled = true;
        
        const optionButtons = document.querySelectorAll('.option-btn');
        optionButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
        
        if (isCorrect) {
            this.correctAnswers++;
            this.score += 10;
            this.streakCount++;
            if (this.streakCount > this.bestStreak) {
                this.bestStreak = this.streakCount;
            }
            this.showFeedback('correct');
            this.game.soundManager.playCriticalSound();
            
            // Particle effect
            if (this.game.particleSystem) {
                this.game.particleSystem.createBurst(
                    window.innerWidth / 2,
                    window.innerHeight / 2,
                    '#00ff00',
                    20
                );
            }
            
            // Check for achievements
            this.checkAchievements();
        } else {
            this.streakCount = 0;
            this.showFeedback('wrong', this.currentQuestion.correctWord);
            this.game.soundManager.playErrorSound();
        }
        
        // Update category stats
        const category = this.currentCategory;
        if (!this.categoryStats[category]) {
            this.categoryStats[category] = { correct: 0, total: 0 };
        }
        this.categoryStats[category].total++;
        if (isCorrect) {
            this.categoryStats[category].correct++;
        }
        
        this.updateStatsDisplay();
        
        // Generate next question after delay
        setTimeout(() => {
            this.generateQuestion();
        }, 2500);
    }
    
    showFeedback(type, correctWord = null) {
        const feedback = document.getElementById('learn-feedback');
        const icon = feedback.querySelector('.feedback-icon');
        const text = feedback.querySelector('.feedback-text');
        
        feedback.classList.remove('hidden', 'correct', 'wrong');
        feedback.classList.add(type);
        
        if (type === 'correct') {
            icon.textContent = '✓';
            text.textContent = 'Correct! +10 points';
            
            if (this.streakCount >= 5) {
                text.textContent += ` | ${this.streakCount} streak! 🔥`;
            }
        } else {
            icon.textContent = '✗';
            text.textContent = `Wrong! The correct answer was: ${correctWord}`;
        }
    }
    
    updateStatsDisplay() {
        // Update score
        const scoreEl = document.getElementById('learn-score');
        if (scoreEl) scoreEl.textContent = this.score;
        
        // Update accuracy
        const accuracy = this.questionsAnswered > 0
            ? Math.round((this.correctAnswers / this.questionsAnswered) * 100)
            : 0;
        const accuracyEl = document.getElementById('learn-accuracy');
        if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
        
        // Update question count
        const countEl = document.getElementById('learn-questions-count');
        if (countEl) countEl.textContent = this.questionsAnswered;
    }
    
    viewInGlossary() {
        if (!this.currentQuestion) return;
        
        // Save current state
        const word = this.currentQuestion.correctWord;
        
        // Navigate to glossary
        if (window.showScreen) {
            window.showScreen('glossary');
        }
        
        // Focus on the word in the mind map
        setTimeout(() => {
            if (window.techMindMap) {
                window.techMindMap.searchWord(word);
            }
        }, 500);
    }
    
    exitLearnMode() {
        this.isActive = false;
        
        // Show final stats if any questions were answered
        if (this.questionsAnswered > 0) {
            const accuracy = Math.round((this.correctAnswers / this.questionsAnswered) * 100);
            alert(`Learn Mode Complete!\n\nScore: ${this.score}\nQuestions: ${this.questionsAnswered}\nCorrect: ${this.correctAnswers}\nAccuracy: ${accuracy}%\nBest Streak: ${this.bestStreak}`);
        }
        
        // Reset UI
        document.getElementById('learn-category-select').classList.remove('hidden');
        document.getElementById('learn-question-area').classList.add('hidden');
        
        // Return to main menu
        if (window.showScreen) {
            window.showScreen('menu');
        }
    }
    
    checkAchievements() {
        // Check for streak achievements
        if (this.streakCount === 10 && window.authClient && window.authClient.isLoggedIn()) {
            // Could unlock "Hot Streak" achievement
            console.log('🔥 Hot streak achievement!');
        }
        
        if (this.streakCount === 20 && window.authClient && window.authClient.isLoggedIn()) {
            // Could unlock "Perfect Student" achievement
            console.log('🎓 Perfect Student achievement!');
        }
        
        // Check total questions milestone
        if (this.questionsAnswered === 50 && window.authClient && window.authClient.isLoggedIn()) {
            console.log('📚 Scholar achievement!');
        }
        
        if (this.questionsAnswered === 100 && window.authClient && window.authClient.isLoggedIn()) {
            console.log('🧠 Tech Master achievement!');
        }
    }
}
