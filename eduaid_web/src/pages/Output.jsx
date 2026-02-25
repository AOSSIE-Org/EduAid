import React, { useState, useEffect, useMemo } from "react";
import "../index.css";
import logoPNG from "../assets/aossie_logo_transparent.png";
import { Link } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { FiShuffle, FiEdit2, FiCheck, FiX } from "react-icons/fi";

const Output = () => {
  const [qaPairs, setQaPairs] = useState([]);
  const questionType = localStorage.getItem("selectedQuestionType");
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
    const questionType = localStorage.getItem("selectedQuestionType");
    let qaPairsFromStorage = {};
    try {
      qaPairsFromStorage = JSON.parse(localStorage.getItem("qaPairs")) || {};
    } catch (e) {
      console.error("Failed to parse qaPairs from localStorage:", e);
      qaPairsFromStorage = {};
    }

    if (Object.keys(qaPairsFromStorage).length > 0) {
      const combinedQaPairs = [];
      const hasStructuredKeys = Boolean(
        qaPairsFromStorage.output_boolq || 
        qaPairsFromStorage.output_mcq || 
        qaPairsFromStorage.output_shortq
      );
      if (qaPairsFromStorage.output_boolq) {
        const boolData = qaPairsFromStorage.output_boolq;
        const questions = boolData.Boolean_Questions || boolData.output;
        const answers = boolData.answers;

        if (Array.isArray(questions)) {
          questions.forEach((question, index) => {
            combinedQaPairs.push({
              question,
              question_type: "Boolean",
              context: boolData.Text || boolData.text,
              answer: answers?.[index] ?? "Answer not found",
            });
          });
        }
      }

      if (qaPairsFromStorage.output_mcq && Array.isArray(qaPairsFromStorage.output_mcq.questions)) {
        qaPairsFromStorage.output_mcq.questions.forEach((qaPair) => {
          combinedQaPairs.push({
            question: qaPair.question ?? qaPair.question_statement ?? qaPair.Question,
            question_type: "MCQ",
            options: qaPair.options,
            answer: qaPair.answer ?? qaPair.Answer,
            context: qaPair.context,
          });
        });
      }

      if (qaPairsFromStorage.output_shortq && Array.isArray(qaPairsFromStorage.output_shortq.questions)) {
        qaPairsFromStorage.output_shortq.questions.forEach((qaPair) => {
          combinedQaPairs.push({
            question: qaPair.question ?? qaPair.question_statement ?? qaPair.Question,
            options: qaPair.options,
            answer: qaPair.answer ?? qaPair.Answer,
            context: qaPair.context,
            question_type: "Short",
          });
        });
      }

      if (!hasStructuredKeys && Array.isArray(qaPairsFromStorage.output)) {
        if (questionType === "get_boolq") {
          const answers = qaPairsFromStorage.answers;
          qaPairsFromStorage.output.forEach((qaPair, index) => {
            combinedQaPairs.push({
              question: qaPair,
              question_type: "Boolean",
              context: qaPairsFromStorage.text || qaPairsFromStorage.Text,
              answer: answers?.[index] ?? "Answer not found",
            });
          });
        } else if (questionType === "get_mcq") {
          qaPairsFromStorage.output.forEach((qaPair) => {
            combinedQaPairs.push({
              question: qaPair.question || qaPair.question_statement || qaPair.Question,
              question_type: "MCQ",
              options: qaPair.options,
              answer: qaPair.answer || qaPair.Answer || qaPair.correctAnswer,
              context: qaPair.context,
            });
          });
        } else {
          qaPairsFromStorage.output.forEach((qaPair) => {
            combinedQaPairs.push({
              question: qaPair.question ?? qaPair.question_statement ?? qaPair.Question,
              options: qaPair.options,
              answer: qaPair.answer ?? qaPair.Answer,
              context: qaPair.context,
              question_type: "Short",
            });
          });
        }
      }

      setQaPairs(combinedQaPairs);
    }
  }, []);

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
            {qaPairs &&
              qaPairs.map((qaPair, index) => {
                const shuffledOptions = shuffledOptionsMap[index];
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
