// API Configuration
export const API_CONFIG = {
  GROQ: {
    MODEL: "llama-3.1-8b-instant",
    TEMPERATURE: 0.3,
    MAX_TOKENS: 2000,
  },
  DEEPSEEK: {
    MODEL: "deepseek-chat",
    TEMPERATURE: 0.3,
    MAX_TOKENS: 2000,
    BASE_URL: "https://api.deepseek.com",
  },
} as const;

// Chat Configuration
export const CHAT_CONFIG = {
  MAX_HISTORY_MESSAGES: 20,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  TOPIC_SWITCH_THRESHOLD: 3,
  AUTO_SAVE_DELAY_MS: 1000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  CHAT_HISTORY: "mermaid-chat-history",
  CONVERSATION_METADATA: "mermaid-conversation-metadata",
  USER_PREFERENCES: "mermaid-user-preferences",
} as const;

// Diagram Types
export const DIAGRAM_TYPES = [
  "flowchart",
  "sequence_diagram",
  "class_diagram",
  "er_diagram",
  "state_diagram",
  "gantt_chart",
] as const;

// Mermaid Directives
export const MERMAID_DIRECTIVES = {
  flowchart: ["graph", "flowchart"],
  sequence_diagram: ["sequenceDiagram"],
  class_diagram: ["classDiagram"],
  er_diagram: ["erDiagram"],
  state_diagram: ["stateDiagram", "stateDiagram-v2"],
  gantt_chart: ["gantt"],
  pie: ["pie"],
  journey: ["journey"],
  gitgraph: ["gitgraph"],
} as const;

// UI Constants
export const UI_CONFIG = {
  TEXTAREA_MAX_HEIGHT: 120,
  TEXTAREA_MIN_HEIGHT: 48,
  TOAST_DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    INFO: 4000,
  },
} as const;
