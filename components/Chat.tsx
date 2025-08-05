import React, { useState, useRef, useEffect, useReducer } from "react";
import { cn } from "@/lib/utils";
import {
  ChatMessage as ChatMessageType,
  ChatState,
  ChatAction,
} from "@/lib/types/chat";
import ChatMessage from "@/components/ChatMessage";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { generateMermaidDiagram } from "@/app/actions";
import { toast } from "sonner";

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  currentInput: "",
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
    default:
      return state;
  }
}

interface ChatProps {
  onDiagramGenerated: (diagram: string) => void;
  className?: string;
}

const Chat: React.FC<ChatProps> = ({ onDiagramGenerated, className }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  useEffect(() => {
    // Load chat history from localStorage
    const savedMessages = localStorage.getItem("mermaid-chat-history");
    if (savedMessages) {
      try {
        const messages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        messages.forEach((message: ChatMessageType) => {
          dispatch({ type: "ADD_MESSAGE", payload: message });
        });
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Save chat history to localStorage
    if (state.messages.length > 0) {
      localStorage.setItem(
        "mermaid-chat-history",
        JSON.stringify(state.messages)
      );
    }
  }, [state.messages]);

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const handleSendMessage = async () => {
    const message = state.currentInput.trim();
    if (!message || state.isLoading) return;

    const userMessage: ChatMessageType = {
      id: generateId(),
      content: message,
      role: "user",
      timestamp: new Date(),
      type: "text",
    };

    dispatch({ type: "ADD_MESSAGE", payload: userMessage });
    dispatch({ type: "UPDATE_CURRENT_INPUT", payload: "" });
    dispatch({ type: "SET_LOADING", payload: true });

    // Create a temporary assistant message with loading state
    const assistantMessageId = generateId();
    const loadingMessage: ChatMessageType = {
      id: assistantMessageId,
      content:
        "I'll help you create that diagram. Let me generate the Mermaid code for you...",
      role: "assistant",
      timestamp: new Date(),
      type: "diagram",
      isGenerating: true,
    };

    dispatch({ type: "ADD_MESSAGE", payload: loadingMessage });

    try {
      const diagramCode = await generateMermaidDiagram(message);

      // Update the loading message with the generated diagram
      dispatch({
        type: "UPDATE_MESSAGE",
        payload: {
          id: assistantMessageId,
          updates: {
            content:
              "I've generated a Mermaid diagram based on your description. You can copy the code or use it directly in the editor.",
            diagramCode,
            isGenerating: false,
          },
        },
      });

      toast.success("Diagram generated successfully!");
    } catch (error) {
      console.error("Error generating diagram:", error);

      // Update the loading message with error
      dispatch({
        type: "UPDATE_MESSAGE",
        payload: {
          id: assistantMessageId,
          updates: {
            content: `I apologize, but I encountered an error while generating your diagram: ${
              error instanceof Error ? error.message : "Unknown error"
            }. Please try rephrasing your request or check if your description is clear.`,
            isGenerating: false,
            type: "text",
          },
        },
      });

      toast.error("Failed to generate diagram", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    dispatch({ type: "CLEAR_MESSAGES" });
    localStorage.removeItem("mermaid-chat-history");
    toast.success("Chat cleared");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: "UPDATE_CURRENT_INPUT", payload: e.target.value });

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <div className="flex items-center justify-between p-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            AI Diagram Chat
          </h3>
        </div>
        {state.messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {state.messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center py-12">
            <div className="max-w-md space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Welcome to AI Diagram Chat
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Describe the diagram you want to create and I'll generate the
                  Mermaid code for you. Try asking for flowcharts, sequence
                  diagrams, class diagrams, and more!
                </p>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
                <p>
                  <strong>Examples:</strong>
                </p>
                <p>"Create a flowchart for user authentication"</p>
                <p>"Generate a sequence diagram for API calls"</p>
                <p>"Make a class diagram for an e-commerce system"</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {state.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onDiagramGenerated={onDiagramGenerated}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={state.currentInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Describe the diagram you want to create..."
              disabled={state.isLoading}
              className="w-full resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              style={{
                minHeight: "48px",
                maxHeight: "120px",
              }}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!state.currentInput.trim() || state.isLoading}
            className="self-end h-12 px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default Chat;
