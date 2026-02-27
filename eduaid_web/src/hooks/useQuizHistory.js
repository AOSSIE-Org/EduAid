import { useState, useEffect } from "react";

export const useQuizHistory = () => {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("quizHistory");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error reading quiz history from localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("quizHistory", JSON.stringify(history));
    } catch (error) {
      console.error("Error saving quiz to localStorage:", error);
    }
  }, [history]);

  const addQuiz = (quiz) => {
    setHistory((prevHistory) => [quiz, ...prevHistory].slice(0, 5));
  };

  const clearHistory = () => {
    // CodeRabbit Fix: Removed manual removeItem as useEffect handles persistence
    setHistory([]);
  };

  return { history, addQuiz, clearHistory };
};