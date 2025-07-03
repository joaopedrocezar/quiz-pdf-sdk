"use server";

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export const generateQuizTitle = async (file: string) => {
  // Remove a extensão .pdf e limpa o nome
  const cleanFileName = file.replace(/\.pdf$/i, '').trim();
  
  // Se o nome é muito curto ou só números, retorna "Quiz"
  if (cleanFileName.length < 3 || /^\d+$/.test(cleanFileName)) {
    return "Quiz";
  }
  
  // Retorna o nome do arquivo sem traduzir, apenas com primeira letra maiúscula
  const words = cleanFileName.split(/[\s-_]+/);
  const capitalizedWords = words.map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
  
  // Limita a 3 palavras
  return capitalizedWords.slice(0, 3).join(' ') + ' - Quiz';
};
