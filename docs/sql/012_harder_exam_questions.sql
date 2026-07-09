-- Run this in the Neon SQL Editor (clear the box first).
-- Replaces the 20 exam questions with a harder set featuring genuine
-- near-miss distractors, so guessing/elimination alone won't pass.

DELETE FROM exam_questions;

INSERT INTO exam_questions (question, options, correct_index, order_num) VALUES

('What does this print?
int x = 5;
int y = x++;
Console.WriteLine(y);', $$["5", "6", "4", "Compile error"]$$::jsonb, 0, 1),
('What does this print?
int x = 5;
int y = ++x;
Console.WriteLine(y);', $$["6", "5", "4", "Compile error"]$$::jsonb, 0, 2),
('What does this print?
double a = 7 / 2;
Console.WriteLine(a);', $$["3", "3.5", "3.0", "4"]$$::jsonb, 0, 3),
('What happens here?
string s = null;
Console.WriteLine(s.Length);', $$["Prints 0", "Throws a NullReferenceException", "Prints null", "Compile error"]$$::jsonb, 1, 4),
('What does this print?
int[] arr = new int[3];
Console.WriteLine(arr[0]);', $$["0", "null", "Compile error", "Undefined behavior"]$$::jsonb, 0, 5),
('Two variables hold string "hi" and "hi" (no custom Equals/== overload elsewhere). Two variables of a plain custom class hold separate instances with identical field values. How does == behave for each pair by default?', $$["Both compare by value", "Strings compare by value; the custom class instances compare by reference", "Both compare by reference", "Strings compare by reference; the class instances compare by value"]$$::jsonb, 1, 6),
('What does this print?
Console.WriteLine(0.1 + 0.2 == 0.3);', $$["True", "False", "Compile error", "Undefined behavior"]$$::jsonb, 1, 7),
('Which exception is thrown here?
int[] arr = {1, 2, 3};
Console.WriteLine(arr[5]);', $$["IndexOutOfRangeException", "ArgumentException", "NullReferenceException", "InvalidOperationException"]$$::jsonb, 0, 8),
('What happens here?
for (int i = 0; i < 3; i++)
{
}
Console.WriteLine(i);', $$["Prints 3", "Prints 2", "Compile error - i is out of scope here", "Prints 0"]$$::jsonb, 2, 9),
('In `var result = list.Where(x => x > 5);`, when does the filtering actually run?', $$["Immediately, the moment Where is called", "Only when result is enumerated (e.g. with foreach or ToList)", "Never - Where just returns the original list unchanged", "At compile time"]$$::jsonb, 1, 10),
('What does this print?
Console.WriteLine(5 / 2);', $$["2", "2.5", "3", "2.0"]$$::jsonb, 0, 11),
('class Point { public int X; public int Y; }
Point p1 = new Point();
Point p2 = p1;
p2.X = 10;
Console.WriteLine(p1.X);
What prints?', $$["10", "0", "Compile error", "null"]$$::jsonb, 0, 12),
('Same code, but Point is declared as a struct instead of a class:
struct Point { public int X; public int Y; }
Point p1 = new Point();
Point p2 = p1;
p2.X = 10;
Console.WriteLine(p1.X);
What prints now?', $$["0", "10", "Compile error", "null"]$$::jsonb, 0, 13),
('What does this print?
string a = "hello";
string b = "hello";
Console.WriteLine(a == b);', $$["True", "False", "Compile error", "Depends on runtime"]$$::jsonb, 0, 14),
('What does this print?
Console.WriteLine("5" + 3);', $$["8", "53", "35", "Compile error"]$$::jsonb, 1, 15),
('A base type array holds one Animal and one Dog (Dog overrides Animal''s virtual Speak(), which prints "Woof!"; Animal''s prints "..."). Looping through and calling .Speak() on the Dog element - what prints for it?', $$["Woof!", "...", "Compile error", "Both messages print"]$$::jsonb, 0, 16),
('Can a single C# class implement more than one interface?', $$["Yes - C# allows implementing multiple interfaces on one class", "No - like base classes, only one interface is allowed per class", "Only if the interfaces share no method names", "Only abstract classes can implement more than one"]$$::jsonb, 0, 17),
('A try block can throw a DivideByZeroException. If you write `catch (Exception e)` BEFORE `catch (DivideByZeroException e)` in the same try statement, what happens?', $$["It compiles fine, and the specific catch still runs correctly for that exception type", "It's a compile-time error - the specific catch block is unreachable", "It's only a runtime warning, not an error", "The first catch block by position always silently wins with no error"]$$::jsonb, 1, 18),
('What actually happens when you call an async method WITHOUT awaiting it?', $$["It starts running immediately, synchronously, up to its first await point, then returns a Task", "Nothing runs until something awaits the call", "It automatically runs entirely on a separate thread", "The compiler ignores the call entirely"]$$::jsonb, 0, 19),
('A property is declared as `public int Age { get; }` with no setter. Where can it still be assigned a value?', $$["Nowhere - without a set accessor it can never be assigned, even in the constructor", "Only inside the constructor of the same class", "Anywhere in the same class, including regular methods", "Only from outside the class"]$$::jsonb, 1, 20)
;
