"use server";

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
  validDiagramTypes: string[] = [
    "flowchart",
    "sequence_diagram",
    "class_diagram",
    "er_diagram",
    "state_diagram",
    "gantt_chart",
  ]
): Promise<string> {
  // Identify prompt type
  if (!prompt || prompt.trim() === "") {
    throw new Error("Prompt cannot be empty");
  }

  const identify_prompt = `You are a prompt identifier specialized in Mermaid diagram types. Your job is to identify which type of diagram the user wants to generate from the given prompt.

Valid diagram types: ${validDiagramTypes.join(", ")}

Instructions:
- Analyze the user's prompt carefully
- Return ONLY one of the valid diagram types listed above
- If the prompt is not related to diagram generation, return "not_diagram"
- Be specific and accurate in your classification

User prompt: "${prompt}"

Return only the diagram type (e.g., "flowchart", "sequence_diagram", etc.) or "not_diagram":`;

  const chatCompletion = await groq_api(identify_prompt);
  // Print the completion returned by the LLM.
  const identifiedPrompt = chatCompletion.trim().toLowerCase();

  // Validate the response
  if (
    !validDiagramTypes.includes(identifiedPrompt) &&
    identifiedPrompt !== "not_diagram"
  ) {
    return "not_diagram"
  }

  if (identifiedPrompt === "not_diagram") {
    return "not_diagram";
  }
  console.log("Identified Prompt:", identifiedPrompt);

  return identifiedPrompt;
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
  // Validate the prompt
  if (!prompt || prompt.trim() === "") {
    throw new Error("Prompt cannot be empty");
  }

  const validDiagramTypes = [
    "flowchart",
    "sequence_diagram",
    "class_diagram",
    "er_diagram",
    "state_diagram",
    "gantt_chart",
  ];
  const diagramType = await IdentifyTypes(prompt, validDiagramTypes);

  console.log("Diagram Type Identified:", diagramType);

  if (diagramType === "not_diagram") {
    throw new Error(
      "The provided prompt is not related to diagram generation."
    );
  }

  // improve the prompt for better diagram generation
  const improvedPrompt = await ImprovePrompt(prompt, diagramType);

  // generate the diagram based on the identified type
  console.log("Improved Prompt:", improvedPrompt);
  if (!improvedPrompt || improvedPrompt.trim() === "") {
    throw new Error("Improved prompt cannot be empty");
  }

  const result = await GenerateDiagram(improvedPrompt, diagramType);
  console.log("Generated Diagram:", result);

  return result;
};
