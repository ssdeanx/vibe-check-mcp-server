---
description: AI rules derived by SpecStory from the project AI interaction history
globs: *
---

## Headers

This document outlines the rules and guidelines for the AI coding assistant to follow while working on this project. It covers coding standards, workflow, documentation, and best practices. This file is a living document and will be updated as the project evolves.

## TECH STACK

*   TypeScript
*   Node.js
*   @google/genai (v1.6.0 or later recommended for Gemini 2.5 support)

## PROJECT DOCUMENTATION & CONTEXT SYSTEM

(To be defined)

## CODING STANDARDS

*   The actual LLM call should only be in the MCP server (e.g., `index.ts`). The tool files (e.g., `vibePlanning.ts`, `vibeWeb.ts`, `vibeDistill.ts`, `vibeLearn.ts`, `vibeCheck.ts`) should only define the interface and implement the tool logic (basic or advanced), or call helpers, but not call the LLM directly.
*   Each tool file should define the input/output interfaces.
*   Tool files should validate input and provide a basic fallback.

## DEBUGGING

*   The AI coding assistant must run `get_errors` after each code modification and not proceed until all errors are resolved.

## WORKFLOW & RELEASE RULES

*   The AI coding assistant must run `get_errors` after each code modification and not proceed until all errors are resolved.

## BEST PRACTICES

*   When using the `@google/genai` SDK, use `client.models.generateContent` instead of the deprecated `getGenerativeModel` and `getModel` methods for accessing generative models. Set safety settings within the `generateContent` call using the `config` property. The old pattern of `genAI.getGenerativeModel({ model: ... })` is deprecated.
*   When using `client.models.generateContent`, configure safety settings and other options via the `config` property.
*   For advanced reasoning and multi-step planning, use Gemini 2.5 models (e.g., `gemini-2.5-pro`, `gemini-2.5-flash`). You can control the "thinking budget" (number of tokens for reasoning) via the `thinkingBudget` parameter in the config. Set to `-1` for dynamic allocation, or a specific number for more/less reasoning. To get insight into the model's reasoning, set `includeThoughts: true` in the config. Thought summaries will be included in the response.
*   For reliable JSON output, always use the `responseSchema` in the config, not just a prompt instruction. You can define schemas for objects, arrays, and enums. For enums, use a schema with an `enum` array. Remember that the schema size counts toward input tokens. Also set `responseMimeType: 'application/json'` when using `responseSchema`.
*   To enable real-time web grounding, add the `googleSearch` tool in the config using camelCase. The model will automatically decide when to use search and will return citations in the response metadata. Use this for up-to-date or factual queries. The correct property is `googleSearch` (camelCase), not `google_search`.
*   Context Caching: Implicit caching is automatic for Gemini 2.5 models. For large, repeated contexts (e.g., long system prompts, big documents), use explicit caching by uploading content, caching it, and referring to it by cache name in future requests for cost savings and efficiency.
*   **Conflicting Information:** The AI has provided conflicting information regarding the use of `getModel` vs `getGenerativeModel`. The current best practice is to use `getGenerativeModel` if `getModel` is not available in the SDK. If the SDK is updated in the future to support `getModel`, switch back. **This rule is now superseded by the new client-based approach using `client.models.generateContent`.**