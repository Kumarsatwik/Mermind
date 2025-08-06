"use server";

import { DiagramType, IdentificationResult } from "@/lib/types/chat";
import Groq from "groq-sdk";
import OpenAI from "openai";

// Get API keys from environment variables (server-side)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Initialize Groq client with proper error handling
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

export async function groq_api(prompt: string) {
  if (!groq) {
    throw new Error(
      "Groq API key is not configured. Please set GROQ_API_KEY in your environment variables."
    );
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response received from Groq API");
    }

    return content;
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error(
      `Groq API error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function deepseek_api(prompt: string) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error(
      "DeepSeek API key is not configured. Please set DEEPSEEK_API_KEY in your environment variables."
    );
  }

  try {
    const openai = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: DEEPSEEK_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      model: "deepseek-chat",
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response received from DeepSeek API");
    }

    return content;
  } catch (error) {
    console.error("DeepSeek API error:", error);
    throw new Error(
      `DeepSeek API error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function IdentifyTypes(
  prompt: string,
  validDiagramTypes: DiagramType[] = [
    "flowchart",
    "sequence_diagram",
    "class_diagram",
    "er_diagram",
    "state_diagram",
    "gantt_chart",
  ]
): Promise<IdentificationResult> {
  // Input validation
  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt must be a non-empty string");
  }

  const cleanedPrompt = prompt.trim();

  // Construct a more effective system prompt with clear JSON structure
  const systemPrompt = `You are an expert AI assistant specialized in identifying Mermaid.js diagram types from natural language prompts.

Task:
Analyze the user's input and determine if it describes a diagram that can be represented using Mermaid.

Valid Diagram Types:
- ${validDiagramTypes.join("\n- ")}

Rules:
1. If the prompt clearly relates to one of the valid diagram types above, return:
   { "type": "<diagram_type>", "message": "The prompt describes a <diagram_type>." }
2. If the prompt is ambiguous but likely refers to a diagram, pick the most probable type based on keywords.
3. If the prompt does not relate to diagram generation at all (e.g., general question, unrelated task), return:
   { "type": "not_diagram", "message": "The provided prompt is not related to diagram generation." }
4. Respond ONLY with a valid JSON object. No explanations, no extra text.

Output Format (strict JSON):
{
  "type": "flowchart" | "sequence_diagram" | "class_diagram" | "er_diagram" | "state_diagram" | "gantt_chart" | "not_diagram",
  "message": string
}

Examples:
Input: "Show how a user logs in with steps"
Output: { "type": "flowchart", "message": "The prompt describes a flowchart." }

Input: "Draw a timeline for project milestones"
Output: { "type": "gantt_chart", "message": "The prompt describes a gantt_chart." }

Input: "What is 2 + 2?"
Output: { "type": "not_diagram", "message": "The provided prompt is not related to diagram generation." }

User Prompt: "${cleanedPrompt}"
`;

  try {
    const chatCompletion = await groq_api(systemPrompt);
    let parsedResponse: IdentificationResult;

    // Attempt to extract JSON from response (LLMs sometimes add extra text)
    const jsonMatch = chatCompletion.trim().match(/\{[\s\S]*\}/); // Find first JSON-like object
    const jsonString = jsonMatch ? jsonMatch[0] : chatCompletion.trim();

    try {
      parsedResponse = JSON.parse(jsonString) as IdentificationResult;
    } catch (parseError) {
      console.warn("Failed to parse LLM output as JSON:", jsonString);
      return {
        type: "not_diagram",
        message:
          "Could not interpret the prompt as a diagram request due to invalid response format.",
      };
    }

    // Validate the structure and content
    if (
      typeof parsedResponse !== "object" ||
      !parsedResponse.type ||
      typeof parsedResponse.message !== "string"
    ) {
      return {
        type: "not_diagram",
        message:
          "Invalid response structure from AI model during diagram type identification.",
      };
    }

    // Normalize type to lowercase
    const normalizedType = parsedResponse.type.toLowerCase() as DiagramType;

    // Final validation against allowed types
    if (
      !validDiagramTypes.includes(normalizedType) &&
      normalizedType !== "not_diagram"
    ) {
      return {
        type: "not_diagram",
        message: `Unrecognized diagram type: ${parsedResponse.type}`,
      };
    }

    // Return consistent result
    return {
      type: normalizedType,
      message: parsedResponse.message,
    };
  } catch (error) {
    console.error("Error in IdentifyTypes:", error);
    throw new Error(
      `Failed to identify diagram type: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function ImprovePrompt(
  prompt: string,
  diagramType: string
): Promise<string> {
  if (!prompt || prompt.trim() === "") {
    throw new Error("Prompt cannot be empty");
  }

  const improve_prompt = `You are an expert prompt engineer specialized in Mermaid diagram generation.

Your task is to improve the following prompt to make it more structured, explicit, and suitable for generating accurate Mermaid diagrams.

IMPORTANT REQUIREMENTS:
1. The improved prompt should be clear and specific
2. Include all necessary details for the diagram type
3. Use proper terminology for the diagram type
4. Ensure the prompt will generate valid Mermaid syntax
5. Be concise but comprehensive

Diagram Type: ${diagramType}
Original Prompt: "${prompt}"

Provide an improved prompt that will generate a clear and accurate ${diagramType} diagram:`;

  const chatCompletion = await groq_api(improve_prompt);
  // Print the completion returned by the LLM.
  const improvedPrompt = chatCompletion.trim();
  console.log("Improved Prompt:", improvedPrompt);

  return improvedPrompt;
}

export async function GenerateDiagram(
  prompt: string,
  diagramType: string
): Promise<string> {
  if (!prompt || prompt.trim() === "") {
    throw new Error("Prompt cannot be empty");
  }

  const finalPrompt = `You are an expert Mermaid diagram generator. Create a valid Mermaid diagram based on the following description.

IMPORTANT REQUIREMENTS:
1. Generate ONLY the Mermaid code, no explanations or markdown formatting
2. Use proper Mermaid syntax for ${diagramType}
3. Ensure the diagram is complete and valid
4. Start with the appropriate Mermaid directive (e.g., "graph TD", "sequenceDiagram", "classDiagram", etc.)
5. Use clear, descriptive labels
6. Follow Mermaid best practices
7. The output should be ready to render directly in a Mermaid viewer

Diagram Type: ${diagramType}
Description: "${prompt}"

Generate the Mermaid diagram code:`;

  const result = await deepseek_api(finalPrompt);
  if (!result || result.trim() === "") {
    throw new Error("Failed to generate diagram from the prompt");
  }

  // Clean up the response to ensure it's valid Mermaid syntax
  let cleanedResult = result.trim();

  // Remove markdown code blocks if present
  if (cleanedResult.startsWith("```mermaid")) {
    cleanedResult = cleanedResult.replace(/^```mermaid\s*/, "");
  }
  if (cleanedResult.startsWith("```")) {
    cleanedResult = cleanedResult.replace(/^```\s*/, "");
  }
  if (cleanedResult.endsWith("```")) {
    cleanedResult = cleanedResult.replace(/\s*```$/, "");
  }

  // Ensure it starts with a valid Mermaid directive
  const validDirectives = [
    "graph",
    "flowchart",
    "sequenceDiagram",
    "classDiagram",
    "stateDiagram",
    "erDiagram",
    "gantt",
    "pie",
    "journey",
    "gitgraph",
  ];

  const hasValidDirective = validDirectives.some((directive) =>
    cleanedResult.toLowerCase().startsWith(directive.toLowerCase())
  );

  if (!hasValidDirective) {
    // Try to add the appropriate directive based on diagram type
    switch (diagramType) {
      case "flowchart":
        cleanedResult = `graph TD\n${cleanedResult}`;
        break;
      case "sequence_diagram":
        cleanedResult = `sequenceDiagram\n${cleanedResult}`;
        break;
      case "class_diagram":
        cleanedResult = `classDiagram\n${cleanedResult}`;
        break;
      case "er_diagram":
        cleanedResult = `erDiagram\n${cleanedResult}`;
        break;
      case "state_diagram":
        cleanedResult = `stateDiagram-v2\n${cleanedResult}`;
        break;
      case "gantt_chart":
        cleanedResult = `gantt\n${cleanedResult}`;
        break;
      default:
        cleanedResult = `graph TD\n${cleanedResult}`;
    }
  }

  console.log("Generated Diagram:", cleanedResult);
  return cleanedResult;
}

export const generateMermaidDiagram = async (
  prompt: string
): Promise<string> => {
  // Validate input
  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt cannot be empty or invalid");
  }

  const trimmedPrompt = prompt.trim();

  try {
    // Step 1: Identify the diagram type
    const identificationResult = await IdentifyTypes(trimmedPrompt);

    console.log("Diagram Type Identification Result:", identificationResult);

    // Extract type from result
    const diagramType = identificationResult.type;

    // Check if it's a valid diagram request
    if (diagramType === "not_diagram") {
      throw new Error(
        identificationResult.message ||
          "The prompt is not related to diagram generation."
      );
    }

    // Step 2: Improve the prompt for better clarity and structure
    const improvedPrompt = await ImprovePrompt(trimmedPrompt, diagramType);

    if (!improvedPrompt || improvedPrompt.trim() === "") {
      throw new Error("Failed to improve prompt: received empty result");
    }

    console.log("Improved Prompt:", improvedPrompt);

    // Step 3: Generate the actual Mermaid diagram code
    const diagramCode = await GenerateDiagram(improvedPrompt, diagramType);

    if (!diagramCode || diagramCode.trim() === "") {
      throw new Error("Generated diagram code is empty");
    }

    console.log("Generated Mermaid Diagram Code:", diagramCode);

    // Optional: Wrap in ```mermaid if needed, depending on consumer
    // return \`\`\`mermaid\n${diagramCode}\n\`\`\`;

    return diagramCode;
  } catch (error) {
    // Re-throw with context, but keep original error if available
    if (error instanceof Error) {
      console.error("Error in generateMermaidDiagram:", error.message);
      throw error;
    } else {
      const errorMsg = "Unknown error occurred during diagram generation";
      console.error("Error in generateMermaidDiagram:", error);
      throw new Error(errorMsg);
    }
  }
};
