// Vibe Planning tool for step-by-step planning
import { parseThinking, ThinkingContext } from '../utils/context-parser.js';
import { getMistakes, MistakeEntry, STANDARD_CATEGORIES } from '../utils/storage.js';

export interface VibePlanningInput {
  goal: string;
  context?: string;
  constraints?: string[];
  thinkingLog?: string; // Added to incorporate user's thought process
  thinkingBudget?: number; // Optional: controls reasoning depth if handled by server
  sessionId?: string;
  includeHistoricalMistakes?: boolean;
}

export interface VibePlanningOutput {
  plan: Array<{ step: string; rationale?: string; risks?: string[] }>;
  summary: string;
  risks?: string[];
  thoughts?: string;
}

/**
 * The vibe_planning tool generates a step-by-step plan for a given goal/context.
 * This tool provides actionable insights and guidance for achieving a goal.
 */
export async function vibePlanningTool(input: VibePlanningInput): Promise<VibePlanningOutput> {
  try {
    // Validate input
    if (!input.goal) {
      throw new Error('Goal is required for planning.');
    }

    const { goal, context, constraints, thinkingLog, includeHistoricalMistakes } = input;

    const generatedPlan: Array<{ step: string; rationale?: string; risks?: string[] }> = [];
    let summary = `A detailed plan for achieving the goal: "${goal}".`;
    let thoughts = `Generating a plan for query: "${goal}".`;
    const risks: string[] = [];

    if (includeHistoricalMistakes) {
      try {
        const mistakes = await getMistakes();
        if (mistakes && Object.keys(mistakes).length > 0) {
          thoughts += ` Historical mistakes considered.`;
          const mistakeCategories = Object.keys(mistakes);
          const relevantMistakeCategories: string[] = [];

          STANDARD_CATEGORIES.forEach(category => {
            if (mistakeCategories.includes(category)) {
              relevantMistakeCategories.push(category);
            }
          });

          if (relevantMistakeCategories.length > 0) {
            risks.push(`Past mistakes related to: ${relevantMistakeCategories.join(', ')}. Consider these during planning.`);
          } else {
            thoughts += ` No specific historical mistake categories found relevant to planning.`;
          }
        } else {
          thoughts += ` No historical mistakes found.`;
        }
      } catch (error: any) {
        thoughts += ` Error fetching historical mistakes: ${error.message}.`;
      }
    }

    let extractedConcerns: string[] = [];
    if (thinkingLog) {
      const parsedContext: ThinkingContext = parseThinking(thinkingLog);
      if (parsedContext.potentialConcerns && parsedContext.potentialConcerns.length > 0) {
        extractedConcerns = parsedContext.potentialConcerns;
        thoughts += ` Identified potential concerns from thinking log: ${extractedConcerns.join(', ')}.`;
      }
    }

    // Step 1: Understand and Define the Goal
    generatedPlan.push({
      step: `Clearly define the goal: "${goal}"`, 
      rationale: `Ensures everyone involved has a shared understanding of what needs to be achieved.`, 
      risks: ['Misinterpretation of goal', 'Scope creep if not well-defined', ...extractedConcerns]
    });

    // Step 2: Break Down the Goal into Smaller Tasks
    const exampleTasks = [
      `Identify key components of "${goal}"`, 
      `Research best practices for "${goal}"`, 
      `Allocate resources for "${goal}"`, 
      `Set up a timeline for "${goal}"`
    ];

    generatedPlan.push({
      step: `Break down "${goal}" into manageable sub-tasks`, 
      rationale: `Large goals can be overwhelming; breaking them down makes them actionable and trackable.`, 
      risks: ['Over-segmentation leading to complexity', 'Under-segmentation leading to large, unmanageable tasks']
    });

    // Add some dynamic tasks based on keywords or context
    exampleTasks.forEach((task, index) => {
      generatedPlan.push({
        step: task, 
        rationale: `Specific actions derived from the goal's nature.`, 
        risks: [`Dependency on external factors for task ${index + 1}`]
      });
    });

    // Step 3: Identify Resources and Dependencies
    generatedPlan.push({
      step: `Identify all necessary resources (e.g., personnel, tools, budget) and external dependencies`, 
      rationale: `Ensures all prerequisites are met before execution begins.`, 
      risks: ['Underestimation of required resources', 'Unforeseen external dependencies']
    });

    // Step 4: Develop a Timeline and Milestones
    generatedPlan.push({
      step: `Establish a realistic timeline with clear milestones for each phase of "${goal}"`, 
      rationale: `Provides a roadmap and allows for progress tracking.`, 
      risks: ['Unrealistic deadlines', 'Delays in one milestone impacting subsequent ones']
    });

    // Step 5: Execute the Plan
    generatedPlan.push({
      step: `Execute the plan, focusing on one task at a time or in parallel as appropriate`, 
      rationale: `The active phase where all preparatory work is put into action.`, 
      risks: ['Lack of focus', 'Unexpected obstacles during execution']
    });

    // Step 6: Monitor Progress and Adapt
    generatedPlan.push({
      step: `Continuously monitor progress, gather feedback, and adapt the plan as needed`, 
      rationale: `Flexibility is key; plans often need adjustments based on real-world feedback.`, 
      risks: ['Resistance to change', 'Ignoring early warning signs']
    });

    // Add notes about context and constraints if provided
    if (context) {
      summary += ` The plan takes into account the context: "${context}".`;
      thoughts += ` Context considered: "${context}".`;
    }
    if (constraints && constraints.length > 0) {
      summary += ` It also addresses the constraints: "${constraints.join(', ')}".`;
      thoughts += ` Constraints addressed: "${constraints.join(', ')}".`;
    }

    // Incorporate extracted concerns into risks if any
    if (extractedConcerns.length > 0) {
      risks.push(...extractedConcerns.map(concern => `Potential concern from thinking log: ${concern}`));
    }

    return {
      plan: generatedPlan,
      summary: summary,
      risks: risks.length > 0 ? risks : undefined,
      thoughts: thoughts,
    };
  } catch (error: any) {
    throw new Error(`An error occurred during planning: ${error.message}`);
  }
}
