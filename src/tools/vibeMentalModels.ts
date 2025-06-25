// Vibe Mental Models tool for understanding and applying mental models

export interface VibeMentalModelsInput {
  query: string;
  context?: string;
  sessionId?: string;
  includeHistoricalMistakes?: boolean; // New field to optionally include historical mistakes
}

export interface VibeMentalModelsInput {
  query: string;
  thinkingLog?: string;
}

export interface VibeMentalModelsOutput {
  explanation?: string;
  suggestions?: string[];
  thoughts?: string;
}

import { getMistakes, MistakeEntry, STANDARD_CATEGORIES } from '../utils/storage.js';
import { parseThinking, ThinkingContext } from '../utils/context-parser.js';

/**
 * The vibe_mental_models tool helps in understanding, suggesting, and applying mental models.
 * This tool provides actionable insights and guidance on various mental models.
 */
export async function vibeMentalModelsTool(input: VibeMentalModelsInput): Promise<VibeMentalModelsOutput> {
  try {
    // Validate input
    if (!input.query) {
      throw new Error('Query is required for mental models tool.');
    }

    const { query, context, includeHistoricalMistakes, thinkingLog } = input;

    let thoughts = `Providing mental model guidance for query: "${query}".`;

    if (thinkingLog) {
      const parsedContext: ThinkingContext = parseThinking(thinkingLog);
      if (parsedContext.potentialConcerns && parsedContext.potentialConcerns.length > 0) {
        thoughts += ` Identified potential concerns from thinking log: ${parsedContext.potentialConcerns.join(', ')}.`;
      }
    }
    if (context) {
      thoughts += ` Context provided: "${context}".`;
    }

    if (includeHistoricalMistakes) {
      try {
        const mistakes = await getMistakes();
        if (mistakes && Object.keys(mistakes).length > 0) {
          thoughts += ` Historical mistakes considered.`;
          const mistakeCategories = Object.keys(mistakes);
          const suggestedModels: string[] = [];

          STANDARD_CATEGORIES.forEach(category => {
            if (mistakeCategories.includes(category)) {
              const mistakesForCategory = mistakes[category];
              if (mistakesForCategory && mistakesForCategory.length > 0) {
                const mistakeSummaries = mistakesForCategory.map((m: MistakeEntry) => `"${m.mistake}"`).join(', ');
                thoughts += ` Found historical mistakes in '${category}' category: ${mistakeSummaries}.`;
              }
              switch (category) {
                case 'Complex Solution Bias':
                  suggestedModels.push('Occam\'s Razor');
                  suggestedModels.push('First Principles Thinking');
                  break;
                case 'Feature Creep':
                  suggestedModels.push('Pareto Principle (80/20 Rule)');
                  suggestedModels.push('Prioritization Matrix');
                  break;
                case 'Premature Implementation':
                  suggestedModels.push('Think Slow, Act Fast');
                  suggestedModels.push('Iterative Design');
                  break;
                case 'Misalignment':
                  suggestedModels.push('Shared Mental Models');
                  suggestedModels.push('Communication Principles');
                  break;
                case 'Overtooling':
                  suggestedModels.push('Less Is More');
                  suggestedModels.push('Simplicity');
                  break;
                default:
                  // No specific mental models for 'Other' or unmapped categories
                  break;
              }
            }
          });

          if (suggestedModels.length > 0) {
            thoughts += ` Based on your historical mistakes, consider exploring these mental models: ${suggestedModels.join(', ')}.`;
          } else {
            thoughts += ` No specific mental model suggestions based on historical mistake categories.`;
          }
        } else {
          thoughts += ` No historical mistakes found.`;
        }
      } catch (error: any) {
        thoughts += ` Error fetching historical mistakes: ${error.message}.`;
      }
    }

    if (!input.query || input.query.trim() === '') {
      // Default or 'suggest' behavior: provide a comprehensive list of mental models
      return {
        explanation: "To effectively leverage mental models, consider the following actionable strategies and common models:\n\n**General Strategy for Application:**\n1.  **Define the Problem:** Clearly articulate the challenge or decision at hand.\n2.  **Scan for Relevance:** Review various mental models and identify those that might offer a useful lens for your specific situation.\n3.  **Apply & Analyze:** Use the chosen model's framework to dissect the problem, asking the questions it prompts.\n4.  **Synthesize & Act:** Integrate insights from different models if beneficial, and formulate a robust plan or decision.\n\n**Key Mental Models & Their Actionable Use:**\n- **First Principles Thinking:** Break down complex problems to fundamental truths. *Action: Ask 'Why?' repeatedly to uncover core components, then rebuild solutions from scratch.*\n- **Inversion:** Think backward from undesired outcomes to identify and avoid pitfalls. *Action: Define worst-case scenarios, then list actions that lead to them, and avoid those actions.*\n- **Occam's Razor:** Choose the simplest explanation that fits the facts. *Action: When faced with multiple theories, favor the one with the fewest assumptions.*\n- **Systems Thinking:** Understand how interconnected parts influence a whole system. *Action: Map out system components and their interactions to predict ripple effects.*\n- **Second-Order Thinking:** Consider the consequences of consequences. *Action: Beyond immediate effects, anticipate future impacts and unintended side effects.*\n- **Opportunity Cost:** Recognize the value of the next best alternative foregone. *Action: Before making a choice, explicitly identify what you are giving up.*\n- **Margin of Safety:** Build in buffer for errors, unknowns, or adverse events. *Action: Always plan with a cushion, whether in time, resources, or assumptions.*\n- **Feedback Loops:** Understand how outputs re-enter a system as inputs. *Action: Identify positive (amplifying) and negative (stabilizing) loops in any process.*\n- **Pareto Principle (80/20 Rule):** Roughly 80% of effects come from 20% of causes. *Action: Identify the vital few inputs that produce the majority of results.*\n- **Compounding:** The process of generating returns on previous returns. *Action: Apply consistent, small efforts over time for disproportionately large long-term gains.*\n\nFor a concise definition of a specific model, query it directly (e.g., 'First Principles', 'Inversion', 'Occam\'s Razor').",
        thoughts: thoughts
      };
    } else if (input.query.toLowerCase().includes('first principles')) {
      return {
        explanation: "**First Principles Thinking:** Deconstruct a problem to its basic, irreducible components. Ask 'Why?' repeatedly until you reach fundamental truths. Then, build up solutions from these truths, rather than reasoning by analogy. This helps in innovation and solving complex problems from scratch. For more, see the general suggestions.",
        thoughts: 'Provided concise definition for First Principles Thinking.'
      };
    } else if (input.query.toLowerCase().includes('inversion')) {
      return {
        explanation: "**Inversion:** Think backward from undesired outcomes to identify and avoid pitfalls. Instead of focusing on how to achieve a desired outcome, consider what would cause the opposite (undesired) outcome and then work to avoid it. For more, see the general suggestions.",
        thoughts: 'Provided concise definition for Inversion.'
      };
    } else if (input.query.toLowerCase().includes('occam\'s razor')) {
      return {
        explanation: "**Occam's Razor:** When faced with competing hypotheses, choose the simplest explanation that fits the facts. This principle promotes simplicity and clarity by removing unnecessary complexity. For more, see the general suggestions.",
        thoughts: 'Provided concise definition for Occam\'s Razor.'
      };
    } else if (input.query.toLowerCase().includes('systems thinking')) {
      return {
        explanation: "**Systems Thinking:** Understand how interconnected parts influence a whole system. This approach helps in grasping complex interactions and anticipating unintended consequences. For more, see the general suggestions.",
        thoughts: 'Provided concise definition for Systems Thinking.'
      };
    } else if (input.query.toLowerCase().includes('second-order thinking')) {
      return {
        explanation: "**Second-Order Thinking:** Look beyond immediate effects to anticipate future impacts and ripple effects. This involves considering the consequences of consequences. For more, see the general suggestions.",
        thoughts: 'Provided concise definition for Second-Order Thinking.'
      };
    } else if (input.query.toLowerCase().includes('opportunity cost')) {
      return {
        explanation: "**Opportunity Cost:** The value of the next best alternative that must be foregone when making a choice. Understanding this helps in making more informed decisions by weighing trade-offs. For more, see the general suggestions.",
        thoughts: 'Provided concise definition for Opportunity Cost.'
      };
    } else if (input.query.toLowerCase().includes('margin of safety')) {
      return {
        explanation: "**Margin of Safety:** Building in a buffer for errors, unknowns, or adverse events. This principle is crucial in engineering, finance, and planning to reduce risk. For more, see the general suggestions.",
        thoughts: 'Provided concise definition for Margin of Safety.'
      };
    } else if (input.query.toLowerCase().includes('feedback loops')) {
      return {
        explanation: "**Feedback Loops:** A process where outputs of a system are routed back as inputs, influencing future outputs. Can be positive (amplifying) or negative (stabilizing). For more, see the general suggestions.",
        thoughts: 'Provided concise definition for Feedback Loops.'
      };
    } else if (input.query.toLowerCase().includes('pareto principle') || input.query.toLowerCase().includes('80/20 rule')) {
      return {
        explanation: "**Pareto Principle (80/20 Rule):** States that roughly 80% of effects come from 20% of causes. Useful for prioritizing efforts to maximize impact. For more, see the general suggestions.",
        thoughts: 'Provided concise definition for Pareto Principle.'
      };
    } else if (input.query.toLowerCase().includes('compounding')) {
      return {
        explanation: "**Compounding:** The process of generating returns on previous returns, leading to exponential growth. Applies to finance, knowledge, and skills. For more, see the general suggestions.",
        thoughts: 'Provided concise definition for Compounding.'
      };
    } else {
      return {
        explanation: `No specific mental model found for "${input.query}" in the current knowledge base. Consider refining your query or viewing the general suggestions for a comprehensive list.`, 
        thoughts: 'No specific mental model matched the query. Suggesting refinement or general list.'
      };
    }
  } catch (error) {
    throw error;
  }
}
