import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "../../index.css";
import logo from "../../assets/aossie_logo.webp";
import logoPNG from "../../assets/aossie_logo.png";

function Question() {
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
    const response = await fetch("http://localhost:5000/generate_gform", {
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
    const worker = new Worker(new URL("../../workers/pdfWorker.js", import.meta.url), { type: "module" });

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
    };

    worker.onerror = (err) => {
      console.error("PDF generation failed in worker:", err);
    };
  };


  return (
    <div className="popup w-full h-full bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient">
        <div className="flex flex-col h-full">
          <div className="flex items-end gap-[2px]">
            <img src={logo} alt="logo" className="w-16 my-4 ml-4 block" />
            <div className="text-2xl mb-3 font-extrabold">
              <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                Edu
              </span>
              <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                Aid
              </span>
            </div>
          </div>
          <div className="font-bold text-xl text-white mt-3 mx-2">
            Generated Questions
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {qaPairs &&
              qaPairs.map((qaPair, index) => {
                const combinedOptions = qaPair.options
                  ? [...qaPair.options, qaPair.answer]
                  : [qaPair.answer];
                const shuffledOptions = shuffleArray(combinedOptions);
                return (
                  <div
                    key={index}
                    className="px-2 bg-[#d9d9d90d] border-black border my-1 mx-2 rounded-xl py-2"
                  >
                    <div className="text-[#E4E4E4] text-sm">
                      Question {index + 1}
                    </div>
                    <div className="text-[#FFF4F4] text-[1rem] my-1">
                      {qaPair.question}
                    </div>
                    {qaPair.question_type !== "Boolean" && (
                      <>
                        <div className="text-[#E4E4E4] text-sm">Answer</div>
                        <div className="text-[#FFF4F4] text-[1rem]">
                          {qaPair.answer}
                        </div>
                        {qaPair.options && qaPair.options.length > 0 && (
                          <div className="text-[#FFF4F4] text-[1rem]">
                            {shuffledOptions.map((option, idx) => (
                              <div key={idx}>
                                <span className="text-[#E4E4E4] text-sm">
                                  Option {idx + 1}:
                                </span>{" "}
                                <span className="text-[#FFF4F4] text-[1rem]">
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
          <div className="items-center flex justify-center gap-6 mx-auto">
            <button
              className="bg-[#161E1E] my-2 text-white px-2 py-2 rounded-xl"
              onClick={() => {
                window.close();
              }}
            >
              Close
            </button>
            <button
              className="bg-[#518E8E] items-center flex gap-1 my-2 font-semibold text-white px-2 py-2 rounded-xl"
              onClick={generateGoogleForm}
            >
              Generate Google form
            </button>
            
            <div className="relative">
              <button
                className="bg-[#518E8E] items-center flex gap-1 my-2 font-semibold text-white px-2 py-2 rounded-xl"
                onClick={() => document.getElementById('pdfDropdown').classList.toggle('hidden')}
              >
                Generate PDF
              </button>
              <div
                id="pdfDropdown"
                className="hidden absolute bottom-full mb-1 bg-[#02000F] shadow-md text-white rounded-lg"
              >
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-500 rounded-t-lg"
                  onClick={() => generatePDF('questions')}
                >
                  Questions Only
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-500"
                  onClick={() => generatePDF('questions_answers')}
                >
                  Questions with Answers
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-500 rounded-b-lg"
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
}

ReactDOM.render(<Question />, document.getElementById("root"));