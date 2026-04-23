/**
 * Quiz Routes
 * Get quiz questions and save attempts
 */

const express = require('express');
const router = express.Router();
const {
    getRandomQuizQuestions,
    createQuizAttempt,
    getQuizStatsByUser,
    getQuizStatsAllStudents
} = require('../services/supabaseService');

/**
 * GET /api/quiz/random
 * Get random quiz questions
 *
 * Query params:
 *   - topic: 'division' | 'brøker' | 'geometri' | 'problemregning' | 'all' (default: 'all')
 *   - count: number of questions (default: 5, max: 15)
 *
 * Returns: { success: boolean, questions: [...] }
 */
router.get('/random', async (req, res) => {
    try {
        const { topic = 'all', count = '5' } = req.query;
        const questionCount = Math.min(parseInt(count) || 5, 15);

        // Validate topic
        const validTopics = ['division', 'brøker', 'geometri', 'problemregning', 'all', 'blandet'];
        if (!validTopics.includes(topic)) {
            return res.status(400).json({
                success: false,
                message: `Invalid topic. Must be one of: ${validTopics.join(', ')}`
            });
        }

        const questions = await getRandomQuizQuestions(topic, questionCount);

        // Remove correct answer from response (client shouldn't know yet)
        const sanitizedQuestions = questions.map(q => ({
            id: q.id,
            topic: q.topic,
            question: q.question,
            options: q.options,
            difficulty: q.difficulty
            // correctAnswer omitted!
        }));

        res.json({
            success: true,
            questions: sanitizedQuestions,
            count: sanitizedQuestions.length,
            topic: topic
        });

    } catch (error) {
        console.error('Get quiz questions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quiz questions',
            error: error.message
        });
    }
});

/**
 * POST /api/quiz/attempt
 * Save a quiz attempt
 *
 * Body: {
 *   userId: string,
 *   questionId: string,
 *   answerGiven: number (0-3),
 *   correctAnswer: number (0-3),
 *   timeSpent: number (seconds),
 *   matchId?: string (optional)
 * }
 *
 * Returns: { success: boolean, attempt: {...}, isCorrect: boolean }
 */
router.post('/attempt', async (req, res) => {
    try {
        const {
            userId,
            questionId,
            answerGiven,
            correctAnswer,
            timeSpent,
            matchId = null
        } = req.body;

        // Validation
        if (!userId || !questionId) {
            return res.status(400).json({
                success: false,
                message: 'userId and questionId are required'
            });
        }

        if (typeof answerGiven !== 'number' || answerGiven < 0 || answerGiven > 3) {
            return res.status(400).json({
                success: false,
                message: 'answerGiven must be a number between 0 and 3'
            });
        }

        if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer > 3) {
            return res.status(400).json({
                success: false,
                message: 'correctAnswer must be a number between 0 and 3'
            });
        }

        // Determine if answer is correct
        const isCorrect = answerGiven === correctAnswer;

        // Save attempt
        const attempt = await createQuizAttempt(
            userId,
            questionId,
            answerGiven,
            isCorrect,
            timeSpent || null,
            matchId
        );

        res.status(201).json({
            success: true,
            attempt: {
                id: attempt.id,
                isCorrect: attempt.is_correct,
                timeSpent: attempt.time_spent,
                createdAt: attempt.created_at
            },
            isCorrect: isCorrect
        });

    } catch (error) {
        console.error('Save quiz attempt error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save quiz attempt',
            error: error.message
        });
    }
});

