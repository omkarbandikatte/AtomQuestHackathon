/**
 * Groq AI Service — server-side only.
 * All AI calls go through server actions to keep the API key safe.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70B-versatile";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callGroq(messages: ChatMessage[], temperature = 0.7): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── 1. AI Goal Writing Assistant ────────────────────────────

export interface AISuggestedGoal {
  title: string;
  description: string;
  uom_type: string;
  target_value: number | null;
  target_date: string | null;
  weightage: number;
  thrust_area: string;
  kpi: string;
  timeline: string;
}

export async function generateGoalFromIntent(intent: string): Promise<AISuggestedGoal> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are an expert HR goal-setting assistant. Given an employee's intent, generate a SMART goal.
Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "title": "Specific, measurable goal statement",
  "description": "Brief description of what this goal entails",
  "uom_type": "numeric_min" | "numeric_max" | "timeline" | "zero",
  "target_value": number or null (for timeline goals),
  "target_date": "YYYY-MM-DD" or null (for numeric goals),
  "weightage": 20,
  "thrust_area": "Category like Quality, Efficiency, Growth, etc.",
  "kpi": "Key Performance Indicator to track",
  "timeline": "Suggested timeline e.g. By end of Q3"
}
UoM types explained:
- numeric_min: higher is better (e.g., increase sales by X)
- numeric_max: lower is better (e.g., reduce bugs to X)
- timeline: goal is a date-based milestone
- zero: binary (done/not done)`,
    },
    {
      role: "user",
      content: `Generate a SMART goal for this intent: "${intent}"`,
    },
  ];

  const response = await callGroq(messages, 0.6);
  const cleaned = response.replace(/```json\n?|```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

// ── 2. AI Goal Quality Scoring ──────────────────────────────

export interface GoalQualityScore {
  overall_score: number;
  specific: { score: number; feedback: string };
  measurable: { score: number; feedback: string };
  achievable: { score: number; feedback: string };
  relevant: { score: number; feedback: string };
  time_bound: { score: number; feedback: string };
  suggestions: string[];
}

export async function scoreGoalQuality(
  title: string,
  description: string | undefined,
  targetValue: number | null,
  targetDate: string | null,
  uomType: string,
): Promise<GoalQualityScore> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a goal quality analyst. Score a goal on SMART criteria (each 0-100).
Return ONLY valid JSON (no markdown):
{
  "overall_score": number (0-100),
  "specific": { "score": number, "feedback": "one sentence" },
  "measurable": { "score": number, "feedback": "one sentence" },
  "achievable": { "score": number, "feedback": "one sentence" },
  "relevant": { "score": number, "feedback": "one sentence" },
  "time_bound": { "score": number, "feedback": "one sentence" },
  "suggestions": ["improvement suggestion 1", "suggestion 2"]
}`,
    },
    {
      role: "user",
      content: `Score this goal:
Title: ${title}
Description: ${description || "None provided"}
Target: ${targetValue ?? targetDate ?? "Not specified"}
Measurement: ${uomType}`,
    },
  ];

  const response = await callGroq(messages, 0.3);
  const cleaned = response.replace(/```json\n?|```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

// ── 3. AI Quarterly Summary Generator ───────────────────────

export interface QuarterlySummary {
  progress_summary: string;
  achievements: string[];
  risks: string[];
  suggested_feedback: string;
  overall_rating: string;
}

export async function generateQuarterlySummary(
  employeeName: string,
  goals: { title: string; weightage: number; progress: number; status: string }[],
  quarter: string,
): Promise<QuarterlySummary> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a performance review assistant. Generate a quarterly summary for a manager reviewing an employee.
Return ONLY valid JSON (no markdown):
{
  "progress_summary": "2-3 sentence overview",
  "achievements": ["achievement 1", "achievement 2"],
  "risks": ["risk 1", "risk 2"],
  "suggested_feedback": "Constructive feedback paragraph",
  "overall_rating": "Exceeds Expectations | Meets Expectations | Needs Improvement"
}`,
    },
    {
      role: "user",
      content: `Generate ${quarter} summary for ${employeeName}:
Goals:
${goals.map((g) => `- ${g.title} (${g.weightage}%): ${g.progress}% complete, status: ${g.status}`).join("\n")}`,
    },
  ];

  const response = await callGroq(messages, 0.5);
  const cleaned = response.replace(/```json\n?|```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

// ── 4. Intelligent Risk Detection ───────────────────────────

export interface RiskAssessment {
  risk_level: "low" | "medium" | "high" | "critical";
  risk_score: number;
  factors: string[];
  recommendation: string;
}

export async function assessGoalRisk(
  title: string,
  progress: number,
  quarter: string,
  totalQuarters: number,
  missedCheckins: number,
): Promise<RiskAssessment> {
  const expectedProgress = (["Q1", "Q2", "Q3", "Q4"].indexOf(quarter) + 1) * 25;
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a risk assessment AI. Analyze a goal's risk of failure.
Return ONLY valid JSON (no markdown):
{
  "risk_level": "low" | "medium" | "high" | "critical",
  "risk_score": number (0-100, higher = more risky),
  "factors": ["factor 1", "factor 2"],
  "recommendation": "one sentence action recommendation"
}`,
    },
    {
      role: "user",
      content: `Assess risk for:
Goal: ${title}
Current Progress: ${progress}%
Expected Progress: ${expectedProgress}%
Current Quarter: ${quarter}
Missed Check-ins: ${missedCheckins}`,
    },
  ];

  const response = await callGroq(messages, 0.3);
  const cleaned = response.replace(/```json\n?|```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

// ── 6. AI Performance Insights ──────────────────────────────

export interface PerformanceInsight {
  insights: string[];
  top_performers: string[];
  areas_of_concern: string[];
  recommendations: string[];
}

export async function generatePerformanceInsights(
  departmentData: { department: string; completion: number; onTime: number; avgScore: number }[],
): Promise<PerformanceInsight> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a performance analytics AI. Analyze department data and generate actionable insights.
Return ONLY valid JSON (no markdown):
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "top_performers": ["top department/observation 1"],
  "areas_of_concern": ["concern 1"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`,
    },
    {
      role: "user",
      content: `Analyze this performance data:
${departmentData.map((d) => `${d.department}: ${d.completion}% completion, ${d.onTime}% on-time, avg score ${d.avgScore}`).join("\n")}`,
    },
  ];

  const response = await callGroq(messages, 0.5);
  const cleaned = response.replace(/```json\n?|```\n?/g, "").trim();
  return JSON.parse(cleaned);
}
