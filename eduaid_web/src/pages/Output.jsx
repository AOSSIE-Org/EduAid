import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import logo from "../assets/aossie_logo.png";
import { FaFilePdf, FaGoogle } from "react-icons/fa";

const Output = () => {
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
          const options = qaPair.options;
          const correctAnswer = qaPair.answer;

          combinedQaPairs.push({
            question: qaPair.question_statement,
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
    page.drawText("EduAid generated Quiz", { x: 50, y: 800, size: 20 });
    page.drawText("Created On: " + d.toString(), { x: 50, y: 770, size: 10 });
    const form = pdfDoc.getForm();
    let y = 700; // Starting y position for content
    let questionIndex = 1;

    console.log("here inside downloading", qaPairs)

    qaPairs.forEach((qaPair) => {
      if (y < 50) {
        page = pdfDoc.addPage();
        y = 700;
      }

      // i'm implementing a question text wrapping logic so that it doesn't overflow the page
      const questionText = `Q${questionIndex}) ${qaPair.question}`;
      const maxLineLength = 67;
      const lines = [];

      let start = 0;
      while (start < questionText.length) {
        let end = start + maxLineLength;
        if (end < questionText.length && questionText[end] !== ' ') {
          while (end > start && questionText[end] !== ' ') {
          end--;
          }
        }
        if (end === start) {
          end = start + maxLineLength;
        }
        lines.push(questionText.substring(start, end).trim());
        start = end + 1;
      }

      lines.forEach((line) => {
        page.drawText(line, { x: 50, y, size: 15 });
        y -= 20;
      });

      y -= 10;

      if (qaPair.question_type === "Boolean") {
        // Create radio buttons for True/False
        const radioGroup = form.createRadioGroup(
          `question${questionIndex}_answer`
        );
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

        drawRadioButton("True", false);
        drawRadioButton("False", false);
      } else if (
        qaPair.question_type === "MCQ" ||
        qaPair.question_type === "MCQ_Hard"
      ) {
        // Shuffle options including qaPair.answer
        const options = [...qaPair.options, qaPair.answer]; // Include correct answer in options
        options.sort(() => Math.random() - 0.5); // Shuffle options randomly

        const radioGroup = form.createRadioGroup(
          `question${questionIndex}_answer`
        );

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

        if (questionIndex % 5 === 0) {
          page = pdfDoc.addPage();
          y = 700;
        }
      } else if (qaPair.question_type === "Short") {
        // Text field for Short answer
        const answerField = form.createTextField(
          `question${questionIndex}_answer`
        );
        answerField.setText("");
        answerField.addToPage(page, {
          x: 50,
          y: y - 20,
          width: 450,
          height: 20,
        });
        y -= 40;
      }

      y -= 20; // Space between questions
      questionIndex += 1;
    });

    // Save PDF and create download link
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "generated_questions.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-green-50 p-4 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-12 sm:w-16" />
          <div className="text-xl sm:text-2xl font-extrabold">
            <span className="text-green-600">Edu</span>
            <span className="text-yellow-500">Aid</span>
          </div>
        </a>
        <h1 className="text-lg sm:text-xl font-bold text-gray-800">Generated Questions</h1>
      </header>

      <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="space-y-4 mb-8">
          {qaPairs && qaPairs.map((qaPair, index) => {
            const combinedOptions = qaPair.options
              ? [...qaPair.options, qaPair.answer]
              : [qaPair.answer];
            const shuffledOptions = shuffleArray(combinedOptions);
            return (
              <div
                key={index}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Question {index + 1}
                </h2>
                <p className="text-gray-700 mb-2">{qaPair.question}</p>
                {qaPair.question_type !== "Boolean" && (
                  <>
                    <h3 className="font-semibold text-gray-700 mt-2 mb-1">Answer</h3>
                    <p className="text-gray-600 mb-2">{qaPair.answer}</p>
                    {qaPair.options && qaPair.options.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-1">Options</h3>
                        <ul className="list-disc list-inside text-gray-600">
                          {shuffledOptions.map((option, idx) => (
                            <li key={idx}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <footer className="bg-green-50 p-4 flex justify-center gap-4">
        <button
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 flex items-center gap-2"
          onClick={generateGoogleForm}
        >
          <FaGoogle /> Generate Google Form
        </button>
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition duration-300 flex items-center gap-2"
          onClick={generatePDF}
        >
          <FaFilePdf /> Generate PDF
        </button>
      </footer>
    </div>
  );
};

export default Output;