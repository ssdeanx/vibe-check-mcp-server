#!/usr/bin/env node

// Import dotenv and configure it
import dotenv from 'dotenv';
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

// Import tool implementations
import { vibeCheckTool, VibeCheckInput, VibeCheckOutput } from './tools/vibeCheck.js';
import { vibeDistillTool, VibeDistillInput, VibeDistillOutput } from './tools/vibeDistill.js';
import { vibeLearnTool, VibeLearnInput, VibeLearnOutput } from './tools/vibeLearn.js';
import { vibePlanningTool, VibePlanningInput, VibePlanningOutput } from './tools/vibePlanning.js';

import { vibeMentalModelsTool, VibeMentalModelsInput, VibeMentalModelsOutput } from './tools/vibeMentalModels.js';

// Import Gemini integration
import { initializeGemini } from './utils/gemini.js';
import { STANDARD_CATEGORIES } from './utils/storage.js';




// Validate API key at startup
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("ERROR: GEMINI_API_KEY environment variable is missing. Server cannot start without a valid API key.");
  process.exit(1);
} else {
  console.error("GEMINI_API_KEY found. Initializing API...");
  try {
    initializeGemini(apiKey);
    console.error('Gemini API initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Gemini API:', error);
    process.exit(1);
  }
}

/**
 * Create the MCP server with appropriate capabilities
 */
const server = new Server(
  {
    name: "vibe-check",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("Received tools/list request");
  const response = {
    tools: [
      {
        name: "vibe_check",
        description: "Metacognitive questioning tool that identifies assumptions and breaks tunnel vision to prevent cascading errors",
        inputSchema: {
          type: "object",
          properties: {
            plan: {
              type: "string",
              description: "Current plan or thinking"
            },
            userRequest: {
              type: "string",
              description: "Original user request - critical for alignment checking"
            },
            thinkingLog: {
              type: "string",
              description: "Raw sequential thinking transcript"
            },
            availableTools: {
              type: "array",
              items: {
                type: "string"
              },
              description: "List of available MCP tools"
            },
            focusAreas: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Optional specific focus areas"
            },
            sessionId: {
              type: "string",
              description: "Optional session ID for state management"
            },
            previousAdvice: {
              type: "string",
              description: "Previous feedback to avoid repetition and ensure progression"
            },
            phase: {
              type: "string",
              enum: ["planning", "implementation", "review"],
              description: "Current project phase for context-appropriate feedback"
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Agent's confidence level (0-1)"
            }
          },
          required: ["plan", "userRequest"] // userRequest now required
        }
      },
      {
        name: "vibe_distill",
        description: "Plan simplification tool that reduces complexity and extracts essential elements to prevent over-engineering",
        inputSchema: {
          type: "object",
          properties: {
            plan: {
              type: "string",
              description: "The plan to distill"
            },
            userRequest: {
              type: "string",
              description: "Original user request"
            },
            sessionId: {
              type: "string",
              description: "Optional session ID for state management"
            }
          },
          required: ["plan", "userRequest"] // userRequest now required
        }
      },
      {
        name: "vibe_learn",
        description: "Pattern recognition system that tracks common errors and solutions to prevent recurring issues",
        inputSchema: {
          type: "object",
          properties: {
            mistake: {
              type: "string",
              description: "One-sentence description of the mistake"
            },
            category: {
              type: "string",
              description: `Category of mistake (standard categories: ${STANDARD_CATEGORIES.join(', ')})`,
              enum: STANDARD_CATEGORIES
            },
            solution: {
              type: "string",
              description: "How it was corrected (one sentence)"
            },
            sessionId: {
              type: "string",
              description: "Optional session ID for state management"
            }
          },
          required: ["mistake", "category", "solution"]
        }
      },
      {
        name: "vibe_planning",
        description: "Step-by-step planning tool that breaks down complex goals into actionable steps",
        inputSchema: {
          type: "object",
          properties: {
            goal: {
              type: "string",
              description: "The goal to plan for"
            },
            context: {
              type: "string",
              description: "Optional context for the planning"
            },
            constraints: {
              type: "string",
              description: "Optional constraints for the planning"
            },
            thinkingBudget: {
              type: "number",
              description: "Optional: controls reasoning depth if handled by server"
            },
            sessionId: {
              type: "string",
              description: "Optional session ID for state management"
            }
          },
          required: ["goal"]
        }
      },
      {
      },
      {
        name: "vibe_mental_models",
        description: "Tool for understanding and applying mental models",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The query for the mental models tool (e.g., 'explain first principles', 'suggest mental models')"
            },
            context: {
              type: "string",
              description: "Optional context for the mental models query"
            },
            sessionId: {
              type: "string",
              description: "Optional session ID for state management"
            }
          },
          required: ["query"]
        }
      }
    ]
  };
  console.error(`Responding with ${response.tools.length} tools`);
  return response;
});

