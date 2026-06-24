import { env } from '../config';
import { prisma } from '../config/database';

interface PredictionRequest {
  user_id: string;
  years_of_experience: number;
  hourly_rate_usd: number;
  rating: number;
  client_satisfaction: number;
  primary_skill?: string;
  country?: string;
  completed_jobs: number;
  earnings_usd: number;
  success_rate: number;
  avg_rating: number;
  avg_job_duration_days: number;
  rehire_rate: number;
  job_category?: string;
  project_type?: string;
  client_region?: string;
}

interface PredictionResponse {
  user_id: string;
  capability_level: 'Beginner' | 'Intermediate' | 'Expert';
  capability_score: number;
  confidence: number;
  model_used: 'cold_start' | 'performance';
  probabilities: Record<string, number>;
}

/**
 * Maps DeTrust DB skill categories → Kaggle model primary_skill categories.
 * The cold-start model was trained on 10 generic Kaggle categories.
 * Our DB has 20 granular categories that must be mapped to match.
 * Unknown categories are left undefined (all one-hot columns stay 0).
 */
const CATEGORY_TO_MODEL_SKILL: Record<string, string> = {
  // Frontend + Backend → Web Development
  'Frontend Engineering': 'Web Development',
  'Backend Engineering': 'Web Development',
  // Mobile
  'Mobile Development': 'Mobile Apps',
  // AI & ML
  'AI & Machine Learning': 'Machine Learning',
  // Data
  'Data Engineering': 'Data Analysis',
  'Data Infrastructure': 'Data Analysis',
  // Security
  'Security': 'Cybersecurity',
  'Applied Cryptography': 'Cybersecurity',
  // DevOps (exact match)
  'DevOps': 'DevOps',
  // Design
  'Product Design': 'UI/UX Design',
  // Web3 / Blockchain
  'Smart Contracts': 'Blockchain Development',
  'Web3 Engineering': 'Blockchain Development',
  'Decentralized Operations': 'Blockchain Development',
  // Content & Marketing → no direct match, but closest is Graphic Design
  'Content & Marketing': 'Graphic Design',
  // Game Dev → Web Development (closest)
  'Game Development': 'Web Development',
  // Others map to closest fit
  'Programming Languages': 'Web Development',
  'Testing & QA': 'Web Development',
  'Trust & Safety': 'Cybersecurity',
  'Project Management': 'Web Development',
};

export class AiService {
  private readonly baseUrl: string;
  private readonly timeoutMs = 5_000;

  constructor() {
    this.baseUrl = env.AI_SERVICE_URL ?? 'http://localhost:8000';
  }

  /**
   * Call the Python AI service and return a 0-100 capability score.
   * Falls back to 0 on any network/timeout error so the main flow is never blocked.
   */
  async predictCapabilityScore(userId: string): Promise<number> {
    try {
      const payload = await this.buildPayload(userId);
      const result  = await this.callPredict(payload);
      return result.capability_score;
    } catch (err) {
      console.warn('[AiService] Prediction unavailable, using fallback:', (err as Error).message);
      return 0;
    }
  }

