import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import "../../index.css";
import stars from "../../assets/stars.png";
import cloud from "../../assets/cloud.png";
import arrow from "../../assets/arrow.png";
import { FaClipboard , FaWikipediaW  } from "react-icons/fa";
import ExtensionShell from "../../components/layout/ExtensionShell";
import BrandHeader from "../../components/layout/BrandHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardTitle, CardSubTitle } from "../../components/ui/Card";
import { Label, Select, TextArea, TextInput } from "../../components/ui/Field";

function Second() {
  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState("Easy Difficulty");
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [fileContent, setFileContent] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [isToggleOn, setIsToggleOn] = useState(0);

  useEffect(() => {
    chrome.storage.local.get(["selectedText"], (result) => {
      if (result.selectedText) {
        console.log("Selected Text: ", result.selectedText);
        setText(result.selectedText);
        localStorage.setItem("textContent", result.selectedText);
      }
    });
  }, [])


  const toggleSwitch = () => {
    setIsToggleOn((isToggleOn + 1) % 2);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:5000/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        setText(data.content || data.error);
      } catch (error) {
        console.error('Error uploading file:', error);
        setText('Error uploading file');
      }
    }
  };

  const handleClick = (event) => {
    event.preventDefault();  // Prevent default behavior
    event.stopPropagation(); // Stop event propagation

    // Open file input dialog
    fileInputRef.current.click();
  };

  const handleSaveToLocalStorage = async () => {
    setLoading(true);

    // Check if a Google Doc URL is provided
    if (docUrl) {
      try {
        const response = await fetch('http://localhost:5000/get_content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ document_url: docUrl })
        });

        if (response.ok) {
          const data = await response.json();
          setDocUrl("")
          setText(data || "Error in retrieving");
        } else {
          console.error('Error retrieving Google Doc content');
          setText('Error retrieving Google Doc content');
        }
      } catch (error) {
        console.error('Error:', error);
        setText('Error retrieving Google Doc content');
      } finally {
        setLoading(false);
        chrome.storage.local.remove(["selectedText"], () => {
          console.log("Chrome storage cleared");
        });
      }
    } else if (text) {
      // Proceed with existing functionality for local storage
      localStorage.setItem("textContent", text);
      localStorage.setItem("difficulty", difficulty);
      localStorage.setItem("numQuestions", numQuestions);

      await sendToBackend(
        text,
        difficulty,
        localStorage.getItem("selectedQuestionType")
      );
    }
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
  };

  const incrementQuestions = () => {
    setNumQuestions((prev) => prev + 1);
  };

  const decrementQuestions = () => {
    setNumQuestions((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const getEndpoint = (difficulty, questionType) => {
    if (difficulty !== "Easy Difficulty") {
      if (questionType === "get_shortq") {
        return "get_shortq_hard";
      } else if (questionType === "get_mcq") {
        return "get_mcq_hard";
      }
    }
    return questionType;
  };

  const sendToBackend = async (data, difficulty, questionType) => {
    const endpoint = getEndpoint(difficulty, questionType);
    try {
      const formData = JSON.stringify({
        input_text: data,
        max_questions: numQuestions,
        use_mediawiki: isToggleOn
      });
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        localStorage.setItem("qaPairs", JSON.stringify(responseData));

        // Save quiz details to local storage
        const quizDetails = {
          difficulty,
          numQuestions,
          date: new Date().toLocaleDateString(),
          qaPair: responseData
        };

        let last5Quizzes = JSON.parse(localStorage.getItem('last5Quizzes')) || [];
        last5Quizzes.push(quizDetails);
        if (last5Quizzes.length > 5) {
          last5Quizzes.shift();  // Keep only the last 5 quizzes
        }
        localStorage.setItem('last5Quizzes', JSON.stringify(last5Quizzes));

        window.location.href = "/src/pages/question/question.html";
      } else {
        console.error("Backend request failed.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <ExtensionShell>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-black">
          <div className="loader border-4 border-t-4 border-white rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}
      {/*
        Make the popup scrollable.
        This wrapper used `h-full` but had no overflow handling, so long forms
        could not scroll inside the fixed-size extension popup.
      */}
      <div
        className={`w-full h-full overflow-y-auto ${
          loading ? "pointer-events-none" : ""
        }`}
      >
        <BrandHeader compact />

        <div className="px-4 pb-4 flex flex-col">
          <div className="text-white font-extrabold text-2xl">Enter content</div>
          <div className="text-white/70 text-sm flex items-center gap-2 mt-1">
            Generate <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text font-semibold">questionaries</span>
            <img className="h-[18px] w-[18px]" src={stars} alt="stars" />
          </div>

          <div className="mt-4">
            <Label>Paste or type text</Label>
            <Card className="mt-2 relative">
              <div className="absolute top-3 left-3 text-white/70">
                <FaClipboard className="h-[18px] w-[18px]" />
              </div>
              <TextArea
                className="min-h-[110px] pl-10 resize-none scrollbar-hide"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your notes here..."
              />
            </Card>
          </div>

          <div className="text-white/60 text-xs text-center my-3">or</div>

          <Card className="border border-white/10">
            <CardTitle>Import a file</CardTitle>
            <CardSubTitle>PDF, MP3 supported</CardSubTitle>
            <div className="mt-3 flex items-center gap-3">
              <img height={22} width={22} src={cloud} alt="cloud" />
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
              <Button variant="secondary" onClick={handleClick}>
                Browse file
              </Button>
            </div>

            <div className="mt-4">
              <Label>Google Doc URL</Label>
              <TextInput
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
                className="mt-2"
              />
            </div>
          </Card>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onChange={handleDifficultyChange} className="mt-2">
                <option>Easy Difficulty</option>
                <option>Medium Difficulty</option>
                <option>Hard Difficulty</option>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Number of questions</Label>
              <div className="mt-2 flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                <div className="text-white/80 text-sm">{numQuestions}</div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="px-2 py-1" onClick={decrementQuestions}>
                    -
                  </Button>
                  <Button variant="ghost" className="px-2 py-1" onClick={incrementQuestions}>
                    +
                  </Button>
                  <button
                    title={isToggleOn ? "Disable Wikipedia Context" : "Enable Wikipedia Context"}
                    onClick={toggleSwitch}
                    className={`ml-1 p-2 rounded-xl border border-white/10 transition ${isToggleOn ? "bg-green-500/90 text-white" : "bg-white/10 text-white/70"}`}
                  >
                    <FaWikipediaW className="text-lg" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 flex items-center gap-3">
            <a href="/src/popup/popup.html" className="block w-1/2">
              <Button variant="outline" className="w-full">
                Back
              </Button>
            </a>
            <Button onClick={handleSaveToLocalStorage} variant="outline" className="w-1/2">
              Next <img src={arrow} width={16} height={12} alt="arrow" />
            </Button>
          </div>
        </div>
      </div>
    </ExtensionShell>
  );
}

ReactDOM.render(<Second />, document.getElementById("root"));

