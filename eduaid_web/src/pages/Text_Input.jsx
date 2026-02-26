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
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);
  const [docUrl, setDocUrl] = useState("");
  const [isToggleOn, setIsToggleOn] = useState(0);

  const toggleSwitch = () => {
    setIsToggleOn((prev) => (prev + 1) % 2);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await apiClient.postFormData("/upload", formData);
      setText(data.content || data.error);
    } catch (error) {
      console.error("Error uploading file:", error);
      setErrorMessage("File upload failed.");
    }
  };

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    fileInputRef.current.click();
  };

  const handleSaveToLocalStorage = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      if (docUrl) {
        const data = await apiClient.post("/get_content", {
          document_url: docUrl,
        });

        setDocUrl("");
        setText(data || "Error retrieving content");
        setLoading(false);
        return;
      }

      if (!text) {
        setErrorMessage("Please enter text before proceeding.");
        setLoading(false);
        return;
      }

      localStorage.setItem("textContent", text);
      localStorage.setItem("difficulty", difficulty);
      localStorage.setItem("numQuestions", numQuestions);

      await sendToBackend(
        text,
        difficulty,
        localStorage.getItem("selectedQuestionType")
      );
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Backend unavailable or request timed out.");
      setLoading(false);
    }
  };

  const getEndpoint = (difficulty, questionType) => {
    if (difficulty !== "Easy Difficulty") {
      if (questionType === "get_shortq") return "get_shortq_hard";
      if (questionType === "get_mcq") return "get_mcq_hard";
    }
    return questionType;
  };

  const sendToBackend = async (data, difficulty, questionType) => {
    try {
      const endpoint = getEndpoint(difficulty, questionType);

      const requestData = {
        input_text: data,
        max_questions: numQuestions,
        use_mediawiki: isToggleOn,
      };

      const responseData = await apiClient.post(
        `/${endpoint}`,
        requestData
      );

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

      localStorage.setItem(
        "last5Quizzes",
        JSON.stringify(last5Quizzes)
      );

      navigate("/output");
    } catch (error) {
      console.error("Backend error:", error);
      setErrorMessage("Backend unavailable or request timed out.");
    } finally {
      setLoading(false);   // 🔥 CRITICAL FIX
    }
  };

  return (
    <div className="popup bg-[#02000F] bg-custom-gradient min-h-screen">
      
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-black">
          <div className="loader border-4 border-t-4 border-white rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}

      <div className={`w-full h-full bg-cust bg-opacity-50 ${loading ? "pointer-events-none" : ""}`}>

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

        {/* Error Message */}
        {errorMessage && (
          <div className="text-red-500 text-center text-lg mt-4">
            {errorMessage}
          </div>
        )}

        {/* Main Controls */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-6 pb-10 px-4 sm:px-8">
          <Link to="/question-type">
            <button className="bg-black text-white text-lg sm:text-xl px-4 py-2 border-gradient rounded-xl w-full sm:w-auto">
              Back
            </button>
          </Link>

          <button
            onClick={handleSaveToLocalStorage}
            className="bg-black text-white text-lg sm:text-xl px-4 py-2 border-gradient flex justify-center items-center rounded-xl w-full sm:w-auto"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Text_Input;