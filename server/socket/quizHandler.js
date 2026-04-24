/**
 * Quiz Socket Handler
 * Server-authoritative quiz that determines who goes first in combat.
 */

const QUESTION_TIME = 15; // seconds per question

// ── Question generator ────────────────────────────────────────────────────────

/**
 * Shuffle an array in place (Fisher-Yates).
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick a random integer in [min, max] (inclusive).
 */
function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Build 3 distractor options that are distinct from the correct answer
 * and from each other.  Distractors stay within ±5 but never equal correct.
 */
function buildOptions(correct) {
  const distractors = new Set();
  // Try nearby values first; fall back to random range if needed.
  const candidates = [];
  for (let d = 1; d <= 10; d++) {
    candidates.push(correct + d, correct - d);
  }
  shuffle(candidates);

  for (const c of candidates) {
    if (c !== correct && !distractors.has(c)) {
      distractors.add(c);
      if (distractors.size === 3) break;
    }
  }

  const all = [correct, ...distractors];
  return shuffle(all);
}

/**
 * Question generators per learning goal code.
 * Each returns { question, correctAnswer, code }.
 */
const GENERATORS = {
  add_0_100: () => {
    const a = rnd(1, 50), b = rnd(1, 50);
    return { question: `${a} + ${b}`, correctAnswer: a + b, code: 'add_0_100' };
  },
  sub_0_100: () => {
    const a = rnd(10, 50), b = rnd(1, a);
    return { question: `${a} − ${b}`, correctAnswer: a - b, code: 'sub_0_100' };
  },
  mul_table_2_12: () => {
    const a = rnd(2, 12), b = rnd(2, 12);
    return { question: `${a} × ${b}`, correctAnswer: a * b, code: 'mul_table_2_12' };
  },
  div_table_2_12: () => {
    const b = rnd(2, 12), answer = rnd(2, 12);
    return { question: `${b * answer} ÷ ${b}`, correctAnswer: answer, code: 'div_table_2_12' };
  },
};

const SUPPORTED_CODES = Object.keys(GENERATORS);
const DEFAULT_GOALS = SUPPORTED_CODES.map(code => ({ code, weight: 1.0 }));

/**
 * Pick a goal code based on weighted random selection.
 * Goals with unknown codes are filtered out.
 */
function pickWeightedCode(goals) {
  const valid = goals.filter(g => SUPPORTED_CODES.includes(g.code));
  if (valid.length === 0) return SUPPORTED_CODES[rnd(0, SUPPORTED_CODES.length - 1)];

  const total = valid.reduce((s, g) => s + (g.weight || 1), 0);
  let r = Math.random() * total;
  for (const g of valid) {
    r -= (g.weight || 1);
    if (r <= 0) return g.code;
  }
  return valid[0].code;
}

/**
 * Generate `count` math questions, optionally weighted by learningGoals.
 * @param {number} count
 * @param {Array<{code: string, weight?: number}>} [learningGoals]
 * @returns {{ id: number, question: string, correctAnswer: number, options: number[], code: string }[]}
 */
function generateQuestions(count = 5, learningGoals = null) {
  const goals = (learningGoals && learningGoals.length > 0) ? learningGoals : DEFAULT_GOALS;
  const questions = [];

  for (let i = 0; i < count; i++) {
    const code = pickWeightedCode(goals);
    const { question, correctAnswer } = GENERATORS[code]();
    questions.push({
      id: i + 1,
      question,
      correctAnswer,
      options: buildOptions(correctAnswer),
      code,
    });
  }

  return questions;
}

// ── Quiz session state ────────────────────────────────────────────────────────

/**
 * @type {Map<string, {
 *   questions: Array,
 *   currentIndex: number,
 *   scores: Map<string, {userId: string, username: string, correct: number, wrong: number, score: number, totalTime: number}>,
 *   questionStartedAt: number,
 *   timer: NodeJS.Timeout|null
 * }>}
 */
const quizSessions = new Map();

/**
 * Advance to the next question or end the quiz.
 */
function advanceQuestion(io, roomCode) {
  const session = quizSessions.get(roomCode);
  if (!session) return;

  // Clear existing timer
  if (session.timer) {
    clearTimeout(session.timer);
    session.timer = null;
  }

  session.currentIndex++;

  if (session.currentIndex >= session.questions.length) {
    finishQuiz(io, roomCode);
    return;
  }

  const q = session.questions[session.currentIndex];
  session.questionStartedAt = Date.now();

  io.to(roomCode).emit('quiz:question', {
    number: session.currentIndex + 1,
    total: session.questions.length,
    question: q.question,
    options: q.options,
    code: q.code,
    timeLimit: QUESTION_TIME
  });

  // Server-side auto-advance timer
  session.timer = setTimeout(() => {
    advanceQuestion(io, roomCode);
  }, QUESTION_TIME * 1000);
}

/**
 * End the quiz, compute winner and emit quiz:complete.
 */
