-- Run this once in the Neon SQL Editor to add the chapters table and seed
-- the first three C# chapters.

CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  order_num INT NOT NULL,
  summary TEXT NOT NULL,
  sections JSONB NOT NULL
);

INSERT INTO chapters (slug, title, order_num, summary, sections) VALUES
(
  'introduction',
  'Introduction to C#',
  1,
  'What C# is, how to run code without installing anything, and your first program.',
  $$[
    {
      "heading": "What is C#?",
      "body": "C# (\"C sharp\") is a general-purpose programming language built by Microsoft. It's strongly typed, object-oriented, and compiled, and it powers everything from Unity games to enterprise web apps (ASP.NET) to desktop software."
    },
    {
      "heading": "What you need",
      "body": "You don't need to install anything to start. Head to dotnetfiddle.net and write and run C# directly in your browser. When you're ready for a real project later, you'll install the free .NET SDK."
    },
    {
      "heading": "Your first program",
      "body": "Every C# program needs a Main method as its entry point. Try this:",
      "code": "using System;\n\nclass Program\n{\n    static void Main()\n    {\n        Console.WriteLine(\"Hello, world!\");\n    }\n}"
    }
  ]$$::jsonb
),
(
  'variables-and-data-types',
  'Variables & Data Types',
  2,
  'How to store data in a C# program, and the types you''ll use constantly.',
  $$[
    {
      "heading": "What is a variable?",
      "body": "A variable is a named container for a value. In C#, you declare its type up front, and that type never changes for that variable."
    },
    {
      "heading": "Common types",
      "body": "int (whole numbers), double (decimals), bool (true/false), string (text), char (a single character), and decimal (precise decimals, good for money)."
    },
    {
      "heading": "Try it",
      "body": "Declaring and using a few variables together:",
      "code": "int age = 21;\ndouble price = 19.99;\nbool isStudent = true;\nstring name = \"Alex\";\n\nConsole.WriteLine($\"{name} is {age} years old.\");"
    }
  ]$$::jsonb
),
(
  'control-flow',
  'Control Flow',
  3,
  'How to make decisions and repeat actions in your code.',
  $$[
    {
      "heading": "Making decisions with if/else",
      "body": "An if statement runs code only when a condition is true. else runs when it isn't.",
      "code": "int score = 85;\n\nif (score >= 50)\n{\n    Console.WriteLine(\"Pass\");\n}\nelse\n{\n    Console.WriteLine(\"Fail\");\n}"
    },
    {
      "heading": "Comparison and logical operators",
      "body": "==, !=, >, <, >=, <= compare values. && means AND, || means OR — combine conditions with these."
    },
    {
      "heading": "Loops: for and while",
      "body": "A for loop repeats a known number of times. A while loop repeats until a condition becomes false.",
      "code": "for (int i = 0; i < 5; i++)\n{\n    Console.WriteLine(i);\n}"
    }
  ]$$::jsonb
)
ON CONFLICT (slug) DO NOTHING;
