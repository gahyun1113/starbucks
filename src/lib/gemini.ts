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
    const base64Data = base64Image.split(",")[1] || base64Image;

    // Use the latest model: gemini-2.0-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      당신은 스타벅스 파트너를 위한 내부 애플리케이션 조수입니다.
      첨부된 이미지(포스터, 공지사항, 또는 영수증)를 분석하세요.
      핵심 정보를 추출하여 엄격한 JSON 객체 형식으로 반환하세요.
      \`\`\`json 과 같은 마크다운 태그를 붙이지 마세요. 오직 순수 JSON만 반환하세요.
      
      중요 규칙: 모든 JSON 값은 한국어로 작성해야 합니다.
      한국어를 영어로 번역하지 마세요. 이미지에 적힌 한국어를 그대로 읽어서 작성하세요.
      
      필수 JSON 형식:
      {
        "title": "사진의 핵심 이벤트/프로모션 제목 (최대 30자)",
        "content": "사진에 적힌 메인 내용 전체를 원본 그대로 작성",
        "cautions": "사진 하단이나 구석에 적힌 유의사항, 제외매장 등의 문구를 원본 그대로 작성. 없다면 빈 문자열"
      }
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
    
    // Parse the JSON
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/```json\n?/, "").replace(/```$/, "").trim();
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```\n?/, "").replace(/```$/, "").trim();
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw error;
  }
}
