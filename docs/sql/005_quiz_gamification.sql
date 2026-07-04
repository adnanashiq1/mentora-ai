-- Run this in the Neon SQL Editor (clear the box first).
-- Adds hints, points tracking, and expands the first 3 chapters to 7
-- questions each.

ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS hint TEXT NOT NULL DEFAULT '';
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS total_possible INT NOT NULL DEFAULT 0;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT 'Student';

-- Add hints to the 9 existing questions
UPDATE quiz_questions SET hint = 'Think about who created it and what category of language it is.'
  WHERE chapter_slug = 'introduction' AND order_num = 1;
UPDATE quiz_questions SET hint = 'It''s a beginner-friendly online tool — check the chapter''s "What you need" section.'
  WHERE chapter_slug = 'introduction' AND order_num = 2;
UPDATE quiz_questions SET hint = 'Every C# console app needs one specific method that runs first.'
  WHERE chapter_slug = 'introduction' AND order_num = 3;

UPDATE quiz_questions SET hint = 'It''s the type made for exactly two possible values.'
  WHERE chapter_slug = 'variables-and-data-types' AND order_num = 1;
UPDATE quiz_questions SET hint = 'It''s designed for precision, often used for prices.'
  WHERE chapter_slug = 'variables-and-data-types' AND order_num = 2;
UPDATE quiz_questions SET hint = 'Console.WriteLine simply displays whatever value the variable currently holds.'
  WHERE chapter_slug = 'variables-and-data-types' AND order_num = 3;

UPDATE quiz_questions SET hint = 'It repeats a set number of times you decide in advance.'
  WHERE chapter_slug = 'control-flow' AND order_num = 1;
UPDATE quiz_questions SET hint = 'Both conditions need to be true for this to be true.'
  WHERE chapter_slug = 'control-flow' AND order_num = 2;
UPDATE quiz_questions SET hint = 'It''s the direct partner to "if" for the opposite case.'
  WHERE chapter_slug = 'control-flow' AND order_num = 3;

-- 4 more questions per chapter, bringing each to 7
INSERT INTO quiz_questions (chapter_slug, question, options, correct_index, order_num, hint) VALUES

('introduction', 'Which company created C#?',
 $$["Google", "Microsoft", "Apple", "Oracle"]$$::jsonb,
 1, 4, 'Same company that makes Windows and Visual Studio.'),

('introduction', 'What is .NET?',
 $$["A social network", "The platform C# programs run on", "A database engine", "A web browser"]$$::jsonb,
 1, 5, 'It''s what you install when you''re ready to build a real project.'),

('introduction', 'Which of these is something C# is actually used for?',
 $$["Building Unity games", "Styling web pages with CSS", "Only writing shell scripts", "Editing images in Photoshop"]$$::jsonb,
 0, 6, 'Think about what the chapter said C# powers, alongside web apps and desktop software.'),

('introduction', 'What does Console.WriteLine do?',
 $$["Reads user input", "Prints a line of text to the screen", "Deletes a variable", "Compiles the program"]$$::jsonb,
 1, 7, 'Look at what it did in the Hello World example.'),

('variables-and-data-types', 'Which type stores whole numbers?',
 $$["string", "int", "bool", "char"]$$::jsonb,
 1, 4, 'Think "integer" - no decimal point.'),

('variables-and-data-types', 'Which type stores a single character like ''A''?',
 $$["string", "char", "int", "double"]$$::jsonb,
 1, 5, 'Its name literally means "character".'),

('variables-and-data-types', 'What does the "var" keyword do?',
 $$["Always causes an error", "Lets the compiler infer the type from the value", "Forces the type to be string", "Makes the variable global"]$$::jsonb,
 1, 6, 'C# can figure out the type on its own from what you assign.'),

('variables-and-data-types', 'Which type would best store a name like "Alex"?',
 $$["int", "bool", "string", "decimal"]$$::jsonb,
 2, 7, 'Names are text, not numbers.'),

('control-flow', 'Which loop repeats while a condition stays true, an unknown number of times?',
 $$["for", "while", "switch", "if"]$$::jsonb,
 1, 4, 'Its name describes exactly what it does.'),

('control-flow', 'What does || mean?',
 $$["AND", "OR", "NOT", "equals"]$$::jsonb,
 1, 5, 'Only one side needs to be true for the whole thing to be true.'),

('control-flow', 'What does == check?',
 $$["Assignment", "Equality between two values", "Division", "Not equal"]$$::jsonb,
 1, 6, 'Careful - a single = assigns, but this doubled version compares.'),

('control-flow', 'Which statement lets you cleanly check many possible values of one variable?',
 $$["for", "switch", "while", "try"]$$::jsonb,
 1, 7, 'It''s a cleaner alternative to a long chain of if/else if.')

ON CONFLICT DO NOTHING;
