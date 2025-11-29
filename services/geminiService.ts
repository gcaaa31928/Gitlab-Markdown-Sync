import { GoogleGenAI } from "@google/genai";
import { AIActionType } from "../types.ts";

// Initialize Gemini
// The API key is obtained exclusively from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const SYSTEM_INSTRUCTION = `You are an expert technical writer and markdown editor assistant. 
Your goal is to help users improve their documentation stored in a GitLab Wiki.
Maintain the existing markdown formatting. Only output the modified text, do not add conversational filler.`;

export const processAIAction = async (
  text: string, 
  action: AIActionType
): Promise<string> => {
  if (!text.trim()) {
    return "";
  }

  let prompt = "";
  switch (action) {
    case AIActionType.FIX_GRAMMAR:
      prompt = "Fix grammar, spelling, and punctuation in the following markdown text. Keep the tone professional.";
      break;
    case AIActionType.SUMMARIZE:
      prompt = "Provide a concise summary of the following content in markdown bullet points.";
      break;
    case AIActionType.EXPAND:
      prompt = "Expand on the ideas in the following text, adding relevant details and examples where appropriate. Keep it in markdown.";
      break;
    case AIActionType.TRANSLATE_EN:
      prompt = "Translate the following text to English, preserving markdown structure.";
      break;
    case AIActionType.TRANSLATE_ZH:
      prompt = "Translate the following text to Traditional Chinese (Taiwan), preserving markdown structure.";
      break;
    default:
      prompt = "Improve the following text.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${prompt}\n\n---\n\n${text}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || text;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new Error("Failed to process AI request. Please try again.");
  }
};