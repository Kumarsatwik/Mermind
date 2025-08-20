import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Trash2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationType } from "@/types";

interface ChatHeaderProps {
  messageCount: number;
  conversationType?: ConversationType;
  onClearChat: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  messageCount,
  conversationType,
  onClearChat,
}) => {
  const getConversationStatusIndicator = () => {
    if (!conversationType) return null;

    const statusColors = {
      new_session: "text-green-600 dark:text-green-400",
      continuation: "text-blue-600 dark:text-blue-400",
      resumed: "text-amber-600 dark:text-amber-400",
      topic_switch: "text-purple-600 dark:text-purple-400",
    };

    const statusLabels = {
      new_session: "New",
      continuation: "Active",
      resumed: "Resumed",
      topic_switch: "Topic Switch",
    };

    return (
      <div
        className={cn(
          "flex items-center gap-1 text-xs",
          statusColors[conversationType]
        )}
      >
        <Info className="w-3 h-3" />
        <span>{statusLabels[conversationType]}</span>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          AI Diagram Chat
        </h3>
        {getConversationStatusIndicator()}
      </div>
      {messageCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearChat}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
