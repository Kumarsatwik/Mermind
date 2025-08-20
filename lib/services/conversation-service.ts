import { CHAT_CONFIG } from "@/lib/constants";
import type {
  ChatMessage,
  ConversationType,
  ConversationMetadata,
} from "@/types";

interface ConversationDetectionResult {
  type: ConversationType;
  confidence: "high" | "medium" | "low";
  reason: string;
  metadata: ConversationMetadata;
}

export class ConversationService {
  detectConversationType(
    messages: ChatMessage[],
    currentMetadata?: ConversationMetadata
  ): ConversationDetectionResult {
    const now = new Date();

    // Case 1: No messages = New session
    if (messages.length === 0) {
      return {
        type: "new_session",
        confidence: "high",
        reason: "No previous messages found",
        metadata: this.createNewSessionMetadata(now),
      };
    }

    // Case 2: No existing metadata = First time loading saved messages
    if (!currentMetadata) {
      const lastMessage = messages[messages.length - 1];
      const timeSinceLastMessage =
        now.getTime() - lastMessage.timestamp.getTime();

      if (timeSinceLastMessage > CHAT_CONFIG.SESSION_TIMEOUT_MS) {
        return {
          type: "resumed",
          confidence: "high",
          reason: `Resumed after ${Math.round(
            timeSinceLastMessage / (1000 * 60)
          )} minutes`,
          metadata: this.createResumedSessionMetadata(messages, now),
        };
      } else {
        return {
          type: "continuation",
          confidence: "medium",
          reason: "Continuing recent conversation",
          metadata: this.createContinuationMetadata(messages, now),
        };
      }
    }

    // Case 3: Check for session timeout
    const timeSinceLastActivity =
      now.getTime() - currentMetadata.lastActivity.getTime();
    if (timeSinceLastActivity > CHAT_CONFIG.SESSION_TIMEOUT_MS) {
      return {
        type: "resumed",
        confidence: "high",
        reason: `Session resumed after ${Math.round(
          timeSinceLastActivity / (1000 * 60)
        )} minutes`,
        metadata: {
          ...currentMetadata,
          lastActivity: now,
          conversationType: "resumed",
        },
      };
    }

    // Case 4: Check for topic switch
    const recentMessages = messages.slice(-CHAT_CONFIG.TOPIC_SWITCH_THRESHOLD);
    const topicSwitchDetected = this.detectTopicSwitch(
      recentMessages,
      currentMetadata.topics
    );

    if (topicSwitchDetected.switched) {
      return {
        type: "topic_switch",
        confidence: topicSwitchDetected.confidence,
        reason: `Topic switched to: ${topicSwitchDetected.newTopic}`,
        metadata: {
          ...currentMetadata,
          lastActivity: now,
          conversationType: "topic_switch",
          topics: [
            ...currentMetadata.topics,
            topicSwitchDetected.newTopic!,
          ].slice(-5),
        },
      };
    }

    // Case 5: Normal continuation
    return {
      type: "continuation",
      confidence: "high",
      reason: "Active conversation continuation",
      metadata: {
        ...currentMetadata,
        lastActivity: now,
        messageCount: messages.length,
        conversationType: "continuation",
      },
    };
  }

  formatConversationHistory(messages: ChatMessage[]): string {
    if (messages.length === 0) return "";

    const recentMessages = this.getRecentMessages(
      messages,
      CHAT_CONFIG.MAX_HISTORY_MESSAGES
    );
    const formattedHistory = recentMessages
      .map((msg) => {
        const role = msg.role === "user" ? "Human" : "Assistant";
        const content = msg.diagramCode
          ? `${
              msg.content
            }\n[Generated diagram code: ${msg.diagramCode.substring(
              0,
              100
            )}...]`
          : msg.content;
        return `${role}: ${content}`;
      })
      .join("\n\n");

    return `\nConversation History:\n${formattedHistory}\n\nCurrent Request:\n`;
  }

  getRecentMessages(
    messages: ChatMessage[],
    maxMessages: number = CHAT_CONFIG.MAX_HISTORY_MESSAGES
  ): ChatMessage[] {
    return messages.slice(-maxMessages);
  }

  getConversationStatusMessage(type: ConversationType, reason: string): string {
    switch (type) {
      case "new_session":
        return "Starting a new conversation";
      case "continuation":
        return "Continuing our conversation";
      case "resumed":
        return `Welcome back! ${reason}`;
      case "topic_switch":
        return `I notice we're switching topics. ${reason}`;
      default:
        return "Ready to help with your diagrams";
    }
  }

