import React, { useState, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import "../index.css";
import logo from "../assets/aossie_logo.png";
import logoPNG from "../assets/aossie_logo_transparent.png";

const processMCQQuestion = (qaPair, index) => {
  return (
    <div key={index} className="px-4 bg-[#d9d9d90d] border-[#518E8E] border my-4 mx-4 rounded-xl py-4">
      <div className="text-[#E4E4E4] text-sm font-semibold">
        Question {index + 1} (MCQ)
      </div>
      <div className="text-white text-lg my-3">
        {qaPair.question}
      </div>
      <div className="ml-4 mb-3">
        {qaPair.options?.map((option, idx) => (
          <div key={idx} 
            className={`text-[#E4E4E4] p-2 my-2 rounded ${
              option === qaPair.answer ? 'bg-[#518E8E40] border-l-4 border-[#518E8E]' : ''
            }`}>
            {String.fromCharCode(65 + idx)}. {option}
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-[#518E8E40]">
        <div className="text-[#E4E4E4] text-sm font-medium">Correct Answer:</div>
        <div className="text-[#518E8E] font-medium mt-1">{qaPair.answer}</div>
      </div>
    </div>
  );
};

const processBooleanQuestion = (qaPair, index) => {
  return (
    <div key={index} className="px-4 bg-[#d9d9d90d] border-[#518E8E] border my-4 mx-4 rounded-xl py-4">
      <div className="text-[#E4E4E4] text-sm font-semibold">
        Question {index + 1} (Boolean)
      </div>
      <div className="text-white text-lg my-3">
        {qaPair.question}
      </div>
      <div className="ml-4 mb-3">
        {['True', 'False'].map((option) => (
          <div key={option} 
            className={`text-[#E4E4E4] p-2 my-2 rounded ${
              option === qaPair.answer ? 'bg-[#518E8E40] border-l-4 border-[#518E8E]' : ''
            }`}>
            {option}
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-[#518E8E40]">
        <div className="text-[#E4E4E4] text-sm font-medium">Answer:</div>
        <div className="text-[#518E8E] font-medium mt-1">{qaPair.answer}</div>
      </div>
    </div>
  );
};

const processShortQuestion = (qaPair, index) => {
  return (
    <div key={index} className="px-4 bg-[#d9d9d90d] border-[#518E8E] border my-4 mx-4 rounded-xl py-4">
      <div className="text-[#E4E4E4] text-sm font-semibold">
        Question {index + 1} (Short Answer)
      </div>
      <div className="text-white text-lg my-3">
        {qaPair.question}
      </div>
      <div className="mt-3 pt-2 border-t border-[#518E8E40]">
        <div className="text-[#E4E4E4] text-sm font-medium">Answer:</div>
        <div className="text-[#518E8E] bg-[#518E8E20] p-3 rounded mt-2">
          {qaPair.answer}
        </div>
      </div>
    </div>
  );
};

// Add these helper functions to process different question types
const processQuestionsByType = (qaPairsFromStorage, questionType) => {
  const combinedQaPairs = [];

  // Process Boolean Questions
  if (qaPairsFromStorage.output_boolq || questionType === "get_boolq") {
    const boolQuestions = processBooleanQuestions(qaPairsFromStorage);
    combinedQaPairs.push(...boolQuestions);
  }

  // Process MCQ Questions
  if (qaPairsFromStorage.output_mcq || questionType === "get_mcq") {
    const mcqQuestions = processMCQQuestions(qaPairsFromStorage);
    combinedQaPairs.push(...mcqQuestions);
  }

  // Process Short Questions
  if (qaPairsFromStorage.output || questionType === "get_shortq") {
    const shortQuestions = processShortQuestions(qaPairsFromStorage);
    combinedQaPairs.push(...shortQuestions);
  }

  return combinedQaPairs;
};

const processBooleanQuestions = (data) => {
  const boolQuestions = [];

  // Handle Boolean questions from output array
  if (data.output && Array.isArray(data.output)) {
    data.output.forEach((qaPair) => {
      if (typeof qaPair.answer === 'boolean' || qaPair.question_type === "Boolean") {
        boolQuestions.push({
          question: qaPair.question || '',
          question_type: "Boolean",
          answer: typeof qaPair.answer === 'boolean' ? (qaPair.answer ? "True" : "False") : String(qaPair.answer),
          context: qaPair.context || "",
          id: qaPair.id
        });
      }
    });
  }

  // Handle Boolean questions from output_boolq (keep existing functionality)
  if (data.output_boolq?.Boolean_Questions) {
    data.output_boolq.Boolean_Questions.forEach((questionObj) => {
      boolQuestions.push({
        question: questionObj.question || questionObj,
        question_type: "Boolean",
        answer: typeof questionObj.answer === 'boolean' 
          ? (questionObj.answer ? "True" : "False") 
          : (typeof questionObj === 'object' ? String(questionObj.answer) : "Unknown"),
        context: data.output_boolq.Text || "",
      });
    });
  }

  console.log('Processed Boolean questions:', boolQuestions);
  return boolQuestions;
};

const processMCQQuestions = (data) => {
  const mcqQuestions = [];

  // Handle when MCQ questions are directly in output
  if (data.output?.output && Array.isArray(data.output.output)) {
    data.output.output.forEach((qaPair) => {
      mcqQuestions.push({
        question: qaPair.question_statement || qaPair.question || '',
        question_type: "MCQ",
        options: [...(qaPair.options || []), ...(qaPair.extra_options || [])].filter(Boolean),
        answer: qaPair.answer || '',
        context: qaPair.context || "",
        id: qaPair.id
      });
    });
  }

  // Handle MCQ questions from output array
  if (data.output && Array.isArray(data.output)) {
    data.output.forEach((qaPair) => {
      mcqQuestions.push({
        question: qaPair.question_statement || qaPair.question || '',
        question_type: "MCQ",
        options: [...(qaPair.options || []), ...(qaPair.extra_options || [])].filter(Boolean),
        answer: qaPair.answer || '',
        context: qaPair.context || "",
        id: qaPair.id
      });
    });
  }

  // Handle MCQ questions from output_mcq
  if (data.output_mcq?.questions) {
    data.output_mcq.questions.forEach((qaPair) => {
      mcqQuestions.push({
        question: qaPair.question_statement || qaPair.question || '',
        question_type: "MCQ",
        options: [...(qaPair.options || [])].filter(Boolean),
        answer: qaPair.answer || '',
        context: qaPair.context || "",
        id: qaPair.id
      });
    });
  }

  console.log('Raw MCQ data:', data);
  console.log('Processed MCQ questions:', mcqQuestions);
  return mcqQuestions;
};

const processShortQuestions = (data) => {
  const shortQuestions = [];

  // Handle questions from output_shortq
  if (data.output_shortq?.questions) {
    data.output_shortq.questions.forEach((qaPair) => {
      shortQuestions.push({
        question: qaPair.Question || qaPair.question || '',
        question_type: "Short",
        answer: qaPair.Answer || qaPair.answer || '',
        context: qaPair.context || data.output_shortq.statement || "",
        id: qaPair.id
      });
    });
  }

  // Handle questions from output array (keep existing functionality)
  if (data.output && Array.isArray(data.output)) {
    data.output.forEach((qaPair) => {
      if (typeof qaPair === 'object' && qaPair !== null) {
        shortQuestions.push({
          question: qaPair.Question || qaPair.question || '',
          question_type: "Short",
          answer: qaPair.Answer || qaPair.answer || '',
          context: qaPair.context || "",
          id: qaPair.id
        });
      }
    });
  }

  console.log('Processed Short questions:', shortQuestions);
  return shortQuestions;
};

const processRawData = (data) => {
  const processedQuestions = [];

  // Handle array in output property
  if (data.output && Array.isArray(data.output)) {
    data.output.forEach((item) => {
      if (item.question_type) {
        // If question_type is explicitly specified
        processedQuestions.push({
          question: item.question,
          question_type: item.question_type,
          answer: item.answer,
          options: item.options || [],
          id: item.id,
          context: item.context || ""
        });
      } else {
        // Determine question type based on answer and options
        if (typeof item.answer === 'boolean') {
          processedQuestions.push({
            question: item.question,
            question_type: "Boolean",
            answer: item.answer ? "True" : "False",
            id: item.id,
            context: item.context || ""
          });
        } else if (Array.isArray(item.options)) {
          processedQuestions.push({
            question: item.question,
            question_type: "MCQ",
            answer: item.answer,
            options: item.options,
            id: item.id,
            context: item.context || ""
          });
        } else {
          processedQuestions.push({
            question: item.question,
            question_type: "Short",
            answer: item.answer,
            id: item.id,
            context: item.context || ""
          });
        }
      }
    });
  }

  return processedQuestions;
};

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
    try {
      const qaPairsFromStorage = JSON.parse(localStorage.getItem("qaPairs")) || {};
      console.log("Raw data from storage:", qaPairsFromStorage);

      let processedQaPairs = [];

      // Handle specific question types based on questionType
      if (questionType === "get_problems" || questionType === "get_problems_hard") {
        // Process Boolean Questions
        if (Array.isArray(qaPairsFromStorage.output_boolq)) {
          const boolQuestions = qaPairsFromStorage.output_boolq.map(q => ({
            question: q.question || '',
            question_type: "Boolean",
            answer: typeof q.answer === 'boolean' ? (q.answer ? "True" : "False") : String(q.answer),
            context: q.context || "",
            id: q.id
          }));
          processedQaPairs = [...processedQaPairs, ...boolQuestions];
        } else if (qaPairsFromStorage.output_boolq?.Boolean_Questions) {
          const boolQuestions = qaPairsFromStorage.output_boolq.Boolean_Questions.map(q => ({
            question: q.question || '',
            question_type: "Boolean",
            answer: typeof q.answer === 'boolean' ? (q.answer ? "True" : "False") : String(q.answer),
            context: qaPairsFromStorage.output_boolq.Text || "",
            id: q.id
          }));
          processedQaPairs = [...processedQaPairs, ...boolQuestions];
        }
  
        // Process MCQ Questions - Updated part
        if (qaPairsFromStorage.output_mcq?.questions) {
          const mcqQuestions = qaPairsFromStorage.output_mcq.questions.map(q => ({
            question: q.question_statement || q.question || '',
            question_type: "MCQ",
            options: [...(q.options || []), ...(q.extra_options || [])].filter(Boolean),
            answer: q.answer || '',
            context: qaPairsFromStorage.output_mcq.statement || "",
            id: q.id
          }));
          processedQaPairs = [...processedQaPairs, ...mcqQuestions];
        }
        // Handle MCQ questions from output.output format
        if (qaPairsFromStorage.output_mcq?.output) {
          const mcqQuestions = qaPairsFromStorage.output_mcq.output.map(q => ({
            question: q.question_statement || q.question || '',
            question_type: "MCQ",
            options: [...(q.options || []), ...(q.extra_options || [])].filter(Boolean),
            answer: q.answer || '',
            context: q.context || "",
            id: q.id
          }));
          processedQaPairs = [...processedQaPairs, ...mcqQuestions];
        }
  
        // Process Short Questions
        if (Array.isArray(qaPairsFromStorage.output_shortq)) {
          const shortQuestions = qaPairsFromStorage.output_shortq.map(q => ({
            question: q.Question || q.question || '',
            question_type: "Short",
            answer: q.Answer || q.answer || '',
            context: q.context || "",
            id: q.id
          }));
          processedQaPairs = [...processedQaPairs, ...shortQuestions];
        } else if (qaPairsFromStorage.output_shortq?.questions) {
          const shortQuestions = qaPairsFromStorage.output_shortq.questions.map(q => ({
            question: q.Question || q.question || '',
            question_type: "Short",
            answer: q.Answer || q.answer || '',
            context: qaPairsFromStorage.output_shortq.statement || "",
            id: q.id
          }));
          processedQaPairs = [...processedQaPairs, ...shortQuestions];
        }
      } else {
        // Handle individual question types
        switch(questionType) {
          case "get_mcq":
          case "get_mcq_hard":
            const mcqQuestions = processMCQQuestions(qaPairsFromStorage);
            processedQaPairs = [...mcqQuestions];
            break;
          case "get_boolq":
          case "get_boolq_hard":
            const boolQuestions = processBooleanQuestions(qaPairsFromStorage);
            processedQaPairs = [...boolQuestions];
            break;
          case "get_shortq":
          case "get_shortq_hard":
            const shortQuestions = processShortQuestions(qaPairsFromStorage);
            processedQaPairs = [...shortQuestions];
            break;
        }
      }

      console.log("Processed QA pairs:", processedQaPairs);
      setQaPairs(processedQaPairs);

    } catch (error) {
      console.error("Error processing QA pairs:", error);
      setQaPairs([]);
    }
  }, [questionType]);

  useEffect(() => {
    console.log('Current qaPairs:', qaPairs);
    qaPairs.forEach((pair, index) => {
      console.log(`Question ${index + 1}:`, {
        type: pair.question_type,
        question: pair.question,
        answer: pair.answer,
        options: pair.options
      });
    });
  }, [qaPairs]);

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
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {qaPairs && qaPairs.length > 0 ? (
              qaPairs.map((qaPair, index) => {
                switch(qaPair.question_type) {
                  case "MCQ":
                    return processMCQQuestion(qaPair, index);
                  case "Boolean":
                    return processBooleanQuestion(qaPair, index);
                  case "Short":
                    return processShortQuestion(qaPair, index);
                  default:
                    return null;
                }
              })
            ) : (
              <div className="text-white text-center mt-4">
                No questions available
              </div>
            )}
          </div>
          <div className="items-center flex justify-center gap-6 mx-auto">
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
                className="hidden absolute bottom-full mb-1 bg-[#02000F] shadow-md text-white rounded-lg shadow-lg"
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
};

export default Output;
