import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "../../index.css";
import logoPNG from "../../assets/aossie_logo.png";
import ExtensionShell from "../../components/layout/ExtensionShell";
import BrandHeader from "../../components/layout/BrandHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardTitle, CardSubTitle } from "../../components/ui/Card";

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
      worker.terminate();
    };

    worker.onerror = (err) => {
      console.error("PDF generation failed in worker:", err);
      worker.terminate();
    };
  };


  return (
    <ExtensionShell>
      <BrandHeader compact />

      <div className="px-4 pb-4 flex-1 flex flex-col">
        <div className="text-slate-900 font-extrabold text-2xl">Generated questions</div>
        <div className="text-slate-500 text-xs mt-1">
          Tip: export to Google Forms or PDF from the action bar.
        </div>

        <div className="mt-4 flex-1 overflow-y-auto scrollbar-hide space-y-3">
          {qaPairs &&
            qaPairs.map((qaPair, index) => {
              const combinedOptions = qaPair.options
                ? [...qaPair.options, qaPair.answer]
                : [qaPair.answer];
              const shuffledOptions = shuffleArray(combinedOptions);

              return (
                <Card key={index} className="border border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardSubTitle>Question {index + 1}</CardSubTitle>
                      <CardTitle className="mt-1">{qaPair.question}</CardTitle>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-1">
                      {qaPair.question_type}
                    </div>
                  </div>

                  {qaPair.question_type !== "Boolean" && (
                    <div className="mt-3">
                      <div className="text-slate-600 text-xs font-semibold">Answer</div>
                      <div className="text-slate-900 mt-1">{qaPair.answer}</div>

                      {qaPair.options && qaPair.options.length > 0 && (
                        <div className="mt-3">
                          <div className="text-slate-600 text-xs font-semibold">Options</div>
                          <div className="mt-1 space-y-1">
                            {shuffledOptions.map((option, idx) => (
                              <div key={idx} className="text-slate-700 text-sm">
                                <span className="text-slate-500">{idx + 1}. </span>
                                {option}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button variant="secondary" className="w-1/3" onClick={() => window.close()}>
            Close
          </Button>
          <Button className="w-1/3" onClick={generateGoogleForm}>
            Google Form
          </Button>

          <div className="relative w-1/3">
            <Button
              className="w-full"
              onClick={() => document.getElementById("pdfDropdown").classList.toggle("hidden")}
            >
              PDF
            </Button>
            <div
              id="pdfDropdown"
              className="hidden absolute bottom-full left-0 right-0 mb-2 glass rounded-xl overflow-hidden"
            >
              <button
                className="block w-full text-left px-4 py-2 text-sm text-slate-900 hover:bg-slate-50"
                onClick={() => generatePDF("questions")}
              >
                Questions only
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-slate-900 hover:bg-slate-50"
                onClick={() => generatePDF("questions_answers")}
              >
                Questions + answers
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-slate-900 hover:bg-slate-50"
                onClick={() => generatePDF("answers")}
              >
                Answers only
              </button>
            </div>
          </div>
        </div>
      </div>
    </ExtensionShell>
  );
}

ReactDOM.render(<Question />, document.getElementById("root"));