-- Run this in the Neon SQL Editor (clear the box first).

-- Add integrity/scoring fields to exam_attempts
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS mcq_score INT NOT NULL DEFAULT 0;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS mcq_total INT NOT NULL DEFAULT 0;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS coding_score NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS overall_percentage NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS verification_code TEXT;

-- Coding challenge questions for the exam (40% of final weight)
CREATE TABLE IF NOT EXISTS exam_coding_questions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  prompt TEXT NOT NULL,
  starter_code TEXT NOT NULL,
  order_num INT NOT NULL
);

INSERT INTO exam_coding_questions (title, difficulty, prompt, starter_code, order_num) VALUES
(
  'FizzBuzz',
  'easy',
  'Write a program that prints the numbers from 1 to 20. For multiples of 3, print "Fizz" instead of the number. For multiples of 5, print "Buzz". For multiples of both 3 and 5, print "FizzBuzz".',
  $$using System;

class Program
{
    static void Main()
    {
        // Write your solution here

    }
}$$,
  1
),
(
  'Bank Account',
  'hard',
  'Create a BankAccount class with a private balance field. Add a Deposit(decimal amount) method and a Withdraw(decimal amount) method. Withdraw should refuse to let the balance go negative - if the withdrawal would overdraw the account, print "Insufficient funds" instead of changing the balance. In Main, create an account, deposit 100, withdraw 30, attempt to withdraw 200 (this should fail), then print the final balance.',
  $$using System;

class BankAccount
{
    // Write your class here

}

class Program
{
    static void Main()
    {
        // Create an account and test it here

    }
}$$,
  2
)
ON CONFLICT DO NOTHING;