  private async buildPayload(userId: string): Promise<PredictionRequest> {
    const [profile, contractStats, reviewAgg] = await Promise.all([
      prisma.freelancerProfile.findUnique({
        where: { userId },
        include: {
          skills: { include: { skill: true } },
          experience: true,
        },
      }),
      prisma.contract.aggregate({
        where: { freelancerId: userId },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.review.aggregate({
        where: { subjectId: userId },
        _avg: { overallRating: true },
      }),
    ]);

    const completedContracts = await prisma.contract.count({
      where: { freelancerId: userId, status: 'COMPLETED' },
    });

    // --- Success rate: only count terminal states (not ACTIVE/PENDING) ---
    // ACTIVE and PENDING contracts are still in progress and shouldn't
    // penalise the freelancer's success rate.
    const terminalContracts = await prisma.contract.count({
      where: {
        freelancerId: userId,
        status: { in: ['COMPLETED', 'CANCELLED', 'DISPUTED'] },
      },
    });

    const totalEarnings  = Number(contractStats._sum.totalAmount ?? 0);
    const rawAvgRating   = reviewAgg._avg.overallRating != null
      ? Number(reviewAgg._avg.overallRating)
      : null;
    const successRate    = terminalContracts > 0
      ? (completedContracts / terminalContracts) * 100
      : 0;

    // --- Avg job duration (days) from completed contracts ---
    const completedWithDates = await prisma.contract.findMany({
      where: {
        freelancerId: userId,
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      select: { createdAt: true, completedAt: true },
    });

    let avgJobDurationDays = 0;
    if (completedWithDates.length > 0) {
      const totalDays = completedWithDates.reduce((sum, c) => {
        const created = new Date(c.createdAt).getTime();
        const completed = new Date(c.completedAt!).getTime();
        return sum + (completed - created) / (1000 * 60 * 60 * 24);
      }, 0);
      avgJobDurationDays = Math.round((totalDays / completedWithDates.length) * 100) / 100;
    }

    // --- Rehire rate: % of distinct clients who hired this freelancer more than once ---
    const clientGroups = await prisma.contract.groupBy({
      by: ['clientId'],
      where: {
        freelancerId: userId,
        status: 'COMPLETED',
      },
      _count: { id: true },
    });

    let rehireRate = 0;
    if (clientGroups.length > 0) {
      const repeatClients = clientGroups.filter(g => g._count.id > 1).length;
      rehireRate = Math.round((repeatClients / clientGroups.length) * 100 * 100) / 100;
    }

    // --- Primary skill: map DB category → model category ---
    const dbCategory   = profile?.skills?.[0]?.skill?.category ?? undefined;
    const primarySkill = dbCategory
      ? CATEGORY_TO_MODEL_SKILL[dbCategory] ?? undefined
      : undefined;

    // --- Experience years from work history ---
    const expYears = profile?.experience?.reduce((sum, exp) => {
      const start = new Date(exp.startDate).getTime();
      const end   = exp.endDate ? new Date(exp.endDate).getTime() : Date.now();
      return sum + (end - start) / (1000 * 60 * 60 * 24 * 365);
    }, 0) ?? 0;

    // --- Rating & satisfaction: use neutral defaults for unrated users ---
    // The model was trained on ratings 1-5.  Sending 0 for unrated users
    // artificially drags them to Beginner.  A neutral midpoint (3.0 / 0.5)
    // lets the model classify purely on experience, rate, and skill.
    const hasReviews        = rawAvgRating !== null;
    const rating            = hasReviews ? rawAvgRating : 3.0;
    const clientSatisfaction = hasReviews ? (rawAvgRating - 1) / 4 : 0.5;

    return {
      user_id:                userId,
      years_of_experience:    Math.max(0, Math.round(expYears * 10) / 10),
      hourly_rate_usd:        Number(profile?.hourlyRate ?? 0),
      rating,
      client_satisfaction:    clientSatisfaction,
      primary_skill:          primarySkill,
      completed_jobs:         completedContracts,
      earnings_usd:           totalEarnings,
      success_rate:           successRate,
      avg_rating:             rating,
      avg_job_duration_days:  avgJobDurationDays,
      rehire_rate:            rehireRate,
    };
  }

  private async callPredict(payload: PredictionRequest): Promise<PredictionResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`AI service responded ${response.status}`);
      }

      return response.json() as Promise<PredictionResponse>;
    } finally {
      clearTimeout(timer);
    }
  }

  // ─── Quiz Generation ───────────────────────────────────────────────────────

  async generateQuiz(skillName: string, category: string): Promise<QuizGenerateResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000); // 30s for AI generation

    try {
      const response = await fetch(`${this.baseUrl}/verify/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_name: skillName,
          category: category,
          num_questions: 10,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Quiz generation failed (${response.status}): ${errorBody}`);
      }

      return response.json() as Promise<QuizGenerateResult>;
    } finally {
      clearTimeout(timer);
    }
  }

  gradeQuiz(
    questions: QuestionFull[],
    answers: { question_id: string; selected_answer: string }[],
  ): GradeResult {
    // Grade locally — no need to call AI service for simple comparison
    let correctCount = 0;
    const answerMap = new Map(answers.map(a => [a.question_id, a.selected_answer]));

    for (const q of questions) {
      const selected = answerMap.get(q.id) ?? '';
      if (selected.toUpperCase() === q.correct_answer.toUpperCase()) {
        correctCount++;
      }
    }

    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    return {
      score,
      correct_count: correctCount,
      total_questions: questions.length,
      passed: score >= 70,
    };
  }
}

// ─── Quiz Types ────────────────────────────────────────────────────────────

export interface QuestionPublic {
  id: string;
  text: string;
  options: string[];
  difficulty: string;
}

export interface QuestionFull {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
}

export interface QuizGenerateResult {
  questions: QuestionPublic[];
  questions_full: QuestionFull[];
  time_limit_minutes: number;
  passing_score: number;
}

export interface GradeResult {
  score: number;
  correct_count: number;
  total_questions: number;
  passed: boolean;
}

export const aiService = new AiService();
export default aiService;

