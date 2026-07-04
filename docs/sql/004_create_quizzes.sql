-- Run this in the Neon SQL Editor. Creates the quiz tables and seeds
-- questions for the first 3 chapters.

CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  chapter_slug TEXT NOT NULL REFERENCES chapters(slug),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  order_num INT NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  chapter_slug TEXT NOT NULL,
  score INT NOT NULL,
  total INT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO quiz_questions (chapter_slug, question, options, correct_index, order_num) VALUES

('introduction', 'What is C#?',
 $$["A markup language for web pages", "A general-purpose language built by Microsoft", "A type of database", "A version of Java"]$$::jsonb,
 1, 1),

('introduction', 'Where can you run C# without installing anything?',
 $$["dotnetfiddle.net", "Only inside Visual Studio", "You can't - installation is required", "Notepad"]$$::jsonb,
 0, 2),

('introduction', 'What is the entry point of a C# console program?',
 $$["Start()", "Main()", "Begin()", "Init()"]$$::jsonb,
 1, 3),

('variables-and-data-types', 'Which type would you use to store true or false?',
 $$["int", "bool", "string", "double"]$$::jsonb,
 1, 1),

('variables-and-data-types', 'Which type is best for storing money precisely?',
 $$["double", "decimal", "int", "char"]$$::jsonb,
 1, 2),

('variables-and-data-types', 'What does this print?  int x = 5; Console.WriteLine(x);',
 $$["5", "x", "Error", "5.0"]$$::jsonb,
 0, 3),

('control-flow', 'Which loop repeats a known number of times?',
 $$["while", "for", "if", "switch"]$$::jsonb,
 1, 1),

('control-flow', 'What does && mean?',
 $$["OR", "NOT", "AND", "equals"]$$::jsonb,
 2, 2),

('control-flow', 'Which block runs when the if condition is false?',
 $$["elseif", "else", "catch", "finally"]$$::jsonb,
 1, 3)

ON CONFLICT DO NOTHING;
