import React, { useState, useEffect, useMemo } from "react";
import "../index.css";
import logoPNG from "../assets/aossie_logo_transparent.png";
import { Link } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { FiShuffle, FiEdit2, FiCheck, FiX } from "react-icons/fi";

const Output = () => {
  const [qaPairs, setQaPairs] = useState([]);
  const [questionType] = useState(localStorage.getItem("selectedQuestionType"));

  const [editingIndex, setEditingIndex] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState("");
  const [editedAnswer, setEditedAnswer] = useState("");
  const [editedOptions, setEditedOptions] = useState([]);

  // Quiz State
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // ===================== LOAD FROM STORAGE =====================
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("qaPairs")) || {};
    const combined = [];

    if (data.output_mcq?.questions) {
      data.output_mcq.questions.forEach((q) => {
        combined.push({
          question: q.question_statement,
          options: q.options || [],
          answer: q.answer,
          question_type: "MCQ",
        });
      });
    }

    setQaPairs(combined);
  }, []);

  // ===================== SHUFFLE =====================
  function shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  const shuffledOptionsMap = useMemo(() => {
    return qaPairs.map((qaPair) =>
      shuffleArray([...(qaPair.options || []), qaPair.answer])
    );
  }, [qaPairs]);

  const handleShuffleQuestions = () => {
    setQaPairs(shuffleArray(qaPairs));
  };

  // ===================== EDIT =====================
  const handleEditQuestion = (index) => {
    setEditingIndex(index);
    setEditedQuestion(qaPairs[index].question);
    setEditedAnswer(qaPairs[index].answer);
    setEditedOptions(qaPairs[index].options || []);
  };

  const handleSaveQuestion = (index) => {
    const updated = [...qaPairs];
    updated[index] = {
      ...updated[index],
      question: editedQuestion,
      answer: editedAnswer,
      options: editedOptions,
    };
    setQaPairs(updated);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  // ===================== QUIZ RENDER =====================
  const renderQuizMode = () => {
    if (!qaPairs.length) {
      return <div className="text-white text-center mt-6">No questions.</div>;
    }

    const current = qaPairs[currentQuestionIndex];

    if (quizCompleted) {
      const score = qaPairs.filter(
        (q, i) => selectedAnswers[i] === q.answer
      ).length;

      return (
        <div className="text-white text-center p-6">
          <h2 className="text-xl font-bold mb-4">Quiz Completed 🎉</h2>
          <p className="mb-4">
            Score: {score} / {qaPairs.length}
          </p>
          <button
            className="bg-purple-600 px-4 py-2 rounded"
            onClick={() => {
              setQuizCompleted(false);
              setCurrentQuestionIndex(0);
              setSelectedAnswers({});
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="text-white px-4 py-6">
        <div className="mb-3 text-sm">
          Question {currentQuestionIndex + 1} of {qaPairs.length}
        </div>

        <div className="mb-4 text-lg font-semibold">
          {current.question}
        </div>

        {current.options?.map((option, idx) => (
          <button
            key={idx}
            className="block w-full mb-2 bg-gray-700 px-3 py-2 rounded"
            onClick={() => {
              setSelectedAnswers({
                ...selectedAnswers,
                [currentQuestionIndex]: option,
              });
              setShowFeedback(true);
            }}
          >
            {option}
          </button>
        ))}

        {showFeedback && (
          <div className="mt-3">
            {selectedAnswers[currentQuestionIndex] === current.answer ? (
              <span className="text-green-500">Correct ✅</span>
            ) : (
              <span className="text-red-500">
                Incorrect ❌ (Correct: {current.answer})
              </span>
            )}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button
            disabled={currentQuestionIndex === 0}
            className="bg-gray-600 px-4 py-2 rounded"
            onClick={() => {
              setCurrentQuestionIndex(currentQuestionIndex - 1);
              setShowFeedback(false);
            }}
          >
            Previous
          </button>

          {currentQuestionIndex === qaPairs.length - 1 ? (
            <button
              className="bg-purple-600 px-4 py-2 rounded"
              onClick={() => setQuizCompleted(true)}
            >
              Finish
            </button>
          ) : (
            <button
              disabled={!selectedAnswers[currentQuestionIndex]}
              className="bg-purple-600 px-4 py-2 rounded"
              onClick={() => {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setShowFeedback(false);
              }}
            >
              Next
            </button>
          )}
        </div>

        <div className="text-center mt-6">
          <button
            className="underline"
            onClick={() => setQuizMode(false)}
          >
            Exit Quiz
          </button>
        </div>
      </div>
    );
  };

  // ===================== MAIN RETURN =====================
  return (
    <div className="popup w-full h-full bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient flex flex-col">

        <Link to="/">
          <div className="flex items-end gap-1 px-6">
            <img src={logoPNG} alt="logo" className="w-12 my-4" />
            <div className="text-2xl font-extrabold mb-3 text-white">
              EduAid
            </div>
          </div>
        </Link>

        <div className="flex justify-between items-center mx-6">
          <div className="text-white font-bold text-xl">
            Generated Questions
          </div>

          <div className="flex gap-3">
            <button
              className="bg-purple-600 px-4 py-2 rounded text-white"
              onClick={handleShuffleQuestions}
            >
              Shuffle
            </button>

            <button
              className="bg-green-600 px-4 py-2 rounded text-white"
              onClick={() => {
                setQuizMode(true);
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
                setQuizCompleted(false);
              }}
            >
              Start Quiz
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 mt-4">
          {quizMode ? (
            renderQuizMode()
          ) : (
            qaPairs.map((qaPair, index) => (
              <div
                key={index}
                className="bg-[#1a1a2e] p-4 rounded mb-4 text-white"
              >
                <div className="flex justify-between">
                  <span>Question {index + 1}</span>
                  <button
                    onClick={() => handleEditQuestion(index)}
                    className="text-sm bg-teal-600 px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                </div>

                <div className="mt-2">{qaPair.question}</div>

                <div className="mt-2 text-sm text-gray-400">
                  Answer: {qaPair.answer}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default Output;