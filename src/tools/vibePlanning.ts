// Vibe Planning tool for step-by-step planning

export interface VibePlanningInput {
  goal: string;
  context?: string;
  constraints?: string;
  thinkingBudget?: number; // Optional: controls reasoning depth if handled by server
  sessionId?: string;
}

export interface VibePlanningOutput {
  plan: Array<{
    step: string;
    rationale?: string;
    risks?: string[];
  }>;
  summary: string;
  thoughts?: string;
}

/**
 * The vibe_planning tool generates a step-by-step plan for a given goal/context.
 * This tool does not call Gemini directly; LLM logic is handled in the MCP server.
 */
export async function vibePlanningTool(input: VibePlanningInput): Promise<VibePlanningOutput> {
  // Validate input
  if (!input.goal) {
    throw new Error('Goal is required for planning.');
  }

  // Simple plan: split goal into steps by sentences or commas
  const steps = input.goal
    .split(/[.,;]/)
    .map(s => s.trim())
    .filter(Boolean)
    .map((step, idx) => ({
      step: `Step ${idx + 1}: ${step}`,
      rationale: 'This is a basic breakdown of the goal.',
      risks: []
    }));

  return {
    plan: steps,
    summary: 'This is a basic step-by-step plan based on the provided goal.',
    thoughts: 'No advanced reasoning applied. For richer plans, use the LLM via the MCP server.'
  };
}
