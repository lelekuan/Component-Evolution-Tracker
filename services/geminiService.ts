
import { GoogleGenAI } from "@google/genai";
import { LocationHistory } from "../types";

export const analyzeChanges = async (history: LocationHistory): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Analyze the following hardware component lifecycle for location ${history.location}.
    Data: ${JSON.stringify(history.stages)}
    
    Tasks:
    1. Summarize the major changes between stages.
    2. Explain if there were value shifts (e.g., resistor resistance changes).
    3. Note any config-specific variations.
    
    Keep the tone professional and engineering-focused. Use bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error analyzing component history.";
  }
};
