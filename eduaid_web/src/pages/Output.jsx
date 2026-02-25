import React, { useState, useEffect, useMemo } from "react";
import "../index.css";
import logoPNG from "../assets/aossie_logo_transparent.png";
import { Link } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { FiShuffle, FiEdit2, FiCheck, FiX } from "react-icons/fi";

const Output = () => {
  const [qaPairs, setQaPairs] = useState([]);
  const [questionType, setQuestionType] = useState(
    localStorage.getItem("selectedQuestionType")
  );
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState("");
  const [editedAnswer, setEditedAnswer] = useState("");
  const [editedOptions, setEditedOptions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  /* ------------------ Helpers ------------------ */

  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  const shuffledOptionsMap = useMemo(() => {
    return qaPairs.map((qa) =>
      qa.options ? shuffleArray([...qa.options, qa.answer]) : []
    );
  }, [qaPairs]);

  const qaPair = qaPairs[currentIndex];
  const shuffledOptions = shuffledOptionsMap[currentIndex];
  const isEditing = editingIndex === currentIndex;

  /* ------------------ Handlers ------------------ */

  const handleShuffleQuestions = () => {
    if (editingIndex !== null) handleCancelEdit();
    setQaPairs(shuffleArray(qaPairs));
    setCurrentIndex(0);
  };
  const handleNext = () => {
  if (editingIndex !== null) return; // block navigation while editing
  if (currentIndex < qaPairs.length - 1) {
    setCurrentIndex((prev) => prev + 1);
  }
};

const handlePrevious = () => {
  if (editingIndex !== null) return; // block navigation while editing
  if (currentIndex > 0) {
    setCurrentIndex((prev) => prev - 1);
  }
};

  const handleEditQuestion = (index) => {
    setEditingIndex(index);
    setEditedQuestion(qaPairs[index].question);
    setEditedAnswer(qaPairs[index].answer || "");
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
    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedQuestion("");
    setEditedAnswer("");
    setEditedOptions([]);
  };

  const handleOptionChange = (i, value) => {
    const updated = [...editedOptions];
    updated[i] = value;
    setEditedOptions(updated);
  };

  /* ------------------ Load Data ------------------ */

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("qaPairs")) || {};
    const combined = [];

    if (stored.output_mcq) {
      stored.output_mcq.questions.forEach((q) => {
        combined.push({
          question: q.question_statement,
          answer: q.answer,
          options: q.options,
          question_type: "MCQ",
        });
      });
    }

    if (stored.output && questionType !== "get_mcq") {
      stored.output.forEach((q) => {
        combined.push({
          question: q.question || q.question_statement,
          answer: q.answer,
          options: q.options,
          question_type: "Short",
        });
      });
    }

    setQaPairs(combined);
  }, [questionType]);

  /* ------------------ PDF & GForm ------------------ */

  const generateGoogleForm = async () => {
    const res = await apiClient.post("/generate_gform", {
      qa_pairs: qaPairs,
      question_type: questionType,
    });
    window.open(res.form_link, "_blank");
  };

  /* ------------------ UI ------------------ */

  return (
    <div className="popup w-full h-full bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-custom-gradient flex flex-col">
        <Link to="/" className="flex items-end gap-2 px-6">
          <img src={logoPNG} alt="logo" className="w-14 my-4" />
          <div className="text-2xl font-extrabold text-white">EduAid</div>
        </Link>

        <div className="flex justify-between items-center px-6">
          <div className="text-white font-bold text-xl">
            Question {currentIndex + 1} of {qaPairs.length}
          </div>
          <button
            onClick={handleShuffleQuestions}
            disabled={editingIndex !== null}
            className="bg-purple-600 px-4 py-2 rounded text-white flex items-center gap-2"
          >
            <FiShuffle /> Shuffle
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 mt-4">
          {qaPair && (
            <div className="bg-[#ffffff0d] p-4 rounded-xl">
              {!isEditing ? (
                <>
                  <p className="text-white text-lg">{qaPair.question}</p>

                  {qaPair.options && (
                    <div className="mt-4">
                      {shuffledOptions.map((opt, i) => (
                        <div key={i} className="text-gray-200">
                          Option {i + 1}: {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    className="mt-4 bg-teal-600 px-4 py-2 rounded text-white"
                    onClick={() => handleEditQuestion(currentIndex)}
                  >
                    <FiEdit2 /> Edit
                  </button>
                </>
              ) : (
                <>
                  <textarea
                    value={editedQuestion}
                    onChange={(e) => setEditedQuestion(e.target.value)}
                    className="w-full p-2 bg-black text-white rounded"
                  />

                  <button
                    onClick={() => handleSaveQuestion(currentIndex)}
                    className="bg-green-600 px-4 py-2 mt-3 rounded text-white"
                  >
                    <FiCheck /> Save
                  </button>

                  <button
                    onClick={handleCancelEdit}
                    className="ml-2 bg-gray-600 px-4 py-2 rounded text-white"
                  >
                    <FiX /> Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
<div className="flex justify-between items-center px-6 pb-4">
  <button
    onClick={handlePrevious}
    disabled={currentIndex === 0}
    className={`px-4 py-2 rounded text-white ${
      currentIndex === 0
        ? "bg-gray-500 cursor-not-allowed"
        : "bg-teal-600 hover:bg-teal-700"
    }`}
  >
    ⬅ Previous
  </button>

  <span className="text-white text-sm">
    Question {currentIndex + 1} of {qaPairs.length}
  </span>

  <button
    onClick={handleNext}
    disabled={currentIndex === qaPairs.length - 1}
    className={`px-4 py-2 rounded text-white ${
      currentIndex === qaPairs.length - 1
        ? "bg-gray-500 cursor-not-allowed"
        : "bg-teal-600 hover:bg-teal-700"
    }`}
  >
    Next ➡
  </button>
</div>

        <div className="flex justify-center gap-4 pb-6">
          <button
            onClick={generateGoogleForm}
            className="bg-teal-600 px-6 py-2 rounded text-white"
          >
            Generate Google Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default Output;