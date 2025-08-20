"use server";

import Groq from "groq-sdk";
import OpenAI from "openai";
import { API_CONFIG } from "@/lib/constants";

// Server action for Groq API calls
export async function groqCompletion(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Groq API key is not configured. Please set GROQ_API_KEY in your environment variables."
    );
  }

  try {
    const client = new Groq({ apiKey });

    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: API_CONFIG.GROQ.MODEL,
      temperature: API_CONFIG.GROQ.TEMPERATURE,
      max_tokens: API_CONFIG.GROQ.MAX_TOKENS,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response received from Groq API");
    }

    return content;
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error(
      `Groq API error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Server action for DeepSeek API calls
export async function deepSeekCompletion(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error(
      "DeepSeek API key is not configured. Please set DEEPSEEK_API_KEY in your environment variables."
    );
  }

  try {
    const client = new OpenAI({
      baseURL: API_CONFIG.DEEPSEEK.BASE_URL,
      apiKey,
    });

    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: API_CONFIG.DEEPSEEK.MODEL,
      temperature: API_CONFIG.DEEPSEEK.TEMPERATURE,
      max_tokens: API_CONFIG.DEEPSEEK.MAX_TOKENS,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response received from DeepSeek API");
    }

    return content;
  } catch (error) {
    console.error("DeepSeek API error:", error);
    throw new Error(
      `DeepSeek API error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
