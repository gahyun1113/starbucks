import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function analyzeImage(base64Image: string) {
  try {
    if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured in Vercel environment variables.");
    }

    const base64Data = base64Image.split(",")[1] || base64Image;

    // Try gemini-1.5-flash-002 first, then fallback to gemini-1.5-flash
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });
    } catch (e) {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    const prompt = `
      Analyze this Starbucks promotion image.
      Return a JSON object with:
      {
        "title": "Core event title in Korean",
        "content": "Main description in Korean",
        "cautions": "Cautions or exclusions in Korean"
      }
      Return ONLY raw JSON. No markdown.
    `;

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/```json\n?/, "").replace(/```$/, "").trim();
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```\n?/, "").replace(/```$/, "").trim();
    }
    
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // If it's a 404, suggest checking model availability
    if (error.message?.includes("404")) {
      throw new Error("Gemini 1.5 Flash model not found. Please ensure your API key has access to this model in Google AI Studio.");
    }
    throw error;
  }
}
