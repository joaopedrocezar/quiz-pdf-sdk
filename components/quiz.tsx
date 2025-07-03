import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  FileText,
  Home,
  Shuffle,
  RotateCcw,
} from "lucide-react";
import QuizScore from "./score";
import QuizReview from "./quiz-overview";
import { Question } from "@/lib/schemas";

type QuizProps = {
  questions: Question[];
  clearPDF: () => void;
  title: string;
};

// Função para embaralhar array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const QuestionCard: React.FC<{
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  isSubmitted: boolean;
  showCorrectAnswer: boolean;
  shuffledOptions: Array<{ option: string; originalIndex: number }>;
}> = ({ question, selectedAnswer, onSelectAnswer, showCorrectAnswer, shuffledOptions }) => {
  const answerLabels = ["A", "B", "C", "D"];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold leading-tight">
        {question.question}
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {shuffledOptions.map((optionData, index) => {
          const originalLabel = answerLabels[optionData.originalIndex];
          const isCorrect = originalLabel === question.answer;
          const isSelected = selectedAnswer === originalLabel;
          
          return (
            <Button
              key={index}
              variant={isSelected ? "secondary" : "outline"}
              className={`h-auto py-6 px-4 justify-start text-left whitespace-normal ${
                showCorrectAnswer && isCorrect
                  ? "bg-green-600 hover:bg-green-700"
                  : showCorrectAnswer && isSelected && !isCorrect
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
              }`}
              onClick={() => onSelectAnswer(originalLabel)}
            >
              <span className="text-lg font-medium mr-4 shrink-0">
                {answerLabels[index]}
              </span>
              <span className="flex-grow">{optionData.option}</span>
              {(showCorrectAnswer && isCorrect) ||
                (isSelected && (
                  <Check className="ml-2 shrink-0 text-white" size={20} />
                ))}
              {showCorrectAnswer && isSelected && !isCorrect && (
                <X className="ml-2 shrink-0 text-white" size={20} />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default function Quiz({
  questions,
  clearPDF,
  title = "Quiz",
}: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(
    Array(questions.length).fill(null),
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);

  // Versão original das questões (sem embaralhamento)
  const originalQuestions = useMemo(() => {
    return questions.map(question => ({
      ...question,
      shuffledOptions: question.options.map((option, index) => ({
        option,
        originalIndex: index
      }))
    }));
  }, [questions]);

  // Versão embaralhada das questões (apenas quando isShuffled = true)
  const shuffledQuestions = useMemo(() => {
    if (!isShuffled) return originalQuestions;
    
    return questions.map(question => ({
      ...question,
      shuffledOptions: shuffleArray(
        question.options.map((option, index) => ({
          option,
          originalIndex: index
        }))
      )
    }));
  }, [questions, isShuffled, originalQuestions]);

  // Usar a versão apropriada das questões
  const currentQuestions = isShuffled ? shuffledQuestions : originalQuestions;

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress((currentQuestionIndex / questions.length) * 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex, questions.length]);

  const handleSelectAnswer = (answer: string) => {
    if (!isSubmitted) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = answer;
      setAnswers(newAnswers);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    const correctAnswers = questions.reduce((acc, question, index) => {
      return acc + (question.answer === answers[index] ? 1 : 0);
    }, 0);
    setScore(correctAnswers);
  };

  const handleReset = () => {
    setAnswers(Array(questions.length).fill(null));
    setIsSubmitted(false);
    setScore(null);
    setCurrentQuestionIndex(0);
    setProgress(0);
    // NÃO muda o estado de embaralhamento - mantém a ordem atual
  };

  const handleShuffle = () => {
    setIsShuffled(true); // Ativa o embaralhamento
    setAnswers(Array(questions.length).fill(null));
    setIsSubmitted(false);
    setScore(null);
    setCurrentQuestionIndex(0);
    setProgress(0);
  };

  const handleResetOrder = () => {
    setIsShuffled(false); // Volta à ordem original
    setAnswers(Array(questions.length).fill(null));
    setIsSubmitted(false);
    setScore(null);
    setCurrentQuestionIndex(0);
    setProgress(0);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionData = currentQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
          {title}
        </h1>
        <div className="relative">
          {!isSubmitted && <Progress value={progress} className="h-1 mb-8" />}
          <div className="min-h-[400px]">
            {" "}
            {/* Prevent layout shift */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isSubmitted ? "results" : currentQuestionIndex}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {!isSubmitted ? (
                  <div className="space-y-8">
                    <QuestionCard
                      question={currentQuestion}
                      selectedAnswer={answers[currentQuestionIndex]}
                      onSelectAnswer={handleSelectAnswer}
                      isSubmitted={isSubmitted}
                      showCorrectAnswer={false}
                      shuffledOptions={currentQuestionData.shuffledOptions}
                    />
                    <div className="flex justify-between items-center pt-4">
                      <Button
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                        variant="ghost"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                      </Button>
                      <span className="text-sm font-medium">
                        {currentQuestionIndex + 1} / {questions.length}
                      </span>
                      <Button
                        onClick={handleNextQuestion}
                        disabled={answers[currentQuestionIndex] === null}
                        variant="ghost"
                      >
                        {currentQuestionIndex === questions.length - 1
                          ? "Enviar"
                          : "Próxima"}{" "}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <QuizScore
                      correctAnswers={score ?? 0}
                      totalQuestions={questions.length}
                    />
                    <div className="space-y-12">
                      <QuizReview questions={questions} userAnswers={answers} />
                    </div>
                    <div className="flex justify-center space-x-2 pt-4 flex-wrap gap-2">
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="bg-muted hover:bg-muted/80 flex-1 min-w-[120px]"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> Refazer Quiz
                      </Button>
                      {!isShuffled ? (
                        <Button
                          onClick={handleShuffle}
                          variant="outline"
                          className="bg-muted hover:bg-muted/80 flex-1 min-w-[120px]"
                        >
                          <Shuffle className="mr-2 h-4 w-4" /> Embaralhar
                        </Button>
                      ) : (
                        <Button
                          onClick={handleResetOrder}
                          variant="outline"
                          className="bg-muted hover:bg-muted/80 flex-1 min-w-[120px]"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" /> Ordem Original
                        </Button>
                      )}
                      <Button
                        onClick={clearPDF}
                        className="bg-primary hover:bg-primary/90 flex-1 min-w-[120px]"
                      >
                        <Home className="mr-2 h-4 w-4" /> Novo Quiz
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