function finishQuiz(io, roomCode) {
  const session = quizSessions.get(roomCode);
  if (!session) return;

  if (session.timer) {
    clearTimeout(session.timer);
    session.timer = null;
  }

  // Build ranked scores array
  const scoresArr = [];
  session.scores.forEach((s) => {
    scoresArr.push({
      userId: s.userId,
      username: s.username,
      correct: s.correct,
      wrong: s.wrong,
      score: s.score,
      totalTime: s.totalTime,
      perGoal: s.perGoal || {}
    });
  });

  // Sort: highest score first, then fastest totalTime as tiebreaker
  scoresArr.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.totalTime - b.totalTime;
  });

  const winnerUserId = scoresArr.length > 0 ? scoresArr[0].userId : null;

  io.to(roomCode).emit('quiz:complete', {
    scores: scoresArr,
    winnerUserId
  });

  // Clean up
  quizSessions.delete(roomCode);
}

// ── Setup handlers ────────────────────────────────────────────────────────────

/**
 * Setup quiz socket event handlers.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function setupQuizHandlers(io, socket) {

  // Client emits quiz:start to kick off the quiz for its room
  socket.on('quiz:start', (data) => {
    const { roomCode, learningGoals } = data;
    if (!roomCode) return;

    // Only one session per room
    if (quizSessions.has(roomCode)) {
      // Room already has a running session — send the current question again
      // so late-joiners can catch up (idempotent).
      const session = quizSessions.get(roomCode);
      const q = session.questions[session.currentIndex];
      const elapsed = (Date.now() - session.questionStartedAt) / 1000;
      const timeLeft = Math.max(0, Math.round(QUESTION_TIME - elapsed));

      socket.emit('quiz:question', {
        number: session.currentIndex + 1,
        total: session.questions.length,
        question: q.question,
        options: q.options,
        timeLimit: timeLeft
      });
      return;
    }

    // Resolve userId and username from socket data (set by roomHandler on join)
    const userId = socket.userId || socket.id;
    const username = socket.assignedName || socket.playerName || 'Spiller';

    // Build a fresh session — questions follow learningGoals if provided
    const questions = generateQuestions(5, learningGoals);
    const scores = new Map();

    // Add the triggering player; others join as they emit quiz:start
    scores.set(socket.id, {
      userId,
      username,
      correct: 0,
      wrong: 0,
      score: 0,
      totalTime: 0
    });

    const session = {
      questions,
      currentIndex: 0,
      scores,
      questionStartedAt: Date.now(),
      timer: null
    };

    quizSessions.set(roomCode, session);

    // Make sure this socket is in the room channel
    socket.join(roomCode);

    // Broadcast first question to everyone in the room
    const q = questions[0];
    io.to(roomCode).emit('quiz:question', {
      number: 1,
      total: questions.length,
      question: q.question,
      options: q.options,
      timeLimit: QUESTION_TIME
    });

    // Auto-advance timer
    session.timer = setTimeout(() => {
      advanceQuestion(io, roomCode);
    }, QUESTION_TIME * 1000);

    console.log(`[Quiz] Session started for room ${roomCode}`);
  });

  // Client emits quiz:answer when a player picks an option
  socket.on('quiz:answer', (data) => {
    const { answer, roomCode } = data;
    if (!roomCode || answer === undefined) return;

    const session = quizSessions.get(roomCode);
    if (!session) return;

    const q = session.questions[session.currentIndex];

    // Ensure player exists in scores (handles players who joined after quiz:start)
    if (!session.scores.has(socket.id)) {
      const userId = socket.userId || socket.id;
      const username = socket.assignedName || socket.playerName || 'Spiller';
      session.scores.set(socket.id, {
        userId,
        username,
        correct: 0,
        wrong: 0,
        score: 0,
        totalTime: 0,
        perGoal: {}
      });
    }

    const playerScore = session.scores.get(socket.id);
    if (!playerScore.perGoal) playerScore.perGoal = {};

    // Only accept first answer per player per question
    if (playerScore.lastAnsweredIndex === session.currentIndex) return;
    playerScore.lastAnsweredIndex = session.currentIndex;

    const responseTime = (Date.now() - session.questionStartedAt) / 1000;
    playerScore.totalTime += responseTime;

    // Init per-goal entry on first encounter
    if (!playerScore.perGoal[q.code]) {
      playerScore.perGoal[q.code] = { correct: 0, total: 0 };
    }
    playerScore.perGoal[q.code].total += 1;

    if (answer === q.correctAnswer) {
      playerScore.correct++;
      playerScore.score++;
      playerScore.perGoal[q.code].correct += 1;
    } else {
      playerScore.wrong++;
      playerScore.score = Math.max(0, playerScore.score - 1);
    }
  });

  console.log(`[Quiz] Handlers registered for socket ${socket.id}`);
}

// ── Cleanup helper (called by other handlers) ─────────────────────────────────

function cleanupQuizSession(roomCode) {
  const session = quizSessions.get(roomCode);
  if (session && session.timer) {
    clearTimeout(session.timer);
  }
  quizSessions.delete(roomCode);
}

// ── Legacy helpers (kept so existing imports don't break) ─────────────────────

function initializeQuizSession() {}
function getQuizResults(roomCode) { return quizSessions.get(roomCode) || null; }

module.exports = {
  setupQuizHandlers,
  generateQuestions,          // exported for testing
  cleanupQuizSession,
  initializeQuizSession,
  getQuizResults
};
