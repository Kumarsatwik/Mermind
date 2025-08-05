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
}

export interface ChatAction {
  type:
    | "ADD_MESSAGE"
    | "SET_LOADING"
    | "UPDATE_CURRENT_INPUT"
    | "CLEAR_MESSAGES"
    | "UPDATE_MESSAGE";
  payload?: any;
}
