/**
 * Seed Quiz Questions
 * Loads quiz questions from JSON file and inserts them into Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedQuizQuestions() {
  try {
    console.log('Starting quiz questions seed...\n');

    // Read questions from JSON file
    const questionsPath = path.join(__dirname, '../data/quiz_questions.json');
    console.log(`Reading questions from: ${questionsPath}`);

    if (!fs.existsSync(questionsPath)) {
      throw new Error(`Questions file not found at: ${questionsPath}`);
    }

    const questionsData = fs.readFileSync(questionsPath, 'utf-8');
    const questions = JSON.parse(questionsData);

    console.log(`Loaded ${questions.length} questions from file\n`);

    // Validate questions
    const validQuestions = questions.filter(q => {
      const isValid = q.id && q.subject && q.topic && q.question &&
                      Array.isArray(q.options) && q.options.length === 4 &&
                      typeof q.correct_answer === 'number' &&
                      q.correct_answer >= 0 && q.correct_answer <= 3;

      if (!isValid) {
        console.warn(`Warning: Invalid question skipped: ${q.id}`);
      }

      return isValid;
    });

    console.log(`Validated ${validQuestions.length} questions\n`);

    // Check for existing questions
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('quiz_questions')
      .select('id');

    if (fetchError) {
      console.error('Error fetching existing questions:', fetchError);
    } else {
      console.log(`Found ${existingQuestions?.length || 0} existing questions in database`);

      // Optional: Clear existing questions
      if (existingQuestions && existingQuestions.length > 0) {
        console.log('\nClearing existing questions...');
        const { error: deleteError } = await supabase
          .from('quiz_questions')
          .delete()
          .neq('id', ''); // Delete all

        if (deleteError) {
          console.error('Error clearing existing questions:', deleteError);
        } else {
          console.log('Existing questions cleared');
        }
      }
    }

    // Insert questions in batches (Supabase has a limit)
    const batchSize = 50;
    let insertedCount = 0;
    let errorCount = 0;

    console.log('\nInserting questions...');

    for (let i = 0; i < validQuestions.length; i += batchSize) {
      const batch = validQuestions.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('quiz_questions')
        .insert(batch)
        .select();

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        errorCount += batch.length;
      } else {
        insertedCount += data.length;
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${data.length} questions`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('SEED SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total questions in file: ${questions.length}`);
    console.log(`Valid questions: ${validQuestions.length}`);
    console.log(`Successfully inserted: ${insertedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(50) + '\n');

    // Topic breakdown
    const topicCounts = validQuestions.reduce((acc, q) => {
      acc[q.topic] = (acc[q.topic] || 0) + 1;
      return acc;
    }, {});

    console.log('Questions by topic:');
    Object.entries(topicCounts).forEach(([topic, count]) => {
      console.log(`  ${topic}: ${count}`);
    });

    console.log('\nSeed completed successfully!');

  } catch (error) {
    console.error('Error during seed:', error);
    process.exit(1);
  }
}

// Run the seed
seedQuizQuestions();
