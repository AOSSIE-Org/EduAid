import React, { useState, useRef } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png"
import stars from "../assets/stars.png";
import cloud from "../assets/cloud.png";
import { FaClipboard } from "react-icons/fa";
import Switch from "react-switch";
import { Link,useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";

const Text_Input = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState("Easy Difficulty");
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [fileContent, setFileContent] = useState("");
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
        const data = await apiClient.postFormData("/upload", formData);
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
        const data = await apiClient.post("/get_content", { document_url: docUrl });
        setDocUrl("");
        setText(data || "Error in retrieving");
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
      const requestData = {
        input_text: data,
        max_questions: numQuestions,
        use_mediawiki: isToggleOn,
      };

      const responseData = await apiClient.post(`/${endpoint}`, requestData);
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

      navigate("/output");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup grid-bg w-screen min-h-screen flex justify-center items-center">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-black">
          <div className="loader border-4 border-t-4 border-white rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}

      <div className={`w-full h-full overflow-auto px-4 py-6 sm:px-8 md:px-16 ${loading ? "pointer-events-none" : ""}`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <Link to="/" className="block">
            <div className="flex items-end gap-2 mb-8">
              <img src={logo_trans} alt="logo" className="w-20 sm:w-24" />
              <div className="text-3xl sm:text-4xl font-extrabold">
                <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">Edu</span>
                <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">Aid</span>
              </div>
            </div>
          </Link>

          {/* Headline */}
          <div className="text-white text-center sm:text-right mb-8">
            <div className="text-xl sm:text-2xl font-bold">Enter the Content</div>
            <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 text-xl font-bold">
              to Generate{" "}
              <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">Questionnaires</span>
              <img className="h-6 w-6" src={stars} alt="stars" />
            </div>
          </div>

          {/* Textarea */}
          <div className="relative bg-[#45454533] backdrop-blur-sm rounded-2xl p-6 min-h-[160px] sm:min-h-[200px] mb-6 border border-[#ffffff20]">
            <button 
              className="absolute top-4 left-4 text-white focus:outline-none" 
              onClick={() => navigator.clipboard.writeText(text)}
              title="Paste from clipboard"
            >
              <FaClipboard className="h-[24px] w-[24px]" />
            </button>
            <textarea
              className="absolute inset-0 p-8 pt-6 bg-transparent text-lg sm:text-xl rounded-2xl outline-none resize-none h-full overflow-y-auto text-white caret-white"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <style>{`textarea::-webkit-scrollbar { display: none; }`}</style>
          </div>

          {/* Separator */}
          <div className="text-white text-center my-6 text-lg font-semibold">or</div>

          {/* File Upload Section */}
          <div className="w-full max-w-2xl mx-auto bg-[#45454533] backdrop-blur-sm rounded-2xl text-center px-6 py-6 mb-6 border border-[#ffffff20]">
            <img className="mx-auto mb-4" height={32} width={32} src={cloud} alt="cloud" />
            <p className="text-white text-lg font-medium">Choose a file (PDF, MP3 supported)</p>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
            <button
              className="bg-[#45454599] hover:bg-[#5a5a5a99] my-4 text-lg rounded-2xl text-white border border-[#ffffff20] px-6 py-3 transition-colors duration-300"
              onClick={handleClick}
            >
              Browse File
            </button>

            <input
              type="text"
              placeholder="Enter Google Doc URL"
              className="bg-transparent border border-[#ffffff20] text-white text-lg sm:text-xl rounded-2xl px-4 py-3 w-full sm:w-2/3 outline-none focus:border-[#7600F2] transition-colors"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
            />
          </div>

          {/* Controls Section */}
          <div className="bg-[#45454533] backdrop-blur-sm rounded-2xl p-6 mb-6 border border-[#ffffff20]">
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 items-center">
              {/* Question Count */}
              <div className="flex gap-2 items-center">
                <div className="text-white text-lg sm:text-xl font-bold">No. of Questions:</div>
                <button onClick={decrementQuestions} className="rounded-lg border-2 border-[#ffffff20] text-white text-xl px-3 hover:border-[#7600F2] transition-colors">-</button>
                <span className="text-white text-2xl font-bold">{numQuestions}</span>
                <button onClick={incrementQuestions} className="rounded-lg border-2 border-[#ffffff20] text-white text-xl px-3 hover:border-[#7600F2] transition-colors">+</button>
              </div>

              {/* Difficulty Dropdown */}
              <div className="text-center">
                <select
                  value={difficulty}
                  onChange={handleDifficultyChange}
                  className="bg-[#45454599] text-white text-lg rounded-xl p-3 outline-none border border-[#ffffff20] focus:border-[#7600F2] transition-colors"
                >
                  <option value="Easy Difficulty">Easy Difficulty</option>
                  <option value="Hard Difficulty">Hard Difficulty</option>
                </select>
              </div>

              {/* Wikipedia Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-white text-lg sm:text-xl font-bold">Use Wikipedia:</span>
                <Switch
                  onChange={toggleSwitch}
                  checked={isToggleOn === 1}
                  onColor="#008080"
                  offColor="#3e5063"
                  checkedIcon={false}
                  uncheckedIcon={false}
                />
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 pb-10">
            <Link to="/question-type">
              <button className="w-full sm:w-auto flex justify-center items-center gap-3 text-lg text-white px-6 py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] rounded-lg hover:opacity-90 transition-all duration-300">Back</button>
            </Link>
            <button
              onClick={handleSaveToLocalStorage}
              className="w-full sm:w-auto flex justify-center items-center gap-3 text-lg text-white px-6 py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] rounded-lg hover:opacity-90 transition-all duration-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

  );
};

export default Text_Input;
