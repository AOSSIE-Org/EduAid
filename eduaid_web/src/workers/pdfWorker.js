import { PDFDocument, rgb } from 'pdf-lib';

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

    if (qaPair.question_type === "MatchColumns") {
      const pairs = qaPair.pairs || [];
      const rightColumn = qaPair.right_column || [];

      const requiredHeight = 40 + pairs.length * 30 + 20 + pairs.length * 20 + 20;
      createNewPageIfNeeded(requiredHeight);

      page.drawText("Match the Columns", {
        x: margin,
        y,
        size: 14,
        color: rgb(0.2, 0.2, 0.8)
      });
      y -= 25;

      const colWidth = (maxContentWidth - 20) / 2;

      page.drawText("Column A (Terms)", {
        x: margin,
        y,
        size: 11,
        color: rgb(0, 0, 0)
      });
      page.drawText("Column B (Definitions)", {
        x: margin + colWidth + 20,
        y,
        size: 11,
        color: rgb(0, 0, 0)
      });
      y -= 20;

      pairs.forEach((pair, i) => {
        createNewPageIfNeeded(30);

        page.drawText(`${i + 1}. ${pair.term}`, {
          x: margin,
          y,
          size: 11
        });

        const defLabel = String.fromCharCode(65 + i);
        const defLines = wrapText(`${defLabel}. ${rightColumn[i]}`, colWidth);
        defLines.forEach((line, lineIdx) => {
          page.drawText(line, {
            x: margin + colWidth + 20,
            y: y - lineIdx * 15,
            size: 11
          });
        });

        y -= Math.max(20, defLines.length * 15) + 5;
      });

      if (mode === 'questions_answers' || mode === 'answers') {
        y -= 10;
        createNewPageIfNeeded(20 + pairs.length * 18);

        page.drawText("Answer Key", {
          x: margin,
          y,
          size: 11,
          color: rgb(0, 0.5, 0)
        });
        y -= 18;

        pairs.forEach((pair, i) => {
          const correctIndex = rightColumn.indexOf(pair.definition);
          const letter = String.fromCharCode(65 + correctIndex);
          page.drawText(`${i + 1} → ${letter}`, {
            x: margin,
            y,
            size: 11,
            color: rgb(0, 0.5, 0)
          });
          y -= 18;
        });
      }

      y -= 20;
      continue;
    }

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
      questionLines.forEach((line, i) => {
        const prefix = i === 0 ? `Q${questionIndex}) ` : '    ';
        page.drawText(`${prefix}${line}`, { x: margin, y: y - i * 20, size: 12 });
      });
      y -= questionLines.length * 20 + 20;

      if (mode === 'questions') {
        if (qaPair.question_type === "Boolean") {
          const radioGroup = form.createRadioGroup(`question${questionIndex}_answer`);
          ['True', 'False'].forEach(option => {
            radioGroup.addOptionToPage(option, page, {
              x: margin + 20, y, width: 15, height: 15
            });
            page.drawText(option, { x: margin + 40, y: y + 2, size: 12 });
            y -= 20;
          });
        } else if (qaPair.question_type === "MCQ" || qaPair.question_type === "MCQ_Hard") {
          const allOptions = [...(qaPair.options || [])];
          if (qaPair.answer && !allOptions.includes(qaPair.answer)) allOptions.push(qaPair.answer);
          const shuffled = shuffleArray([...allOptions]);

          const radioGroup = form.createRadioGroup(`question${questionIndex}_answer`);
          shuffled.forEach((option, idx) => {
            radioGroup.addOptionToPage(`option${idx}`, page, {
              x: margin + 20, y, width: 15, height: 15
            });

            const optionLines = wrapText(option, maxContentWidth - 60);
            optionLines.forEach((line, i) => {
              page.drawText(line, { x: margin + 40, y: y + 2 - i * 15, size: 12 });
            });
            y -= Math.max(25, optionLines.length * 20);
          });
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
      answerLines.forEach((line, i) => {
        page.drawText(line, {
          x: margin, y: y - i * 15, size: 12, color: rgb(0, 0.5, 0)
        });
      });
      y -= answerLines.length * 20;
    }

    y -= 20;
    questionIndex++;
  }

  const pdfBytes = await pdfDoc.save();
  // eslint-disable-next-line no-restricted-globals
  self.postMessage(pdfBytes);
};