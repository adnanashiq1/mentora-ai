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

// --- Final Exam ---

const EXAM_PASS_THRESHOLD = 0.7; // 70% to pass
const EXAM_MAX_ATTEMPTS = 3;
const EXAM_COOLDOWN_DAYS = 21; // 3 weeks

export type ExamQuestion = {
  id: number;
  question: string;
  options: string[];
  order_num: number;
};

type ExamQuestionWithAnswer = ExamQuestion & { correct_index: number };

export async function getExamQuestions(): Promise<ExamQuestion[]> {
  const rows = await sql`
    SELECT id, question, options, order_num FROM exam_questions ORDER BY order_num ASC
  `;
  return rows as ExamQuestion[];
}

export async function getExamQuestionsWithAnswers(
  ids: number[]
): Promise<ExamQuestionWithAnswer[]> {
  const rows = await sql`
    SELECT * FROM exam_questions WHERE id = ANY(${ids})
  `;
  return rows as ExamQuestionWithAnswer[];
}

export type ExamAttempt = {
  id: number;
  user_id: string;
  display_name: string;
  score: number;
  total: number;
  passed: boolean;
  flagged: boolean;
  status: "in_progress" | "completed";
  mcq_score: number;
  mcq_total: number;
  coding_score: number;
  overall_percentage: number;
  attempted_at: string;
};

// Postgres NUMERIC columns come back from the driver as strings (to avoid
// silent precision loss), not JS numbers - so raw rows can't just be cast.
// This coerces the numeric fields properly wherever an attempt row is read.
function normalizeExamAttempt(row: Record<string, unknown>): ExamAttempt {
  return {
    ...row,
    score: Number(row.score),
    total: Number(row.total),
    mcq_score: Number(row.mcq_score),
    mcq_total: Number(row.mcq_total),
    coding_score: Number(row.coding_score),
    overall_percentage: Number(row.overall_percentage),
  } as ExamAttempt;
}

export async function getExamAttempts(userId: string): Promise<ExamAttempt[]> {
  const rows = await sql`
    SELECT * FROM exam_attempts WHERE user_id = ${userId} ORDER BY attempted_at DESC
  `;
  return rows.map(normalizeExamAttempt);
}

async function getBestPassedAttempt(userId: string): Promise<ExamAttempt | null> {
  const rows = await sql`
    SELECT * FROM exam_attempts
    WHERE user_id = ${userId} AND passed = true AND status = 'completed'
    ORDER BY overall_percentage DESC
    LIMIT 1
  `;
  return rows[0] ? normalizeExamAttempt(rows[0]) : null;
}

export type ExamStatus =
  | { state: "can_attempt"; attemptsUsed: number; attemptsRemaining: number; bestPassedAttempt: ExamAttempt | null }
  | { state: "cooldown"; eligibleAt: Date; attemptsUsed: number; attemptsRemaining: number; bestPassedAttempt: ExamAttempt | null }
  | { state: "passed_final"; bestPassedAttempt: ExamAttempt }
  | { state: "locked"; attemptsUsed: number };

