import { useReducer, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { storage } from "@/lib/utils/storage";
import { IdGenerator } from "@/lib/utils/id-generator";
import { ClientConversationService } from "@/lib/services/client-conversation-service";
import { generateMermaidDiagram } from "@/app/actions";
import { UI_CONFIG } from "@/lib/constants";
import type { ChatState, ChatAction, ChatMessage } from "@/types";

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  currentInput: "",
  conversationMetadata: undefined,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "UPDATE_CURRENT_INPUT":
      return {
        ...state,
        currentInput: action.payload,
      };
    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
        conversationMetadata: undefined,
      };
    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id
            ? { ...msg, ...action.payload.updates }
            : msg
        ),
      };
    case "SET_CONVERSATION_METADATA":
      return {
        ...state,
        conversationMetadata: action.payload,
      };
    default:
      return state;
  }
}

export function useChat(onDiagramGenerated?: (diagram: string) => void) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Memoize conversation service to prevent recreating on every render
  const conversationService = useMemo(
    () => new ClientConversationService(),
    []
  );

  // Load chat history and metadata on mount
  useEffect(() => {
    const messages = storage.loadChatHistory();
    const metadata = storage.loadConversationMetadata();

    // Detect conversation type
    const detection = conversationService.detectConversationType(
      messages,
      metadata || undefined
    );

    // Load messages
    messages.forEach((message: ChatMessage) => {
      dispatch({ type: "ADD_MESSAGE", payload: message });
    });

    // Set conversation metadata
    dispatch({
      type: "SET_CONVERSATION_METADATA",
      payload: detection.metadata,
    });

    // Show contextual greeting if appropriate
    if (conversationService.shouldShowContextualGreeting(detection.type)) {
      const statusMessage = conversationService.getConversationStatusMessage(
        detection.type,
        detection.reason
      );

      toast.info(statusMessage, {
        duration: UI_CONFIG.TOAST_DURATION.INFO,
        description: `Conversation type: ${detection.type} (${detection.confidence} confidence)`,
      });
    }
  }, [conversationService]);

  // Save chat history and metadata when they change
  useEffect(() => {
    if (state.messages.length > 0) {
      storage.saveChatHistory(state.messages);
    }

    if (state.conversationMetadata) {
      storage.saveConversationMetadata(state.conversationMetadata);
    }
  }, [state.messages, state.conversationMetadata]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || state.isLoading) return;

      // Detect conversation type before sending
      const detection = conversationService.detectConversationType(
        state.messages,
        state.conversationMetadata
      );

      // Update metadata if conversation type changed
      if (detection.type !== state.conversationMetadata?.conversationType) {
        dispatch({
          type: "SET_CONVERSATION_METADATA",
          payload: detection.metadata,
        });

        // Show notification for significant changes
        if (detection.type === "topic_switch") {
          toast.info(detection.reason, {
            duration: UI_CONFIG.TOAST_DURATION.INFO,
            description: "I'll consider this context switch in my response",
          });
        }
      }

      const userMessage: ChatMessage = {
        id: IdGenerator.generateMessageId(),
        content: message,
        role: "user",
        timestamp: new Date(),
        type: "text",
      };

      dispatch({ type: "ADD_MESSAGE", payload: userMessage });
      dispatch({ type: "UPDATE_CURRENT_INPUT", payload: "" });
      dispatch({ type: "SET_LOADING", payload: true });

      // Create loading message
      const assistantMessageId = IdGenerator.generateMessageId();
      const loadingMessage: ChatMessage = {
        id: assistantMessageId,
        content: getContextualLoadingMessage(detection.type),
        role: "assistant",
        timestamp: new Date(),
        type: "diagram",
        isGenerating: true,
      };

      dispatch({ type: "ADD_MESSAGE", payload: loadingMessage });

      try {
        const conversationHistory = conversationService.getRecentMessages(
          state.messages,
          20
        );

        // Call server action directly
        const diagramCode = await generateMermaidDiagram(
          message,
          conversationHistory
        );

        // Update the loading message with the generated diagram
        dispatch({
          type: "UPDATE_MESSAGE",
          payload: {
            id: assistantMessageId,
            updates: {
              content: getContextualSuccessMessage(detection.type),
              diagramCode: diagramCode,
              isGenerating: false,
            },
          },
        });

        // Call the callback if provided
        onDiagramGenerated?.(diagramCode);

        toast.success("Diagram generated successfully!");

        // Update metadata after successful generation
        const updatedMetadata = {
          ...detection.metadata,
          messageCount: state.messages.length + 2,
          lastActivity: new Date(),
        };
        dispatch({
          type: "SET_CONVERSATION_METADATA",
          payload: updatedMetadata,
        });
      } catch (error) {
        console.error("Error generating diagram:", error);

        dispatch({
          type: "UPDATE_MESSAGE",
          payload: {
            id: assistantMessageId,
            updates: {
              content:
                error instanceof Error
                  ? error.message
                  : "Unknown error. Please try rephrasing your request or check if your description is clear.",
              isGenerating: false,
              type: "text",
            },
          },
        });

        toast.error("Failed to generate diagram", {
          description: error instanceof Error ? error.message : "Unknown error",
          duration: UI_CONFIG.TOAST_DURATION.ERROR,
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [
      state.messages,
      state.isLoading,
      state.conversationMetadata,
      conversationService,
      onDiagramGenerated,
    ]
  );

  const updateInput = useCallback((input: string) => {
    dispatch({ type: "UPDATE_CURRENT_INPUT", payload: input });
  }, []);

  const clearChat = useCallback(() => {
    dispatch({ type: "CLEAR_MESSAGES" });
    storage.clearChatData();
    toast.success("Chat cleared - Starting fresh conversation");
  }, []);

  return {
    ...state,
    sendMessage,
    updateInput,
    clearChat,
  };
}

function getContextualLoadingMessage(conversationType: string): string {
  switch (conversationType) {
    case "new_session":
      return "Welcome! I'll help you create that diagram. Let me generate the Mermaid code for you...";
    case "continuation":
      return "I'll help you create that diagram. Let me generate the Mermaid code for you...";
    case "resumed":
      return "Welcome back! I'll help you create that diagram. Let me generate the Mermaid code for you...";
    case "topic_switch":
      return "I see we're exploring a new type of diagram. Let me generate the Mermaid code for you...";
    default:
      return "I'll help you create that diagram. Let me generate the Mermaid code for you...";
  }
}

function getContextualSuccessMessage(conversationType: string): string {
  switch (conversationType) {
    case "new_session":
      return "I've generated your first Mermaid diagram! You can copy the code or use it directly in the editor.";
    case "continuation":
      return "I've generated a Mermaid diagram based on your description and our conversation context. You can copy the code or use it directly in the editor.";
    case "resumed":
      return "I've generated a Mermaid diagram considering our previous conversation. You can copy the code or use it directly in the editor.";
    case "topic_switch":
      return "I've generated a Mermaid diagram for this new topic. You can copy the code or use it directly in the editor.";
    default:
      return "I've generated a Mermaid diagram based on your description. You can copy the code or use it directly in the editor.";
  }
}
