import React, { useState, useEffect, useMemo } from "react";
import "../index.css";
import logoPNG from "../assets/aossie_logo_transparent.png";
import { Link } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { FiShuffle, FiEdit2, FiCheck, FiX } from "react-icons/fi";

const Output = () => {
  const [qaPairs, setQaPairs] = useState([]);
  const [questionType] = useState(
    localStorage.getItem("selectedQuestionType")
  );
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState("");
  const [editedAnswer, setEditedAnswer] = useState("");
  const [editedOptions, setEditedOptions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  /* ------------------ Helpers ------------------ */

  const shuffleArray = (array = []) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // ✅ Deduplicated options (CodeRabbit fix)
  const shuffledOptionsMap = useMemo(() => {
    return qaPairs.map((qa) =>
      qa.options
        ? shuffleArray(
            [...new Set([...(qa.options || []), qa.answer].filter(Boolean))]
          )
        : []
    );
  }, [qaPairs]);

  const totalQuestions = qaPairs.length;
  const hasQuestions = totalQuestions > 0;
  const qaPair = hasQuestions ? qaPairs[currentIndex] : null;
  const shuffledOptions = shuffledOptionsMap[currentIndex] || [];
  const isEditing = editingIndex === currentIndex;

  /* ------------------ Navigation ------------------ */

  const handleNext = () => {
    if (isEditing || !hasQuestions) return;
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (isEditing || !hasQuestions) return;
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleShuffleQuestions = () => {
    if (isEditing) handleCancelEdit();
    setQaPairs(shuffleArray(qaPairs));
    setCurrentIndex(0);
  };

  /* ------------------ Editing ------------------ */

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

  /* ------------------ Load Data (Safe) ------------------ */

  useEffect(() => {
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem("qaPairs") || "{}");
    } catch {
      stored = {};
    }

    const combined = [];

    if (Array.isArray(stored.output_mcq?.questions)) {
      stored.output_mcq.questions.forEach((q) => {
        combined.push({
          question: q.question_statement,
          answer: q.answer,
          options: q.options,
          question_type: "MCQ",
        });
      });
    }

    if (Array.isArray(stored.output) && questionType !== "get_mcq") {
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
    setCurrentIndex(0); // ✅ important
  }, [questionType]);

  /* ------------------ Google Form ------------------ */

  const generateGoogleForm = async () => {
  try {
    const res = await apiClient.post("/generate_gform", {
      qa_pairs: qaPairs,
      question_type: questionType,
    });

    const formUrl = res?.form_link;

    if (formUrl) {
      window.open(formUrl, "_blank", "noopener,noreferrer");
    } else {
      console.error("Form link missing in response", res);
    }
  } catch (err) {
    console.error("Failed to generate Google Form:", err);
  }
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
            Question {hasQuestions ? currentIndex + 1 : 0} of {totalQuestions}
          </div>
          <button
            onClick={handleShuffleQuestions}
            disabled={isEditing || !hasQuestions}
            className="bg-purple-600 px-4 py-2 rounded text-white flex items-center gap-2 disabled:opacity-50"
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
                    <div className="mt-4 space-y-1">
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

                  {editedOptions.map((opt, i) => (
  <input
    key={i}
    value={opt}
    onChange={(e) => handleOptionChange(i, e.target.value)}
    className="w-full p-2 mt-2 bg-black text-white rounded"
  />
))}

{/* ✅ Answer editor (CodeRabbit fix) */}
<input
  value={editedAnswer}
  onChange={(e) => setEditedAnswer(e.target.value)}
  placeholder="Correct answer"
  className="w-full p-2 mt-3 bg-black text-white rounded border border-gray-600"
/>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleSaveQuestion(currentIndex)}
                      className="bg-green-600 px-4 py-2 rounded text-white"
                    >
                      <FiCheck /> Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-600 px-4 py-2 rounded text-white"
                    >
                      <FiX /> Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center px-6 pb-4">
          <button
            onClick={handlePrevious}
            disabled={isEditing || !hasQuestions || currentIndex === 0}
            className="px-4 py-2 rounded text-white bg-teal-600 disabled:bg-gray-500"
          >
            ⬅ Previous
          </button>

          <span className="text-white text-sm">
            Question {hasQuestions ? currentIndex + 1 : 0} of {totalQuestions}
          </span>

          <button
            onClick={handleNext}
            disabled={
              isEditing || !hasQuestions || currentIndex >= totalQuestions - 1
            }
            className="px-4 py-2 rounded text-white bg-teal-600 disabled:bg-gray-500"
          >
            Next ➡
          </button>
        </div>

        <div className="flex justify-center pb-6">
          <button
            onClick={generateGoogleForm}
            disabled={!hasQuestions}
            className="bg-teal-600 px-6 py-2 rounded text-white disabled:opacity-50"
          >
            Generate Google Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default Output;