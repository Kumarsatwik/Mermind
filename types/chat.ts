export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  type?: "text" | "diagram";
  diagramCode?: string;
  isGenerating?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentInput: string;
  conversationMetadata?: ConversationMetadata;
}

export interface ChatAction {
  type:
    | "ADD_MESSAGE"
    | "SET_LOADING"
    | "UPDATE_CURRENT_INPUT"
    | "CLEAR_MESSAGES"
    | "UPDATE_MESSAGE"
    | "SET_CONVERSATION_METADATA";
  payload?: any;
}

export interface ConversationMetadata {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  conversationType: ConversationType;
  topics: string[];
}

export type ConversationType =
  | "new_session"
  | "continuation"
  | "resumed"
  | "topic_switch";

export interface ConversationContext {
  messages: ChatMessage[];
  currentPrompt: string;
  metadata?: ConversationMetadata;
}
