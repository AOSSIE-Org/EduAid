import { useState, useRef } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png";
import stars from "../assets/stars.png";
import cloud from "../assets/cloud.png";
import { FaClipboard } from "react-icons/fa";
import Switch from "react-switch";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { ToastContainer, Bounce, toast } from "react-toastify";
import { handleToastNotifs } from "../helpers";

const Text_Input = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState("Easy Difficulty");
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [docUrl, setDocUrl] = useState("");
  const [isToggleOn, setIsToggleOn] = useState(0);

  const reset = () => {
    setLoading(false);
    setDocUrl("");
  };

  const toggleSwitch = () => {
    setIsToggleOn((isToggleOn + 1) % 2);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const data = await apiClient.postFormData("/upload", formData);
      setText(data.content);
    }
  };

  const handleClick = (event) => {
    event.preventDefault(); // Prevent default behavior
    event.stopPropagation(); // Stop event propagation
    // Open file input dialog
    fileInputRef.current.click();
  };

  const handleGoogleDoc = async () => {
    const data = await apiClient.post("/get_content", {
      document_url: docUrl,
    });
    setText(data);
  };

  const handleSaveToLocalStorage = async () => {
    setLoading(true);
    if (docUrl) {
      await handleToastNotifs(handleGoogleDoc(), reset, {
        pending: "Fetching content from Google Doc...",
        success: "Content fetched successfully!",
        error: "Error fetching content. Please check the URL and try again.",
      });
    } else if (text) {
      // Proceed with existing functionality for local storage
      let success = false;
      localStorage.setItem("textContent", text);
      localStorage.setItem("difficulty", difficulty);
      localStorage.setItem("numQuestions", numQuestions);

      await handleToastNotifs(
        sendToBackend(
          text,
          difficulty,
          localStorage.getItem("selectedQuestionType"),
        ).then(() => {
          success = true;
        }),
        reset,
        {
          pending: "Generating quiz...",
          success:
            "Quiz generated successfully! Taking you to the output page...",
          error: "Error generating quiz. Please try again.",
        },
      );
      if (success) {
        setTimeout(() => {
          navigate("/output");
        }, 3000);
      }
    } else {
      setLoading(false);
      toast.error(
        "Please enter text or provide a valid file before proceeding.",
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

    let last5Quizzes = JSON.parse(localStorage.getItem("last5Quizzes")) || [];
    last5Quizzes.push(quizDetails);
    if (last5Quizzes.length > 5) {
      last5Quizzes.shift(); // Keep only the last 5 quizzes
    }
    localStorage.setItem("last5Quizzes", JSON.stringify(last5Quizzes));
  };

  return (
    <div className="popup bg-[#02000F] bg-custom-gradient min-h-screen">
      <div
        className={`w-full h-full bg-cust bg-opacity-50 ${loading ? "pointer-events-none" : ""}`}
      >
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          pauseOnHover
          theme="dark"
          transition={Bounce}
        />

        {/* Header */}
        <Link to="/" className="block">
          <div className="flex items-end gap-2 p-4">
            <img src={logo_trans} alt="logo" className="w-20 sm:w-24" />
            <div className="text-3xl sm:text-4xl font-extrabold">
              <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                Edu
              </span>
              <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                Aid
              </span>
            </div>
          </div>
        </Link>

        {/* Headline */}
        <div className="text-white text-center sm:text-right mx-4 sm:mx-8">
          <div className="text-xl sm:text-2xl font-bold">Enter the Content</div>
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 text-xl font-bold">
            to Generate{" "}
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Questionnaires
            </span>
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
          <style>{`textarea::-webkit-scrollbar { display: none; }`}</style>
        </div>

        {/* Separator */}
        <div className="text-white text-center my-4 text-lg">or</div>

        {/* File Upload Section */}
        <div className="w-full max-w-2xl mx-auto border-[3px] rounded-2xl text-center px-6 py-6 border-dotted border-[#3E5063] mt-6">
          <img
            className="mx-auto mb-2"
            height={32}
            width={32}
            src={cloud}
            alt="cloud"
          />
          <p className="text-white text-lg">
            Choose a file (PDF, MP3 supported)
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              setLoading(true);
              handleToastNotifs(handleFileUpload(e), reset, {
                pending: "Uploading file...",
                success: "File uploaded successfully!",
                error:
                  "Error uploading file. Please ensure it's a valid format (PDF, MP3) and try again.",
              });
            }}
            style={{ display: "none" }}
          />
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
          {/* Question Count */}
          <div className="flex gap-2 items-center">
            <div className="text-white text-lg sm:text-xl font-bold">
              No. of Questions:
            </div>
            <button
              onClick={decrementQuestions}
              className="rounded-lg border-2 border-[#6e8a9f] text-white text-xl px-3"
            >
              -
            </button>
            <span className="text-white text-2xl">{numQuestions}</span>
            <button
              onClick={incrementQuestions}
              className="rounded-lg border-2 border-[#6e8a9f] text-white text-xl px-3"
            >
              +
            </button>
          </div>

          {/* Difficulty Dropdown */}
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

          {/* Wikipedia Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-white text-lg sm:text-xl font-bold">
              Use Wikipedia:
            </span>
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
