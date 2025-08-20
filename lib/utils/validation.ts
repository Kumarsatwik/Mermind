import type { ChatMessage, DiagramType } from "@/types";
import { DIAGRAM_TYPES } from "@/lib/constants";

/**
 * Validation utilities for various data types
 */
export class Validator {
  /**
   * Validate a prompt string
   */
  static validatePrompt(prompt: unknown): prompt is string {
    return typeof prompt === "string" && prompt.trim().length > 0;
  }

  /**
   * Validate a chat message
   */
  static validateChatMessage(message: unknown): message is ChatMessage {
    if (!message || typeof message !== "object") return false;

    const msg = message as Record<string, unknown>;
    return (
      typeof msg.id === "string" &&
      typeof msg.content === "string" &&
      (msg.role === "user" || msg.role === "assistant") &&
      msg.timestamp instanceof Date
    );
  }

  /**
   * Validate a diagram type
   */
  static validateDiagramType(type: unknown): type is DiagramType {
    return (
      typeof type === "string" &&
      (DIAGRAM_TYPES.includes(type as (typeof DIAGRAM_TYPES)[number]) ||
        type === "not_diagram")
    );
  }

  /**
   * Validate an array of chat messages
   */
  static validateChatMessages(messages: unknown): messages is ChatMessage[] {
    return Array.isArray(messages) && messages.every(this.validateChatMessage);
  }

  /**
   * Sanitize a string for safe usage
   */
  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, "");
  }

  /**
   * Validate environment variable
   */
  static validateEnvVar(name: string, value: unknown): value is string {
    if (typeof value !== "string" || value.length === 0) {
      console.warn(`Environment variable ${name} is not set or empty`);
      return false;
    }
    return true;
  }
}

export const validator = Validator;
