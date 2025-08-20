"use server";

import { groqCompletion, deepSeekCompletion } from "./ai-actions";
import { DIAGRAM_TYPES, MERMAID_DIRECTIVES } from "@/lib/constants";
import type { ChatMessage, DiagramType, IdentificationResult } from "@/types";

// Helper function to format conversation history
function formatConversationHistory(messages: ChatMessage[]): string {
  if (messages.length === 0) return "";

  const recentMessages = messages.slice(-20); // Last 20 messages
  const formattedHistory = recentMessages
    .map((msg) => {
      const role = msg.role === "user" ? "Human" : "Assistant";
      const content = msg.diagramCode
        ? `${msg.content}\n[Generated diagram code: ${msg.diagramCode.substring(
            0,
            100
          )}...]`
        : msg.content;
      return `${role}: ${content}`;
    })
    .join("\n\n");

  return `\nConversation History:\n${formattedHistory}\n\nCurrent Request:\n`;
}

// Server action to identify diagram type
export async function identifyDiagramType(
  prompt: string,
  conversationHistory?: ChatMessage[]
): Promise<IdentificationResult> {
  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt must be a non-empty string");
  }

  const cleanedPrompt = prompt.trim();

  const contextualInstruction = conversationHistory?.length
    ? `You are analyzing a user's request in the context of an ongoing conversation about diagram creation. 
       Consider the conversation history to better understand what type of diagram the user is requesting.`
    : `You are an expert AI assistant specialized in identifying Mermaid.js diagram types from natural language prompts.`;

  const historyContext = conversationHistory?.length
    ? formatConversationHistory(conversationHistory)
    : "";

  const systemPrompt = `${contextualInstruction}

Task: Analyze the user's input and determine if it describes a diagram that can be represented using Mermaid.

Valid Diagram Types: ${DIAGRAM_TYPES.join(", ")}

Rules:
1. If the prompt clearly relates to one of the valid diagram types, return: { "type": "<diagram_type>", "message": "The prompt describes a <diagram_type>." }
2. If ambiguous but likely refers to a diagram, pick the most probable type based on keywords and context.
3. If not related to diagram generation, return: { "type": "not_diagram", "message": "The provided prompt is not related to diagram generation." }
4. Respond ONLY with valid JSON.

${historyContext}

User Prompt: "${cleanedPrompt}"`;

  try {
    const response = await groqCompletion(systemPrompt);

    // Parse the response
    const jsonMatch = response.trim().match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : response.trim();

    try {
      const parsed = JSON.parse(jsonString) as IdentificationResult;

      if (!parsed.type || typeof parsed.message !== "string") {
        throw new Error("Invalid response structure");
      }

      const normalizedType = parsed.type.toLowerCase() as DiagramType;

      if (
        !DIAGRAM_TYPES.includes(
          normalizedType as (typeof DIAGRAM_TYPES)[number]
        ) &&
        normalizedType !== "not_diagram"
      ) {
        return {
          type: "not_diagram",
          message: `Unrecognized diagram type: ${parsed.type}`,
        };
      }

      return {
        type: normalizedType,
        message: parsed.message,
        confidence: parsed.confidence,
      };
    } catch (parseError) {
      console.warn("Failed to parse identification response:", response);
      return {
        type: "not_diagram",
        message:
          "Could not interpret the prompt as a diagram request due to invalid response format.",
      };
    }
  } catch (error) {
    console.error("Error in diagram type identification:", error);
    throw new Error(
      `Failed to identify diagram type: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Server action to improve prompt
export async function improvePrompt(
  prompt: string,
  diagramType: string,
  conversationHistory?: ChatMessage[]
): Promise<string> {
  if (!prompt || prompt.trim() === "") {
    throw new Error("Prompt cannot be empty");
  }

  const contextualInstruction = conversationHistory?.length
    ? `Consider the conversation history when improving this prompt. If this appears to be a modification 
       or extension of a previously discussed diagram, incorporate relevant context from the conversation.`
    : "";

  const historyContext = conversationHistory?.length
    ? formatConversationHistory(conversationHistory)
    : "";

  const improvementPrompt = `You are an expert prompt engineer specialized in Mermaid diagram generation.

Your task is to improve the following prompt to make it more structured, explicit, and suitable for generating accurate Mermaid diagrams.

${contextualInstruction}

REQUIREMENTS:
1. The improved prompt should be clear and specific
2. Include all necessary details for the diagram type
3. Use proper terminology for the diagram type
4. Ensure the prompt will generate valid Mermaid syntax
5. Be concise but comprehensive

${historyContext}

Diagram Type: ${diagramType}
Original Prompt: "${prompt}"

Provide an improved prompt:`;

  try {
    const improvedPrompt = await groqCompletion(improvementPrompt);
    return improvedPrompt.trim();
  } catch (error) {
    console.error("Error improving prompt:", error);
    throw new Error("Failed to improve prompt");
  }
}

// Server action to generate diagram code
export async function generateDiagramCode(
  prompt: string,
  diagramType: string,
  conversationHistory?: ChatMessage[]
): Promise<string> {
  if (!prompt || prompt.trim() === "") {
    throw new Error("Prompt cannot be empty");
  }

  const contextualInstruction = conversationHistory?.length
    ? `Use the conversation history to understand the context. If this is a modification of a previously 
       generated diagram, build upon or modify the previous diagram structure appropriately.`
    : "";

  const historyContext = conversationHistory?.length
    ? formatConversationHistory(conversationHistory)
    : "";

  const generationPrompt = `You are an expert Mermaid diagram generator. Create a valid Mermaid diagram based on the following description.

${contextualInstruction}

REQUIREMENTS:
1. Generate ONLY the Mermaid code, no explanations or markdown formatting
2. Use proper Mermaid syntax for ${diagramType}
3. Ensure the diagram is complete and valid
4. Start with the appropriate Mermaid directive
5. Use clear, descriptive labels
6. Follow Mermaid best practices
7. The output should be ready to render directly

${historyContext}

Diagram Type: ${diagramType}
Description: "${prompt}"

Generate the Mermaid diagram code:`;

  try {
    const result = await deepSeekCompletion(generationPrompt);
    return cleanDiagramCode(result, diagramType);
  } catch (error) {
    console.error("Error generating diagram:", error);
    throw new Error("Failed to generate diagram");
  }
}

// Helper function to clean diagram code
function cleanDiagramCode(code: string, diagramType: string): string {
  let cleanedCode = code.trim();

  // Remove markdown code blocks
  cleanedCode = cleanedCode
    .replace(/^```mermaid\s*/, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "");

  // Ensure proper directive
  if (!hasValidDirective(cleanedCode)) {
    cleanedCode = addDirective(cleanedCode, diagramType);
  }

  return cleanedCode;
}

