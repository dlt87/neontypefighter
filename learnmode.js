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
        this.learnedTerms = [];
        this.availableTerms = [];
        
        // Track category-specific progress
        this.categoryStats = {};
        this.categoryProgress = {}; // Track learned terms per category
    }
    
    updateCategoryProgress() {
        const glossary = window.TECH_GLOSSARY || {};
        const categoryButtons = document.querySelectorAll('.category-btn');
        
        categoryButtons.forEach(btn => {
            const category = btn.getAttribute('data-category');
            
            // Get all terms in this category
            let categoryTerms;
            if (category === 'all') {
                categoryTerms = Object.keys(glossary);
            } else {
                categoryTerms = Object.keys(glossary).filter(word => glossary[word].category === category);
            }
            
            // Get learned terms from localStorage
            const learnedData = JSON.parse(localStorage.getItem('learnedTerms') || '{}');
            const learnedInCategory = categoryTerms.filter(term => learnedData[term]);
            
            const total = categoryTerms.length;
            const learned = learnedInCategory.length;
            const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;
            
            // Update the progress ring circle
            const progressCircle = btn.querySelector('.progress-ring-circle');
            if (progressCircle) {
                // Calculate stroke-dashoffset (377 is the circumference for r=60)
                const circumference = 377;
                const offset = circumference - (percentage / 100) * circumference;
                progressCircle.style.strokeDashoffset = offset;
            }
        });
    }
    
    setupUI() {
        // Update category buttons with progress indicators
        this.updateCategoryProgress();
        
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
        
        // Explain why button
        const explainBtn = document.getElementById('explain-why-btn');
        if (explainBtn) {
            explainBtn.addEventListener('click', () => {
                this.showExplanation();
            });
        }
        
        // Next question button
        const nextQuestionBtn = document.getElementById('next-question-btn');
        if (nextQuestionBtn) {
            nextQuestionBtn.addEventListener('click', () => {
                nextQuestionBtn.classList.add('hidden');
                const explainBtn = document.getElementById('explain-why-btn');
                if (explainBtn) explainBtn.classList.add('hidden');
                this.generateQuestion();
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
        
        // Initialize available terms for this category
        const glossary = window.TECH_GLOSSARY || {};
        this.availableTerms = Object.keys(glossary)
            .filter(word => category === 'all' || glossary[word].category === category);
        this.learnedTerms = [];
        
        // Show question area, hide category selection
        document.getElementById('learn-category-select').classList.add('hidden');
        document.getElementById('learn-question-area').classList.remove('hidden');
        
        // Update sidebars
        this.updateTermsSidebar();
        
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
        this.learnedTerms = [];
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
        const usedWords = new Set([correctItem.word]); // Track correct word to avoid duplicates
        
        // Filter out the correct answer
        let candidates = pool.filter(item => item.word !== correctItem.word);
        
        // Prioritize same category for more challenging questions
        let sameCategoryCandidates = candidates.filter(item => item.category === correctItem.category);
        
        // If not enough in same category, use all candidates
        if (sameCategoryCandidates.length < count) {
            sameCategoryCandidates = candidates;
        }
        
        // Shuffle and pick unique words only
        const shuffled = this.shuffleArray(sameCategoryCandidates);
        for (let i = 0; i < shuffled.length && wrongAnswers.length < count; i++) {
            if (!usedWords.has(shuffled[i].word)) {
                wrongAnswers.push(shuffled[i]);
                usedWords.add(shuffled[i].word);
            }
        }
        
        // If still not enough, fill with any remaining unique words
        if (wrongAnswers.length < count) {
            const remainingCandidates = this.shuffleArray(candidates);
            for (let i = 0; i < remainingCandidates.length && wrongAnswers.length < count; i++) {
                if (!usedWords.has(remainingCandidates[i].word)) {
                    wrongAnswers.push(remainingCandidates[i]);
                    usedWords.add(remainingCandidates[i].word);
                }
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
        
        // Update options and fully reset button states
        const optionButtons = document.querySelectorAll('.option-btn');
        optionButtons.forEach((btn, index) => {
            if (this.currentQuestion.options[index]) {
                const word = this.currentQuestion.options[index].word;
                btn.querySelector('.option-text').textContent = word;
                btn.classList.remove('correct', 'wrong', 'disabled');
                btn.disabled = false;
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '1';
            }
        });
        
        // Hide feedback and buttons for new question
        const feedback = document.getElementById('learn-feedback');
        if (feedback) {
            feedback.classList.add('hidden');
        }
        
        // Hide action buttons until answer is given
        const nextBtn = document.getElementById('next-question-btn');
        if (nextBtn) {
            nextBtn.classList.add('hidden');
        }
        
        const explainBtn = document.getElementById('explain-why-btn');
        if (explainBtn) {
            explainBtn.classList.add('hidden');
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
        
        // Disable all buttons immediately
        const optionButtons = document.querySelectorAll('.option-btn');
        optionButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
        });
        
        // Highlight the clicked option
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
            this.game.soundManager.play('critical');
            
            // Particle effect
            if (this.game.particleSystem) {
                this.game.particleSystem.createExplosion(
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
            this.game.soundManager.play('error');
        }
        
        // Update category stats
        const category = this.currentCategory;
        if (!this.categoryStats[category]) {
            this.categoryStats[category] = { correct: 0, total: 0 };
        }
        this.categoryStats[category].total++;
        if (isCorrect) {
            this.categoryStats[category].correct++;
            // Add to learned terms
            if (!this.learnedTerms.includes(this.currentQuestion.correctWord)) {
                this.learnedTerms.push(this.currentQuestion.correctWord);
                this.updateTermsSidebar();
                
                // Save to localStorage
                const learnedData = JSON.parse(localStorage.getItem('learnedTerms') || '{}');
                learnedData[this.currentQuestion.correctWord] = true;
                localStorage.setItem('learnedTerms', JSON.stringify(learnedData));
            }
        }
        
        this.updateStatsDisplay();
        
        // Show next question and explain why buttons
        const nextBtn = document.getElementById('next-question-btn');
        console.log('Next button found:', nextBtn, 'Hidden class:', nextBtn?.classList.contains('hidden'));
        if (nextBtn) {
            nextBtn.classList.remove('hidden');
            console.log('Removed hidden from next button');
        }
        
        const explainBtn = document.getElementById('explain-why-btn');
        console.log('Explain button found:', explainBtn, 'Hidden class:', explainBtn?.classList.contains('hidden'));
        if (explainBtn) {
            explainBtn.classList.remove('hidden');
            console.log('Removed hidden from explain button');
        }
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
    
    updateTermsSidebar() {
        // Update learned terms list
        const learnedList = document.getElementById('learned-terms-list');
        if (learnedList) {
            if (this.learnedTerms.length === 0) {
                learnedList.innerHTML = '<li>Start answering questions!</li>';
            } else {
                learnedList.innerHTML = this.learnedTerms
                    .map(term => `<li>${term}</li>`)
                    .join('');
            }
        }
        
        // Update unlearned terms list
        const unlearnedList = document.getElementById('unlearned-terms-list');
        if (unlearnedList) {
            const unlearnedTerms = this.availableTerms.filter(
                term => !this.learnedTerms.includes(term)
            );
            
            if (unlearnedTerms.length === 0) {
                unlearnedList.innerHTML = '<li>🎉 All terms learned!</li>';
            } else {
                unlearnedList.innerHTML = unlearnedTerms
                    .slice(0, 50) // Limit to first 50 to avoid performance issues
                    .map(term => `<li>${term}</li>`)
                    .join('');
                
                if (unlearnedTerms.length > 50) {
                    unlearnedList.innerHTML += `<li style="color: var(--accent-color); font-style: italic;">...and ${unlearnedTerms.length - 50} more</li>`;
                }
            }
        }
    }
    
    showExplanation() {
        if (!this.currentQuestion) return;
        
        const word = this.currentQuestion.correctWord;
        const definition = this.currentQuestion.definition;
        const glossary = window.TECH_GLOSSARY || {};
        const relatedTerms = glossary[word]?.related || [];
        const category = this.currentQuestion.category;
        
        // Create intelligent explanation based on context
        let explanation = `✓ The correct answer is "${word}".\n\n`;
        
        // Add contextual explanation based on category and related terms
        explanation += this.generateContextualExplanation(word, definition, category, relatedTerms);
        
        // Show in feedback area
        const feedback = document.getElementById('learn-feedback');
        const text = feedback.querySelector('.feedback-text');
        const icon = feedback.querySelector('.feedback-icon');
        
        if (feedback && text && icon) {
            feedback.classList.remove('hidden', 'correct', 'wrong');
            feedback.classList.add('correct');
            icon.textContent = '💡';
            text.innerHTML = explanation.replace(/\n/g, '<br>');
        }
    }
    
    generateContextualExplanation(word, definition, category, relatedTerms) {
        let explanation = '';
        
        // Category-specific context
        const categoryContext = {
            'security': `🛡️ In cybersecurity, "${word}" is crucial for understanding threats and protection mechanisms. `,
            'networking': `🌐 This networking concept "${word}" is fundamental to how data travels across the internet. `,
            'fundamentals': `💻 "${word}" is a core computing concept that forms the foundation of modern technology. `,
            'hardware': `🔧 Understanding "${word}" helps you grasp how physical computer components work together. `,
            'datastructures': `📊 "${word}" is a way programmers organize and store data efficiently. `,
            'ai': `🤖 In artificial intelligence and machine learning, "${word}" plays a key role in how systems learn and adapt. `,
            'web': `🌍 "${word}" is essential for building and understanding modern web applications. `,
            'cyberpunk': `⚡ This term "${word}" represents the intersection of technology and digital culture. `,
            'system': `⚙️ "${word}" is a system-level concept that affects how operating systems function. `,
            'programming': `👨‍💻 "${word}" is a programming concept developers use to write efficient code. `,
            'data': `📈 "${word}" relates to how we manage, analyze, and extract value from information. `,
            'graphics': `🎨 In computer graphics, "${word}" helps create visual content and rendering. `,
            'tools': `🔨 "${word}" is a tool or utility that developers and engineers use in their workflow. `
        };
        
        explanation += categoryContext[category] || `📖 "${word}" is an important technical concept. `;
        explanation += `${definition}.\n\n`;
        
        // Add real-world context based on the term
        if (relatedTerms.length > 0) {
            explanation += `🔗 This concept connects to: ${relatedTerms.slice(0, 3).join(', ')}. `;
            explanation += `Understanding these relationships helps you see how different technologies work together.\n\n`;
        }
        
        // Add practical insight
        const practicalInsights = {
            'security': 'Security professionals encounter this daily when protecting systems from threats.',
            'networking': 'Network engineers use this when designing and troubleshooting network infrastructure.',
            'fundamentals': 'This is foundational knowledge for anyone pursuing a career in technology.',
            'ai': 'Data scientists and ML engineers apply this when building intelligent systems.',
            'web': 'Web developers implement this when creating interactive online experiences.',
            'programming': 'Software engineers leverage this when solving complex coding challenges.'
        };
        
        if (practicalInsights[category]) {
            explanation += `💼 ${practicalInsights[category]}\n\n`;
        }
        
        explanation += `🎯 Category: ${category}`;
        
        return explanation;
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