/**
 * GET /api/quiz/stats/:userId
 * Get quiz statistics for a specific user
 *
 * Returns: { success: boolean, stats: {...} }
 */
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const attempts = await getQuizStatsByUser(userId);

        // Calculate overall stats
        const totalAttempts = attempts.length;
        const correctAttempts = attempts.filter(a => a.is_correct).length;
        const accuracy = totalAttempts > 0
            ? Math.round((correctAttempts / totalAttempts) * 100)
            : 0;

        // Stats by topic
        const topicStats = {};
        attempts.forEach(attempt => {
            const topic = attempt.quiz_questions.topic;

            if (!topicStats[topic]) {
                topicStats[topic] = {
                    total: 0,
                    correct: 0,
                    accuracy: 0
                };
            }

            topicStats[topic].total++;
            if (attempt.is_correct) {
                topicStats[topic].correct++;
            }
        });

        // Calculate accuracy per topic
        Object.keys(topicStats).forEach(topic => {
            const stats = topicStats[topic];
            stats.accuracy = Math.round((stats.correct / stats.total) * 100);
        });

        // Recent attempts
        const recentAttempts = attempts.slice(0, 10).map(a => ({
            questionId: a.question_id,
            topic: a.quiz_questions.topic,
            difficulty: a.quiz_questions.difficulty,
            isCorrect: a.is_correct,
            timeSpent: a.time_spent,
            createdAt: a.created_at
        }));

        res.json({
            success: true,
            stats: {
                overall: {
                    totalAttempts,
                    correctAttempts,
                    incorrectAttempts: totalAttempts - correctAttempts,
                    accuracy
                },
                byTopic: topicStats,
                recentAttempts
            }
        });

    } catch (error) {
        console.error('Get quiz stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quiz stats',
            error: error.message
        });
    }
});

/**
 * GET /api/quiz/teacher/stats
 * Get aggregated quiz stats for all students (teacher dashboard)
 *
 * Returns: { success: boolean, stats: {...} }
 */
router.get('/teacher/stats', async (req, res) => {
    try {
        const { getUserById } = require('../services/supabaseService');
        const allAttempts = await getQuizStatsAllStudents();

        // Aggregate by user
        const userStats = {};
        allAttempts.forEach(attempt => {
            const userId = attempt.user_id;

            if (!userStats[userId]) {
                userStats[userId] = {
                    userId,
                    username: null, // Will be populated below
                    total: 0,
                    correct: 0,
                    byTopic: {}
                };
            }

            userStats[userId].total++;
            if (attempt.is_correct) {
                userStats[userId].correct++;
            }

            // By topic
            const topic = attempt.quiz_questions.topic;
            if (!userStats[userId].byTopic[topic]) {
                userStats[userId].byTopic[topic] = { total: 0, correct: 0 };
            }
            userStats[userId].byTopic[topic].total++;
            if (attempt.is_correct) {
                userStats[userId].byTopic[topic].correct++;
            }
        });

        // Fetch usernames for all students
        const userStatsArray = Object.values(userStats);
        await Promise.all(
            userStatsArray.map(async (user) => {
                try {
                    const userData = await getUserById(user.userId);
                    user.username = userData.username;
                } catch (error) {
                    console.error(`Error fetching username for ${user.userId}:`, error);
                    user.username = 'Ukendt';
                }
            })
        );

        // Calculate accuracies
        userStatsArray.forEach(user => {
            user.accuracy = user.total > 0
                ? Math.round((user.correct / user.total) * 100)
                : 0;

            Object.values(user.byTopic).forEach(topicData => {
                topicData.accuracy = topicData.total > 0
                    ? Math.round((topicData.correct / topicData.total) * 100)
                    : 0;
            });
        });

        // Overall stats
        const totalAttempts = allAttempts.length;
        const correctAttempts = allAttempts.filter(a => a.is_correct).length;
        const overallAccuracy = totalAttempts > 0
            ? Math.round((correctAttempts / totalAttempts) * 100)
            : 0;

        // Stats by topic (class-wide)
        const topicStats = {};
        allAttempts.forEach(attempt => {
            const topic = attempt.quiz_questions.topic;
            if (!topicStats[topic]) {
                topicStats[topic] = { total: 0, correct: 0, accuracy: 0 };
            }
            topicStats[topic].total++;
            if (attempt.is_correct) {
                topicStats[topic].correct++;
            }
        });

        Object.keys(topicStats).forEach(topic => {
            const stats = topicStats[topic];
            stats.accuracy = Math.round((stats.correct / stats.total) * 100);
        });

        res.json({
            success: true,
            stats: {
                overall: {
                    totalAttempts,
                    correctAttempts,
                    accuracy: overallAccuracy,
                    uniqueStudents: Object.keys(userStats).length
                },
                byTopic: topicStats,
                byUser: userStatsArray
            }
        });

    } catch (error) {
        console.error('Get teacher stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch teacher stats',
            error: error.message
        });
    }
});

module.exports = router;
