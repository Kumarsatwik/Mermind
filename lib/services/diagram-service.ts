import { GroqClient, DeepSeekClient } from "./ai-client";
import { ConversationService } from "./conversation-service";
import { DIAGRAM_TYPES, MERMAID_DIRECTIVES } from "@/lib/constants";
import type {
  DiagramType,
  IdentificationResult,
  DiagramGenerationRequest,
  DiagramGenerationResult,
  ChatMessage,
} from "@/types";

export class DiagramService {
  private groqClient = new GroqClient();
  private deepSeekClient = new DeepSeekClient();
  private conversationService = new ConversationService();

  async identifyDiagramType(
    prompt: string,
    conversationHistory?: ChatMessage[]
  ): Promise<IdentificationResult> {
    this.validatePrompt(prompt);

    const contextualPrompt = this.buildIdentificationPrompt(
      prompt,
      conversationHistory
    );

    try {
      const response = await this.groqClient.generateCompletion(
        contextualPrompt
      );
      return this.parseIdentificationResponse(response);
    } catch (error) {
      console.error("Error in diagram type identification:", error);
      throw new Error(
        `Failed to identify diagram type: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async improvePrompt(
    prompt: string,
    diagramType: string,
    conversationHistory?: ChatMessage[]
  ): Promise<string> {
    this.validatePrompt(prompt);

    const improvementPrompt = this.buildImprovementPrompt(
      prompt,
      diagramType,
      conversationHistory
    );

    try {
      const improvedPrompt = await this.groqClient.generateCompletion(
        improvementPrompt
      );
      return improvedPrompt.trim();
    } catch (error) {
      console.error("Error improving prompt:", error);
      throw new Error("Failed to improve prompt");
    }
  }

  async generateDiagram(
    prompt: string,
    diagramType: string,
    conversationHistory?: ChatMessage[]
  ): Promise<string> {
    this.validatePrompt(prompt);

    const generationPrompt = this.buildGenerationPrompt(
      prompt,
      diagramType,
      conversationHistory
    );

    try {
      const result = await this.deepSeekClient.generateCompletion(
        generationPrompt
      );
      return this.cleanDiagramCode(result, diagramType);
    } catch (error) {
      console.error("Error generating diagram:", error);
      throw new Error("Failed to generate diagram");
    }
  }

  async generateMermaidDiagram(
    request: DiagramGenerationRequest
  ): Promise<DiagramGenerationResult> {
    const startTime = Date.now();

    try {
      // Step 1: Identify diagram type
      const identification = await this.identifyDiagramType(
        request.prompt,
        request.conversationHistory
      );

      if (identification.type === "not_diagram") {
        throw new Error(identification.message);
      }

      // Step 2: Improve prompt
      const improvedPrompt = await this.improvePrompt(
        request.prompt,
        identification.type,
        request.conversationHistory
      );

      // Step 3: Generate diagram
      const diagramCode = await this.generateDiagram(
        improvedPrompt,
        identification.type,
        request.conversationHistory
      );

      const processingTime = Date.now() - startTime;

      return {
        code: diagramCode,
        type: identification.type,
        metadata: {
          processingTime,
          confidence: identification.confidence || "medium",
        },
      };
    } catch (error) {
      console.error("Error in diagram generation pipeline:", error);
      throw error;
    }
  }

  private validatePrompt(prompt: string): void {
    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      throw new Error("Prompt must be a non-empty string");
    }
  }

  private buildIdentificationPrompt(
    prompt: string,
    conversationHistory?: ChatMessage[]
  ): string {
    const contextualInstruction = conversationHistory?.length
      ? `You are analyzing a user's request in the context of an ongoing conversation about diagram creation. 
         Consider the conversation history to better understand what type of diagram the user is requesting.`
      : `You are an expert AI assistant specialized in identifying Mermaid.js diagram types from natural language prompts.`;

    const historyContext = conversationHistory?.length
      ? this.conversationService.formatConversationHistory(conversationHistory)
      : "";

    return `${contextualInstruction}

Task: Analyze the user's input and determine if it describes a diagram that can be represented using Mermaid.

Valid Diagram Types: ${DIAGRAM_TYPES.join(", ")}

Rules:
1. If the prompt clearly relates to one of the valid diagram types, return: { "type": "<diagram_type>", "message": "The prompt describes a <diagram_type>." }
2. If ambiguous but likely refers to a diagram, pick the most probable type based on keywords and context.
3. If not related to diagram generation, return: { "type": "not_diagram", "message": "The provided prompt is not related to diagram generation." }
4. Respond ONLY with valid JSON.

${historyContext}

User Prompt: "${prompt.trim()}"`;
  }

  private buildImprovementPrompt(
    prompt: string,
    diagramType: string,
    conversationHistory?: ChatMessage[]
  ): string {
    const contextualInstruction = conversationHistory?.length
      ? `Consider the conversation history when improving this prompt. If this appears to be a modification 
         or extension of a previously discussed diagram, incorporate relevant context from the conversation.`
      : "";

    const historyContext = conversationHistory?.length
      ? this.conversationService.formatConversationHistory(conversationHistory)
      : "";

    return `You are an expert prompt engineer specialized in Mermaid diagram generation.

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
  }

  private buildGenerationPrompt(
    prompt: string,
    diagramType: string,
    conversationHistory?: ChatMessage[]
  ): string {
    const contextualInstruction = conversationHistory?.length
      ? `Use the conversation history to understand the context. If this is a modification of a previously 
         generated diagram, build upon or modify the previous diagram structure appropriately.`
      : "";

    const historyContext = conversationHistory?.length
      ? this.conversationService.formatConversationHistory(conversationHistory)
      : "";

    return `You are an expert Mermaid diagram generator. Create a valid Mermaid diagram based on the following description.

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
  }

  private parseIdentificationResponse(response: string): IdentificationResult {
    try {
      const jsonMatch = response.trim().match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response.trim();
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
    } catch {
      console.warn("Failed to parse identification response:", response);
      return {
        type: "not_diagram",
        message:
          "Could not interpret the prompt as a diagram request due to invalid response format.",
      };
    }
  }

  private cleanDiagramCode(code: string, diagramType: string): string {
    let cleanedCode = code.trim();

    // Remove markdown code blocks
    cleanedCode = cleanedCode
      .replace(/^```mermaid\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "");

    // Ensure proper directive
    if (!this.hasValidDirective(cleanedCode)) {
      cleanedCode = this.addDirective(cleanedCode, diagramType);
    }

    return cleanedCode;
  }

  private hasValidDirective(code: string): boolean {
    const lowerCode = code.toLowerCase();
    return Object.values(MERMAID_DIRECTIVES)
      .flat()
      .some((directive) => lowerCode.startsWith(directive.toLowerCase()));
  }

  private addDirective(code: string, diagramType: string): string {
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
}
