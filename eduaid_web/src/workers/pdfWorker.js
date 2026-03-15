import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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
  const { qaPairs, mode, logoBytes, fontBytes } = e.data;

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const maxContentWidth = pageWidth - 2 * margin;

  const pdfDoc = await PDFDocument.create();
  
  // Register fontkit & Embed User Font for Unicode support
  let customFont = null;
  if (fontBytes) {
    pdfDoc.registerFontkit(fontkit);
    try {
      customFont = await pdfDoc.embedFont(fontBytes);
    } catch (err) {
      console.error("Failed to embed font in worker:", err);
    }
  }

  // Fallback to standard font if no custom font is provided / failed
  if (!customFont) {
    customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

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
        size: 20,
        font: customFont
      });
      page.drawText("Created On: " + d.toString(), {
        x: margin + logoDims.width + 10,
        y: pageHeight - margin - 30,
        size: 10,
        font: customFont
      });
    }
  } catch (err) {
    page.drawText("EduAid generated Quiz", { x: margin, y: pageHeight - margin, size: 20, font: customFont });
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
      for (const [i, line] of questionLines.entries()) {
        const prefix = i === 0 ? `Q${questionIndex}) ` : '    ';
        page.drawText(`${prefix}${line}`, { x: margin, y: y - i * 20, size: 12, font: customFont });
      }
      y -= questionLines.length * 20 + 20;

      if (mode === 'questions') {
        if (qaPair.question_type === "Boolean") {
          const radioGroup = form.createRadioGroup(`question${questionIndex}_answer`);
          for (const option of ['True', 'False']) {
            radioGroup.addOptionToPage(option, page, {
              x: margin + 20, y, width: 15, height: 15
            });
            page.drawText(option, { x: margin + 40, y: y + 2, size: 12, font: customFont });
            y -= 20;
          }
        } else if (qaPair.question_type === "MCQ" || qaPair.question_type === "MCQ_Hard") {
          const allOptions = [...(qaPair.options || [])];
          if (qaPair.answer && !allOptions.includes(qaPair.answer)) allOptions.push(qaPair.answer);
          const shuffled = shuffleArray([...allOptions]);

          const radioGroup = form.createRadioGroup(`question${questionIndex}_answer`);
          for (const [idx, option] of shuffled.entries()) {
            radioGroup.addOptionToPage(`option${idx}`, page, {
              x: margin + 20, y, width: 15, height: 15
            });

            const optionLines = wrapText(option, maxContentWidth - 60);
            for (const [i, line] of optionLines.entries()) {
              page.drawText(line, { x: margin + 40, y: y + 2 - i * 15, size: 12, font: customFont });
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
      for (const [i, line] of answerLines.entries()) {
        page.drawText(line, {
          x: margin, y: y - i * 15, size: 12, color: rgb(0, 0.5, 0), font: customFont
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
