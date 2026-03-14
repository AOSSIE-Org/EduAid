import React, { useMemo } from "react";
import ErrorBoundary from "./ErrorBoundary";
import EmptyState from "./EmptyState";
import { useAIFetch } from "../hooks/useAIFetch";
import { normalizeArrayData } from "../utils/normalizeArrayData";

/**
 * Example component demonstrating resilient data fetching and rendering.
 *
 * It uses the `useAIFetch` hook, handles Timeout/Network errors defensively,
 * normalizes the received data to prevent iteration errors, and provides an
 * `EmptyState` when the data is empty. The entire fetch and render process
 * is protected by an `ErrorBoundary`.
 */
export default function QuizRenderer() {
  // Simulate fetch call. The URL should match your backend endpoint.
  const { data, isLoading, error } = useAIFetch({
    url: "http://localhost:5000/get_mcq", // Ensure this endpoint exists
    fetchOptions: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input_text: "Sample Context Layer", max_questions: 2 }),
    },
    timeout: 30000,
  });

  // Extract the target array and ensure it's iterable.
  const quizzes = useMemo(() => normalizeArrayData(data?.output), [data]);

  // Handle component states
  let content;

  if (isLoading) {
    content = (
      <div className="flex justify-center my-8">
        <div className="loader border-4 border-t-4 border-[#7600F2] rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  } else if (error === "TIMEOUT") {
    content = <EmptyState message="The server took too long to respond. Please try a shorter text or try again later." />;
  } else if (error === "NETWORK") {
    content = <EmptyState message="Failed to connect to the server. Please check your connection." />;
  } else if (quizzes.length === 0) {
    content = <EmptyState message="No quizzes could be parse from the response. Please try again." />;
  } else {
    content = (
      <div className="px-2 scrollbar-hide">
        {quizzes.map((quiz, index) => (
          <div
            key={index}
            className="px-4 py-3 bg-[#d9d9d90d] border-[#7600F2] border-dotted border-2 my-2 mx-2 rounded-xl"
          >
            <div className="text-white font-bold text-sm">Question {index + 1}</div>
            <div className="text-white text-[1rem] my-2">{quiz.question_statement || quiz.question}</div>
            <div className="text-[#a1a1aa] text-sm mt-1 mb-1">Answer:</div>
            <div className="text-white text-[1rem] font-semibold">{quiz.answer}</div>
          </div>
        ))}
      </div>
    );
  }

  // Render everything inside an ErrorBoundary to localize any potential render crashes.
  return (
    <ErrorBoundary fallback={<EmptyState message="Quiz failed to load." />}>
      {content}
    </ErrorBoundary>
  );
}
