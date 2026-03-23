import React, { useState, useRef } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png"
import stars from "../assets/stars.png";
import cloud from "../assets/cloud.png";
import { FaClipboard } from "react-icons/fa";
import Switch from "react-switch";
import { Link,useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import ErrorToast from "../components/ErrorToast";

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
  const [error, setError] = useState(null);

  // Allowed file types and size limits
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'audio/mpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const toggleSwitch = () => {
    setIsToggleOn((isToggleOn + 1) % 2);
  };

  const validateFile = (file) => {
    if (!file) {
      setError("Please select a file to upload");
      return false;
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("Unsupported file type. Please upload PDF, DOCX, TXT, or MP3 files only.");
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 10MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      return false;
    }

    return true;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];

    if (!validateFile(file)) {
      // Clear the file input
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const data = await apiClient.postFormData("/upload", formData);

      if (data.error) {
        setError(data.error);
      } else if (data.content) {
        setText(data.content);
        setError(null);
      } else {
        setError("Failed to extract content from file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Error uploading file. Please try again.");
    } finally {
      setLoading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    fileInputRef.current.click();
  };

  const validateInput = () => {
    // Check if any input method has content
    const hasTextInput = text.trim().length > 0;
    const hasGoogleDocsUrl = docUrl.trim().length > 0;

    if (!hasTextInput && !hasGoogleDocsUrl) {
      setError("Please provide input text, upload a file, or enter a Google Docs URL before proceeding.");
      return false;
    }

    // Validate text length if provided
    if (hasTextInput && text.trim().length < 10) {
      setError("Input text must be at least 10 characters long.");
      return false;
    }

    return true;
  };

  const handleSaveToLocalStorage = async () => {
    // Validate input before proceeding
    if (!validateInput()) {
      return;
    }

    setLoading(true);

    // Check if a Google Doc URL is provided
    if (docUrl) {
      try {
        const data = await apiClient.post("/get_content", { document_url: docUrl });

        if (data && typeof data === 'string' && data.length > 0) {
          setDocUrl("");
          setText(data);
          setError(null);
        } else {
          setError("Failed to retrieve Google Doc content. Please check the URL and try again.");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error:", error);
        setError("Error retrieving Google Doc content. Please verify the URL is correct and the document is publicly accessible.");
        setLoading(false);
        return;
      }
    }

    if (text) {
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
      setError("Failed to generate questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup bg-[#02000F] bg-custom-gradient min-h-screen">
      {/* Error Toast Notification */}
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}

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
          <button className="absolute top-0 left-0 p-2 text-white focus:outline-none" aria-label="Paste from clipboard">
            <FaClipboard className="h-[24px] w-[24px]" />
          </button>
          <textarea
            className="absolute inset-0 p-8 pt-6 bg-[#83b6cc40] text-lg sm:text-xl rounded-2xl outline-none resize-none h-full overflow-y-auto text-white caret-white"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            placeholder="Enter your text content here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Text input for quiz content"
          />
          <style>{`textarea::-webkit-scrollbar { display: none; }`}</style>
        </div>

        {/* Separator */}
        <div className="text-white text-center my-4 text-lg">or</div>

        {/* File Upload Section */}
        <div className="w-full max-w-2xl mx-auto border-[3px] rounded-2xl text-center px-6 py-6 border-dotted border-[#3E5063] mt-6">
          <img className="mx-auto mb-2" height={32} width={32} src={cloud} alt="cloud" />
          <p className="text-white text-lg">Choose a file (PDF, DOCX, TXT, MP3 supported)</p>
          <p className="text-gray-400 text-sm mt-1">Maximum file size: 10MB</p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt,.mp3"
            style={{ display: "none" }}
            aria-label="File upload input"
          />
          <button
            className="bg-[#3e506380] my-4 text-lg rounded-2xl text-white border border-[#cbd0dc80] px-6 py-2 hover:bg-[#3e5063a0] transition-colors"
            onClick={handleClick}
          >
            Browse File
          </button>

          <input
            type="text"
            placeholder="Enter Google Doc URL"
            className="bg-transparent mt-4 border border-[#cbd0dc80] text-white text-lg sm:text-xl rounded-2xl px-4 py-2 w-full sm:w-2/3 outline-none focus:border-[#00CBE7] transition-colors"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
            aria-label="Google Docs URL input"
          />
        </div>

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 items-center mt-6 px-4 sm:px-8">
          {/* Question Count */}
          <div className="flex gap-2 items-center">
            <div className="text-white text-lg sm:text-xl font-bold">No. of Questions:</div>
            <button onClick={decrementQuestions} className="rounded-lg border-2 border-[#6e8a9f] text-white text-xl px-3 hover:bg-[#6e8a9f] transition-colors" aria-label="Decrease question count">-</button>
            <span className="text-white text-2xl">{numQuestions}</span>
            <button onClick={incrementQuestions} className="rounded-lg border-2 border-[#6e8a9f] text-white text-xl px-3 hover:bg-[#6e8a9f] transition-colors" aria-label="Increase question count">+</button>
          </div>

          {/* Difficulty Dropdown */}
          <div className="text-center">
            <select
              value={difficulty}
              onChange={handleDifficultyChange}
              className="bg-[#3e5063] text-white text-lg rounded-xl p-2 outline-none cursor-pointer"
              aria-label="Difficulty level selector"
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
              aria-label="Toggle Wikipedia integration"
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-6 pb-10 px-4 sm:px-8">
          <Link to="/question-type">
            <button className="bg-black text-white text-lg sm:text-xl px-4 py-2 border-gradient rounded-xl w-full sm:w-auto hover:opacity-80 transition-opacity">Back</button>
          </Link>
          <button
            onClick={handleSaveToLocalStorage}
            className="bg-black text-white text-lg sm:text-xl px-4 py-2 border-gradient flex justify-center items-center rounded-xl w-full sm:w-auto hover:opacity-80 transition-opacity"
          >
            Next
          </button>
        </div>
      </div>
    </div>

  );
};

export default Text_Input;