/**
 * Handler for tool invocation
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error(`Received tools/call request for tool: ${request.params.name}`);
  
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case "vibe_check": {
      // Validate required userRequest
      if (!args || !args.userRequest || typeof args.userRequest !== 'string' || args.userRequest.trim() === '') {
        console.error("Invalid vibe_check request: missing userRequest");
        throw new McpError(
          ErrorCode.InvalidParams,
          'FULL user request is required for alignment checking and to prevent bias'
        );
      }
      
      // Fix type casting error - convert args to the correct interface
      const input: VibeCheckInput = {
        plan: typeof args.plan === 'string' ? args.plan : '',
        userRequest: args.userRequest,
        thinkingLog: typeof args.thinkingLog === 'string' ? args.thinkingLog : undefined,
        availableTools: Array.isArray(args.availableTools) ? args.availableTools : undefined,
        focusAreas: Array.isArray(args.focusAreas) ? args.focusAreas : undefined,
        sessionId: typeof args.sessionId === 'string' ? args.sessionId : undefined,
        previousAdvice: typeof args.previousAdvice === 'string' ? args.previousAdvice : undefined,
        phase: ['planning', 'implementation', 'review'].includes(args.phase as string) ? 
          args.phase as 'planning' | 'implementation' | 'review' : undefined,
        confidence: typeof args.confidence === 'number' ? args.confidence : undefined
      };
      
      console.error("Executing vibe_check tool...");
      const result = await vibeCheckTool(input);
      console.error("vibe_check execution complete");
      
      return {
        content: [
          {
            type: "text",
            text: formatVibeCheckOutput(result)
          }
        ]
      };
    }
    
    case "vibe_distill": {
      // Validate required parameters
      if (!args || typeof args.plan !== 'string') {
        console.error("Invalid vibe_distill request: missing plan");
        throw new McpError(
          ErrorCode.InvalidParams,
          'Invalid input: plan is required and must be a string'
        );
      }
      
      // Validate required userRequest
      if (!args.userRequest || typeof args.userRequest !== 'string' || args.userRequest.trim() === '') {
        console.error("Invalid vibe_distill request: missing userRequest");
        throw new McpError(
          ErrorCode.InvalidParams,
          'FULL user request is required for proper distillation and alignment'
        );
      }
      
      // Create a properly typed input
      const input: VibeDistillInput = {
        plan: args.plan,
        userRequest: args.userRequest,
        sessionId: typeof args.sessionId === 'string' ? args.sessionId : undefined
      };
      
      console.error("Executing vibe_distill tool...");
      const result = await vibeDistillTool(input);
      console.error("vibe_distill execution complete");
      
      return {
        content: [
          {
            type: "text",
            text: formatVibeDistillOutput(result)
          }
        ]
      };
    }
    
    case "vibe_learn": {
      if (!args || 
          typeof args.mistake !== 'string' || 
          typeof args.category !== 'string' || 
          typeof args.solution !== 'string') {
        console.error("Invalid vibe_learn request: missing required parameters");
        throw new McpError(
          ErrorCode.InvalidParams,
          'Invalid input: mistake, category, and solution are required and must be strings'
        );
      }
      
      // Create a properly typed input
      const input: VibeLearnInput = {
        mistake: args.mistake,
        category: args.category,
        solution: args.solution,
        sessionId: typeof args.sessionId === 'string' ? args.sessionId : undefined
      };
      
      console.error("Executing vibe_learn tool...");
      const result = await vibeLearnTool(input);
      console.error("vibe_learn execution complete");
      
      return {
        content: [
          {
            type: "text",
            text: formatVibeLearnOutput(result)
          }
        ]
      };
    }

    case "vibe_planning": {
      if (!args || typeof args.goal !== 'string') {
        console.error("Invalid vibe_planning request: missing goal");
        throw new McpError(
          ErrorCode.InvalidParams,
          'Invalid input: goal is required and must be a string'
        );
      }

      const input: VibePlanningInput = {
        goal: args.goal,
        context: typeof args.context === 'string' ? args.context : undefined,
        constraints: Array.isArray(args.constraints) ? args.constraints.filter((c: any) => typeof c === 'string') : (typeof args.constraints === 'string' ? [args.constraints] : undefined),
        thinkingBudget: typeof args.thinkingBudget === 'number' ? args.thinkingBudget : undefined,
        sessionId: typeof args.sessionId === 'string' ? args.sessionId : undefined,
        includeHistoricalMistakes: typeof args.includeHistoricalMistakes === 'boolean' ? args.includeHistoricalMistakes : undefined
      };

      console.error("Executing vibe_planning tool...");
      const result = await vibePlanningTool(input);
      console.error("vibe_planning execution complete");

      return {
        content: [
          {
            type: "text",
            text: formatVibePlanningOutput(result)
          }
        ]
      };
    }

    case "vibe_mental_models": {
      if (!args || typeof args.query !== 'string') {
        console.error("Invalid vibe_mental_models request: missing query");
        throw new McpError(
          ErrorCode.InvalidParams,
          'Invalid input: query is required and must be a string'
        );
      }

      const input: VibeMentalModelsInput = {
        query: args.query,
        context: typeof args.context === 'string' ? args.context : undefined,
        sessionId: typeof args.sessionId === 'string' ? args.sessionId : undefined,
        thinkingLog: typeof args.thinkingLog === 'string' ? args.thinkingLog : undefined,
        includeHistoricalMistakes: typeof args.includeHistoricalMistakes === 'boolean' ? args.includeHistoricalMistakes : undefined
      };

      console.error("Executing vibe_mental_models tool...");
      const result = await vibeMentalModelsTool(input);
      console.error("vibe_mental_models execution complete");

      return {
        content: [
          {
            type: "text",
            text: formatVibeMentalModelsOutput(result)
          }
        ]
      };
    }

    default: {
      console.error(`Unknown tool requested: ${name}`);
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${name}`
      );
    }
  }
});

/**
 * Format vibe check output as markdown
 */
