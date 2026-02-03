import React, { useState, useRef } from "react";
import "../index.css";
import Header from "../components/Header";
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
    <div className="w-full popup bg-[#02000F] bg-custom-gradient min-h-screen">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-black">
          <div className="loader border-4 border-t-4 border-white rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}
      <Header imgClass="w-20 sm:w-24" titleClass="text-3xl sm:text-4xl font-extrabold" linkClass="flex items-center gap-2 p-4" />

      <div className={`w-full h-full bg-cust bg-opacity-50 ${loading ? "pointer-events-none" : ""}`}>
        
        {/* Main Card */}
        <div className="max-w-4xl mx-auto p-6 sm:p-10 mt-6 bg-[#07121A] bg-opacity-70 rounded-3xl shadow-xl border border-[#22303a]">
          {/* Headline */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-white text-2xl sm:text-3xl font-extrabold">Generate Questions</h2>
              <p className="text-[#cbd0dc] mt-1">Paste text, upload a file, or provide a Google Doc URL to generate professional quizzes.</p>
            </div>
            <div className="flex items-center gap-3">
              <img src={stars} alt="stars" className="h-6 w-6" />
              <div className="text-sm text-[#a8cbd3]">Trusted by learners</div>
            </div>
          </div>

          {/* Textarea */}
          <label htmlFor="contentInput" className="block text-sm font-semibold text-[#9fb7bf] mb-2">Paste or type content</label>
          <textarea
            id="contentInput"
            aria-label="Content to generate questions"
            placeholder="Paste article text, lecture notes, or any content here..."
            className="w-full bg-[#0b2730] text-white rounded-2xl p-5 min-h-[180px] sm:min-h-[260px] resize-y outline-none focus:ring-2 focus:ring-[#00CBE7] placeholder-[#7f9aa2]"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex items-center justify-center my-6">
            <div className="h-px bg-[#2a3a42] w-1/6" />
            <span className="mx-4 text-[#8ea9b0] font-semibold">OR</span>
            <div className="h-px bg-[#2a3a42] w-1/6" />
          </div>

          {/* Upload / Google Doc */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="border-2 border-dashed border-[#2e4650] rounded-2xl p-6 text-center bg-[#071d24]">
              <img className="mx-auto mb-3" height={36} width={36} src={cloud} alt="cloud" />
              <p className="text-[#cbd0dc] font-medium mb-3">Upload a file (PDF, MP3, TXT)</p>
              <p className="text-sm text-[#92a9b0] mb-4">We support common document and audio formats.</p>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
              <button onClick={handleClick} className="bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] text-white px-5 py-2 rounded-xl font-semibold shadow-md hover:brightness-105 transition">Choose file</button>
            </div>

            <div className="flex flex-col gap-3">
              <label htmlFor="docUrl" className="text-sm font-semibold text-[#9fb7bf]">Google Doc URL</label>
              <input
                id="docUrl"
                type="text"
                placeholder="https://docs.google.com/document/d/...."
                className="w-full bg-[#0b2730] text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#00CBE7] placeholder-[#7f9aa2]"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
              />
              <div className="text-xs text-[#7f9aa2]">Paste a publicly shared Google Doc URL and we will fetch its content.</div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-3">
              <div className="text-[#cbd0dc] font-semibold">No. of Questions</div>
              <div className="inline-flex items-center bg-[#081f26] rounded-full px-2 py-1 gap-2">
                <button onClick={decrementQuestions} className="px-3 py-1 rounded-full bg-transparent text-white border border-[#2f4a55]">-</button>
                <div className="px-3 text-white font-bold">{numQuestions}</div>
                <button onClick={incrementQuestions} className="px-3 py-1 rounded-full bg-transparent text-white border border-[#2f4a55]">+</button>
              </div>
            </div>

            <div>
              <div className="text-[#cbd0dc] font-semibold mb-1">Difficulty</div>
              <select value={difficulty} onChange={handleDifficultyChange} className="bg-[#0b2730] text-white rounded-xl p-2 outline-none w-full md:w-40 focus:ring-2 focus:ring-[#00CBE7]">
                <option value="Easy Difficulty">Easy</option>
                <option value="Hard Difficulty">Hard</option>
              </select>
            </div>

            <div className="flex items-center justify-start md:justify-end gap-3">
              <div className="text-[#cbd0dc] font-semibold">Use Wikipedia</div>
              <Switch onChange={toggleSwitch} checked={isToggleOn === 1} onColor="#008080" offColor="#3e5063" checkedIcon={false} uncheckedIcon={false} />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            <div className="w-full sm:w-auto">
              <Link to="/question-type">
                <button className="w-full sm:w-auto px-6 py-2 rounded-xl border border-[#2f4a55] text-[#a8cbd3] bg-transparent">Back</button>
              </Link>
            </div>

            <div className="w-full sm:w-auto">
              <button onClick={handleSaveToLocalStorage} className="w-full sm:w-auto px-6 py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] shadow-lg hover:brightness-105 transition">Generate Questions</button>
            </div>
          </div>

          <div className="text-xs text-[#7f9aa2] mt-4">We respect your privacy — uploaded files are processed securely and not stored after processing.</div>
        </div>

        </div>
      </div>
    
  );
};

export default Text_Input;
