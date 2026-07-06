-- Run this in the Neon SQL Editor (clear the box first).
-- Fixes two chapters whose code snippets referenced classes (Person,
-- Animal, Dog) declared only in earlier chapters, making them non-runnable
-- on their own in the sandbox.

UPDATE chapters SET sections = $$[
  {
    "heading": "Creating instances",
    "body": "The new keyword creates an actual object in memory from a class. You can create as many as you want from the same class."
  },
  {
    "heading": "Each object is independent",
    "body": "Two objects from the same class each have their own separate copy of the fields.",
    "code": "class Person\n{\n    public string Name;\n\n    public void Greet()\n    {\n        Console.WriteLine($\"Hi, I'm {Name}\");\n    }\n}\n\nPerson p1 = new Person();\np1.Name = \"Alex\";\n\nPerson p2 = new Person();\np2.Name = \"Sam\";\n\np1.Greet(); // Hi, I'm Alex\np2.Greet(); // Hi, I'm Sam"
  }
]$$::jsonb
WHERE slug = 'objects';

UPDATE chapters SET sections = $$[
  {
    "heading": "One interface, many behaviors",
    "body": "When you call an overridden method through a base-type reference, C# runs the derived class's actual version, not the base one - this is polymorphism."
  },
  {
    "heading": "Why it matters",
    "body": "You can write code that works with a general type (like Animal) and it automatically behaves correctly for every specific subtype.",
    "code": "class Animal\n{\n    public virtual void Speak() => Console.WriteLine(\"...\");\n}\n\nclass Dog : Animal\n{\n    public override void Speak() => Console.WriteLine(\"Woof!\");\n}\n\nAnimal[] animals = { new Dog(), new Animal() };\nforeach (Animal a in animals)\n{\n    a.Speak(); // Woof! then ...\n}"
  }
]$$::jsonb
WHERE slug = 'polymorphism';
