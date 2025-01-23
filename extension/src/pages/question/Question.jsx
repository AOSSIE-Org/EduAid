import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { PDFDocument, rgb } from 'pdf-lib';
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
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const maxContentWidth = pageWidth - (2 * margin);
    const maxContentHeight = pageHeight - (2 * margin);
    
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    const d = new Date(Date.now());

    // Load and embed logo
    const logoBytes = await loadLogoAsBytes();
    let logoImage;
    if (logoBytes) {
      try {
        logoImage = await pdfDoc.embedPng(logoBytes);
        const logoDims = logoImage.scale(0.2); // Scale down the logo
        page.drawImage(logoImage, {
          x: margin,
          y: pageHeight - margin - 30,
          width: logoDims.width,
          height: logoDims.height,
        });
        // Adjust title position to be next to the logo
        page.drawText('EduAid generated Quiz', {
          x: margin + logoDims.width + 10,
          y: pageHeight - margin,
          size: 20
        });
        page.drawText('Created On: ' + d.toString(), {
          x: margin + logoDims.width + 10,
          y: pageHeight - margin - 30,
          size: 10
        });
      } catch (error) {
        console.error('Error embedding logo:', error);
        // Fallback to text-only header if logo embedding fails
        page.drawText('EduAid generated Quiz', {
          x: margin,
          y: pageHeight - margin,
          size: 20
        });
        page.drawText('Created On: ' + d.toString(), {
          x: margin,
          y: pageHeight - margin - 30,
          size: 10
        });
      }
    }
    
    
    const form = pdfDoc.getForm();
    let y = pageHeight - margin - 70;
    let questionIndex = 1;

    const createNewPageIfNeeded = (requiredHeight) => {
        if (y - requiredHeight < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
            return true;
        }
        return false;
    };

    const wrapText = (text, maxWidth) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
  
      words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
  
          // Adjust the multiplier to reflect a more realistic line width based on font size
          const testWidth = testLine.length * 6; // Update the multiplier for better wrapping.
  
          if (testWidth > maxWidth) {
              lines.push(currentLine);
              currentLine = word;
          } else {
              currentLine = testLine;
          }
      });
  
      if (currentLine) {
          lines.push(currentLine);
      }
  
      return lines;
  };
  

    qaPairs.forEach((qaPair) => {
        let requiredHeight = 60;
        const questionLines = wrapText(qaPair.question, maxContentWidth);
        requiredHeight += questionLines.length * 20;

        if (mode !== 'answers') {
            if (qaPair.question_type === "Boolean") {
                requiredHeight += 60;
            } else if (qaPair.question_type === "MCQ" || qaPair.question_type === "MCQ_Hard") {
                const optionsCount = qaPair.options ? qaPair.options.length + 1 : 1;
                requiredHeight += optionsCount * 25;
            } else {
                requiredHeight += 40;
            }
        }

        if (mode === 'answers' || mode === 'questions_answers') {
            requiredHeight += 40;
        }

        createNewPageIfNeeded(requiredHeight);

        if (mode !== 'answers') {
          questionLines.forEach((line, lineIndex) => {
              const textToDraw = lineIndex === 0 
                  ? `Q${questionIndex}) ${line}`  // First line includes question number
                  : `        ${line}`;           // Subsequent lines are indented
              page.drawText(textToDraw, {
                  x: margin,
                  y: y - (lineIndex * 20),
                  size: 12,
                  maxWidth: maxContentWidth
              });
          });
          y -= (questionLines.length * 20 + 20);

            if (mode === 'questions') {
                if (qaPair.question_type === "Boolean") {
                    const radioGroup = form.createRadioGroup(`question${questionIndex}_answer`);
                    ['True', 'False'].forEach((option) => {
                        const radioOptions = {
                            x: margin + 20,
                            y,
                            width: 15,
                            height: 15,
                        };
                        radioGroup.addOptionToPage(option, page, radioOptions);
                        page.drawText(option, { x: margin + 40, y: y + 2, size: 12 });
                        y -= 20;
                    });
                } else if (qaPair.question_type === "MCQ" || qaPair.question_type === "MCQ_Hard") {
                    const allOptions = [...(qaPair.options || [])];
                    if (qaPair.answer && !allOptions.includes(qaPair.answer)) {
                        allOptions.push(qaPair.answer);
                    }
                    const shuffledOptions = shuffleArray([...allOptions]);
                    
                    const radioGroup = form.createRadioGroup(`question${questionIndex}_answer`);
                    shuffledOptions.forEach((option, index) => {
                        const radioOptions = {
                            x: margin + 20,
                            y,
                            width: 15,
                            height: 15,
                        };
                        radioGroup.addOptionToPage(`option${index}`, page, radioOptions);
                        const optionLines = wrapText(option, maxContentWidth - 60);
                        optionLines.forEach((line, lineIndex) => {
                            page.drawText(line, {
                                x: margin + 40,
                                y: y + 2 - (lineIndex * 15),
                                size: 12
                            });
                        });
                        y -= Math.max(25, optionLines.length * 20);
                    });
                } else if (qaPair.question_type === "Short") {
                    const answerField = form.createTextField(`question${questionIndex}_answer`);
                    answerField.setText("");
                    answerField.addToPage(page, {
                        x: margin,
                        y: y - 20,
                        width: maxContentWidth,
                        height: 20
                    });
                    y -= 40;
                }
            }
        }

        if (mode === 'answers' || mode === 'questions_answers') {
            const answerText = `Answer ${questionIndex}: ${qaPair.answer}`;
            const answerLines = wrapText(answerText, maxContentWidth);
            answerLines.forEach((line, lineIndex) => {
                page.drawText(line, {
                    x: margin,
                    y: y - (lineIndex * 15),
                    size: 12,
                    color: rgb(0, 0.5, 0)
                });
            });
            y -= answerLines.length * 20;
        }

        y -= 20;
        questionIndex += 1;
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "generated_questions.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    document.getElementById('pdfDropdown').classList.add('hidden');
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