function formatVibeCheckOutput(result: VibeCheckOutput): string {
  let output = result.questions;
  
  // Add pattern alert section if present
  if (result.patternAlert) {
    // Check if the pattern alert is already in the response
    if (!output.includes("Pattern Alert:") && !output.includes("pattern emerging:")) {
      output += `\n\n**I notice a pattern emerging:** ${result.patternAlert}`;
    }
  }
  
  return output;
}

/**
 * Format vibe learn output as markdown
 */
function formatVibeLearnOutput(result: VibeLearnOutput): string {
  let output = '';

  if (result.added) {
    output += `✅ Pattern logged successfully (category tally: ${result.currentTally})`;
  } else {
    output += '❌ Failed to log pattern';
  }

  // Add top categories section
  if (result.topCategories && result.topCategories.length > 0) {
    output += '\n\n## Top Pattern Categories\n';
    for (const category of result.topCategories) {
      output += `\n### ${category.category} (${category.count} occurrences)\n`;

      // Show the most recent example
      if (category.recentExample) {
        output += `Most recent: "${category.recentExample.mistake}"\n`;
        output += `Solution: "${category.recentExample.solution}"\n`;
      }
    }
  }

  return output;
}

/**
 * Format vibe planning output as markdown
 */
function formatVibePlanningOutput(result: VibePlanningOutput): string {
  let output = '## Vibe Planning Result\n\n';
  output += `**Summary:** ${result.summary}\n\n`;
  output += '### Plan Steps:\n';
  result.plan.forEach((step, index) => {
    output += `${index + 1}. ${step.step}\n`;
    if (step.rationale) {
      output += `   - Rationale: ${step.rationale}\n`;
    }
    if (step.risks && step.risks.length > 0) {
      output += `   - Risks: ${step.risks.join(', ')}\n`;
    }
  });
  if (result.thoughts) {
    output += `\n**Thoughts:** ${result.thoughts}\n`;
  }
  return output;
}

/**
 * Format vibe mental models output as markdown
 */
function formatVibeMentalModelsOutput(result: VibeMentalModelsOutput): string {
  let output = '## Vibe Mental Models Result\n\n';
  if (result.explanation) {
    output += `**Explanation:** ${result.explanation}\n\n`;
  }
  if (result.suggestions && result.suggestions.length > 0) {
    output += '### Suggestions:\n';
    result.suggestions.forEach((suggestion, index) => {
      output += `${index + 1}. ${suggestion}\n`;
    });
  }
  if (result.thoughts) {
    output += `\n**Thoughts:** ${result.thoughts}\n`;
  }
  return output;
}

/**
 * Format vibe distill output as markdown
 */
function formatVibeDistillOutput(result: VibeDistillOutput): string {
  return `## Vibe Distill Result\n\n**Distilled Plan:**\n${result.distilledPlan}`;
}

/**
 * Start the server
 */
async function main() {
  console.error('Starting Vibe Check MCP server...');
  
  // Set up error handler
  server.onerror = (error) => {
    console.error("[Vibe Check Error]", error);
  };
  
  try {
    // Connect to transport
    console.error('Connecting to transport...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('Vibe Check MCP server running');
  } catch (error) {
    console.error("Error connecting to transport:", error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error("Server startup error:", error);
  process.exit(1);
});


