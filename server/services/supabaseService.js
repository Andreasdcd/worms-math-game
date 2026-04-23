/**
 * Supabase Service Layer
 * Wrapper functions for database queries with error handling
 * Falls back to in-memory store when Supabase credentials are not configured
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// =====================================================
// IN-MEMORY FALLBACK STORE
// =====================================================

const memStore = {
    users: new Map(),
    quizQuestions: [
        { id: '1', topic: 'addition', difficulty: 'easy', question: 'Hvad er 5 + 3?', correct_answer: '8', wrong_answers: ['6', '7', '9'] },
        { id: '2', topic: 'addition', difficulty: 'easy', question: 'Hvad er 12 + 7?', correct_answer: '19', wrong_answers: ['17', '18', '20'] },
        { id: '3', topic: 'subtraktion', difficulty: 'easy', question: 'Hvad er 10 - 4?', correct_answer: '6', wrong_answers: ['5', '7', '8'] },
        { id: '4', topic: 'subtraktion', difficulty: 'easy', question: 'Hvad er 15 - 6?', correct_answer: '9', wrong_answers: ['7', '8', '10'] },
        { id: '5', topic: 'multiplikation', difficulty: 'medium', question: 'Hvad er 6 × 7?', correct_answer: '42', wrong_answers: ['36', '48', '54'] },
        { id: '6', topic: 'multiplikation', difficulty: 'medium', question: 'Hvad er 8 × 9?', correct_answer: '72', wrong_answers: ['63', '64', '81'] },
        { id: '7', topic: 'division', difficulty: 'medium', question: 'Hvad er 48 ÷ 6?', correct_answer: '8', wrong_answers: ['6', '7', '9'] },
        { id: '8', topic: 'division', difficulty: 'medium', question: 'Hvad er 56 ÷ 7?', correct_answer: '8', wrong_answers: ['6', '7', '9'] },
        { id: '9', topic: 'addition', difficulty: 'medium', question: 'Hvad er 37 + 45?', correct_answer: '82', wrong_answers: ['80', '81', '83'] },
        { id: '10', topic: 'subtraktion', difficulty: 'medium', question: 'Hvad er 100 - 37?', correct_answer: '63', wrong_answers: ['62', '64', '73'] },
    ]
};

const useMemStore = !process.env.SUPABASE_URL || !process.env.SUPABASE_KEY;

// =====================================================
// SUPABASE INIT
// =====================================================

let supabase = null;

function initSupabase() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
        throw new Error('Supabase credentials not found in environment variables');
    }

    supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
    );

    return supabase;
}

function getSupabase() {
    if (!supabase) {
        return initSupabase();
    }
    return supabase;
}

// =====================================================
// USER QUERIES
// =====================================================

async function createUser(username, role = 'student') {
    if (useMemStore) {
        for (const u of memStore.users.values()) {
            if (u.username.toLowerCase() === username.toLowerCase()) {
                const err = new Error('Username already exists'); err.code = '23505'; throw err;
            }
        }
        const user = {
            id: uuidv4(), username, role,
            rating: 0, matches_played: 0, matches_won: 0,
            total_kills: 0, total_damage: 0,
            created_at: new Date().toISOString()
        };
        memStore.users.set(user.id, user);
        return user;
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('users').insert([{ username, role }]).select().single();
    if (error) throw error;
    return data;
}

async function getUserById(userId) {
    if (useMemStore) {
        return memStore.users.get(userId) || null;
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('users').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
}

async function getUserByUsername(username) {
    if (useMemStore) {
        for (const u of memStore.users.values()) {
            if (u.username.toLowerCase() === username.toLowerCase()) return u;
        }
        return null;
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('users').select('*').eq('username', username).single();
    if (error) throw error;
    return data;
}

async function getAllUsers() {
    if (useMemStore) {
        return [...memStore.users.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

async function updateUserStats(userId, stats) {
    if (useMemStore) {
        const user = memStore.users.get(userId);
        if (!user) throw new Error('User not found');
        Object.assign(user, stats);
        return user;
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('users').update(stats).eq('id', userId).select().single();
    if (error) throw error;
    return data;
}

async function updateUserRating(userId, newRating) {
    if (useMemStore) {
        const user = memStore.users.get(userId);
        if (!user) throw new Error('User not found');
        user.rating = newRating;
        user.last_played_at = new Date().toISOString();
        return user;
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('users').update({ rating: newRating, last_played_at: new Date().toISOString() }).eq('id', userId).select().single();
    if (error) throw error;
    return data;
}

// =====================================================
// LEADERBOARD QUERIES
// =====================================================

async function getLeaderboard(limit = 20) {
    if (useMemStore) {
        return [...memStore.users.values()]
            .filter(u => u.role === 'student')
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit)
            .map(u => ({ id: u.id, username: u.username, rating: u.rating, matches_played: u.matches_played, matches_won: u.matches_won, total_kills: u.total_kills, total_damage: u.total_damage, created_at: u.created_at }));
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('users').select('id, username, rating, matches_played, matches_won, total_kills, total_damage, created_at').eq('role', 'student').order('rating', { ascending: false }).limit(limit);
    if (error) throw error;
    return data;
}

// =====================================================
// QUIZ QUERIES
// =====================================================

async function getRandomQuizQuestions(topic, count = 5) {
    if (useMemStore) {
        let questions = memStore.quizQuestions;
        if (topic && topic !== 'all' && topic !== 'blandet') {
            questions = questions.filter(q => q.topic === topic);
        }
        return questions.sort(() => Math.random() - 0.5).slice(0, count);
    }

    const sb = getSupabase();
    let query = sb.from('quiz_questions').select('*');
    if (topic && topic !== 'all' && topic !== 'blandet') {
        query = query.eq('topic', topic);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data.sort(() => Math.random() - 0.5).slice(0, count);
}

async function getQuizQuestionById(questionId) {
    if (useMemStore) {
        return memStore.quizQuestions.find(q => q.id === questionId) || null;
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('quiz_questions').select('*').eq('id', questionId).single();
    if (error) throw error;
    return data;
}

async function createQuizAttempt(userId, questionId, answerGiven, isCorrect, timeSpent, matchId = null) {
    if (useMemStore) {
        return { id: uuidv4(), user_id: userId, question_id: questionId, answer_given: answerGiven, is_correct: isCorrect, time_spent: timeSpent, match_id: matchId, created_at: new Date().toISOString() };
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('quiz_attempts').insert([{ user_id: userId, question_id: questionId, answer_given: answerGiven, is_correct: isCorrect, time_spent: timeSpent, match_id: matchId }]).select().single();
    if (error) throw error;
    return data;
}

async function getQuizStatsByUser(userId) {
    if (useMemStore) return [];

    const sb = getSupabase();
    const { data, error } = await sb.from('quiz_attempts').select('*, quiz_questions(topic, difficulty)').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

async function getQuizStatsAllStudents() {
    if (useMemStore) return [];

    const sb = getSupabase();
    const { data, error } = await sb.from('quiz_attempts').select('user_id, is_correct, quiz_questions(topic)');
    if (error) throw error;
    return data;
}

// =====================================================
// MATCH QUERIES
// =====================================================

async function createMatch(matchType, durationSeconds = null, totalTurns = null) {
    if (useMemStore) {
        return { id: uuidv4(), match_type: matchType, duration_seconds: durationSeconds, total_turns: totalTurns, ended_at: new Date().toISOString(), created_at: new Date().toISOString() };
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('match_results').insert([{ match_type: matchType, duration_seconds: durationSeconds, total_turns: totalTurns, ended_at: new Date().toISOString() }]).select().single();
    if (error) throw error;
    return data;
}

async function addMatchParticipant(matchId, userId, teamId, placement, stats, ratingChanges) {
    if (useMemStore) {
        return { id: uuidv4(), match_id: matchId, user_id: userId, team_id: teamId, placement, kills: stats.kills || 0, damage_dealt: stats.damage || 0, turns_taken: stats.turns || 0, rating_before: ratingChanges.before, rating_after: ratingChanges.after, rating_change: ratingChanges.change };
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('match_participants').insert([{ match_id: matchId, user_id: userId, team_id: teamId, placement, kills: stats.kills || 0, damage_dealt: stats.damage || 0, turns_taken: stats.turns || 0, rating_before: ratingChanges.before, rating_after: ratingChanges.after, rating_change: ratingChanges.change }]).select().single();
    if (error) throw error;
    return data;
}

async function addMatchTeam(matchId, teamId, teamName, teamColor, won, stats) {
    if (useMemStore) {
        return { id: uuidv4(), match_id: matchId, team_id: teamId, team_name: teamName, team_color: teamColor, won, total_kills: stats.kills || 0, total_damage: stats.damage || 0 };
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('match_teams').insert([{ match_id: matchId, team_id: teamId, team_name: teamName, team_color: teamColor, won, total_kills: stats.kills || 0, total_damage: stats.damage || 0 }]).select().single();
    if (error) throw error;
    return data;
}

async function getMatchHistory(userId, limit = 10) {
    if (useMemStore) return [];

    const sb = getSupabase();
    const { data, error } = await sb.from('match_participants').select('*, match_results(match_type, created_at, duration_seconds)').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data;
}

async function getMatchDetails(matchId) {
    if (useMemStore) return { match: null, participants: [], teams: [] };

    const sb = getSupabase();
    const { data: match, error: matchError } = await sb.from('match_results').select('*').eq('id', matchId).single();
    if (matchError) throw matchError;

    const { data: participants, error: participantsError } = await sb.from('match_participants').select('*, users(username, rating)').eq('match_id', matchId).order('placement', { ascending: true });
    if (participantsError) throw participantsError;

    let teams = null;
    if (match.match_type !== 'ffa') {
        const { data: teamsData, error: teamsError } = await sb.from('match_teams').select('*').eq('match_id', matchId).order('team_id', { ascending: true });
        if (teamsError) throw teamsError;
        teams = teamsData;
    }

    return { match, participants, teams };
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    initSupabase,
    getSupabase,

    // Users
    createUser,
    getUserById,
    getUserByUsername,
    getAllUsers,
    updateUserStats,
    updateUserRating,

    // Leaderboard
    getLeaderboard,

    // Quiz
    getRandomQuizQuestions,
    getQuizQuestionById,
    createQuizAttempt,
    getQuizStatsByUser,
    getQuizStatsAllStudents,

    // Matches
    createMatch,
    addMatchParticipant,
    addMatchTeam,
    getMatchHistory,
    getMatchDetails
};
