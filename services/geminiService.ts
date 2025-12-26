
import { GoogleGenAI } from "@google/genai";

export const getVictoryMessage = async (totalTimeLeft: number, level: number) => {
  try {
    // Fix: Always use process.env.API_KEY directly as a named parameter.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The player just won a memory card game! They finished all 3 levels with ${totalTimeLeft} seconds to spare. Provide a short (max 2 sentences), encouraging, and cool futuristic-themed victory message. Use a tone of a digital game master.`,
      config: {
        temperature: 0.8,
        maxOutputTokens: 100
      }
    });
    // Fix: Access response.text as a property, not a method.
    return response.text || "Mission Accomplished, Commander. You've conquered the Chronos Quest with time to spare.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Victory is yours! Your memory is unparalleled in this sector.";
  }
};
