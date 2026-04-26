import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function analyzeImage(base64Image: string) {
  try {
    // Make sure we have an API key
    if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured.");
    }

    // Clean the base64 string to just get the data part
    // e.g. "data:image/jpeg;base64,/9j/4AAQSkZJRg..." -> "/9j/4AAQSkZJRg..."
    const base64Data = base64Image.split(",")[1] || base64Image;

    // Use the latest available flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an assistant for a Starbucks Partner internal application. 
      Analyze the attached image (it might be a poster, announcement, or receipt).
      Extract the key information and return it in a strictly formatted JSON object.
      Do not return markdown wrappers like \`\`\`json. Return only the raw JSON.
      
      CRITICAL RULE: YOU MUST WRITE THE JSON VALUES IN KOREAN. 
      Do NOT translate Korean text into English. Read the Korean text directly from the image and write it EXACTLY as it appears in the image.
      
      Required JSON format:
      {
        "title": "사진의 핵심 이벤트/프로모션 제목 (최대 30자, 한국어)",
        "content": "사진에 적힌 메인 내용 전체를 한국어로 원본 그대로 작성",
        "cautions": "사진 하단이나 구석에 적힌 유의사항, 제외매장 등의 문구를 한국어로 원본 그대로 작성. 없다면 빈 문자열"
      }
    `;

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg" // Assuming jpeg from our compression
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    // Parse the JSON (handling potential markdown formatting if the model disobeys instructions)
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/```json\n?/, "").replace(/```$/, "").trim();
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw error;
  }
}
