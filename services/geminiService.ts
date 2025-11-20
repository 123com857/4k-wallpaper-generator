import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeminiResponse, DailyContent } from '../types';
import { GEMINI_MODEL } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeImage = async (base64Image: string): Promise<GeminiResponse> => {
  try {
    // Clean the base64 string if it contains data header
    const data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        chinesePoem: {
          type: Type.STRING,
          description: "A beautiful, short, two-line poem in Chinese capturing the mood of the image. Use traditional or simplified Chinese, make it poetic and elegant.",
        },
        englishPoem: {
          type: Type.STRING,
          description: "An English translation or adaptation of the Chinese poem. Make it lyrical.",
        },
        colors: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of 5 hex color codes dominant in the image.",
        },
      },
      required: ["chinesePoem", "englishPoem", "colors"],
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: data,
            },
          },
          {
            text: "Analyze this image. Generate a poetic response and a color palette.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a poet and visual artist. Your goal is to create a serene, aesthetic experience. Generate poems that are short (couplets), profound, and match the visual mood.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as GeminiResponse;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback if API fails
    return {
      chinesePoem: "山重水复疑无路，柳暗花明又一村。",
      englishPoem: "Across the mountains and rivers, a path creates itself.",
      colors: ["#2d3436", "#636e72", "#b2bec3", "#dfe6e9", "#ffffff"]
    };
  }
};