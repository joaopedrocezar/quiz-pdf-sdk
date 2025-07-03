import { questionSchema, questionsSchema } from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  console.log("POST request received - alternative version");
  
  try {
    const { files } = await req.json();
    console.log("Files received:", files?.length);
    
    if (!files || files.length === 0) {
      return new Response("No files provided", { status: 400 });
    }
    
    const firstFile = files[0].data;
    console.log("Processing file:", files[0].name);

    console.log("Calling generateObject...");
    const result = await generateObject({
      model: google("gemini-1.5-flash"),
      messages: [
        {
          role: "system",
          content:
            "You are a teacher. Your job is to take a document, and create a multiple choice test (with 4 questions) based on the content of the document. Each option should be roughly equal in length.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Create a multiple choice test based on this document.",
            },
            {
              type: "file",
              data: firstFile,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
      schema: questionsSchema,
    });

    console.log("Generated questions:", result.object);
    return Response.json(result.object);
    
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        stack: error instanceof Error ? error.stack : undefined 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
