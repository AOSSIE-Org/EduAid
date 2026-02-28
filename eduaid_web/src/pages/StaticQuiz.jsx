import React, { useState, useEffect, useMemo } from "react";
import "../index.css";
import { Link } from "react-router-dom";
import logoPNG from "../assets/aossie_logo_transparent.png";
import apiClient from "../utils/apiClient";
import { FiShuffle, FiEdit2, FiCheck, FiX } from "react-icons/fi";

const Output = ({ questions: questionsProp }) => {
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

  const shuffledOptionsMap = useMemo(() => {
    return qaPairs.map((qaPair) => {
      const opts = Array.isArray(qaPair.options) ? [...qaPair.options] : [];
      if (qaPair.answer && !opts.includes(qaPair.answer)) {
        opts.push(qaPair.answer);
      }
      return shuffleArray(opts.filter(Boolean));
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
    // If questions were passed via props (from QuizModeWrapper), use them directly
    if (questionsProp && questionsProp.length > 0) {
      // Normalize each question object for consistent rendering
      const normalized = questionsProp.map((q) => {
        // MCQ format from backend: { question_statement, options, answer, context }
        if (q.question_statement) {
          return {
            question: q.question_statement,
            question_type: "MCQ",
            options: q.options || [],
            answer: q.answer,
            context: q.context,
          };
        }
        // Boolean format: plain string
        if (typeof q === "string") {
          return { question: q, question_type: "Boolean" };
        }
        // Already normalized or short-answer
        return {
          question: q.question || q.Question || q.question_statement || "",
          question_type: q.question_type || "Short",
          options: q.options || [],
          answer: q.answer || q.Answer || "",
          context: q.context || "",
        };
      });
      setQaPairs(normalized);
      return;
    }

    // Fallback: load from localStorage (e.g. page refresh)
    const qaPairsFromStorage =
      JSON.parse(localStorage.getItem("qaPairs")) || {};
    if (qaPairsFromStorage) {
      const combinedQaPairs = [];

      // "All types" response has output_boolq, output_mcq, output_shortq
      if (qaPairsFromStorage["output_boolq"]) {
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

      if (qaPairsFromStorage["output_mcq"]) {
        qaPairsFromStorage["output_mcq"]["questions"].forEach((qaPair) => {
          combinedQaPairs.push({
            question: qaPair.question_statement,
            question_type: "MCQ",
            options: qaPair.options,
            answer: qaPair.answer,
            context: qaPair.context,
          });
        });
      }

      if (qaPairsFromStorage["output_shortq"]) {
        (qaPairsFromStorage["output_shortq"]["questions"] || []).forEach((qaPair) => {
          combinedQaPairs.push({
            question: qaPair.question || qaPair.question_statement || qaPair.Question,
            options: qaPair.options,
            answer: qaPair.answer || qaPair.Answer,
            context: qaPair.context,
            question_type: "Short",
          });
        });
      }

      // Single-type response has just "output" key
      if (qaPairsFromStorage["output"] && !qaPairsFromStorage["output_mcq"]) {
        if (questionType === "get_mcq" || questionType === "get_mcq_hard") {
          qaPairsFromStorage["output"].forEach((qaPair) => {
            combinedQaPairs.push({
              question: qaPair.question_statement,
              question_type: "MCQ",
              options: qaPair.options,
              answer: qaPair.answer,
              context: qaPair.context,
            });
          });
        } else if (questionType === "get_boolq" || questionType === "get_boolq_hard") {
          qaPairsFromStorage["output"].forEach((qaPair) => {
            const text = typeof qaPair === "string" ? qaPair : qaPair.question || qaPair.Question;
            combinedQaPairs.push({
              question: text,
              question_type: "Boolean",
            });
          });
        } else {
          qaPairsFromStorage["output"].forEach((qaPair) => {
            combinedQaPairs.push({
              question:
                qaPair.question || qaPair.question_statement || qaPair.Question,
              options: qaPair.options,
              answer: qaPair.answer || qaPair.Answer,
              context: qaPair.context,
              question_type: "Short",
            });
          });
        }
      }

      setQaPairs(combinedQaPairs);
    }
  }, [questionsProp]);

  const generateGoogleForm = async () => {
    try {
      const result = await apiClient.post("/generate_gform", {
        qa_pairs: qaPairs,
        question_type: questionType,
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

  if (qaPairs.length === 0) {
    return (
      <div className="min-h-screen bg-[#02000F] flex items-center justify-center text-white">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#7600F2] opacity-[0.10] blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full bg-[#00CBE7] opacity-[0.08] blur-[100px]" />
        </div>
        <div className="relative z-10 text-center p-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] max-w-md">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-2xl font-bold mb-3">No Questions Yet</h2>
          <p className="text-[#718096] mb-6">Generate a quiz first to see your questions here.</p>
          <Link to="/upload">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-white font-bold hover:scale-105 transition-all">
              Generate a Quiz →
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02000F] text-white">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#7600F2] opacity-[0.10] blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full bg-[#00CBE7] opacity-[0.08] blur-[100px]" />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen pt-24 pb-10">
        <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full px-2 sm:px-4">

          {/* Title and Shuffle Button */}
          <div className="flex justify-between items-center mb-6">
            <div className="font-bold text-2xl sm:text-3xl bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Generated Questions
            </div>
            <button
              className={`${
                editingIndex !== null
                  ? 'bg-white/10 cursor-not-allowed text-white/40'
                  : 'bg-[#7600F2] hover:bg-[#6000d0] text-white'
              } px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 border border-white/10`}
              onClick={handleShuffleQuestions}
              disabled={editingIndex !== null}
            >
              <FiShuffle className="text-sm sm:text-base" />
              Shuffle
            </button>
          </div>

          {/* Questions Container - Responsive padding and margins */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-2 sm:px-4">
            {qaPairs &&
              qaPairs.map((qaPair, index) => {
                const shuffledOptions = shuffledOptionsMap[index];
                const isEditing = editingIndex === index;
                
                return (
                  <div
                    key={index}
                    className="px-4 sm:px-5 bg-white/[0.03] border border-white/[0.07] my-3 rounded-2xl py-4 sm:py-5 hover:bg-white/[0.05] transition-colors"
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
              })}
          </div>

          {/* Action Buttons - Responsive layout */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mx-4 sm:mx-auto pb-4 sm:pb-6">
            <button
              className="bg-[#518E8E] items-center flex gap-1 w-full sm:w-auto font-semibold text-white px-4 sm:px-6 py-3 sm:py-2 rounded-xl text-sm sm:text-base hover:bg-[#3a6b6b] transition-colors justify-center"
              onClick={generateGoogleForm}
            >
              Generate Google form
            </button>
            
            <div className="relative w-full sm:w-auto">
              <button
                className="bg-[#518E8E] items-center flex gap-1 w-full sm:w-auto font-semibold text-white px-4 sm:px-6 py-3 sm:py-2 rounded-xl text-sm sm:text-base hover:bg-[#3a6b6b] transition-colors justify-center"
                onClick={() => document.getElementById('pdfDropdown').classList.toggle('hidden')}
              >
                Generate PDF
              </button>
              
              <div
                id="pdfDropdown"
                className="hidden absolute bottom-full mb-1 left-0 sm:left-auto right-0 sm:right-auto bg-[#02000F] shadow-md text-white rounded-lg shadow-lg z-50 w-full sm:w-48"
              >
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-500 rounded-t-lg text-sm sm:text-base"
                  onClick={() => generatePDF('questions')}
                >
                  Questions Only
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-500 text-sm sm:text-base"
                  onClick={() => generatePDF('questions_answers')}
                >
                  Questions with Answers
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-500 rounded-b-lg text-sm sm:text-base"
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

