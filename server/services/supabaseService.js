/**
 * Supabase Service Layer
 * Wrapper functions for database queries with error handling
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
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
    const sb = getSupabase();

    const { data, error } = await sb
        .from('users')
        .insert([{ username, role }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function getUserById(userId) {
    const sb = getSupabase();

    const { data, error } = await sb
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
}

async function getUserByUsername(username) {
    const sb = getSupabase();

    const { data, error } = await sb
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (error) throw error;
    return data;
}

async function getAllUsers() {
    const sb = getSupabase();

    const { data, error } = await sb
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

async function updateUserStats(userId, stats) {
    const sb = getSupabase();

    const { data, error } = await sb
        .from('users')
        .update(stats)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function updateUserRating(userId, newRating) {
    const sb = getSupabase();

    const { data, error } = await sb
        .from('users')
        .update({
            rating: newRating,
            last_played_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// =====================================================
// LEADERBOARD QUERIES
// =====================================================

async function getLeaderboard(limit = 20) {
    const sb = getSupabase();

    const { data, error } = await sb
        .from('users')
        .select('id, username, rating, matches_played, matches_won, total_kills, total_damage, created_at')
        .eq('role', 'student')
        .order('rating', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

// =====================================================
// QUIZ QUERIES
// =====================================================

async function getRandomQuizQuestions(topic, count = 5) {
    const sb = getSupabase();

    let query = sb
        .from('quiz_questions')
        .select('*');

    // Filter by topic if specified (or get all if 'all')
    if (topic && topic !== 'all' && topic !== 'blandet') {
        query = query.eq('topic', topic);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Randomly shuffle and take count
    const shuffled = data.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

async function getQuizQuestionById(questionId) {
    const sb = getSupabase();

    const { data, error } = await sb
        .from('quiz_questions')
        .select('*')
        .eq('id', questionId)
        .single();

    if (error) throw error;
    return data;
}

async function createQuizAttempt(userId, questionId, answerGiven, isCorrect, timeSpent, matchId = null) {
    const sb = getSupabase();

    const { data, error } = await sb
        .from('quiz_attempts')
        .insert([{
            user_id: userId,
            question_id: questionId,
            answer_given: answerGiven,
            is_correct: isCorrect,
            time_spent: timeSpent,
            match_id: matchId
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function getQuizStatsByUser(userId) {
    const sb = getSupabase();

    // Get all attempts with question info
    const { data, error } = await sb
        .from('quiz_attempts')
        .select(`
            *,
            quiz_questions (
                topic,
                difficulty
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

async function getQuizStatsAllStudents() {
    const sb = getSupabase();

    // Get aggregated stats per user
    const { data, error } = await sb
        .from('quiz_attempts')
        .select(`
            user_id,
            is_correct,
            quiz_questions (
                topic
            )
        `);

    if (error) throw error;
    return data;
}

// =====================================================
// MATCH QUERIES
// =====================================================

async function createMatch(matchType, durationSeconds = null, totalTurns = null) {
    const sb = getSupabase();

    const { data, error } = await sb
        .from('match_results')
        .insert([{
            match_type: matchType,
            duration_seconds: durationSeconds,
            total_turns: totalTurns,
            ended_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function addMatchParticipant(matchId, userId, teamId, placement, stats, ratingChanges) {
    const sb = getSupabase();

    const { data, error } = await sb
        .from('match_participants')
        .insert([{
            match_id: matchId,
            user_id: userId,
            team_id: teamId,
            placement: placement,
            kills: stats.kills || 0,
            damage_dealt: stats.damage || 0,
            turns_taken: stats.turns || 0,
            rating_before: ratingChanges.before,
            rating_after: ratingChanges.after,
            rating_change: ratingChanges.change
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function addMatchTeam(matchId, teamId, teamName, teamColor, won, stats) {
    const sb = getSupabase();

    const { data, error } = await sb
        .from('match_teams')
        .insert([{
            match_id: matchId,
            team_id: teamId,
            team_name: teamName,
            team_color: teamColor,
            won: won,
            total_kills: stats.kills || 0,
            total_damage: stats.damage || 0
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function getMatchHistory(userId, limit = 10) {
    const sb = getSupabase();

    const { data, error } = await sb
        .from('match_participants')
        .select(`
            *,
            match_results (
                match_type,
                created_at,
                duration_seconds
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

async function getMatchDetails(matchId) {
    const sb = getSupabase();

    // Get match info
    const { data: match, error: matchError } = await sb
        .from('match_results')
        .select('*')
        .eq('id', matchId)
        .single();

    if (matchError) throw matchError;

    // Get participants
    const { data: participants, error: participantsError } = await sb
        .from('match_participants')
        .select(`
            *,
            users (
                username,
                rating
            )
        `)
        .eq('match_id', matchId)
        .order('placement', { ascending: true });

    if (participantsError) throw participantsError;

    // Get teams if applicable
    let teams = null;
    if (match.match_type !== 'ffa') {
        const { data: teamsData, error: teamsError } = await sb
            .from('match_teams')
            .select('*')
            .eq('match_id', matchId)
            .order('team_id', { ascending: true });

        if (teamsError) throw teamsError;
        teams = teamsData;
    }

    return {
        match,
        participants,
        teams
    };
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
