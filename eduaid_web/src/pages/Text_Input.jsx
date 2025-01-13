import React, { useState, useRef } from "react";
import logo from "../assets/aossie_logo.png";
import { FaClipboard, FaCloudUploadAlt, FaGoogle, FaMinus, FaPlus, FaWikipediaW } from "react-icons/fa";
import Switch from "react-switch";

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
        const response = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        setText(data.content || data.error);
      } catch (error) {
        console.error("Error uploading file:", error);
        setText("Error uploading file");
      }
    }
  };

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    fileInputRef.current.click();
  };

  const handleSaveToLocalStorage = async () => {
    setLoading(true);

    if (docUrl) {
      try {
        const response = await fetch("http://localhost:5000/get_content", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ document_url: docUrl }),
        });

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
          last5Quizzes.shift();
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
    <div className="min-h-screen bg-white flex flex-col">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="loader border-4 border-t-4 border-green-500 rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}
      <header className="bg-green-50 p-4 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-12 sm:w-16" />
          <div className="text-xl sm:text-2xl font-extrabold">
            <span className="text-green-600">Edu</span>
            <span className="text-yellow-500">Aid</span>
          </div>
        </a>
        <h1 className="text-lg sm:text-xl font-bold text-gray-800">Enter Content</h1>
      </header>

      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="relative bg-yellow-50 rounded-lg p-4 shadow-md">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none">
              <FaClipboard className="h-5 w-5" />
            </button>
            <textarea
              className="w-full p-2 bg-transparent text-gray-800 rounded-lg outline-none resize-none h-40"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your content here..."
            />
          </div>

          <div className="text-center text-gray-500 text-lg">or</div>

          <div className="border-2 border-dashed border-yellow-300 rounded-lg p-6 text-center">
            <FaCloudUploadAlt className="mx-auto text-yellow-500 text-4xl mb-2" />
            <p className="text-gray-600 mb-4">Choose a file (PDF, MP3 supported)</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300"
              onClick={handleClick}
            >
              Browse File
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Enter Google Doc URL"
              className="w-full sm:w-2/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">Use Wikipedia:</span>
              <Switch
                onChange={toggleSwitch}
                checked={isToggleOn === 1}
                onColor="#10B981"
                offColor="#D1D5DB"
                checkedIcon={false}
                uncheckedIcon={false}
                height={24}
                width={48}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">Questions:</span>
              <button
                onClick={decrementQuestions}
                className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition duration-300"
              >
                <FaMinus />
              </button>
              <span className="text-xl font-bold text-gray-800 w-8 text-center">{numQuestions}</span>
              <button
                onClick={incrementQuestions}
                className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition duration-300"
              >
                <FaPlus />
              </button>
            </div>
            <select
              value={difficulty}
              onChange={handleDifficultyChange}
              className="bg-white border border-gray-300 text-gray-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="Easy Difficulty">Easy Difficulty</option>
              <option value="Hard Difficulty">Hard Difficulty</option>
            </select>
          </div>
        </div>
      </main>

      <footer className="bg-green-50 p-4 flex justify-center gap-4">
        <a href="question-type">
          <button className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded transition duration-300">
            Back
          </button>
        </a>
        <button
          onClick={handleSaveToLocalStorage}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded transition duration-300"
        >
          Next
        </button>
      </footer>
    </div>
  );
};

export default Text_Input;