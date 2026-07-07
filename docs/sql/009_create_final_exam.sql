-- Run this in the Neon SQL Editor (clear the box first).

CREATE TABLE IF NOT EXISTS exam_questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  order_num INT NOT NULL
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  score INT NOT NULL,
  total INT NOT NULL,
  passed BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO exam_questions (question, options, correct_index, order_num) VALUES

('What is C#?', $$["A markup language for web pages", "A general-purpose language built by Microsoft", "A type of database", "A version of Java"]$$::jsonb, 1, 1),
('Which type would you use to store true or false?', $$["int", "bool", "string", "double"]$$::jsonb, 1, 2),
('Which loop repeats a known number of times, decided in advance?', $$["while", "for", "if", "switch"]$$::jsonb, 1, 3),
('What does ''void'' before a method name mean?', $$["The method takes no parameters", "The method returns nothing", "The method is broken", "The method runs twice"]$$::jsonb, 1, 4),
('What index does the first element of an array have?', $$["1", "0", "-1", "It depends on the array"]$$::jsonb, 1, 5),
('Which method converts a string to all uppercase?', $$[".ToUpper()", ".Capitalize()", ".Upper()", ".MakeUpper()"]$$::jsonb, 0, 6),
('What keyword creates a new object from a class?', $$["make", "new", "create", "object"]$$::jsonb, 1, 7),
('What runs automatically the moment an object is created with ''new''?', $$["The destructor", "The constructor", "The base class", "Nothing automatically"]$$::jsonb, 1, 8),
('What keyword allows a base class method to be overridden by a derived class?', $$["static", "virtual", "final", "private"]$$::jsonb, 1, 9),
('What does polymorphism let you do?', $$["Delete objects automatically", "Call an overridden method through a base-type reference and get the derived behavior", "Create arrays faster", "Avoid using classes entirely"]$$::jsonb, 1, 10),
('What can an interface contain?', $$["Only fields", "Method signatures with no implementation", "Full method implementations only", "Constructors only"]$$::jsonb, 1, 11),
('What is the main advantage of List<T> over a plain array?', $$["It's always faster", "It can grow and shrink at runtime", "It can only store numbers", "It doesn't need a using directive"]$$::jsonb, 1, 12),
('What does LINQ''s .Where() do in a query chain?', $$["Sorts a collection", "Filters items matching a condition", "Transforms each item", "Counts items"]$$::jsonb, 1, 13),
('What does a try/catch block do?', $$["Wraps code that might throw an exception and handles it gracefully", "Deletes risky code before running", "Always crashes the program on error", "Only works with file operations"]$$::jsonb, 0, 14),
('What problem does async/await primarily solve?', $$["Slow compilation", "Keeping a program responsive while waiting on slow operations", "Too many classes", "Missing semicolons"]$$::jsonb, 1, 15),
('What is a common real-world use of reflection?', $$["Sorting arrays", "Serialization libraries inspecting an object's properties automatically", "Basic arithmetic", "Declaring variables"]$$::jsonb, 1, 16),
('What does encapsulation primarily protect against?', $$["Slow performance", "Code from outside putting an object into an invalid state", "Running out of memory", "Too many classes"]$$::jsonb, 1, 17),
('What does the % operator return?', $$["The result of division", "The remainder after division", "A percentage of a number", "A rounded value"]$$::jsonb, 1, 18),
('What type does Console.ReadLine() always return?', $$["int", "string", "bool", "double"]$$::jsonb, 1, 19),
('What is the correct entry-point method name for a C# console application?', $$["Start()", "Main()", "Begin()", "Init()"]$$::jsonb, 1, 20)


ON CONFLICT DO NOTHING;
