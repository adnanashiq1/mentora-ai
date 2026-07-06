-- Run this in the Neon SQL Editor (clear the box first).

-- Fix 1: Reflection's snippet referenced Person without declaring it, and
-- even if it had, the reused Person only had a public field (not a
-- property), so GetProperties() would have returned nothing. Give it its
-- own self-contained Person with real properties.
UPDATE chapters SET sections = $$[
  {
    "heading": "Inspecting code at runtime",
    "body": "Reflection (System.Reflection) lets a program examine its own classes, methods, and properties while it's running, rather than everything being fixed at compile time."
  },
  {
    "heading": "When it is actually used",
    "body": "Mostly inside frameworks and libraries - for example, serialization libraries use reflection to see what properties an object has. You will rarely need it in everyday app code.",
    "code": "class Person\n{\n    public string Name { get; set; }\n    public int Age { get; set; }\n}\n\nType t = typeof(Person);\nforeach (var prop in t.GetProperties())\n{\n    Console.WriteLine(prop.Name);\n}"
  }
]$$::jsonb
WHERE slug = 'reflection';

-- Fix 2: Environment Setup's code block is terminal commands (dotnet new,
-- cd, dotnet run), not C# - it should never get a "Try it" button in the
-- sandbox. Mark it as non-runnable.
UPDATE chapters SET sections = $$[
  {
    "heading": "Installing the .NET SDK",
    "body": "Download the free .NET SDK from dotnet.microsoft.com. Once installed, open a terminal and run dotnet --version to confirm it worked."
  },
  {
    "heading": "Creating a project",
    "body": "The dotnet CLI scaffolds projects for you:",
    "code": "dotnet new console -o MyApp\ncd MyApp\ndotnet run",
    "runnable": false
  },
  {
    "heading": "Choosing an editor",
    "body": "VS Code with the C# extension is lightweight and free. Visual Studio Community is a fuller IDE with more built-in tooling, also free."
  }
]$$::jsonb
WHERE slug = 'environment-setup';
