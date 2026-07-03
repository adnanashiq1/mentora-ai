import { neon } from "@neondatabase/serverless";

// Reads the connection string from the DATABASE_URL env var automatically.
const sql = neon(process.env.DATABASE_URL!);

export type Profile = {
  user_id: string;
  interests: string;
  background: string;
  learning_goal: string;
  analogy_domain: string;
  created_at?: string;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const rows = await sql`
    SELECT * FROM profiles WHERE user_id = ${userId} LIMIT 1
  `;
  return (rows[0] as Profile) ?? null;
}

export async function saveProfile(
  userId: string,
  data: Omit<Profile, "user_id" | "created_at">
): Promise<void> {
  await sql`
    INSERT INTO profiles (user_id, interests, background, learning_goal, analogy_domain)
    VALUES (${userId}, ${data.interests}, ${data.background}, ${data.learning_goal}, ${data.analogy_domain})
    ON CONFLICT (user_id)
    DO UPDATE SET
      interests = EXCLUDED.interests,
      background = EXCLUDED.background,
      learning_goal = EXCLUDED.learning_goal,
      analogy_domain = EXCLUDED.analogy_domain
  `;
}

export type ChapterSection = {
  heading: string;
  body: string;
  code?: string;
};

export type Chapter = {
  id: number;
  slug: string;
  title: string;
  order_num: number;
  summary: string;
  sections: ChapterSection[];
};

export async function getChapters(): Promise<Chapter[]> {
  const rows = await sql`
    SELECT * FROM chapters ORDER BY order_num ASC
  `;
  return rows as Chapter[];
}

export async function getChapterBySlug(slug: string): Promise<Chapter | null> {
  const rows = await sql`
    SELECT * FROM chapters WHERE slug = ${slug} LIMIT 1
  `;
  return (rows[0] as Chapter) ?? null;
}
