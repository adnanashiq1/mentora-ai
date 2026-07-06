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
  runnable?: boolean;
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

export type QuizQuestion = {
  id: number;
  chapter_slug: string;
  question: string;
  options: string[];
  order_num: number;
  hint: string;
};

type QuizQuestionWithAnswer = QuizQuestion & { correct_index: number };

export async function getQuizQuestions(chapterSlug: string): Promise<QuizQuestion[]> {
  const rows = await sql`
    SELECT id, chapter_slug, question, options, order_num, hint
    FROM quiz_questions
    WHERE chapter_slug = ${chapterSlug}
    ORDER BY order_num ASC
  `;
  return rows as QuizQuestion[];
}

export async function getQuizQuestionsWithAnswers(
  ids: number[]
): Promise<QuizQuestionWithAnswer[]> {
  const rows = await sql`
    SELECT * FROM quiz_questions WHERE id = ANY(${ids})
  `;
  return rows as QuizQuestionWithAnswer[];
}

export async function saveQuizResult(
  userId: string,
  chapterSlug: string,
  score: number,
  total: number,
  pointsEarned: number,
  totalPossible: number,
  displayName: string
): Promise<void> {
  await sql`
    INSERT INTO quiz_results (user_id, chapter_slug, score, total, points_earned, total_possible, display_name)
    VALUES (${userId}, ${chapterSlug}, ${score}, ${total}, ${pointsEarned}, ${totalPossible}, ${displayName})
  `;
}

export async function getLatestQuizResult(userId: string, chapterSlug: string) {
  const rows = await sql`
    SELECT * FROM quiz_results
    WHERE user_id = ${userId} AND chapter_slug = ${chapterSlug}
    ORDER BY attempted_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  total_points: number;
};

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const rows = await sql`
    SELECT
      user_id,
      (array_agg(display_name ORDER BY attempted_at DESC))[1] AS display_name,
      SUM(points_earned)::int AS total_points
    FROM quiz_results
    GROUP BY user_id
    ORDER BY total_points DESC
    LIMIT ${limit}
  `;
  return rows as LeaderboardEntry[];
}

export type ChapterProgress = {
  slug: string;
  title: string;
  order_num: number;
  best_score: number | null;
  best_total: number | null;
  best_points: number | null;
};

export async function getUserProgress(userId: string): Promise<ChapterProgress[]> {
  const rows = await sql`
    SELECT
      c.slug,
      c.title,
      c.order_num,
      (SELECT MAX(score) FROM quiz_results r WHERE r.chapter_slug = c.slug AND r.user_id = ${userId}) AS best_score,
      (SELECT MAX(total) FROM quiz_results r WHERE r.chapter_slug = c.slug AND r.user_id = ${userId}) AS best_total,
      (SELECT MAX(points_earned) FROM quiz_results r WHERE r.chapter_slug = c.slug AND r.user_id = ${userId}) AS best_points
    FROM chapters c
    ORDER BY c.order_num ASC
  `;
  return rows as ChapterProgress[];
}
