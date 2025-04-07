import React, { useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import "../index.css";
import logo from "../assets/aossie_logo.png";
import logoPNG from "../assets/aossie_logo_transparent.png";

const StudyNotes = () => {
  const [studyNotes, setStudyNotes] = useState(JSON.parse(localStorage.getItem("studyNotes")) || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedHeader, setEditedHeader] = useState("");
  const [editedPoints, setEditedPoints] = useState([]);

  const loadLogoAsBytes = async () => {
    try {
      const response = await fetch(logoPNG);
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error("Error loading logo:", error);
      return null;
    }
  };

  const generateNotesPDF = async () => {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin - 70;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const logoBytes = await loadLogoAsBytes();
    if (logoBytes) {
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const logoDims = logoImage.scale(0.2);
      page.drawImage(logoImage, {
        x: margin,
        y: height - margin - 30,
        width: logoDims.width,
        height: logoDims.height,
      });
      page.drawText("EduAid Study Notes", {
        x: margin + logoDims.width + 10,
        y: height - margin,
        size: 20,
        font,
        color: rgb(0, 0, 0),
      });
    }

    const wrapText = (text, font, size, maxWidth) => {
      // Remove newlines and extra whitespace
      const cleanText = text.replace(/[\n\r]+/g, " ").trim();
      const words = cleanText.split(" ");
      let line = "";
      const lines = [];
      for (const word of words) {
        const testLine = line + word + " ";
        const testWidth = font.widthOfTextAtSize(testLine, size);
        if (testWidth > maxWidth && line !== "") {
          lines.push(line.trim());
          line = word + " ";
        } else {
          line = testLine;
        }
      }
      if (line !== "") lines.push(line.trim());
      return lines;
    };

    const availableWidth = width - 2 * margin;

    studyNotes.forEach((card) => {
      if (y < margin + 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - margin;
      }

      const headerLines = wrapText(card.header, font, 16, availableWidth);
      headerLines.forEach((line, index) => {
        page.drawText(line, {
          x: margin,
          y: y - index * 18,
          size: 16,
          font,
          color: rgb(0, 0.5, 0.5),
        });
      });
      y -= headerLines.length * 18 + 10;

      card.points.forEach((point) => {
        const pointLines = wrapText(point, font, 12, availableWidth);
        pointLines.forEach((line, index) => {
          if (y < margin) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = height - margin;
          }
          page.drawText(line, {
            x: margin,
            y: y - index * 14,
            size: 12,
            font,
            color: rgb(0, 0, 0),
          });
        });
        y -= pointLines.length * 14 + 5;
      });

      y -= 10;
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "study_notes.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedHeader(studyNotes[index].header);
    setEditedPoints([...studyNotes[index].points]); // Clone to avoid direct mutation
  };

  const handleSave = (index) => {
    const updatedNotes = [...studyNotes];
    updatedNotes[index] = { header: editedHeader, points: editedPoints };
    setStudyNotes(updatedNotes);
    localStorage.setItem("studyNotes", JSON.stringify(updatedNotes));
    setEditingIndex(null);
  };

  const handleHeaderChange = (e) => setEditedHeader(e.target.value);

  const handlePointChange = (e, pointIndex) => {
    const updatedPoints = [...editedPoints];
    updatedPoints[pointIndex] = e.target.value;
    setEditedPoints(updatedPoints);
  };

  return (
    <div className="w-full bg-[#02000F] flex justify-center items-center font-sans min-h-screen">
      <div className="w-full max-w-4xl bg-opacity-50 bg-custom-gradient rounded-xl shadow-lg p-6 flex flex-col">
        <a href="/" className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-14" />
          <div className="text-3xl font-extrabold">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">Edu</span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">Aid</span>
          </div>
        </a>

        <h2 className="font-bold text-2xl text-white mt-4 mb-6">Study Notes</h2>

        <div className="flex-1 space-y-4">
          {studyNotes.length > 0 ? (
            studyNotes.map((card, index) => (
              <div key={index} className="bg-[#1a1a2e] p-4 rounded-lg shadow-md">
                {editingIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={editedHeader}
                      onChange={handleHeaderChange}
                      className="w-full text-[#00CBE7] bg-[#2a2a3e] p-2 rounded mb-2"
                    />
                    <ul className="text-[#FFF4F4] text-base list-disc pl-5">
                      {editedPoints.map((point, idx) => (
                        <li key={idx}>
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => handlePointChange(e, idx)}
                            className="w-full bg-[#2a2a3e] p-1 rounded"
                          />
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleSave(index)}
                        className="bg-[#518E8E] text-white px-4 py-1 rounded hover:bg-[#3e706e]"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="bg-[#3e5063] text-white px-4 py-1 rounded hover:bg-[#4a6075]"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-[#00CBE7] text-lg font-semibold mb-2">{card.header}</h3>
                    <ul className="text-[#FFF4F4] text-base list-disc pl-5">
                      {card.points.map((point, idx) => (
                        <li key={idx}>{point.slice(2)}</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleEdit(index)}
                      className="mt-2 bg-[#3e5063] text-white px-4 py-1 rounded hover:bg-[#4a6075]"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="text-[#E4E4E4] text-base">No study notes generated yet. Go back and create some!</p>
          )}
        </div>

        <div className="mt-6 flex gap-4 justify-center">
          {studyNotes.length > 0 && (
            <button
              onClick={generateNotesPDF}
              className="bg-[#518E8E] text-white font-semibold px-6 py-2 rounded-lg hover:bg-[#3e706e] transition-colors"
            >
              Download as PDF
            </button>
          )}
          <a href="/">
            <button className="bg-[#3e5063] text-white font-semibold px-6 py-2 rounded-lg hover:bg-[#4a6075] transition-colors">
              Back to Input
            </button>
          </a>
          <a href="/output">
            <button className="bg-[#3e5063] text-white font-semibold px-6 py-2 rounded-lg hover:bg-[#4a6075] transition-colors">
              Go to Quiz
            </button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default StudyNotes;