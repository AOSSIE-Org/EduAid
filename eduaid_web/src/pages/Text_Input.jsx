import React, { useState, useRef } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png";
import stars from "../assets/stars.png";
import cloud from "../assets/cloud.png";
import { FaClipboard } from "react-icons/fa";
import Switch from "react-switch";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";

const Text_Input = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState("Easy Difficulty");
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [docUrl, setDocUrl] = useState("");
  const [isToggleOn, setIsToggleOn] = useState(0);

  const toggleSwitch = () => {
    setIsToggleOn((prev) => (prev + 1) % 2);
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
        alert("Error uploading file.");
      }
    }
  };

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    fileInputRef.current.click();
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
      if (questionType === "get_shortq") return "get_shortq_hard";
      if (questionType === "get_mcq") return "get_mcq_hard";
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

      localStorage.setItem("lastQuizPayload", JSON.stringify(requestData));
      localStorage.setItem("selectedQuestionType", questionType);

      const response = await apiClient.post(`/${endpoint}`, requestData);

      const responseData = response.output || [];
      if (!responseData.length) {
        alert("No questions generated. Try longer text.");
        return;
      }

      const wrappedData = { output: responseData };
      localStorage.setItem("qaPairs", JSON.stringify(wrappedData));
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

      navigate("/output");
    } catch (error) {
      console.error("Error:", error);

      if (error.message?.includes("cancelled")) {
        alert("Request cancelled or timed out. Please try again.");
      } else {
        alert("Failed to generate questions. Please try again.");
      }

      throw error; // let outer function handle loading reset
    }
  };

  const handleSaveToLocalStorage = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const questionType =
        localStorage.getItem("selectedQuestionType") || "get_mcq";

      let inputText = text;

      // 🔹 If Google Doc URL is provided
      if (docUrl) {
        const data = await apiClient.post("/get_content", {
          document_url: docUrl,
        });

        inputText = data?.content || "";

        if (!inputText) {
          alert("Error retrieving Google Doc content");
          return;
        }

        setDocUrl("");
        setText(inputText);
      }

      if (!inputText) {
        alert("Please enter some text.");
        return;
      }

      // 🔹 Persist data
      localStorage.setItem("textContent", inputText);
      localStorage.setItem("difficulty", difficulty);
      localStorage.setItem("numQuestions", numQuestions);

      // 🔹 Generate quiz
      await sendToBackend(inputText, difficulty, questionType);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup bg-[#02000F] bg-custom-gradient min-h-screen">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-black">
          <div className="loader border-4 border-t-4 border-white rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}

      <div
        className={`w-full h-full bg-cust bg-opacity-50 ${
          loading ? "pointer-events-none" : ""
        }`}
      >
        {/* Header */}
        <Link to="/" className="block">
          <div className="flex items-end gap-2 p-4">
            <img src={logo_trans} alt="logo" className="w-20 sm:w-24" />
            <div className="text-3xl sm:text-4xl font-extrabold">
              <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">Edu</span>
              <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">Aid</span>
            </div>
          </div>
        </Link>

        {/* Headline */}
        <div className="text-white text-center sm:text-right mx-4 sm:mx-8">
          <div className="text-xl sm:text-2xl font-bold">Enter the Content</div>
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 text-xl font-bold">
            to Generate{" "}
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">Questionaries</span>
            <img className="h-6 w-6" src={stars} alt="stars" />
          </div>
        </div>

        {/* Textarea */}
        <div className="relative bg-[#83b6cc40] mx-4 sm:mx-8 rounded-2xl p-4 min-h-[160px] sm:min-h-[200px] mt-4">
          <button className="absolute top-0 left-0 p-2 text-white focus:outline-none">
            <FaClipboard className="h-[24px] w-[24px]" />
          </button>
          <textarea
            className="absolute inset-0 p-8 pt-6 bg-[#83b6cc40] text-lg sm:text-xl rounded-2xl outline-none resize-none h-full overflow-y-auto text-white caret-white"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* Separator */}
        <div className="text-white text-center my-4 text-lg">or</div>

        {/* File Upload Section */}
        <div className="w-full max-w-2xl mx-auto border-[3px] rounded-2xl text-center px-6 py-6 border-dotted border-[#3E5063] mt-6">
          <img className="mx-auto mb-2" height={32} width={32} src={cloud} alt="cloud" />
          <p className="text-white text-lg">Choose a file (PDF, MP3 supported)</p>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
          <button
            className="bg-[#3e506380] my-4 text-lg rounded-2xl text-white border border-[#cbd0dc80] px-6 py-2"
            onClick={handleClick}
          >
            Browse File
          </button>

          <input
            type="text"
            placeholder="Enter Google Doc URL"
            className="bg-transparent mt-4 border border-[#cbd0dc80] text-white text-lg sm:text-xl rounded-2xl px-4 py-2 w-full sm:w-2/3 outline-none"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
          />
        </div>

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 items-center mt-6 px-4 sm:px-8">
          <div className="flex gap-2 items-center">
            <div className="text-white text-lg sm:text-xl font-bold">No. of Questions:</div>
            <button onClick={decrementQuestions} className="rounded-lg border-2 border-[#6e8a9f] text-white text-xl px-3">-</button>
            <span className="text-white text-2xl">{numQuestions}</span>
            <button onClick={incrementQuestions} className="rounded-lg border-2 border-[#6e8a9f] text-white text-xl px-3">+</button>
          </div>

          <div className="text-center">
            <select
              value={difficulty}
              onChange={handleDifficultyChange}
              className="bg-[#3e5063] text-white text-lg rounded-xl p-2 outline-none"
            >
              <option value="Easy Difficulty">Easy Difficulty</option>
              <option value="Hard Difficulty">Hard Difficulty</option>
            </select>
          </div>

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

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-6 pb-10 px-4 sm:px-8">
          <Link to="/question-type">
            <button className="bg-black text-white text-lg sm:text-xl px-4 py-2 border-gradient rounded-xl w-full sm:w-auto">Back</button>
          </Link>

          <button
            onClick={handleSaveToLocalStorage}
            disabled={loading}
            className={`bg-black text-white text-lg sm:text-xl px-4 py-2 border-gradient flex justify-center items-center rounded-xl w-full sm:w-auto ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Generating..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Text_Input;