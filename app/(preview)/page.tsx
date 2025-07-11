"use client";

import { useState } from "react";
import { experimental_useObject } from "ai/react";
import { questionsSchema } from "@/lib/schemas";
import { z } from "zod";
import { toast } from "sonner";
import { FileUp, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import Quiz from "@/components/quiz";
import { Link } from "@/components/ui/link";
import NextLink from "next/link";
import { generateQuizTitle } from "./actions";
import { AnimatePresence, motion } from "framer-motion";
import { VercelIcon, GitIcon } from "@/components/icons";

export default function ChatWithFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [questions, setQuestions] = useState<z.infer<typeof questionsSchema>>(
    [],
  );
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState<string>();
  const [numberOfQuestions, setNumberOfQuestions] = useState(4);

  const {
    submit,
    object: partialQuestions,
    isLoading,
    error,
  } = experimental_useObject({
    api: "/api/generate-quiz",
    schema: questionsSchema,
    initialValue: undefined,
    onError: (error) => {
      console.error("Error in useObject:", error);
      toast.error(`Falha ao gerar quiz: ${error.message || 'Erro desconhecido'}`);
      setFiles([]);
    },
    onFinish: ({ object }) => {
      console.log("Quiz generation finished:", object);
      setQuestions(object ?? []);
    },
  });

  // Log state changes
  console.log("Current state:", { 
    isLoading, 
    partialQuestions: partialQuestions?.length, 
    questions: questions.length,
    hasError: !!error 
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari && isDragging) {
      toast.error(
        "Safari não suporta arrastar e soltar. Use o seletor de arquivos.",
      );
      return;
    }

    const selectedFiles = Array.from(e.target.files || []);
    const maxSize = 100 * 1024 * 1024; // 100MB
    const validFiles = selectedFiles.filter(
      (file) => file.type === "application/pdf" && file.size <= maxSize,
    );
    
    console.log("Selected files:", selectedFiles.map(f => ({
      name: f.name,
      size: `${Math.round(f.size / 1024 / 1024)}MB`,
      valid: f.type === "application/pdf" && f.size <= maxSize
    })));

    if (validFiles.length !== selectedFiles.length) {
      const rejectedFiles = selectedFiles.filter(file => 
        file.type !== "application/pdf" || file.size > maxSize
      );
      const sizeIssues = rejectedFiles.filter(f => f.size > maxSize);
      const typeIssues = rejectedFiles.filter(f => f.type !== "application/pdf");
      
      if (sizeIssues.length > 0) {
        toast.error(`Arquivo muito grande. Limite máximo: 100MB. Arquivo: ${Math.round(sizeIssues[0].size / 1024 / 1024)}MB`);
      } else if (typeIssues.length > 0) {
        toast.error("Apenas arquivos PDF são permitidos.");
      }
    }

    setFiles(validFiles);
  };

  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitWithFiles = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Starting file submission...");
    console.log("Files to process:", files);
    
    // Verificar tamanho do arquivo antes de processar
    if (files[0] && files[0].size > 100 * 1024 * 1024) {
      toast.error("Arquivo muito grande. O limite máximo é de 100MB.");
      return;
    }
    
    try {
      toast.info("Processando arquivo... Isso pode levar alguns minutos para arquivos grandes.");
      
      const encodedFiles = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type,
          data: await encodeFileAsBase64(file),
        })),
      );
      
      console.log("Files encoded, calling submit...");
      submit({ files: encodedFiles, numberOfQuestions });
      
      const generatedTitle = await generateQuizTitle(encodedFiles[0].name);
      setTitle(generatedTitle);
    } catch (error) {
      console.error("Error in handleSubmitWithFiles:", error);
      toast.error(`Falha ao processar arquivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const testAPIWithoutFile = async () => {
    console.log("Testing API without file...");
    try {
      const response = await fetch("/api/test-api");
      const data = await response.json();
      console.log("Test API response:", data);
      
      if (data.success) {
        toast.success("API is working correctly!");
      } else {
        toast.error(`API test failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Test API error:", error);
      toast.error("Failed to test API");
    }
  };

  const clearPDF = () => {
    setFiles([]);
    setQuestions([]);
  };

  const progress = partialQuestions ? (partialQuestions.length / numberOfQuestions) * 100 : 0;

  if (questions.length >= numberOfQuestions) {
    return (
      <Quiz title={title ?? "Quiz"} questions={questions} clearPDF={clearPDF} />
    );
  }

  return (
    <div
      className="min-h-[100dvh] w-full flex justify-center"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragExit={() => setIsDragging(false)}
      onDragEnd={() => setIsDragging(false)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        console.log(e.dataTransfer.files);
        handleFileChange({
          target: { files: e.dataTransfer.files },
        } as React.ChangeEvent<HTMLInputElement>);
      }}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed pointer-events-none dark:bg-zinc-900/90 h-dvh w-dvw z-10 justify-center items-center flex flex-col gap-1 bg-zinc-100/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div>Arraste e solte arquivos aqui</div>
            <div className="text-sm dark:text-zinc-400 text-zinc-500">
              {"(Apenas PDFs)"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Card className="w-full max-w-md h-full border-0 sm:border sm:h-fit mt-12">
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground">
            <div className="rounded-full bg-primary/10 p-2">
              <FileUp className="h-6 w-6" />
            </div>
            <Plus className="h-4 w-4" />
            <div className="rounded-full bg-primary/10 p-2">
              <Loader2 className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              Gerador de Quiz em PDF
            </CardTitle>
            <CardDescription className="text-base">
              Envie um PDF (até 100MB) para gerar um quiz interativo baseado no seu conteúdo
              usando o <Link href="https://sdk.vercel.ai">AI SDK</Link> e{" "}
              <Link href="https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai">
                Google Gemini
              </Link>
              .
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitWithFiles} className="space-y-4">
            <div
              className={`relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 transition-colors hover:border-muted-foreground/50`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileUp className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                {files.length > 0 ? (
                  <span className="space-y-1">
                    <span className="font-medium text-foreground block">
                      {files[0].name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(files[0].size / 1024 / 1024)} MB
                    </span>
                  </span>
                ) : (
                  <span>
                    Arraste seu PDF aqui ou clique para procurar.
                    <br />
                    <span className="text-xs">Limite máximo: 100MB</span>
                  </span>
                )}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="questions-number" className="text-sm font-medium">
                Número de questões
              </Label>
              <Select value={numberOfQuestions.toString()} onValueChange={(value) => setNumberOfQuestions(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o número de questões" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 17 }, (_, i) => i + 4).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} questões
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={files.length === 0}
              onClick={() => console.log("Generate Quiz button clicked")}
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Gerando Quiz...</span>
                </span>
              ) : (
                "Gerar Quiz"
              )}
            </Button>
          </form>
        </CardContent>
        {isLoading && (
          <CardFooter className="flex flex-col space-y-4">
            <div className="w-full space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="w-full space-y-2">
              <div className="grid grid-cols-6 sm:grid-cols-4 items-center space-x-2 text-sm">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isLoading ? "bg-yellow-500/50 animate-pulse" : "bg-muted"
                  }`}
                />
                <span className="text-muted-foreground text-center col-span-4 sm:col-span-2">
                  {partialQuestions
                    ? `Gerando questão ${partialQuestions.length + 1} de ${numberOfQuestions}`
                    : "Analisando conteúdo do PDF"}
                </span>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
      <motion.div
        className="fixed bottom-6 w-full flex flex-col items-center gap-2 text-xs"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <NextLink
          target="_blank"
          href="https://github.com/joaopedrocezar/quiz-pdf-sdk"
          className="flex flex-row gap-2 items-center border px-2 py-1.5 rounded-md hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          <GitIcon />
          Ver Código Fonte
        </NextLink>
        <p className="text-muted-foreground">
          Feito por João Pedro Cezar
        </p>
      </motion.div>
    </div>
  );
}
