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
  const [pdfMode, setPdfMode] = useState("questions");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState("");
  const [editedAnswer, setEditedAnswer] = useState("");
  const [editedOptions, setEditedOptions] = useState([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
        const dropdown = document.getElementById('pdfDropdown');
        if (dropdown && !dropdown.contains(event.target) && 
            !event.target.closest('button')) {
            dropdown.classList.add('hidden');
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  function shuffleArray(array) {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  }

  const resolveMcqAnswer = (answer, options) => {
    if (!answer || !Array.isArray(options) || options.length === 0) {
      return typeof answer === "string" ? answer.trim() : (answer || "");
    }
    const strAns = String(answer).trim();
    const letterMatch = strAns.match(/^[A-Da-d]$/);
    if (letterMatch) {
      const idx = letterMatch[0].toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < options.length) {
        return options[idx];
      }
    }
    return strAns;
  };

  const shuffledOptionsMap = useMemo(() => {
    return qaPairs.map((qaPair) => {
      const opts = Array.isArray(qaPair.options) ? [...qaPair.options] : [];
      if (qaPair.answer && !opts.includes(qaPair.answer)) {
        opts.push(qaPair.answer);
      }
      return shuffleArray(opts);
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
    setEditedOptions(Array.isArray(qaPairs[index].options) ? qaPairs[index].options : []);
  };

  const handleSaveQuestion = (index) => {
    const updatedQaPairs = [...qaPairs];
    updatedQaPairs[index] = {
      ...updatedQaPairs[index],
      question: editedQuestion,
      answer: editedAnswer || updatedQaPairs[index].answer,
      options: Array.isArray(editedOptions) ? editedOptions : [],
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
    let qaPairsFromStorage = {};
    try {
      qaPairsFromStorage = JSON.parse(localStorage.getItem("qaPairs")) || {};
    } catch (err) {
      console.error("Error parsing qaPairs from localStorage:", err);
      qaPairsFromStorage = {};
    }

    if (qaPairsFromStorage && typeof qaPairsFromStorage === "object") {
      const combinedQaPairs = [];

      // Determine effective question type from component state, storage, or infer from payload
      let effectiveType = questionType || localStorage.getItem("selectedQuestionType");
      if (!effectiveType || effectiveType === "undefined") {
        if (qaPairsFromStorage["output_mcq"]) {
          effectiveType = "get_mcq";
        } else if (qaPairsFromStorage["output_boolq"]) {
          effectiveType = "get_boolq";
        } else if (Array.isArray(qaPairsFromStorage["output"]) && qaPairsFromStorage["output"].length > 0) {
          const first = qaPairsFromStorage["output"][0];
          if (first && typeof first === "object" && (first.options || first.question_statement || first.correct_answer)) {
            effectiveType = "get_mcq";
          } else if (first && (typeof first.answer === "boolean" || first.boolean_question)) {
            effectiveType = "get_boolq";
          } else if (typeof first === "string") {
            const isBoolQuestion = /^(is|are|was|were|do|does|did|can|could|will|would|should|has|have|had)\b/i.test(first.trim());
            effectiveType = isBoolQuestion ? "get_boolq" : "get_shortq";
          }
        }
      }

      // 1. Handle output_boolq
      if (
        qaPairsFromStorage["output_boolq"] &&
        Array.isArray(qaPairsFromStorage["output_boolq"]["Boolean_Questions"])
      ) {
        qaPairsFromStorage["output_boolq"]["Boolean_Questions"].forEach(
          (question) => {
            if (typeof question === "string" && question.trim().length > 0) {
              combinedQaPairs.push({
                question: question.trim(),
                question_type: "Boolean",
                answer: "",
                options: ["True", "False"],
                context: qaPairsFromStorage["output_boolq"]["Text"] || "",
              });
            }
          }
        );
      }

      // 2. Handle output_mcq (nested questions array)
      if (
        qaPairsFromStorage["output_mcq"] &&
        Array.isArray(qaPairsFromStorage["output_mcq"]["questions"])
      ) {
        qaPairsFromStorage["output_mcq"]["questions"].forEach((qaPair) => {
          if (qaPair) {
            const qText = qaPair.question_statement || qaPair.question;
            if (typeof qText === "string" && qText.trim().length > 0) {
              const opts = Array.isArray(qaPair.options) ? qaPair.options : [];
              const rawAns = qaPair.answer || qaPair.correct_answer || "";
              combinedQaPairs.push({
                question: qText.trim(),
                question_type: "MCQ",
                options: opts,
                answer: resolveMcqAnswer(rawAns, opts),
                context: qaPair.context || "",
              });
            }
          }
        });
      }

      // 3. Handle standard "output" key (returned by get_mcq, get_boolq, get_shortq, and LLM endpoints)
      if (Array.isArray(qaPairsFromStorage["output"])) {
        qaPairsFromStorage["output"].forEach((qaPair) => {
          if (!qaPair) return;

          // If item is a plain string, it cannot be an MCQ
          const hasMcqProperties =
            typeof qaPair !== "string" &&
            (Boolean(qaPair.question_statement) ||
              Boolean(qaPair.options && Array.isArray(qaPair.options) && qaPair.options.length > 0) ||
              Boolean(qaPair.correct_answer && qaPair.options));

          const hasBoolProperties =
            typeof qaPair.answer === "boolean" ||
            Boolean(qaPair.boolean_question) ||
            (typeof qaPair === "string" &&
              /^(is|are|was|were|do|does|did|can|could|will|would|should|has|have|had)\b/i.test(qaPair.trim()));

          const isMcq =
            typeof qaPair !== "string" &&
            (hasMcqProperties ||
              ((effectiveType === "get_mcq" || effectiveType === "get_mcq_llm") && !hasBoolProperties));

          const isBool =
            !isMcq &&
            (hasBoolProperties ||
              ((effectiveType === "get_boolq" || effectiveType === "get_boolq_llm") && !hasMcqProperties));

          if (isBool) {
            const qText = typeof qaPair === "string" ? qaPair : qaPair.question;
            // Skip entries when question is not a string (e.g. malformed or object-valued questions)
            if (typeof qText === "string" && qText.trim().length > 0) {
              const boolAnswer =
                qaPair && qaPair.answer !== undefined && qaPair.answer !== null
                  ? typeof qaPair.answer === "boolean"
                    ? (qaPair.answer ? "True" : "False")
                    : String(qaPair.answer)
                  : "";
              combinedQaPairs.push({
                question: qText.trim(),
                question_type: "Boolean",
                answer: boolAnswer,
                options: ["True", "False"],
              });
            }
          } else if (isMcq) {
            const qText = qaPair.question_statement || qaPair.question;
            if (typeof qText === "string" && qText.trim().length > 0) {
              const opts = Array.isArray(qaPair.options) ? qaPair.options : [];
              const rawAns = qaPair.answer || qaPair.correct_answer || "";
              combinedQaPairs.push({
                question: qText.trim(),
                question_type: "MCQ",
                options: opts,
                answer: resolveMcqAnswer(rawAns, opts),
                context: qaPair.context || "",
              });
            }
          } else {
            const qText =
              typeof qaPair === "string"
                ? qaPair
                : qaPair.question ||
                  qaPair.question_statement ||
                  qaPair.Question ||
                  "";
            if (typeof qText === "string" && qText.trim().length > 0) {
              combinedQaPairs.push({
                question: qText.trim(),
                options: Array.isArray(qaPair.options) ? qaPair.options : [],
                answer: qaPair.answer || qaPair.Answer || "",
                context: qaPair.context || "",
                question_type: "Short",
              });
            }
          }
        });
      }

      setQaPairs(combinedQaPairs);
    }
  }, [questionType]);

  const generateGoogleForm = async () => {
    try {
      const typeMap = { Boolean: "get_boolq", MCQ: "get_mcq", Short: "get_shortq" };
      let exportType = "";
      if (questionType === "get_boolq" || questionType === "get_mcq" || questionType === "get_shortq") {
        exportType = questionType;
      } else if (questionType === "get_boolq_llm") {
        exportType = "get_boolq";
      } else if (questionType === "get_mcq_llm") {
        exportType = "get_mcq";
      } else if (questionType === "get_shortq_hard") {
        exportType = "get_shortq";
      } else if (questionType === "get_mcq_hard") {
        exportType = "get_mcq";
      } else if (qaPairs[0]?.question_type && typeMap[qaPairs[0].question_type]) {
        exportType = typeMap[qaPairs[0].question_type];
      } else {
        exportType = "get_mcq";
      }

      const result = await apiClient.post("/generate_gform", {
        qa_pairs: qaPairs,
        question_type: exportType,
      });
      const formUrl = result.form_link;
      window.open(formUrl, "_blank");
    } catch (error) {
      console.error("Failed to generate Google Form:", error);
    }
  };

  const loadLogoAsBytes = async () => {
    try {
      const response = await fetch(logoPNG);
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('Error loading logo:', error);
      return null;
    }
  };

    const generatePDF = async (mode) => {
    const logoBytes = await loadLogoAsBytes();
    const worker = new Worker(new URL("../workers/pdfWorker.js", import.meta.url), { type: "module" });

    worker.postMessage({ qaPairs, mode, logoBytes });

    worker.onmessage = (e) => {
      const blob = new Blob([e.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = "generated_questions.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      document.getElementById('pdfDropdown').classList.add('hidden');
      worker.terminate();
    };

    worker.onerror = (err) => {
      console.error("PDF generation failed in worker:", err);
      worker.terminate();
    };
  };

  return (
    <div className="popup w-full h-full bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient">
        <div className="flex flex-col h-full">
          {/* Header - Responsive logo and title */}
          <Link to="/">
            <div className="flex items-end gap-[2px] px-4 sm:px-6">
              <img 
                src={logoPNG} 
                alt="logo" 
                className="w-12 sm:w-16 my-4 block" 
              />
              <div className="text-xl sm:text-2xl mb-3 font-extrabold">
                <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                  Edu
                </span>
                <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                  Aid
                </span>
              </div>
            </div>
          </Link>

          {/* Title and Shuffle Button */}
          <div className="flex justify-between items-center mt-3 mx-4 sm:mx-6">
            <div className="font-bold text-lg sm:text-xl text-white">
              Generated Questions
            </div>
            <button
              className={`${
                editingIndex !== null
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-[#7C3AED] hover:bg-[#5A2AD9]'
              } text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2`}
              onClick={handleShuffleQuestions}
              disabled={editingIndex !== null}
            >
              <FiShuffle className="text-sm sm:text-base" />
              Shuffle
            </button>
          </div>

          {/* Questions Container - Responsive padding and margins */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-2 sm:px-4">
            {qaPairs && qaPairs.length > 0 ? (
              qaPairs.map((qaPair, index) => {
                const shuffledOptions = shuffledOptionsMap[index] || [];
                const isEditing = editingIndex === index;
                
                return (
                  <div
                    key={index}
                    className="px-3 sm:px-4 bg-[#d9d9d90d] border-black border my-2 sm:my-3 mx-1 sm:mx-2 rounded-xl py-3 sm:py-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-[#E4E4E4] text-xs sm:text-sm">
                        Question {index + 1}
                      </div>
                      {!isEditing ? (
                        <button
                          className="bg-[#518E8E] hover:bg-[#3a6b6b] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
                          onClick={() => handleEditQuestion(index)}
                        >
                          <FiEdit2 className="text-sm sm:text-base" />
                          Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            className="bg-green-700 hover:bg-green-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
                            onClick={() => handleSaveQuestion(index)}
                          >
                            <FiCheck className="text-sm sm:text-base" />
                            Save
                          </button>
                          <button
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
                            onClick={handleCancelEdit}
                          >
                            <FiX className="text-sm sm:text-base" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {!isEditing ? (
                      <>
                        <div className="text-[#FFF4F4] text-sm sm:text-base my-1 sm:my-2 leading-relaxed">
                          {qaPair.question}
                        </div>
                        {qaPair.question_type !== "Boolean" && (
                          <>
                            <div className="text-[#E4E4E4] text-xs sm:text-sm mt-3 sm:mt-4">
                              Answer
                            </div>
                            <div className="text-[#FFF4F4] text-sm sm:text-base leading-relaxed">
                              {qaPair.answer}
                            </div>
                            {qaPair.options && qaPair.options.length > 0 && (
                              <div className="text-[#FFF4F4] text-sm sm:text-base mt-2 sm:mt-3">
                                {shuffledOptions.map((option, idx) => (
                                  <div key={idx} className="mb-1 sm:mb-2">
                                    <span className="text-[#E4E4E4] text-xs sm:text-sm">
                                      Option {idx + 1}:
                                    </span>{" "}
                                    <span className="text-[#FFF4F4] text-sm sm:text-base">
                                      {option}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-[#E4E4E4] text-xs sm:text-sm mb-1">
                          Edit Question
                        </div>
                        <textarea
                          className="w-full bg-[#1a1a2e] text-[#FFF4F4] text-sm sm:text-base p-2 rounded border border-gray-600 focus:border-[#7600F2] focus:outline-none resize-none"
                          rows="3"
                          value={editedQuestion}
                          onChange={(e) => setEditedQuestion(e.target.value)}
                        />
                        
                        {qaPair.question_type !== "Boolean" && (
                          <>
                            <div className="text-[#E4E4E4] text-xs sm:text-sm mt-3 mb-1">
                              Edit Answer
                            </div>
                            <textarea
                              className="w-full bg-[#1a1a2e] text-[#FFF4F4] text-sm sm:text-base p-2 rounded border border-gray-600 focus:border-[#7600F2] focus:outline-none resize-none"
                              rows="2"
                              value={editedAnswer}
                              onChange={(e) => setEditedAnswer(e.target.value)}
                            />
                            
                            {editedOptions && editedOptions.length > 0 && (
                              <div className="mt-3">
                                <div className="text-[#E4E4E4] text-xs sm:text-sm mb-2">
                                  Edit Options
                                </div>
                                {editedOptions.map((option, optIdx) => (
                                  <div key={optIdx} className="mb-2">
                                    <div className="text-[#E4E4E4] text-xs mb-1">
                                      Option {optIdx + 1}
                                    </div>
                                    <input
                                      type="text"
                                      className="w-full bg-[#1a1a2e] text-[#FFF4F4] text-sm sm:text-base p-2 rounded border border-gray-600 focus:border-[#7600F2] focus:outline-none"
                                      value={option}
                                      onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
                <p className="text-base sm:text-lg mb-4">No questions found or generated yet.</p>
                <Link to="/question-type">
                  <button className="bg-[#7C3AED] hover:bg-[#5A2AD9] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                    Generate a Quiz
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Action Buttons - Responsive layout */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mx-4 sm:mx-auto pb-4 sm:pb-6">
            <button
              disabled={!qaPairs || qaPairs.length === 0}
              className={`bg-[#518E8E] items-center flex gap-1 w-full sm:w-auto font-semibold text-white px-4 sm:px-6 py-3 sm:py-2 rounded-xl text-sm sm:text-base justify-center transition-all ${
                !qaPairs || qaPairs.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#3a6b6b] active:scale-95 active:bg-[#2f5555]"
              }`}
              onClick={generateGoogleForm}
            >
              Generate Google form
            </button>
            
            <div className="relative w-full sm:w-auto">
              <button
                disabled={!qaPairs || qaPairs.length === 0}
                className={`bg-[#518E8E] items-center flex gap-1 w-full sm:w-auto font-semibold text-white px-4 sm:px-6 py-3 sm:py-2 rounded-xl text-sm sm:text-base justify-center transition-all ${
                  !qaPairs || qaPairs.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#3a6b6b] active:scale-95 active:bg-[#2f5555]"
                }`}
                onClick={() => {
                  if (qaPairs && qaPairs.length > 0) {
                    const dropdown = document.getElementById('pdfDropdown');
                    if (dropdown) dropdown.classList.toggle('hidden');
                  }
                }}
              >
                Generate PDF
              </button>
              
              <div
                id="pdfDropdown"
                className="hidden absolute bottom-full mb-1 left-0 sm:left-auto right-0 sm:right-auto bg-[#02000F] shadow-md text-white rounded-lg shadow-lg z-50 w-full sm:w-48"
              >
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-500 active:bg-gray-600 active:scale-95 text-sm sm:text-base"
                  onClick={() => generatePDF('questions')}
                >
                  Questions Only
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-500 active:bg-gray-600 active:scale-95 text-sm sm:text-base"
                  onClick={() => generatePDF('questions_answers')}
                >
                  Questions with Answers
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-500 active:bg-gray-600 active:scale-95 text-sm sm:text-base"
                  onClick={() => generatePDF('answers')}
                >
                  Answers Only
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Output;
