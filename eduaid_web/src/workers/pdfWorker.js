import { PDFDocument, rgb } from 'pdf-lib';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const wrapText = (text, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = testLine.length * 6;
    if (testWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
};

// eslint-disable-next-line no-restricted-globals
self.onmessage = async (e) => {
  const { qaPairs, mode, logoBytes } = e.data;

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const maxContentWidth = pageWidth - 2 * margin;

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  const d = new Date(Date.now());

  const form = pdfDoc.getForm();
  let y = pageHeight - margin - 70;
  let questionIndex = 1;

  const createNewPageIfNeeded = (requiredHeight) => {
    if (y - requiredHeight < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  try {
    if (logoBytes) {
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const logoDims = logoImage.scale(0.2);
      page.drawImage(logoImage, {
        x: margin,
        y: pageHeight - margin - 30,
        width: logoDims.width,
        height: logoDims.height,
      });
      page.drawText("EduAid generated Quiz", {
        x: margin + logoDims.width + 10,
        y: pageHeight - margin,
        size: 20
      });
      page.drawText("Created On: " + d.toString(), {
        x: margin + logoDims.width + 10,
        y: pageHeight - margin - 30,
        size: 10
      });
    }
  } catch (err) {
    page.drawText("EduAid generated Quiz", { x: margin, y: pageHeight - margin, size: 20 });
  }

  for (const qaPair of qaPairs) {
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
      for (let lineIndex = 0; lineIndex < questionLines.length; lineIndex += 1) {
        const line = questionLines[lineIndex];
        const prefix = lineIndex === 0 ? `Q${questionIndex}) ` : '    ';
        page.drawText(`${prefix}${line}`, {
          x: margin,
          y: y - lineIndex * 20,
          size: 12,
        });
      }
      y -= questionLines.length * 20 + 20;

      if (mode === 'questions') {
        if (qaPair.question_type === "Boolean") {
          const radioGroup = form.createRadioGroup(`question${questionIndex}_answer`);
          const booleanOptions = ['True', 'False'];

          for (const option of booleanOptions) {
            radioGroup.addOptionToPage(option, page, {
              x: margin + 20, y, width: 15, height: 15
            });
            page.drawText(option, { x: margin + 40, y: y + 2, size: 12 });
            y -= 20;
          }
        } else if (qaPair.question_type === "MCQ" || qaPair.question_type === "MCQ_Hard") {
          const allOptions = [...(qaPair.options || [])];
          if (qaPair.answer && !allOptions.includes(qaPair.answer)) allOptions.push(qaPair.answer);
          const shuffled = shuffleArray(allOptions);

          const radioGroup = form.createRadioGroup(`question${questionIndex}_answer`);

          for (let optionIndex = 0; optionIndex < shuffled.length; optionIndex += 1) {
            const option = shuffled[optionIndex];
            radioGroup.addOptionToPage(`option${optionIndex}`, page, {
              x: margin + 20, y, width: 15, height: 15
            });

            const optionLines = wrapText(option, maxContentWidth - 60);
            for (let lineIndex = 0; lineIndex < optionLines.length; lineIndex += 1) {
              page.drawText(optionLines[lineIndex], {
                x: margin + 40,
                y: y + 2 - lineIndex * 15,
                size: 12,
              });
            }
            y -= Math.max(25, optionLines.length * 20);
          }
        } else if (qaPair.question_type === "Short") {
          const field = form.createTextField(`question${questionIndex}_answer`);
          field.setText('');
          field.addToPage(page, {
            x: margin, y: y - 20, width: maxContentWidth, height: 20
          });
          y -= 40;
        }
      }
    }

    if (mode === 'answers' || mode === 'questions_answers') {
      const answerLines = wrapText(`Answer ${questionIndex}: ${qaPair.answer}`, maxContentWidth);
      for (let lineIndex = 0; lineIndex < answerLines.length; lineIndex += 1) {
        page.drawText(answerLines[lineIndex], {
          x: margin,
          y: y - lineIndex * 15,
          size: 12,
          color: rgb(0, 0.5, 0)
        });
      }
      y -= answerLines.length * 20;
    }

    y -= 20;
    questionIndex++;
  }

  const pdfBytes = await pdfDoc.save();
  // eslint-disable-next-line no-restricted-globals
  self.postMessage(pdfBytes);
};