export async function getExamStatus(userId: string): Promise<ExamStatus> {
  const attempts = await getExamAttempts(userId); // newest first, includes in_progress
  const bestPassedAttempt = await getBestPassedAttempt(userId);

  const attemptsUsed = attempts.length;
  const attemptsRemaining = EXAM_MAX_ATTEMPTS - attemptsUsed;

  if (attemptsUsed >= EXAM_MAX_ATTEMPTS) {
    if (bestPassedAttempt) {
      return { state: "passed_final", bestPassedAttempt };
    }
    return { state: "locked", attemptsUsed };
  }

  // Cooldown applies after any attempt that wasn't a pass - this includes
  // an abandoned/in-progress attempt (closing the tab without finishing),
  // so someone can't dodge the cooldown by simply never submitting.
  const lastAttempt = attempts[0];
  if (lastAttempt && !lastAttempt.passed) {
    const lastDate = new Date(lastAttempt.attempted_at);
    const eligibleAt = new Date(lastDate.getTime() + EXAM_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    if (eligibleAt.getTime() > Date.now()) {
      return { state: "cooldown", eligibleAt, attemptsUsed, attemptsRemaining, bestPassedAttempt };
    }
  }

  return { state: "can_attempt", attemptsUsed, attemptsRemaining, bestPassedAttempt };
}

export function computeOverallPercentage(
  mcqScore: number,
  mcqTotal: number,
  codingScore: number // 0-100
): number {
  const mcqPercent = mcqTotal > 0 ? (mcqScore / mcqTotal) * 100 : 0;
  return mcqPercent * 0.6 + codingScore * 0.4;
}

export function computeExamPass(overallPercentage: number): boolean {
  return overallPercentage >= EXAM_PASS_THRESHOLD * 100;
}

// --- Exam coding challenges ---

export type ExamCodingQuestion = {
  id: number;
  title: string;
  difficulty: string;
  prompt: string;
  starter_code: string;
  order_num: number;
};

export async function getExamCodingQuestions(): Promise<ExamCodingQuestion[]> {
  const rows = await sql`
    SELECT * FROM exam_coding_questions ORDER BY order_num ASC
  `;
  return rows as ExamCodingQuestion[];
}

// Reserves an attempt the moment the student STARTS the exam, not when
// they finish. This closes a real exploit: previously, closing the tab
// mid-exam left no record at all, so someone could "practice" for free
// indefinitely as long as they never hit Submit.
export async function startExamAttempt(userId: string, displayName: string): Promise<number> {
  const rows = await sql`
    INSERT INTO exam_attempts (user_id, display_name, score, total, passed, flagged, status)
    VALUES (${userId}, ${displayName}, 0, 0, false, false, 'in_progress')
    RETURNING id
  `;
  return rows[0].id as number;
}

function generateVerificationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Finalizes an in-progress attempt with its real results. Verifies the
// attempt actually belongs to this user and hasn't already been completed,
// so the endpoint can't be replayed to overwrite a finished result.
export async function completeExamAttempt(params: {
  attemptId: number;
  userId: string;
  mcqScore: number;
  mcqTotal: number;
  codingScore: number;
  overallPercentage: number;
  passed: boolean;
  flagged: boolean;
}): Promise<boolean> {
  const rows = await sql`
    UPDATE exam_attempts
    SET score = ${params.mcqScore},
        total = ${params.mcqTotal},
        passed = ${params.passed},
        flagged = ${params.flagged},
        mcq_score = ${params.mcqScore},
        mcq_total = ${params.mcqTotal},
        coding_score = ${params.codingScore},
        overall_percentage = ${params.overallPercentage},
        status = 'completed'
    WHERE id = ${params.attemptId} AND user_id = ${params.userId} AND status = 'in_progress'
    RETURNING id
  `;
  return rows.length > 0;
}

// A stable, permanent certificate identity per user. Retaking the exam to
// improve a score never changes this code, so a certificate someone has
// already shared or had verified stays valid and simply reflects the new
// best score going forward.
export async function getOrCreateCertificateCode(
  userId: string,
  displayName: string
): Promise<string> {
  const existing = await sql`
    SELECT verification_code FROM certificates WHERE user_id = ${userId} LIMIT 1
  `;
  if (existing[0]) {
    return existing[0].verification_code as string;
  }

  const code = generateVerificationCode();
  await sql`
    INSERT INTO certificates (user_id, verification_code, display_name)
    VALUES (${userId}, ${code}, ${displayName})
    ON CONFLICT (user_id) DO NOTHING
  `;
  const rows = await sql`
    SELECT verification_code FROM certificates WHERE user_id = ${userId} LIMIT 1
  `;
  return rows[0].verification_code as string;
}

export type CertificateLookup = {
  displayName: string;
  overallPercentage: number;
  attemptedAt: string;
  verificationCode: string;
};

export async function getCertificateByCode(code: string): Promise<CertificateLookup | null> {
  const rows = await sql`
    SELECT c.display_name, c.verification_code, a.overall_percentage, a.attempted_at
    FROM certificates c
    JOIN exam_attempts a ON a.user_id = c.user_id AND a.passed = true AND a.status = 'completed'
    WHERE c.verification_code = ${code}
    ORDER BY a.overall_percentage DESC
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return {
    displayName: rows[0].display_name,
    overallPercentage: Number(rows[0].overall_percentage),
    attemptedAt: rows[0].attempted_at,
    verificationCode: rows[0].verification_code,
  };
}

// --- Chat history ---

export type ChatMessage = { role: "user" | "assistant"; content: string };

const CHAT_HISTORY_LIMIT = 30; // most recent messages kept per user

export async function getChatHistory(userId: string): Promise<ChatMessage[]> {
  const rows = await sql`
    SELECT role, content, created_at FROM (
      SELECT role, content, created_at FROM chat_messages
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${CHAT_HISTORY_LIMIT}
    ) recent
    ORDER BY created_at ASC
  `;
  return rows.map((r) => ({ role: r.role, content: r.content })) as ChatMessage[];
}

export async function saveChatMessage(
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  await sql`
    INSERT INTO chat_messages (user_id, role, content)
    VALUES (${userId}, ${role}, ${content})
  `;
}

// --- Streaks & Badges ---
// Both are computed on the fly from existing activity data (quiz attempts
// and chat messages) rather than tracked in a separate table - always
// accurate, no extra bookkeeping to keep in sync.

function parseDateOnly(dateStr: string): number {
  // Postgres DATE columns come back as "YYYY-MM-DD" strings. Parsing with
  // Date.UTC keeps day-boundary math consistent regardless of server
  // timezone, avoiding off-by-one bugs from local-time parsing.
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export type StreakInfo = { current: number; longest: number };

export async function getUserStreak(userId: string): Promise<StreakInfo> {
  const rows = await sql`
    SELECT DISTINCT activity_date::text AS activity_date FROM (
      SELECT DATE(attempted_at) AS activity_date FROM quiz_results WHERE user_id = ${userId}
      UNION
      SELECT DATE(created_at) AS activity_date FROM chat_messages WHERE user_id = ${userId} AND role = 'user'
    ) combined
    ORDER BY activity_date DESC
  `;

  if (rows.length === 0) return { current: 0, longest: 0 };

  const oneDay = 24 * 60 * 60 * 1000;
  const dayTimestamps = rows.map((r) => parseDateOnly(r.activity_date as string));
  const daySet = new Set(dayTimestamps);

  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  // Current streak: only counts if the most recent activity was today or
  // yesterday (a grace day, so the streak doesn't vanish before someone's
  // had a chance to do today's activity yet).
  let current = 0;
  const mostRecent = dayTimestamps[0];
  if (mostRecent === todayUTC || mostRecent === todayUTC - oneDay) {
    let cursor = mostRecent;
    while (daySet.has(cursor)) {
      current++;
      cursor -= oneDay;
    }
  }

  // Longest streak ever, walking the sorted days in ascending order.
  const sortedAsc = [...dayTimestamps].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const day of sortedAsc) {
    run = prev !== null && day - prev === oneDay ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }

  return { current, longest };
}

export type Badge = {
  id: string;
  name: string;
  description: string;
  earned: boolean;
};

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const progress = await getUserProgress(userId);
  const attempted = progress.filter((p) => p.best_score !== null);
  const perfect = progress.some(
    (p) => p.best_score !== null && p.best_total !== null && p.best_score === p.best_total
  );

  const examStatus = await getExamStatus(userId);
  const passedExam = "bestPassedAttempt" in examStatus && !!examStatus.bestPassedAttempt;

  const streak = await getUserStreak(userId);

  const chatRows = await sql`
    SELECT COUNT(*)::int AS count FROM chat_messages WHERE user_id = ${userId} AND role = 'user'
  `;
  const chatCount = (chatRows[0]?.count as number) ?? 0;

  return [
    {
      id: "first-steps",
      name: "First Steps",
      description: "Complete your first chapter quiz",
      earned: attempted.length >= 1,
    },
    {
      id: "halfway",
      name: "Halfway There",
      description: "Complete 13 of 26 chapters",
      earned: attempted.length >= 13,
    },
    {
      id: "course-complete",
      name: "Course Complete",
      description: "Complete all 26 chapters",
      earned: attempted.length >= 26,
    },
    {
      id: "perfectionist",
      name: "Perfectionist",
      description: "Score 100% on any chapter quiz",
      earned: perfect,
    },
    {
      id: "certified",
      name: "Certified",
      description: "Pass the final exam",
      earned: passedExam,
    },
    {
      id: "on-a-roll",
      name: "On a Roll",
      description: "Reach a 3-day learning streak",
      earned: streak.current >= 3 || streak.longest >= 3,
    },
    {
      id: "dedicated",
      name: "Dedicated",
      description: "Reach a 7-day learning streak",
      earned: streak.current >= 7 || streak.longest >= 7,
    },
    {
      id: "chatterbox",
      name: "Chatterbox",
      description: "Send 20 messages to Mentora",
      earned: chatCount >= 20,
    },
  ];
}

// --- Guided Projects ---

export type Project = {
  id: number;
  slug: string;
  title: string;
  order_num: number;
  difficulty: string;
  description: string;
  requirements: string[];
  starter_code: string;
};

export async function getProjects(): Promise<Project[]> {
  const rows = await sql`
    SELECT * FROM projects ORDER BY order_num ASC
  `;
  return rows as Project[];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const rows = await sql`
    SELECT * FROM projects WHERE slug = ${slug} LIMIT 1
  `;
  return (rows[0] as Project) ?? null;
}

export type ProjectSubmission = {
  id: number;
  user_id: string;
  project_slug: string;
  code: string;
  meets_requirements: boolean;
  feedback: string;
  submitted_at: string;
};

export async function getProjectSubmissions(
  userId: string,
  projectSlug: string
): Promise<ProjectSubmission[]> {
  const rows = await sql`
    SELECT * FROM project_submissions
    WHERE user_id = ${userId} AND project_slug = ${projectSlug}
    ORDER BY submitted_at DESC
  `;
  return rows as ProjectSubmission[];
}

export async function saveProjectSubmission(params: {
  userId: string;
  projectSlug: string;
  code: string;
  meetsRequirements: boolean;
  feedback: string;
}): Promise<void> {
  await sql`
    INSERT INTO project_submissions (user_id, project_slug, code, meets_requirements, feedback)
    VALUES (${params.userId}, ${params.projectSlug}, ${params.code}, ${params.meetsRequirements}, ${params.feedback})
  `;
}
