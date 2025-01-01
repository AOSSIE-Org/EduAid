import React, { useState } from "react"; 
import "../index.css";
import logo from "../assets/aossie_logo.png";

const Question_Type = () => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };

  const handleSaveToLocalStorage = () => {
    if (selectedOption) {
      localStorage.setItem("selectedQuestionType", selectedOption);
    }
  };

  return (
    <div className="popup w-screen h-screen bg-[#75d8f6b7] flex justify-center items-center">
      <div className="w-full h-full bg-[#90e0ef] bg-opacity-50 p-6 flex flex-col justify-center items-center">
      <a href="/" className="absolute top-0 left-0 ml-4 mt-4">
  <div className="flex px-3 py-0">
    <img
      src={logo}
      alt="logo"
      className="w-20 bg-white my-6 rounded-full"
    />
  </div>
</a>

        <div className="text-4xl text-[#03045e] font-extrabold text-center mb-4">
          What’s on your Mind?
        </div>

        <div className="text-xl text-[#03045e] font-medium text-center mb-6">
          Choose one
        </div>

        <div className="flex flex-col items-center gap-6">
          <div
            onClick={() => handleOptionClick("get_shortq")}
            className="flex items-center w-full max-w-lg cursor-pointer rounded-xl gap-6 px-6 py-6 bg-opacity-50 bg-[#202838] hover:bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
          >
            <div
              className={`w-10 h-10 rounded-full ${
                selectedOption === "get_shortq" ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]" : "bg-[#999C9D]"
              }`}
            ></div>
            <div className="text-white text-xl font-medium">Short-Answer Type Questions</div>
          </div>
          <div
            onClick={() => handleOptionClick("get_mcq")}
            className="flex items-center w-full max-w-lg cursor-pointer rounded-xl gap-6 px-6 py-6 bg-opacity-50 bg-[#202838] hover:bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
          >
            <div
              className={`w-10 h-10 rounded-full ${
                selectedOption === "get_mcq" ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]" : "bg-[#999C9D]"
              }`}
            ></div>
            <div className="text-white text-xl font-medium">Multiple Choice Questions</div>
          </div>
          <div
            onClick={() => handleOptionClick("get_boolq")}
            className="flex items-center w-full max-w-lg cursor-pointer rounded-xl gap-6 px-6 py-6 bg-opacity-50 bg-[#202838] hover:bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
          >
            <div
              className={`w-10 h-10 rounded-full ${
                selectedOption === "get_boolq" ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]" : "bg-[#999C9D]"
              }`}
            ></div>
            <div className="text-white text-xl font-medium">True/False Questions</div>
          </div>
          <div
            onClick={() => handleOptionClick("get_problems")}
            className="flex items-center w-full max-w-lg cursor-pointer rounded-xl gap-6 px-6 py-6 bg-opacity-50 bg-[#202838] hover:bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
          >
            <div
              className={`w-10 h-10 rounded-full ${
                selectedOption === "get_problems" ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]" : "bg-[#999C9D]"
              }`}
            ></div>
            <div className="text-white text-xl font-medium">All Questions</div>
          </div>
        </div>

        <div className="mt-10">
          {selectedOption ? (
            <a href="input">
              <button
                onClick={handleSaveToLocalStorage}
                className="rounded-2xl text-2xl text-white px-8 py-3 font-bold bg-gradient-to-r  from-[#405EED] to-[#01CBE7]"
              >
                Fire Up 🚀
              </button>
            </a>
          ) : (
            <button
              onClick={() => alert("Please select a question type.")}
              className="rounded-2xl text-2xl text-white px-8 py-3 font-bold bg-gray-500 cursor-not-allowed"
              disabled
            >
              Fire Up 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Question_Type;
