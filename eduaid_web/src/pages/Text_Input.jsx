import React, { useState, useRef } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png";
import stars from "../assets/stars.png";
import cloud from "../assets/cloud.png";
import { FaClipboard } from "react-icons/fa";
import { MdClose } from "react-icons/md"; 
import Switch from "react-switch";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { useQuizHistory } from "../hooks/useQuizHistory";

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  i = Math.max(0, Math.min(i, sizes.length - 1)); 
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Text_Input = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState("Easy Difficulty");
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [docUrl, setDocUrl] = useState("");
  const [isToggleOn, setIsToggleOn] = useState(0);
  
  const [rawFileSize, setRawFileSize] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("");

  const { addQuiz } = useQuizHistory();

  const toggleSwitch = () => {
    setIsToggleOn((isToggleOn + 1) % 2);
  };

  const handleRemoveFile = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFileName("");
    setRawFileSize(0); 
    setUploadError(""); 
    setText("");
    setUploadProgress(0); 
    setUploadSpeed(""); 
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = new Set(['application/pdf', 'audio/mpeg']);
      const genericTypes = new Set(['', 'application/octet-stream']);
      const hasAllowedExtension = /\.(pdf|mp3)$/i.test(file.name || "");

      const isValid = allowedTypes.has(file.type) || (genericTypes.has(file.type) && hasAllowedExtension);

      if (!isValid) {
        setUploadError("Unsupported file type or MIME mismatch. Please select a valid PDF or MP3 file.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const MAX_FILE_SIZE = 10 * 1024 * 1024; 
      if (file.size > MAX_FILE_SIZE) {
        setUploadError("File is too large. Please select a file under 10MB.");
        setFileName("");
        setRawFileSize(0);
        setUploadProgress(0);
        setUploadSpeed("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setDocUrl(""); 
      setFileName(file.name);
      setRawFileSize(file.size);
      setIsUploading(true);
      setUploadError("");
      setText("");
      setUploadProgress(0);
      setUploadSpeed("Calculating...");

      const startTime = Date.now();
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${process.env.REACT_APP_API_URL || ""}/upload_endpoint`);
      
      xhr.timeout = 30000; 
      xhr.ontimeout = () => {
        setUploadError("Upload timed out. Please try again.");
        setIsUploading(false);
        setUploadProgress(0);
        setUploadSpeed("");
        xhr.abort();
      };
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const percentCompleted = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(percentCompleted);

          const timeElapsed = (Date.now() - startTime) / 1000; 
          if (timeElapsed > 0) {
            const uploadSpeedBytes = event.loaded / timeElapsed;
            setUploadSpeed(`${formatBytes(uploadSpeedBytes)}/s`);
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.extractedText && response.extractedText.trim()) {
              setText(response.extractedText);
              setUploadProgress(100);
              setUploadSpeed("Completed");
            } else {
              setUploadError("No text extracted. Try another file.");
              setUploadProgress(0);
            }
          } catch (e) {
            setUploadError("Invalid response from server.");
            setUploadProgress(0);
          }
        } else {
          setUploadError("Server error. File upload failed.");
          setUploadProgress(0);
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        setUploadError("Network error. Is the backend running?");
        setUploadProgress(0);
        setUploadSpeed("");
        setIsUploading(false);
      };

      xhr.send(formData);
    }
  };

  const handleClick = (event) => {
    event.preventDefault(); 
    event.stopPropagation(); 
    fileInputRef.current.click();
  };

  const handleSaveToLocalStorage = async () => {
    if (fileName && docUrl) {
      setUploadError("Please use either file upload or Google Doc URL.");
      return;
    }

    setLoading(true);
    if (docUrl) {
      try {
        const data = await apiClient.post("/get_content", { document_url: docUrl });
        setDocUrl("");
        setText(data || "Error in retrieving");
      } catch (error) {
        setUploadError("Failed to fetch Google Doc content.");
      } finally {
        setLoading(false);
      }
    } else if (text && text.trim()) {
      localStorage.setItem("textContent", text);
      localStorage.setItem("difficulty", difficulty);
      localStorage.setItem("numQuestions", numQuestions);

      await sendToBackend(
        text,
        difficulty,
        localStorage.getItem("selectedQuestionType")
      );
    } else {
      setLoading(false);
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

      const quizDetails = {
        difficulty,
        numQuestions,
        date: new Date().toLocaleDateString(),
        qaPair: responseData,
      };

      addQuiz(quizDetails);

      navigate("/output");
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

      <div className={`w-full h-full bg-cust bg-opacity-50 ${loading ? "pointer-events-none" : ""}`}>
        <Link to="/" className="block">
          <div className="flex items-end gap-2 p-4">
            <img src={logo_trans} alt="logo" className="w-20 sm:w-24" />
            <div className="text-3xl sm:text-4xl font-extrabold">
              <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">Edu</span>
              <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">Aid</span>
            </div>
          </div>
        </Link>

        <div className="text-white text-center sm:text-right mx-4 sm:mx-8">
          <div className="text-xl sm:text-2xl font-bold">Enter the Content</div>
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 text-xl font-bold">
            to Generate{" "}
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">Questionaries</span>
            <img className="h-6 w-6" src={stars} alt="stars" />
          </div>
        </div>

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

        <div className="text-white text-center my-4 text-lg">or</div>

        <div className="w-full max-w-2xl mx-auto border-[3px] rounded-2xl text-center px-6 py-6 border-dotted border-[#3E5063] mt-6">
          <img className="mx-auto mb-2" height={32} width={32} src={cloud} alt="cloud" />
          
          {fileName ? (
            <div className="flex items-center justify-center gap-3 mb-2">
               <p className="text-[#00CBE7] text-lg font-bold">{fileName}</p>
               <button 
                 onClick={handleRemoveFile} 
                 className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
                 disabled={isUploading}
               >
                 <MdClose size={18} />
               </button>
            </div>
          ) : (
            <p className="text-white text-lg mb-2">Choose a file (PDF, MP3 supported)</p>
          )}

          {(isUploading || uploadProgress > 0) && (
            <div className="w-full max-w-md mx-auto my-4 flex flex-col">
              <div className="flex justify-between text-xs font-medium mb-2">
                <span className="text-gray-300">
                  {formatBytes((rawFileSize * uploadProgress) / 100)} / {formatBytes(rawFileSize)}
                </span>
                <span className="text-[#FF005C]">
                  {uploadProgress === 100 ? "Completed" : uploadSpeed}
                </span>
                <span className="text-[#00CBE7] font-bold">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${uploadError ? 'bg-red-500' : 'bg-gradient-to-r from-[#FF005C] to-[#7600F2]'}`}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadError && (
             <div className="text-red-500 font-bold bg-red-100 bg-opacity-20 p-2 rounded-lg my-2">{uploadError}</div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            disabled={isUploading} 
            accept=".pdf,.mp3,application/pdf,audio/mpeg"
          />
          <button
            className={`my-4 text-lg rounded-2xl text-white border px-6 py-2 ${isUploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#3e506380] border-[#cbd0dc80]'}`}
            onClick={handleClick}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Browse File'}
          </button>

          <input
            type="text"
            placeholder="Enter Google Doc URL"
            className="bg-transparent mt-4 border border-[#cbd0dc80] text-white text-lg sm:text-xl rounded-2xl px-4 py-2 w-full sm:w-2/3 outline-none"
            value={docUrl}
            onChange={(e) => {
              setDocUrl(e.target.value);
              if (e.target.value) handleRemoveFile(); 
            }}
            disabled={isUploading}
          />
        </div>

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

        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-6 pb-10 px-4 sm:px-8">
          <Link to="/question-type">
            <button className="bg-black text-white text-lg sm:text-xl px-4 py-2 border-gradient rounded-xl w-full sm:w-auto">Back</button>
          </Link>
          <button
            onClick={handleSaveToLocalStorage}
            disabled={isUploading}
            className={`text-lg sm:text-xl px-4 py-2 border-gradient flex justify-center items-center rounded-xl w-full sm:w-auto ${
              isUploading ? "bg-gray-800 text-gray-400 cursor-not-allowed" : "bg-black text-white"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Text_Input;