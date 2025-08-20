import Groq from "groq-sdk";
import OpenAI from "openai";
import { API_CONFIG } from "@/lib/constants";

export class AIClientError extends Error {
  constructor(
    message: string,
    public provider: "groq" | "deepseek",
    public originalError?: unknown
  ) {
    super(message);
    this.name = "AIClientError";
  }
}

export class GroqClient {
  private client: Groq | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.client = new Groq({ apiKey });
    }
  }

  async generateCompletion(prompt: string): Promise<string> {
    if (!this.client) {
      throw new AIClientError(
        "Groq API key is not configured. Please set GROQ_API_KEY in your environment variables.",
        "groq"
      );
    }

    try {
      const completion = await this.client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: API_CONFIG.GROQ.MODEL,
        temperature: API_CONFIG.GROQ.TEMPERATURE,
        max_tokens: API_CONFIG.GROQ.MAX_TOKENS,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new AIClientError("No response received from Groq API", "groq");
      }

      return content;
    } catch (error) {
      console.error("Groq API error:", error);
      throw new AIClientError(
        `Groq API error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "groq",
        error
      );
    }
  }
}

export class DeepSeekClient {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({
        baseURL: API_CONFIG.DEEPSEEK.BASE_URL,
        apiKey,
      });
    }
  }

  async generateCompletion(prompt: string): Promise<string> {
    if (!this.client) {
      throw new AIClientError(
        "DeepSeek API key is not configured. Please set DEEPSEEK_API_KEY in your environment variables.",
        "deepseek"
      );
    }

    try {
      const completion = await this.client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: API_CONFIG.DEEPSEEK.MODEL,
        temperature: API_CONFIG.DEEPSEEK.TEMPERATURE,
        max_tokens: API_CONFIG.DEEPSEEK.MAX_TOKENS,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new AIClientError(
          "No response received from DeepSeek API",
          "deepseek"
        );
      }

      return content;
    } catch (error) {
      console.error("DeepSeek API error:", error);
      throw new AIClientError(
        `DeepSeek API error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "deepseek",
        error
      );
    }
  }
}