  shouldShowContextualGreeting(type: ConversationType): boolean {
    return type === "resumed" || type === "topic_switch";
  }

  private createNewSessionMetadata(now: Date): ConversationMetadata {
    return {
      sessionId: this.generateSessionId(),
      startTime: now,
      lastActivity: now,
      messageCount: 0,
      conversationType: "new_session",
      topics: [],
    };
  }

  private createResumedSessionMetadata(
    messages: ChatMessage[],
    now: Date
  ): ConversationMetadata {
    const topics = this.extractTopicsFromMessages(messages);
    return {
      sessionId: this.generateSessionId(),
      startTime: messages[0]?.timestamp || now,
      lastActivity: now,
      messageCount: messages.length,
      conversationType: "resumed",
      topics,
    };
  }

  private createContinuationMetadata(
    messages: ChatMessage[],
    now: Date
  ): ConversationMetadata {
    const topics = this.extractTopicsFromMessages(messages);
    return {
      sessionId: this.generateSessionId(),
      startTime: messages[0]?.timestamp || now,
      lastActivity: now,
      messageCount: messages.length,
      conversationType: "continuation",
      topics,
    };
  }

  private detectTopicSwitch(
    recentMessages: ChatMessage[],
    currentTopics: string[]
  ): {
    switched: boolean;
    confidence: "high" | "medium" | "low";
    newTopic?: string;
  } {
    if (recentMessages.length === 0) {
      return { switched: false, confidence: "low" };
    }

    const userMessages = recentMessages.filter((msg) => msg.role === "user");
    const recentKeywords = this.extractKeywordsFromMessages(userMessages);

    // Check for diagram type switches
    const diagramKeywords = {
      flowchart: ["flowchart", "flow", "process", "workflow", "steps"],
      sequence: ["sequence", "interaction", "timeline", "communication"],
      class: ["class", "object", "inheritance", "relationship"],
      er: ["database", "entity", "table", "relation"],
      state: ["state", "status", "transition", "lifecycle"],
      gantt: ["gantt", "timeline", "schedule", "project", "milestone"],
    };

    for (const [diagramType, keywords] of Object.entries(diagramKeywords)) {
      const hasKeywords = keywords.some((keyword) =>
        recentKeywords.some((recent) => recent.toLowerCase().includes(keyword))
      );

      if (hasKeywords && !currentTopics.includes(diagramType)) {
        return {
          switched: true,
          confidence: "high",
          newTopic: diagramType,
        };
      }
    }

    // Check for general topic switches
    const topicChangeIndicators = [
      "now let's",
      "switch to",
      "instead",
      "different",
      "new",
      "another",
      "change topic",
      "move on",
      "next",
    ];

    const hasTopicChangeIndicator = userMessages.some((msg) =>
      topicChangeIndicators.some((indicator) =>
        msg.content.toLowerCase().includes(indicator)
      )
    );

    if (hasTopicChangeIndicator) {
      return {
        switched: true,
        confidence: "medium",
        newTopic: "general_topic_switch",
      };
    }

    return { switched: false, confidence: "low" };
  }

  private extractTopicsFromMessages(messages: ChatMessage[]): string[] {
    const topics = new Set<string>();

    messages.forEach((msg) => {
      if (msg.type === "diagram" && msg.diagramCode) {
        const diagramType = this.extractDiagramTypeFromCode(msg.diagramCode);
        if (diagramType) topics.add(diagramType);
      }
    });

    return Array.from(topics);
  }

  private extractKeywordsFromMessages(messages: ChatMessage[]): string[] {
    return messages.flatMap((msg) =>
      msg.content
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3)
    );
  }

  private extractDiagramTypeFromCode(code: string): string | null {
    const lowerCode = code.toLowerCase();
    if (lowerCode.includes("sequencediagram")) return "sequence";
    if (lowerCode.includes("classdiagram")) return "class";
    if (lowerCode.includes("erdiagram")) return "er";
    if (lowerCode.includes("statediagram")) return "state";
    if (lowerCode.includes("gantt")) return "gantt";
    if (lowerCode.includes("graph") || lowerCode.includes("flowchart"))
      return "flowchart";
    return null;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
