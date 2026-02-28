import React, { useState, useEffect } from "react";
import "../index.css";
import logoPNG from "../assets/aossie_logo_transparent.png";
import { Link } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { FiShuffle, FiEdit2, FiCheck, FiX } from "react-icons/fi";

const Output = () => {
  const [qaPairs, setQaPairs] = useState([]);
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState([]);
  const [questionType] = useState(localStorage.getItem("selectedQuestionType"));
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState("");
  const [editedAnswer, setEditedAnswer] = useState("");
  const [editedOptions, setEditedOptions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formError, setFormError] = useState(null);

  const shuffleArray = (array = []) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const totalQuestions = qaPairs.length;
  const hasQuestions = totalQuestions > 0;
  const qaPair = hasQuestions ? qaPairs[currentIndex] : null;
  const shuffledOptions = shuffledOptionsMap[currentIndex] || [];
  const isEditing = editingIndex === currentIndex;

  /* Navigation */
  const handleNext = () => {
    if (isEditing || currentIndex >= totalQuestions - 1) return;
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (isEditing || currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
  };

  const handleShuffleQuestions = () => {
    if (isEditing) handleCancelEdit();

    const shuffledQAs = shuffleArray(qaPairs);
    setQaPairs(shuffledQAs);

    const shuffledOpts = shuffledQAs.map((qa) =>
      qa.options
        ? shuffleArray([...new Set([...(qa.options || []), qa.answer].filter(Boolean))])
        : []
    );

    setShuffledOptionsMap(shuffledOpts);
    setCurrentIndex(0);
  };

  /* Editing */
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

    const updatedShuffled = [...shuffledOptionsMap];
    updatedShuffled[index] = shuffleArray(
      [...new Set([...(editedOptions || []), editedAnswer].filter(Boolean))]
    );
    setShuffledOptionsMap(updatedShuffled);

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

  /* Load Data */
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
        });
      });
    }

    if (Array.isArray(stored.output) && questionType !== "get_mcq") {
      stored.output.forEach((q) => {
        combined.push({
          question: q.question || q.question_statement,
          answer: q.answer,
          options: q.options,
        });
      });
    }

    setQaPairs(combined);

    const shuffled = combined.map((qa) =>
      qa.options
        ? shuffleArray([...new Set([...(qa.options || []), qa.answer].filter(Boolean))])
        : []
    );

    setShuffledOptionsMap(shuffled);
    setCurrentIndex(0);
  }, [questionType]);

  /* Google Form */
  const generateGoogleForm = async () => {
    setFormError(null);
    try {
      const res = await apiClient.post("/generate_gform", {
        qa_pairs: qaPairs,
        question_type: questionType,
      });
      if (res?.form_link) {
        window.open(res.form_link, "_blank", "noopener,noreferrer");
      } else {
        setFormError("Failed to generate Google Form. Please try again.");
      }
    } catch {
      setFormError("Failed to generate Google Form. Please try again.");
    }
  };

  /* UI */
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
          {!hasQuestions && (
            <div className="text-center text-gray-300 mt-20">
              <p className="text-xl font-semibold">No questions available</p>
              <p className="text-sm mt-2">
                Please generate questions to preview them here.
              </p>
            </div>
          )}

          {qaPair && (
            <div className="bg-[#ffffff0d] p-4 rounded-xl">
              {!isEditing ? (
                <>
                  <p className="text-white text-lg">{qaPair.question}</p>

                  {shuffledOptions.length > 0 && (
                    <div className="mt-4 space-y-1">
                      {shuffledOptions.map((opt, i) => (
                        <div key={i} className="text-gray-200">
                          Option {i + 1}: {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    className="flex items-center gap-1 mt-4 bg-teal-600 px-4 py-2 rounded text-white"
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

                  <label className="text-white mt-2 block">Correct Answer</label>
                  <input
                    value={editedAnswer}
                    onChange={(e) => setEditedAnswer(e.target.value)}
                    className="w-full p-2 mt-1 bg-black text-white rounded border border-gray-600"
                  />

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleSaveQuestion(currentIndex)}
                      className="flex items-center gap-1 bg-green-600 px-4 py-2 rounded text-white"
                    >
                      <FiCheck /> Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 bg-gray-600 px-4 py-2 rounded text-white"
                    >
                      <FiX /> Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center pb-6">
          <button
            onClick={generateGoogleForm}
            disabled={!hasQuestions}
            className="bg-teal-600 px-6 py-2 rounded text-white disabled:opacity-50"
          >
            Generate Google Form
          </button>

          {formError && (
            <p className="text-red-500 text-sm mt-2 text-center">{formError}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Output;