/**
 * Validate Quiz Questions
 * Checks JSON format, content quality, and distribution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateQuestions() {
  console.log('Quiz Questions Validation\n');
  console.log('='.repeat(60));

  // Read questions file
  const questionsPath = path.join(__dirname, '../data/quiz_questions.json');

  if (!fs.existsSync(questionsPath)) {
    console.error('ERROR: Questions file not found at:', questionsPath);
    process.exit(1);
  }

  let questions;
  try {
    const data = fs.readFileSync(questionsPath, 'utf-8');
    questions = JSON.parse(data);
  } catch (error) {
    console.error('ERROR: Invalid JSON format:', error.message);
    process.exit(1);
  }

  // Validation results
  const results = {
    total: questions.length,
    valid: 0,
    errors: [],
    warnings: [],
    byTopic: {},
    byGradeLevel: {},
    duplicateIds: []
  };

  // Track IDs for duplicates
  const seenIds = new Set();

  // Validate each question
  questions.forEach((q, index) => {
    const questionNum = index + 1;
    let isValid = true;

    // Check required fields
    if (!q.id) {
      results.errors.push(`Question ${questionNum}: Missing 'id'`);
      isValid = false;
    } else if (seenIds.has(q.id)) {
      results.duplicateIds.push(q.id);
      results.errors.push(`Question ${questionNum}: Duplicate ID '${q.id}'`);
      isValid = false;
    } else {
      seenIds.add(q.id);
    }

    if (!q.subject) {
      results.errors.push(`Question ${questionNum} (${q.id}): Missing 'subject'`);
      isValid = false;
    }

    if (!q.topic) {
      results.errors.push(`Question ${questionNum} (${q.id}): Missing 'topic'`);
      isValid = false;
    }

    if (!q.question) {
      results.errors.push(`Question ${questionNum} (${q.id}): Missing 'question'`);
      isValid = false;
    }

    if (!Array.isArray(q.options)) {
      results.errors.push(`Question ${questionNum} (${q.id}): 'options' must be an array`);
      isValid = false;
    } else if (q.options.length !== 4) {
      results.errors.push(`Question ${questionNum} (${q.id}): Must have exactly 4 options (has ${q.options.length})`);
      isValid = false;
    }

    if (typeof q.correct_answer !== 'number') {
      results.errors.push(`Question ${questionNum} (${q.id}): 'correct_answer' must be a number`);
      isValid = false;
    } else if (q.correct_answer < 0 || q.correct_answer > 3) {
      results.errors.push(`Question ${questionNum} (${q.id}): 'correct_answer' must be 0-3 (is ${q.correct_answer})`);
      isValid = false;
    }

    if (!q.grade_level) {
      results.warnings.push(`Question ${questionNum} (${q.id}): Missing 'grade_level', defaulting to 5`);
    }

    // Quality checks
    if (q.question && q.question.length < 10) {
      results.warnings.push(`Question ${questionNum} (${q.id}): Question text seems too short`);
    }

    if (q.options && q.options.some(opt => !opt || opt.trim() === '')) {
      results.warnings.push(`Question ${questionNum} (${q.id}): Has empty or whitespace-only options`);
    }

    // Count by topic
    if (q.topic) {
      results.byTopic[q.topic] = (results.byTopic[q.topic] || 0) + 1;
    }

    // Count by grade level
    if (q.grade_level) {
      results.byGradeLevel[q.grade_level] = (results.byGradeLevel[q.grade_level] || 0) + 1;
    }

    if (isValid) {
      results.valid++;
    }
  });

  // Print results
  console.log(`\nTotal Questions: ${results.total}`);
  console.log(`Valid Questions: ${results.valid}`);
  console.log(`Invalid Questions: ${results.total - results.valid}`);

  console.log('\n' + '='.repeat(60));
  console.log('DISTRIBUTION BY TOPIC');
  console.log('='.repeat(60));
  Object.entries(results.byTopic)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([topic, count]) => {
      const bar = '█'.repeat(Math.round(count / 3));
      console.log(`${topic.padEnd(20)} ${count.toString().padStart(2)} ${bar}`);
    });

  console.log('\n' + '='.repeat(60));
  console.log('DISTRIBUTION BY GRADE LEVEL');
  console.log('='.repeat(60));
  Object.entries(results.byGradeLevel)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([level, count]) => {
      console.log(`Grade ${level}: ${count} questions`);
    });

  if (results.errors.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('ERRORS');
    console.log('='.repeat(60));
    results.errors.forEach(err => console.log(`❌ ${err}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('WARNINGS');
    console.log('='.repeat(60));
    results.warnings.forEach(warn => console.log(`⚠️  ${warn}`));
  }

  // Check expected distribution
  console.log('\n' + '='.repeat(60));
  console.log('EXPECTED DISTRIBUTION CHECK');
  console.log('='.repeat(60));

  const expectedTopics = {
    'division': 15,
    'broeker': 15,
    'geometri': 15,
    'problemregning': 15
  };

  let distributionOk = true;
  Object.entries(expectedTopics).forEach(([topic, expected]) => {
    const actual = results.byTopic[topic] || 0;
    const status = actual === expected ? '✓' : '✗';
    console.log(`${status} ${topic}: ${actual}/${expected}`);
    if (actual !== expected) {
      distributionOk = false;
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));

  if (results.errors.length === 0 && distributionOk) {
    console.log('✅ ALL CHECKS PASSED! Questions are ready for production.');
    console.log('✅ 60 questions distributed correctly across 4 topics.');
    console.log('✅ No errors or critical issues found.');
    console.log('\nNext step: Run seed script to insert into database:');
    console.log('  node server/scripts/seedQuizQuestions.js');
  } else {
    console.log('❌ VALIDATION FAILED');
    console.log(`   Errors: ${results.errors.length}`);
    console.log(`   Distribution: ${distributionOk ? 'OK' : 'INCORRECT'}`);
    console.log('\nPlease fix the issues before seeding the database.');
    process.exit(1);
  }

  console.log('='.repeat(60) + '\n');
}

// Run validation
validateQuestions();
