import React, { useState, useEffect, useMemo } from "react";
import "../index.css";
import logoPNG from "../assets/aossie_logo_transparent.png";
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
  const [editedAnswer, setEditedAnswer] = useState("");
  const [editedOptions, setEditedOptions] = useState([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById("pdfDropdown");
      if (
        dropdown &&
        !dropdown.contains(event.target) &&
        !event.target.closest("button")
      ) {
        dropdown.classList.add("hidden");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function shuffleArray(array) {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    return shuffledArray;
  }

  const shuffledOptionsMap = useMemo(() => {
    return qaPairs.map((qaPair) => {
      const combinedOptions = qaPair.options
        ? [...qaPair.options, qaPair.answer]
        : [qaPair.answer];
      return shuffleArray(combinedOptions);
    });
  }, [qaPairs]);

  const handleShuffleQuestions = () => {
    if (editingIndex !== null) {
      handleCancelEdit();
    }
    const shuffled = shuffleArray(qaPairs);
    setQaPairs(shuffled);
  };

  const handleEditQuestion = (index) => {
    setEditingIndex(index);
    setEditedQuestion(qaPairs[index].question);
    setEditedAnswer(qaPairs[index].answer || "");
    setEditedOptions(qaPairs[index].options || []);
  };

  const handleSaveQuestion = (index) => {
    const updatedQaPairs = [...qaPairs];
    updatedQaPairs[index] = {
      ...updatedQaPairs[index],
      question: editedQuestion,
      answer: editedAnswer,
      options: editedOptions,
    };
    setQaPairs(updatedQaPairs);
    setEditingIndex(null);
    setEditedQuestion("");
    setEditedAnswer("");
    setEditedOptions([]);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedQuestion("");
    setEditedAnswer("");
    setEditedOptions([]);
  };

  const handleOptionChange = (optionIndex, value) => {
    const updatedOptions = [...editedOptions];
    updatedOptions[optionIndex] = value;
    setEditedOptions(updatedOptions);
  };

  useEffect(() => {
    setLoading(true);
    let qaPairsFromStorage = {};

    try {
      qaPairsFromStorage =
        JSON.parse(localStorage.getItem("qaPairs")) || {};
    } catch (error) {
      console.error("Failed to parse qaPairs:", error);
      qaPairsFromStorage = {};
    }

    const combinedQaPairs = [];

    if (
      qaPairsFromStorage["output_boolq"] &&
      qaPairsFromStorage["output_boolq"]["Boolean_Questions"]
    ) {
      qaPairsFromStorage["output_boolq"]["Boolean_Questions"].forEach(
        (question) => {
          combinedQaPairs.push({
            question,
            question_type: "Boolean",
            context: qaPairsFromStorage["output_boolq"]["Text"],
          });
        }
      );
    }

    else if (
      questionType === "get_mcq" &&
      qaPairsFromStorage["output"]
    ) {
      qaPairsFromStorage["output"].forEach((qaPair) => {
        combinedQaPairs.push({
          question: qaPair.question_statement,
          question_type: "MCQ",
          options: qaPair.options,
          answer: qaPair.answer,
          context: qaPair.context,
        });
      });
    }

    else if (
      questionType === "get_boolq" &&
      qaPairsFromStorage["output"]
    ) {
      qaPairsFromStorage["output"].forEach((qaPair) => {
        combinedQaPairs.push({
          question: qaPair,
          question_type: "Boolean",
        });
      });
    }

    else if (qaPairsFromStorage["output"]) {
      qaPairsFromStorage["output"].forEach((qaPair) => {
        combinedQaPairs.push({
          question:
            qaPair.question ||
            qaPair.question_statement ||
            qaPair.Question,
          options: qaPair.options,
          answer: qaPair.answer || qaPair.Answer,
          context: qaPair.context,
          question_type: "Short",
        });
      });
    }

    setQaPairs(combinedQaPairs);
    setLoading(false);
  }, [questionType]);

  if (loading) {
    return (
      <div className="popup w-full h-full bg-[#02000F] flex justify-center items-center">
        <div className="text-white text-lg">Loading quiz...</div>
      </div>
    );
  }

  if (!qaPairs || qaPairs.length === 0) {
    return (
      <div className="popup w-full h-full bg-[#02000F] flex justify-center items-center">
        <div className="text-white text-center">
          No quiz available. Please generate a quiz first.
          <br />
          <Link to="/input" className="text-blue-400 underline">
            Go to input page
          </Link>
        </div>
      </div>
    );
  }

  const generateGoogleForm = async () => {
    try {
      const result = await apiClient.post("/generate_gform", {
        qa_pairs: qaPairs,
        question_type: questionType,
      });
      window.open(result.form_link, "_blank");
    } catch (error) {
      console.error(error);
      alert("Failed to generate Google Form");
    }
  };

  return (
    <div className="popup w-full h-full bg-[#02000F]">
      <div className="flex flex-col h-full">

        <Link to="/">
          <div className="flex items-end gap-2 px-4">
            <img src={logoPNG} alt="logo" className="w-12 my-4" />
            <div className="text-xl font-bold text-white">EduAid</div>
          </div>
        </Link>

        <div className="flex justify-between px-4">
          <div className="text-white font-bold">Generated Questions</div>
          <button
            onClick={handleShuffleQuestions}
            className="bg-purple-600 text-white px-3 py-1 rounded"
          >
            <FiShuffle />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {qaPairs.map((qaPair, index) => {
            const isEditing = editingIndex === index;
            const shuffledOptions = shuffledOptionsMap[index];

            return (
              <div key={index} className="bg-gray-800 p-3 my-2 rounded">

                {!isEditing ? (
                  <>
                    <div className="text-white">{qaPair.question}</div>

                    {qaPair.question_type !== "Boolean" && (
                      <>
                        <div className="text-gray-300 mt-2">
                          Answer: {qaPair.answer}
                        </div>

                        {qaPair.options && (
                          <div className="mt-2 text-gray-200">
                            {shuffledOptions.map((opt, i) => (
                              <div key={i}>Option {i + 1}: {opt}</div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => handleEditQuestion(index)}
                      className="mt-2 text-blue-400"
                    >
                      Edit
                    </button>
                  </>
                ) : (
                  <>
                    <textarea
                      value={editedQuestion}
                      onChange={(e) => setEditedQuestion(e.target.value)}
                      className="w-full"
                    />
                    <button onClick={() => handleSaveQuestion(index)}>Save</button>
                    <button onClick={handleCancelEdit}>Cancel</button>
                  </>
                )}

              </div>
            );
          })}
        </div>

        <button
          onClick={generateGoogleForm}
          className="bg-green-600 text-white p-2 m-4 rounded"
        >
          Generate Google Form
        </button>

      </div>
    </div>
  );
};

export default Output;