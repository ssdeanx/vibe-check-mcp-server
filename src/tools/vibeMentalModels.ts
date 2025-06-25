// Vibe Mental Models tool for understanding and applying mental models

export interface VibeMentalModelsInput {
  query: string;
  context?: string;
  sessionId?: string;
  includeHistoricalMistakes?: boolean;
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

// Define mental model registry
const MENTAL_MODEL_REGISTRY: Record<string, string> = {
  'first principles': '**First Principles Thinking:** Break problems to fundamental truths. *Action: Ask \"Why?\" 5 times to reach core truths, then rebuild solutions.*',
  'inversion': '**Inversion:** Think backwards from failure. *Action: Ask \"What would guarantee failure?\" then avoid those paths.*',
  "occam's razor": "**Occam's Razor:** When faced with competing hypotheses, choose the simplest explanation that fits the facts. This principle promotes simplicity and clarity by removing unnecessary complexity.",
  'systems thinking': '**Systems Thinking:** Understand how interconnected parts influence a whole system. This approach helps in grasping complex interactions and anticipating unintended consequences.',
  'second-order thinking': '**Second-Order Thinking:** Consider the consequences of consequences. *Action: Always ask \"And then what?\" to anticipate ripple effects.*',
  'opportunity cost': '**Opportunity Cost:** The value of the next best alternative that must be foregone when making a choice. Understanding this helps in making more informed decisions by weighing trade-offs.',
  'margin of safety': '**Margin of Safety:** Building in a buffer for errors, unknowns, or adverse events. This principle is crucial in engineering, finance, and planning to reduce risk.',
  'feedback loops': '**Feedback Loops:** A process where outputs of a system are routed back as inputs, influencing future outputs. Can be positive (amplifying) or negative (stabilizing).',
  'pareto principle': '**Pareto Principle (80/20 Rule):** States that roughly 80% of effects come from 20% of causes. Useful for prioritizing efforts to maximize impact.',
  'compounding': '**Compounding:** The process of generating returns on previous returns, leading to exponential growth. Applies to finance, knowledge, and skills.',
  'probabilistic thinking': '**Probabilistic Thinking:** Estimate likelihoods of outcomes and make decisions based on probability. *Action: Assign rough probabilities to possible outcomes, then focus on high-probability/high-impact scenarios.*',
  "hanlon's razor": "**Hanlon's Razor:** Never attribute to malice what can be adequately explained by neglect or incompetence. *Action: Assume good faith first, especially when interpreting others' actions.*",
  'Scientific Method': '**Scientific Method:** Formulate hypotheses and test them systematically. *Action: When debugging, write down your assumptions and design experiments to test each one.*',
  'Four Stages of Competence': '**Four Stages of Competence:** 1) Unconscious Incompetence, 2) Conscious Incompetence, 3) Conscious Competence, 4) Unconscious Competence. *Action: Identify your current stage to guide learning.*',
  'Critical Thinking': '**Critical Thinking:** Question assumptions and evaluate evidence objectively. *Action: When debugging, challenge your initial assumptions about where the problem might be.*',
  'Divide and Conquer': '**Divide and Conquer:** Break problems into smaller, manageable parts. *Action: Isolate components or subsystems to narrow down the source of issues.*',
  'Binary Search': '**Binary Search:** Efficiently locate problems by repeatedly dividing the search space. *Action: Use in debugging to quickly isolate problematic code sections.*',
  'Debugging Mindset': '**Debugging Mindset:** Adopt a structured approach: 1) Reproduce, 2) Isolate, 3) Analyze, 4) Fix, 5) Verify. *Action: Follow this workflow for systematic debugging.*',
  'RAI Dashboard': '**RAI Dashboard:** Use Responsible AI tools to analyze model behavior. *Action: For ML systems, leverage tools like error analysis and feature importance.*',
  'Convex Optimization': '**Convex Optimization:** Frame problems as convex optimization when possible for efficient solutions. *Action: Use for performance-critical systems where optimal solutions are required.*',
  'Memory Profiling': '**Memory Profiling:** Use tools to identify memory allocation patterns and detect potential memory leaks. *Action: Regularly profile memory usage to prevent memory-related issues.*',
};

// Enhanced scenario-based matching with professional-grade coverage
function findRelevantModels(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  
  // Debugging scenarios (expanded keywords)
  if (/(debug|bug|error|issue|crashe?|leak|fault|defect|exception|trace|stack|memory|profiling)/.test(lowerQuery)) {
    return [
      'Systems Thinking: Analyze interactions between components',
      'Root Cause Analysis: Identify underlying causes, not symptoms',
      'Margin of Safety: Add buffers for unexpected failures',
      'Binary Search: Efficiently isolate problematic code sections',
      'Debugging Mindset: Follow structured 5-step workflow',
      'Memory Profiling: Use tools to identify memory allocation patterns'
    ];
  }
  // Performance scenarios (expanded keywords)
  if (/(perf|slow|speed|optimization|bottleneck|latency|throughput|scalability)/.test(lowerQuery)) {
    return [
      'Pareto Principle (80/20 Rule): Focus on high-impact optimizations',
      'Opportunity Cost: Consider tradeoffs of optimization efforts',
      'Feedback Loops: Instrument metrics to measure optimization impact',
      'Diminishing Returns: Recognize when optimization isn\'t worth effort'
    ];
  }
  // Design scenarios (expanded keywords)
  if (/(design|architect|structure|blueprint|model|pattern|framework)/.test(lowerQuery)) {
    return [
      'First Principles Thinking: Break down to fundamental truths',
      'Inversion: Avoid worst-case scenarios from the start',
      'Occam\'s Razor: Prefer simpler designs',
      'Modularity: Build independent, interchangeable components'
    ];
  }
  
  // Fallback to keyword matching
  const matchedModels = Object.keys(MENTAL_MODEL_REGISTRY).filter(model => 
    lowerQuery.includes(model)
  );
  
  return matchedModels.length > 0 ? matchedModels : [];
}

// Updated tool implementation
export async function vibeMentalModelsTool(input: VibeMentalModelsInput): Promise<VibeMentalModelsOutput> {
  try {
    if (!input.query) throw new Error('Query is required.');
    
    const lowerCaseQuery = input.query.toLowerCase();
    let thoughts = `Providing mental model guidance for query: "${input.query}".`;
    
    // Process context and thinking log
    if (input.context) thoughts += ` Context: "${input.context}".`;
    if (input.thinkingLog) {
      const parsedContext = parseThinking(input.thinkingLog);
      if (parsedContext.potentialConcerns?.length) {
        thoughts += ` Concerns: ${parsedContext.potentialConcerns.join(', ')}.`;
      }
    }
    
    // Handle historical mistakes
    if (input.includeHistoricalMistakes) {
      try {
        const mistakes = await getMistakes();
        if (mistakes && Object.keys(mistakes).length > 0) {
          thoughts += ' Historical mistakes considered.';
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
          return {
            explanation: `No historical mistakes found for the given query: "${input.query}".`,
            thoughts: thoughts
          };
        }
      } catch (error: unknown) {
        thoughts += ` Error fetching historical mistakes: ${(error as Error).message}.`;
        return {
          explanation: `An error occurred while fetching historical mistakes: ${(error as Error).message}`,
          thoughts: thoughts
        };
      }
    }

    // Handle different query types
    if (!input.query.trim() || /list all|suggest|all mental models/i.test(input.query)) {
      const GENERAL_EXPLANATION = `To effectively apply mental models:

1. **Define**: Clearly state your problem/goal
2. **Select**: Choose 1-3 relevant models (${Object.keys(MENTAL_MODEL_REGISTRY).slice(0,5).join(', ')}...)
3. **Apply**: Use the model\'s lens to analyze
4. **Synthesize**: Combine insights into action
5. **Review**: Reflect on outcomes to improve

Key models include:\n- ${Object.keys(MENTAL_MODEL_REGISTRY).join('\n- ')}`;
      return {
        explanation: GENERAL_EXPLANATION,
        thoughts
      };
    } 
    
    // Find relevant models using improved matching
    const matchedModels = findRelevantModels(input.query);
    
    if (matchedModels.length > 0) {
      const explanations = matchedModels.join('\n- ');
      
      return {
        explanation: `For your scenario, apply these mental models:\n- ${explanations}`,
        thoughts: `Found ${matchedModels.length} relevant models for your scenario.`
      };
    }
    
    // Fallback for unknown models
    return {
      explanation: `No specific mental model found for "${input.query}". Try "list all mental models" for options.`,
      thoughts: 'No specific match. Suggesting general list.'
    };
    
  } catch (error) {
    return {
      explanation: `Error: ${(error as Error).message}`,
      thoughts: 'Processing error occurred.'
    };
  }
}
