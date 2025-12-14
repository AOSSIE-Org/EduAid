import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { PDFDocument } from 'pdf-lib';
import "../../index.css";
import ExtensionShell from "../../components/layout/ExtensionShell";
import BrandHeader from "../../components/layout/BrandHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardTitle, CardSubTitle } from "../../components/ui/Card";

function SidePanel() {
  const [qaPairs, setQaPairs] = useState([]);
  const [questionType, setQuestionType] = useState(
    localStorage.getItem("selectedQuestionType")
  );

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

      if (qaPairsFromStorage["output_shortq"]) {
        qaPairsFromStorage["output_shortq"]["questions"].forEach((qaPair) => {
          combinedQaPairs.push({
            question: qaPair.Question,
            question_type: "Short",
            answer: qaPair.Answer,
            context: qaPair.context,
          });
        });
      }

      if (questionType === "get_mcq") {
        qaPairsFromStorage["output"].forEach((qaPair) => {
          const options = qaPair.answer
            .filter((ans) => !ans.correct)
            .map((ans) => ans.answer);
          const correctAnswer = qaPair.answer.find(
            (ans) => ans.correct
          )?.answer;

          combinedQaPairs.push({
            question: qaPair.question,
            question_type: "MCQ_Hard",
            options: options,
            answer: correctAnswer,
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

  const generatePDF = async () => {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const d = new Date(Date.now());
    page.drawText('EduAid generated Quiz', { x: 50, y: 800, size: 20 });
    page.drawText('Created On: ' + d.toString(), { x: 50, y: 770, size: 10 });
    const form = pdfDoc.getForm();
    let y = 700; // Starting y position for content
    let questionIndex = 1;

    qaPairs.forEach((qaPair) => {
        if (y < 50) {
            page = pdfDoc.addPage();
            y = 700;
        }

        page.drawText(`Q${questionIndex}) ${qaPair.question}`, { x: 50, y, size: 15 });
        y -= 30;

        if (qaPair.question_type === "Boolean") {
            // Create radio buttons for True/False
            const radioGroup = form.createRadioGroup(`question${questionIndex}_answer`);
            const drawRadioButton = (text, selected) => {
                const options = {
                    x: 70,
                    y,
                    width: 15,
                    height: 15,
                };

                radioGroup.addOptionToPage(text, page, options);
                page.drawText(text, { x: 90, y: y + 2, size: 12 });
                y -= 20;
            };

            drawRadioButton('True', false);
            drawRadioButton('False', false);
        } else if (qaPair.question_type === "MCQ" || qaPair.question_type === "MCQ_Hard") {
            // Shuffle options including qaPair.answer
            const options = [...qaPair.options, qaPair.answer]; // Include correct answer in options
            options.sort(() => Math.random() - 0.5); // Shuffle options randomly

            const radioGroup = form.createRadioGroup(`question${questionIndex}_answer`);

            options.forEach((option, index) => {
                const drawRadioButton = (text, selected) => {
                    const radioOptions = {
                        x: 70,
                        y,
                        width: 15,
                        height: 15,
                    };
                    radioGroup.addOptionToPage(text, page, radioOptions);
                    page.drawText(text, { x: 90, y: y + 2, size: 12 });
                    y -= 20;
                };
                drawRadioButton(option, false);
            });
        } else if (qaPair.question_type === "Short") {
            // Text field for Short answer
            const answerField = form.createTextField(`question${questionIndex}_answer`);
            answerField.setText("");
            answerField.addToPage(page, { x: 50, y: y - 20, width: 450, height: 20 });
            y -= 40;
        }

        y -= 20; // Space between questions
        questionIndex += 1;
    });

    // Save PDF and create download link
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "generated_questions.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

  return (
    <ExtensionShell>
      <BrandHeader compact />

      <div className="px-4 pb-4 flex-1 flex flex-col">
        <div className="text-slate-900 font-extrabold text-2xl">Generated questions</div>
        <div className="text-slate-500 text-xs mt-1">Fill answers here (side panel view).</div>

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

                  {qaPair.options ? (
                    <div className="mt-3 space-y-2">
                      {shuffledOptions.map((option, idx) => (
                        <label key={idx} className="flex items-center gap-2 text-slate-700 text-sm">
                          <input
                            type="radio"
                            name={`question${index}`}
                            value={option}
                            className="accent-[#7600F2]"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Enter your answer"
                        className="w-full rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 px-4 py-2 outline-none focus:ring-2 focus:ring-[#7600F2]/25 focus:border-[#7600F2]/40"
                      />
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
          <Button className="w-1/3" onClick={generatePDF}>
            PDF
          </Button>
        </div>
      </div>
    </ExtensionShell>
  );
}

ReactDOM.render(<SidePanel />, document.getElementById("root"));
