import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function GET() {
  try {
    console.log("Testing Google API...");
    console.log("API Key exists:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    console.log("API Key prefix:", process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 10));
    
    const result = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: "Say hello",
    });
    
    return Response.json({ 
      success: true, 
      text: result.text,
      apiKeyExists: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    });
  } catch (error) {
    console.error("Test API error:", error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKeyExists: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    }, { status: 500 });
  }
}