function hasValidDirective(code: string): boolean {
  const lowerCode = code.toLowerCase();
  return Object.values(MERMAID_DIRECTIVES)
    .flat()
    .some((directive) => lowerCode.startsWith(directive.toLowerCase()));
}

function addDirective(code: string, diagramType: string): string {
  const directiveMap: Record<string, string> = {
    flowchart: "graph TD",
    sequence_diagram: "sequenceDiagram",
    class_diagram: "classDiagram",
    er_diagram: "erDiagram",
    state_diagram: "stateDiagram-v2",
    gantt_chart: "gantt",
  };

  const directive = directiveMap[diagramType] || "graph TD";
  return `${directive}\n${code}`;
}

// Main server action for generating Mermaid diagrams
export async function generateMermaidDiagram(
  prompt: string,
  conversationHistory?: ChatMessage[]
): Promise<string> {
  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt cannot be empty or invalid");
  }

  const startTime = Date.now();

  try {
    // Step 1: Identify diagram type
    const identification = await identifyDiagramType(
      prompt,
      conversationHistory
    );

    if (identification.type === "not_diagram") {
      throw new Error(identification.message);
    }

    // Step 2: Improve prompt
    const improvedPrompt = await improvePrompt(
      prompt,
      identification.type,
      conversationHistory
    );

    // Step 3: Generate diagram
    const diagramCode = await generateDiagramCode(
      improvedPrompt,
      identification.type,
      conversationHistory
    );

    const processingTime = Date.now() - startTime;
    console.log(`Generated diagram in ${processingTime}ms`);

    return diagramCode;
  } catch (error) {
    console.error("Error in diagram generation pipeline:", error);
    throw error;
  }
}
