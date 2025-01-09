import React, { useState, useRef } from "react";
import { FaClipboard, FaCloudUploadAlt, FaMinus, FaPlus } from "react-icons/fa";
import Switch from "react-switch";
import logo from "../assets/aossie_logo.png";
import stars from "../assets/stars.png";

const Text_Input = () => {
  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState("Easy Difficulty");
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [docUrl, setDocUrl] = useState("");
  const [isToggleOn, setIsToggleOn] = useState(0);

  const toggleSwitch = () => {
    setIsToggleOn((isToggleOn + 1) % 2);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await response.json();
        setText(data.content || data.error);
      } catch (error) {
        console.error("Error uploading file:", error);
        setText("Error uploading file");
      }
    }
  };

  const handleClick = (event) => {
    event.preventDefault(); // Prevent default behavior
    event.stopPropagation(); // Stop event propagation

    // Open file input dialog
    fileInputRef.current.click();
  };

  const handleSaveToLocalStorage = async () => {
    setLoading(true);

    // Check if a Google Doc URL is provided
    if (docUrl) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/get_content`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ document_url: docUrl }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setDocUrl("");
          setText(data || "Error in retrieving");
        } else {
          console.error("Error retrieving Google Doc content");
          setText("Error retrieving Google Doc content");
        }
      } catch (error) {
        console.error("Error:", error);
        setText("Error retrieving Google Doc content");
      } finally {
        setLoading(false);
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
        use_mediawiki: isToggleOn,
      });

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/${endpoint}`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        localStorage.setItem("qaPairs", JSON.stringify(responseData));

        // Save quiz details to local storage
        const quizDetails = {
          difficulty,
          numQuestions,
          date: new Date().toLocaleDateString(),
          qaPair: responseData,
        };

        let last5Quizzes =
          JSON.parse(localStorage.getItem("last5Quizzes")) || [];
        last5Quizzes.push(quizDetails);
        if (last5Quizzes.length > 5) {
          last5Quizzes.shift(); // Keep only the last 5 quizzes
        }
        localStorage.setItem("last5Quizzes", JSON.stringify(last5Quizzes));

        window.location.href = "output";
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
    <div className="relative min-h-screen bg-neutral-950">
      {/* Background patterns */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="loader border-4 border-t-4 border-white rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <a href="/">
          <div className="flex items-center gap-2 mb-12">
            <img
              src={logo}
              alt="AOSSIE Logo"
              width={80}
              height={80}
              className="mix-blend-screen rounded-full"
            />
            <h1 className="text-4xl font-extrabold">
              <span className="bg-gradient-to-r from-[#7877C6] to-purple-500 text-transparent bg-clip-text">
                EduAid
              </span>
            </h1>
          </div>
        </a>

        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">
            Enter the Content
          </h2>
          <p className="text-xl text-gray-400">
            to Generate{" "}
            <span className="bg-gradient-to-r from-[#7877C6] to-purple-500 text-transparent bg-clip-text font-semibold">
              Questionnaires
            </span>
          </p>
        </div>

        <div className="bg-neutral-800 rounded-xl p-4 mb-8 relative">
          <button className="absolute top-2 left-2 text-gray-400 hover:text-white focus:outline-none">
            <FaClipboard className="h-6 w-6" />
          </button>
          <textarea
            className="w-full h-40 bg-transparent text-white text-lg p-8 rounded-xl outline-none resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your text here..."
          />
        </div>

        <div className="text-center text-gray-400 my-4">or</div>

        <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 mb-8">
          <div className="flex flex-col items-center">
            <FaCloudUploadAlt className="text-4xl text-gray-400 mb-2" />
            <p className="text-lg text-white mb-2">Choose a file</p>
            <p className="text-sm text-gray-400 mb-4">PDF, MP3 supported</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={handleClick}
              className="bg-neutral-700 text-white px-6 py-2 rounded-full hover:bg-neutral-600 transition-colors mb-4"
            >
              Browse File
            </button>
            <input
              type="text"
              placeholder="Enter Google Doc URL"
              className="w-full bg-neutral-800 text-white rounded-full px-4 py-2 outline-none"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-8 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-white text-lg">No. of Questions:</span>
            <button
              onClick={decrementQuestions}
              className="bg-neutral-700 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-600 transition-colors"
            >
              <FaMinus />
            </button>
            <span className="text-white text-xl w-8 text-center">
              {numQuestions}
            </span>
            <button
              onClick={incrementQuestions}
              className="bg-neutral-700 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-600 transition-colors"
            >
              <FaPlus />
            </button>
          </div>
          <div>
            <select
              value={difficulty}
              onChange={handleDifficultyChange}
              className="bg-neutral-700 text-white rounded-full px-4 py-2 outline-none"
            >
              <option value="Easy Difficulty">Easy Difficulty</option>
              <option value="Hard Difficulty">Hard Difficulty</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white text-lg">Use Wikipedia:</span>
            <Switch
              onChange={toggleSwitch}
              checked={isToggleOn === 1}
              onColor="#7877C6"
              offColor="#4B5563"
              checkedIcon={false}
              uncheckedIcon={false}
            />
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <a href="/question-type">
            <button className="bg-neutral-700 text-white px-8 py-2 rounded-full hover:bg-neutral-600 transition-colors">
              Back
            </button>
          </a>
          <button
            onClick={handleSaveToLocalStorage}
            className="bg-gradient-to-r from-[#7877C6] to-purple-500 text-white px-8 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Text_Input;
