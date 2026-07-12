-- Run this in the Neon SQL Editor (clear the box first).

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  order_num INT NOT NULL,
  difficulty TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB NOT NULL,
  starter_code TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_submissions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_slug TEXT NOT NULL,
  code TEXT NOT NULL,
  meets_requirements BOOLEAN NOT NULL,
  feedback TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_submissions_user ON project_submissions(user_id, project_slug);

INSERT INTO projects (slug, title, order_num, difficulty, description, requirements, starter_code) VALUES

(
  'simple-calculator',
  'Simple Calculator',
  1,
  'Easy',
  'Build a console calculator that reads two numbers and an operator, then prints the result.',
  $$[
    "Reads two numbers and an operator (+, -, *, /) from the user",
    "Performs the correct arithmetic based on the operator",
    "Handles division by zero without crashing (prints a friendly message instead)",
    "Uses at least one method, rather than putting everything directly in Main"
  ]$$::jsonb,
  $$using System;

class Program
{
    static void Main()
    {
        // Read two numbers and an operator, then print the result.
        // Try to use a separate method for the calculation itself.
    }
}$$
),

(
  'student-grade-tracker',
  'Student Grade Tracker',
  2,
  'Medium',
  'Track a small class of students and their grades, then report the class average and letter grades.',
  $$[
    "Defines a Student class with at least a Name and a numeric Score",
    "Stores multiple students in a List<Student>",
    "Computes and prints the class average score",
    "Converts each student's score into a letter grade (A/B/C/D/F) using a method",
    "Prints every student's name, score, and letter grade"
  ]$$::jsonb,
  $$using System;
using System.Collections.Generic;

class Student
{
    public string Name;
    public int Score;
}

class Program
{
    static void Main()
    {
        List<Student> students = new List<Student>();
        // Add a few students, compute the class average,
        // and print each student's letter grade.
    }
}$$
),

(
  'library-catalog',
  'Simple Library Catalog',
  3,
  'Hard',
  'Build a small library system that tracks books, whether they are borrowed, and lets you search by title.',
  $$[
    "Defines a Book class with Title, Author, and an IsBorrowed flag",
    "Stores multiple books in a List<Book>",
    "Has a method to mark a book as borrowed and another to mark it returned",
    "Has a method to search for a book by title (case-insensitive is a bonus)",
    "Prints only the currently available (not borrowed) books on request"
  ]$$::jsonb,
  $$using System;
using System.Collections.Generic;

class Book
{
    public string Title;
    public string Author;
    public bool IsBorrowed;
}

class Program
{
    static void Main()
    {
        List<Book> books = new List<Book>();
        // Add some books, borrow/return a couple, search by title,
        // and print the ones that are currently available.
    }
}$$
)

ON CONFLICT (slug) DO NOTHING;
