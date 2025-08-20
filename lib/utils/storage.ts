import { STORAGE_KEYS } from "@/lib/constants";
import type { ChatMessage, ConversationMetadata } from "@/types";

export class StorageService {
  static saveChatHistory(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  }

  static loadChatHistory(): ChatMessage[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (!saved) return [];

      return JSON.parse(saved).map(
        (msg: ChatMessage & { timestamp: string }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })
      );
    } catch (error) {
      console.error("Failed to load chat history:", error);
      return [];
    }
  }

  static saveConversationMetadata(metadata: ConversationMetadata): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CONVERSATION_METADATA,
        JSON.stringify(metadata)
      );
    } catch (error) {
      console.error("Failed to save conversation metadata:", error);
    }
  }

  static loadConversationMetadata(): ConversationMetadata | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONVERSATION_METADATA);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        startTime: new Date(parsed.startTime),
        lastActivity: new Date(parsed.lastActivity),
      };
    } catch (error) {
      console.error("Failed to load conversation metadata:", error);
      return null;
    }
  }

  static clearChatData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
      localStorage.removeItem(STORAGE_KEYS.CONVERSATION_METADATA);
    } catch (error) {
      console.error("Failed to clear chat data:", error);
    }
  }
}

export const storage = StorageService;
