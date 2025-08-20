import React from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";

interface ChatProps {
  onDiagramGenerated: (diagram: string) => void;
  className?: string;
}

const Chat: React.FC<ChatProps> = ({ onDiagramGenerated, className }) => {
  return (
    <ChatContainer
      onDiagramGenerated={onDiagramGenerated}
      className={className}
    />
  );
};

export default Chat;
