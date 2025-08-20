import React, { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { UI_CONFIG } from "@/lib/constants";
import type { ConversationMetadata } from "@/types";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  isLoading: boolean;
  conversationMetadata?: ConversationMetadata;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
  conversationMetadata,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);

      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = "auto";
      textarea.style.height =
        Math.min(textarea.scrollHeight, UI_CONFIG.TEXTAREA_MAX_HEIGHT) + "px";
    },
    [onChange]
  );

  const handleSend = useCallback(() => {
    const message = value.trim();
    if (message && !isLoading) {
      onSend(message);
    }
  }, [value, isLoading, onSend]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="flex gap-3">
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Describe the diagram you want to create..."
            disabled={isLoading}
            className="w-full resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            style={{
              minHeight: `${UI_CONFIG.TEXTAREA_MIN_HEIGHT}px`,
              maxHeight: `${UI_CONFIG.TEXTAREA_MAX_HEIGHT}px`,
            }}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
          className="self-end h-12 px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Press Enter to send, Shift+Enter for new line
        </p>
        {conversationMetadata && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {conversationMetadata.messageCount} messages • Session:{" "}
            {conversationMetadata.sessionId.split("_")[1]}
          </p>
        )}
      </div>
    </div>
  );
};
