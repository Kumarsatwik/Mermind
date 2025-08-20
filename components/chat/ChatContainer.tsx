import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useChat } from "@/lib/hooks";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatWelcome } from "./ChatWelcome";
import ChatMessage from "@/components/ChatMessage";

interface ChatContainerProps {
  onDiagramGenerated: (diagram: string) => void;
  className?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  onDiagramGenerated,
  className,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    isLoading,
    currentInput,
    conversationMetadata,
    sendMessage,
    updateInput,
    clearChat,
  } = useChat(onDiagramGenerated);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <ChatHeader
        messageCount={messages.length}
        conversationType={conversationMetadata?.conversationType}
        onClearChat={clearChat}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <ChatWelcome />
        ) : (
          <>
            {messages.map((message) => (
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

      <ChatInput
        value={currentInput}
        onChange={updateInput}
        onSend={sendMessage}
        isLoading={isLoading}
        conversationMetadata={conversationMetadata}
      />
    </div>
  );
};
