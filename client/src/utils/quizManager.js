/**
 * Quiz Manager
 * Handles quiz logic, question selection, answer validation, and scoring
 */

class QuizManager {
  constructor() {
    this.questions = [];
    this.selectedQuestions = [];
    this.answers = new Map(); // questionId -> answerIndex
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Load questions from server/API
   * @param {Array} questionsData - Array of question objects
   */
  loadQuestions(questionsData) {
    this.questions = questionsData;
    console.log(`Loaded ${this.questions.length} quiz questions`);
  }

  /**
   * Select random questions for the quiz
   * @param {number} count - Number of questions to select (default: 5)
   * @param {string|null} topic - Filter by topic (null = all topics)
   * @returns {Array} - Selected questions
   */
  selectRandomQuestions(count = 5, topic = null) {
    let availableQuestions = this.questions;

    // Filter by topic if specified
    if (topic) {
      availableQuestions = this.questions.filter(q => q.topic === topic);
    }

    // Ensure we don't request more questions than available
    const actualCount = Math.min(count, availableQuestions.length);

    // Shuffle and select
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    this.selectedQuestions = shuffled.slice(0, actualCount);

    // Reset answers and timing
    this.answers.clear();
    this.startTime = Date.now();
    this.endTime = null;

    console.log(`Selected ${this.selectedQuestions.length} questions${topic ? ` (topic: ${topic})` : ''}`);

    return this.selectedQuestions;
  }

  /**
   * Check if an answer is correct
   * @param {string} questionId - Question ID
   * @param {number} answerIndex - Selected answer index (0-3)
   * @returns {boolean} - True if correct
   */
  checkAnswer(questionId, answerIndex) {
    const question = this.selectedQuestions.find(q => q.id === questionId);

    if (!question) {
      console.error(`Question not found: ${questionId}`);
      return false;
    }

    // Store the answer
    this.answers.set(questionId, answerIndex);

    // Check if correct
    const isCorrect = question.correct_answer === answerIndex;

    console.log(`Answer for ${questionId}: ${isCorrect ? 'CORRECT' : 'WRONG'} (selected: ${answerIndex}, correct: ${question.correct_answer})`);

    return isCorrect;
  }

  /**
   * Calculate the current score
   * @returns {number} - Number of correct answers
   */
  calculateScore() {
    let correctCount = 0;

    for (const question of this.selectedQuestions) {
      const userAnswer = this.answers.get(question.id);
      if (userAnswer === question.correct_answer) {
        correctCount++;
      }
    }

    return correctCount;
  }

  /**
   * Get completion time in seconds
   * @returns {number} - Time in seconds (null if not completed)
   */
  getCompletionTime() {
    if (!this.startTime) {
      return null;
    }

    const endTime = this.endTime || Date.now();
    return Math.round((endTime - this.startTime) / 1000);
  }

  /**
   * Mark quiz as completed
   */
  markCompleted() {
    this.endTime = Date.now();
  }

  /**
   * Get quiz results
   * @returns {Object} - Results object with score, time, and details
   */
  getResults() {
    const score = this.calculateScore();
    const totalQuestions = this.selectedQuestions.length;
    const completionTime = this.getCompletionTime();
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    return {
      score,
      totalQuestions,
      percentage,
      completionTime,
      answers: Array.from(this.answers.entries()).map(([questionId, answerIndex]) => {
        const question = this.selectedQuestions.find(q => q.id === questionId);
        return {
          questionId,
          question: question?.question,
          selectedAnswer: answerIndex,
          correctAnswer: question?.correct_answer,
          isCorrect: answerIndex === question?.correct_answer
        };
      })
    };
  }

  /**
   * Get a specific question by ID
   * @param {string} questionId - Question ID
   * @returns {Object|null} - Question object or null
   */
  getQuestion(questionId) {
    return this.selectedQuestions.find(q => q.id === questionId) || null;
  }

  /**
   * Get all selected questions
   * @returns {Array} - Array of selected questions
   */
  getSelectedQuestions() {
    return [...this.selectedQuestions];
  }

  /**
   * Reset the quiz state
   */
  reset() {
    this.selectedQuestions = [];
    this.answers.clear();
    this.startTime = null;
    this.endTime = null;
    console.log('Quiz manager reset');
  }

  /**
   * Get statistics by topic
   * @returns {Object} - Statistics grouped by topic
   */
  getStatsByTopic() {
    const stats = {};

    for (const question of this.selectedQuestions) {
      const topic = question.topic;
      if (!stats[topic]) {
        stats[topic] = {
          total: 0,
          correct: 0,
          percentage: 0
        };
      }

      stats[topic].total++;

      const userAnswer = this.answers.get(question.id);
      if (userAnswer === question.correct_answer) {
        stats[topic].correct++;
      }
    }

    // Calculate percentages
    for (const topic in stats) {
      const { correct, total } = stats[topic];
      stats[topic].percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    }

    return stats;
  }
}

// Export singleton instance
export const quizManager = new QuizManager();

// For testing/development - load sample questions
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // In production, questions will be loaded from API
  // For now, we'll load them when the scene starts
  window.quizManager = quizManager;
}
