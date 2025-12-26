
import { GoogleGenAI } from "@google/genai";

export const getVictoryMessage = async (totalTimeLeft: number) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `玩家赢得了记忆匹配游戏！最终剩余时间：${totalTimeLeft}秒。请提供一段非常简短（最多2句话）、鼓励且具有赛博朋克风格的中文贺词。`,
    });
    return response.text || "同步完成。你的认知水平超出了本系统的预测。";
  } catch (error) {
    return "胜利属于你！你的记忆力在当前星区无与伦比。";
  }
};
