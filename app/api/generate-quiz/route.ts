import { questionSchema, questionsSchema } from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";

// Aumentar duração máxima para arquivos grandes
export const maxDuration = 300; // 5 minutos

export async function POST(req: Request) {
  console.log("POST request received");
  
  try {
    const { files, numberOfQuestions = 4 } = await req.json();
    console.log("Files received:", files?.length);
    console.log("Number of questions:", numberOfQuestions);
    
    if (!files || files.length === 0) {
      return new Response("Nenhum arquivo fornecido", { status: 400 });
    }
    
    const firstFile = files[0];
    console.log("Processing file:", firstFile.name);
    console.log("File size:", firstFile.data ? `~${Math.round(firstFile.data.length / 1024 / 1024)}MB` : 'Unknown');
    
    // Verificar se o arquivo não está muito grande para o modelo
    if (firstFile.data && firstFile.data.length > 100 * 1024 * 1024) { // 100MB limite
      return new Response("Arquivo muito grande. Limite máximo: 100MB", { status: 413 });
    }

  const result = streamObject({
    model: google("gemini-1.5-flash"),
    messages: [
      {
        role: "system",
        content:
          `Você é um professor brasileiro. Seu trabalho é analisar um documento e criar um teste de múltipla escolha com ${numberOfQuestions} questões baseado no conteúdo do documento. IMPORTANTE: Todas as perguntas e opções devem estar escritas em português brasileiro. Cada opção deve ter aproximadamente o mesmo tamanho. As questões devem ser claras e objetivas.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analise este documento e crie um teste de múltipla escolha em português brasileiro. Todas as perguntas e todas as opções de resposta devem estar em português brasileiro, independente do idioma do documento original.",
          },
          {
            type: "file",
            data: firstFile.data,
            mimeType: "application/pdf",
          },
        ],
      },
    ],
    schema: questionSchema,
    output: "array",
    onFinish: ({ object }) => {
      console.log("StreamObject finished with object:", object);
      const res = questionsSchema.safeParse(object);
      if (res.error) {
        console.error("Schema validation error:", res.error);
        throw new Error(res.error.errors.map((e) => e.message).join("\n"));
      }
    },
  });

  console.log("Returning stream response");
  return result.toTextStreamResponse();
  
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
