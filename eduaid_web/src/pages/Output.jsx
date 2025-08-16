import React, { useState, useEffect } from "react";
import "../index.css";
import logoPNG from "../assets/aossie_logo_transparent.png";
import { Link } from "react-router-dom";

const Output = () => {
  const [qaPairs, setQaPairs] = useState([]);
  const [questionType, setQuestionType] = useState(
    localStorage.getItem("selectedQuestionType")
  );
  const [pdfMode, setPdfMode] = useState("questions");

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
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  useEffect(() => {
    const qaPairsFromStorage =
      JSON.parse(localStorage.getItem("qaPairs")) || {};
    if (qaPairsFromStorage) {
      const combinedQaPairs = [];

      if (qaPairsFromStorage["output_boolq"]) {
        qaPairsFromStorage["output_boolq"]["Boolean_Questions"].forEach(
          (question, index) => {
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

      if (qaPairsFromStorage["output_mcq"] || questionType === "get_mcq") {
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

      if (questionType == "get_boolq") {
        qaPairsFromStorage["output"].forEach((qaPair) => {
          combinedQaPairs.push({
            question: qaPair,
            question_type: "Boolean",
          });
        });
      } else if (qaPairsFromStorage["output"] && questionType !== "get_mcq") {
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

      setQaPairs(combinedQaPairs);
    }
  }, []);

  const generateGoogleForm = async () => {
    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/generate_gform`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        qa_pairs: qaPairs,
        question_type: questionType,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const formUrl = result.form_link;
      window.open(formUrl, "_blank");
    } else {
      console.error("Failed to generate Google Form");
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

          {/* Title */}
          <div className="font-bold text-lg sm:text-xl text-white mt-3 mx-4 sm:mx-6">
            Generated Questions
          </div>

          {/* Questions Container - Responsive padding and margins */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-2 sm:px-4">
            {qaPairs &&
              qaPairs.map((qaPair, index) => {
                const combinedOptions = qaPair.options
                  ? [...qaPair.options, qaPair.answer]
                  : [qaPair.answer];
                const shuffledOptions = shuffleArray(combinedOptions);
                return (
                  <div
                    key={index}
                    className="px-3 sm:px-4 bg-[#d9d9d90d] border-black border my-2 sm:my-3 mx-1 sm:mx-2 rounded-xl py-3 sm:py-4"
                  >
                    <div className="text-[#E4E4E4] text-xs sm:text-sm">
                      Question {index + 1}
                    </div>
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
