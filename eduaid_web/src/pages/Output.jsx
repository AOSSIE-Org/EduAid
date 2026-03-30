import React, { useState, useEffect } from "react";
import "../index.css";
import { Link } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { FiShuffle, FiEdit2, FiCheck, FiX } from "react-icons/fi";

const Output = () => {
  const [qaPairs, setQaPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionType, setQuestionType] = useState(
    localStorage.getItem("selectedQuestionType")
  );

  const [editingIndex, setEditingIndex] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState("");

  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const handleShuffleQuestions = () => {
    if (editingIndex !== null) return;
    setQaPairs(shuffleArray(qaPairs));
  };

  const handleEditQuestion = (index) => {
    setEditingIndex(index);
    setEditedQuestion(qaPairs[index].question);
  };

  const handleSaveQuestion = (index) => {
    const updated = [...qaPairs];
    const original = updated[index];

    updated[index] = {
      ...original,
      question: editedQuestion,
    };

    setQaPairs(updated);
    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedQuestion("");
  };

  useEffect(() => {
    setLoading(true);

    let data = {};
    try {
      data = JSON.parse(localStorage.getItem("qaPairs")) || {};
    } catch {
      data = {};
    }

    const combined = [];

    // Boolean (separate source)
    if (data.output_boolq?.Boolean_Questions) {
      data.output_boolq.Boolean_Questions.forEach((q) => {
        combined.push({
          question: q,
          question_type: "Boolean",
          context: data.output_boolq.Text,
        });
      });
    }

    // MCQ (separate source)
    if (data.output_mcq?.questions) {
      data.output_mcq.questions.forEach((q) => {
        combined.push({
          question: q.question_statement,
          question_type: "MCQ",
          options: q.options,
          answer: q.answer,
          context: q.context,
        });
      });
    }

    // Generic output (based on type)
    if (data.output) {
      if (questionType === "get_mcq") {
        data.output.forEach((q) => {
          combined.push({
            question: q.question_statement,
            question_type: "MCQ",
            options: q.options,
            answer: q.answer,
            context: q.context,
          });
        });
      } else if (questionType === "get_boolq") {
        data.output.forEach((q) => {
          combined.push({
            question: q,
            question_type: "Boolean",
          });
        });
      } else {
        // Short questions only
        data.output.forEach((q) => {
          combined.push({
            question:
              q.question ||
              q.question_statement ||
              q.Question,
            options: q.options,
            answer: q.answer || q.Answer,
            context: q.context,
            question_type: "Short",
          });
        });
      }
    }

    setQaPairs(combined);
    setLoading(false);
  }, [questionType]);

  const generateGoogleForm = async () => {
    try {
      const result = await apiClient.post("/generate_gform", {
        qa_pairs: qaPairs,
        question_type: questionType,
      });

      const link =
        typeof result === "string" ? result : result?.form_link;

      if (!link) throw new Error("No form link");

      window.open(link, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      alert("Failed to generate Google Form");
    }
  };

  // ✅ Styled loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        <p className="text-lg">Loading quiz...</p>
      </div>
    );
  }

  // ✅ Styled empty state
  if (!qaPairs.length) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white gap-4">
        <p className="text-lg">No quiz available</p>
        <Link to="/input" className="text-blue-400 underline">
          Go to input page
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-4">Generated Questions</h2>

      <button
        onClick={handleShuffleQuestions}
        aria-label="Shuffle questions"
        className="mb-4 bg-purple-600 px-3 py-1 rounded"
      >
        <FiShuffle />
      </button>

      {qaPairs.map((qa, i) => {
        const isEditing = editingIndex === i;

        return (
          <div key={i} className="mb-4 border p-3 rounded">
            {!isEditing ? (
              <>
                <p className="font-semibold">{qa.question}</p>

                <p className="text-sm text-gray-400">
                  Type: {qa.question_type}
                </p>

                {qa.options && (
                  <ul className="ml-4 list-disc">
                    {qa.options.map((opt, idx) => (
                      <li key={idx}>
                        {opt}{" "}
                        {opt === qa.answer && "(Correct)"}
                      </li>
                    ))}
                  </ul>
                )}

                {qa.context && (
                  <p className="text-xs text-gray-500 mt-1">
                    {qa.context}
                  </p>
                )}

                <button
                  onClick={() => handleEditQuestion(i)}
                  aria-label="Edit question"
                  className="mt-2"
                >
                  <FiEdit2 />
                </button>
              </>
            ) : (
              <>
                <textarea
                  value={editedQuestion}
                  onChange={(e) =>
                    setEditedQuestion(e.target.value)
                  }
                  className="w-full text-black p-1"
                />

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleSaveQuestion(i)}
                    aria-label="Save changes"
                  >
                    <FiCheck />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    aria-label="Cancel editing"
                  >
                    <FiX />
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}

      <button
        onClick={generateGoogleForm}
        className="mt-4 bg-green-600 px-4 py-2 rounded"
      >
        Generate Google Form
      </button>
    </div>
  );
};

export default Output;