
import { GoogleGenAI, Type } from "@google/genai";

export const createGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * 核心图生图/局部重绘功能
 */
export const generateWorkflowImage = async (prompt: string, snapshot: string, mask?: string) => {
  const ai = createGeminiClient();
  
  const extractBase64 = (data: string) => data.includes(',') ? data.split(',')[1] : data;

  const parts: any[] = [
    {
      inlineData: {
        data: extractBase64(snapshot),
        mimeType: "image/png"
      }
    }
  ];

  if (mask && mask.length > 500) {
    parts.push({
      inlineData: {
        data: extractBase64(mask),
        mimeType: "image/png"
      }
    });
    parts.push({
      text: `Task: Selective Image Inpainting/Editing.
      Target Area: The areas marked in the secondary mask image (highlighted regions).
      Action: ${prompt}.
      
      Instructions:
      - Only modify the parts of the primary image that correspond to the mask.
      - Seamlessly blend the new content with the existing surroundings.
      - Maintain consistent lighting, style, and quality.
      - Output the full updated image.`
    });
  } else {
    parts.push({
      text: `Task: Image Transformation / Style Fusion.
      Prompt: ${prompt}.
      
      Instructions:
      - Use the provided image as a composition and structure reference.
      - Output a high-fidelity creative result.
      - DO NOT include toolbars or UI elements.`
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { 
      imageConfig: { 
        aspectRatio: "1:1" 
      } 
    }
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("AI 未能生成图像");
};

/**
 * AI 抠图功能：利用 Gemini 识别主体并移除背景
 */
export const removeBackground = async (imageData: string) => {
  const ai = createGeminiClient();
  const extractBase64 = (data: string) => data.includes(',') ? data.split(',')[1] : data;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: extractBase64(imageData),
            mimeType: "image/png"
          }
        },
        {
          text: "Task: Background Removal. Identify the main subject in this image and remove the background entirely. Return the subject on a PURE WHITE background (#FFFFFF). The subject must remain high quality and uncropped. Do not add any text or UI elements."
        }
      ]
    }
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("AI 抠图失败");
};

export const generatePlan = async (prompt: string) => {
  const ai = createGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an expert creative director. Create a structured design plan for: "${prompt}".
    Mix 'generate_image', 'brainstorm', 'research', and 'workflow' tasks.
    Translate output to Chinese.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['generate_image', 'brainstorm', 'research', 'workflow'] },
                imagePrompt: { type: Type.STRING }
              },
              required: ['title', 'description', 'type']
            }
          }
        },
        required: ['steps']
      }
    }
  });
  try { return JSON.parse(response.text || '{}'); } catch (e) { return { steps: [] }; }
};

export const generateImage = async (prompt: string, style: string = 'none') => {
  const ai = createGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data found");
};

export const performResearch = async (query: string) => {
  const ai = createGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Research: "${query}"`,
    config: { tools: [{ googleSearch: {} }] }
  });
  const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map(chunk => chunk.web?.uri).filter(uri => !!uri) as string[] || [];
  return { text: response.text, urls: [...new Set(urls)] };
};

export const generateBrainstorm = async (topic: string, description: string) => {
  const ai = createGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Brainstorm ideas for: "${topic}". Description: ${description}. Markdown.`,
  });
  return response.text;
};

export const refineContent = async (item: any) => {
  const ai = createGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on content: "${item.content}", suggest next step. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  try { return JSON.parse(response.text || '{}'); } catch (e) { return null; }
};