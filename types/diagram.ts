import type { ChatMessage } from "./chat";

export type DiagramType =
  | "flowchart"
  | "sequence_diagram"
  | "class_diagram"
  | "er_diagram"
  | "state_diagram"
  | "gantt_chart"
  | "not_diagram";

export interface IdentificationResult {
  type: DiagramType;
  message: string;
  confidence?: "high" | "medium" | "low";
}

export interface DiagramGenerationRequest {
  prompt: string;
  conversationHistory?: ChatMessage[];
  diagramType?: DiagramType;
}

export interface DiagramGenerationResult {
  code: string;
  type: DiagramType;
  metadata?: {
    processingTime: number;
    tokensUsed?: number;
    confidence: "high" | "medium" | "low";
  };
}
