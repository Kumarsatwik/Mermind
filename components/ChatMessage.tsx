import React from "react";
import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from "@/lib/types/chat";
import { User, Bot, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface ChatMessageProps {
  message: ChatMessageType;
  onDiagramGenerated?: (diagram: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onDiagramGenerated,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleUseDiagram = () => {
    if (message.diagramCode && onDiagramGenerated) {
      onDiagramGenerated(message.diagramCode);
      toast.success("Diagram loaded into editor");
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        isUser
          ? "bg-primary/5 border border-primary/10 ml-8"
          : "bg-slate-50/80 dark:bg-slate-800/50 mr-8"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {isUser ? "You" : "Assistant"}
          </span>
          <span className="text-xs text-slate-400">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="space-y-3">
          {message.isGenerating ? (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating diagram...</span>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            </div>
          )}

          {message.type === "diagram" && message.diagramCode && (
            <div className="space-y-3">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Generated Mermaid Code
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(message.diagramCode!)}
                      className="h-7 px-2"
                    >
                      {copied ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <pre className="text-xs font-mono bg-white dark:bg-slate-900 p-3 rounded border overflow-x-auto">
                  <code className="text-slate-800 dark:text-slate-200">
                    {message.diagramCode}
                  </code>
                </pre>
              </div>

              <Button
                onClick={handleUseDiagram}
                variant="default"
                size="sm"
                className="w-full"
              >
                Use This Diagram
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
