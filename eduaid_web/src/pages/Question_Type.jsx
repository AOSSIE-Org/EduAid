import React, { useState } from "react";
import "../index.css";
import logo from "../assets/aossie_logo.png";

const Question_Type = () => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionClick = (option) => {
    if (selectedOption === option) {
      setSelectedOption(null);
    } else {
      setSelectedOption(option);
    }
  };

  const handleSaveToLocalStorage = () => {
    if (selectedOption) {
      localStorage.setItem("selectedQuestionType", selectedOption);
    }
  };

  return (
    <div className="popup w-screen h-screen bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-opacity-50 bg-gradient-to-r from-yellow-500 to-green-500 p-6">
        <a href="/">
          <div className="flex items-center space-x-4">
            <div className="flex items-end gap-4">
              <img src={logo} alt="logo" className="w-24 my-6 block" />
            </div>
            <div className="absolute top-10 right-9 mt-6 mr-6 text-5xl font-extrabold">
              <span className="text-white text-transparent bg-clip-text">
                EduAid
              </span>
            </div>
          </div>
        </a>
        <div className="text-4xl text-white text-center font-extrabold">
          What’s on your Mind?
        </div>
        <div className="mt-2 text-white text-xl text-center font-medium">
          Choose one
        </div>
        <div className="flex flex-col items-center mt-3">
          <div
            onClick={() => handleOptionClick("get_shortq")}
            className="flex my-3 items-center w-full max-w-lg cursor-pointer rounded-xl gap-6 px-6 py-4 bg-opacity-60 bg-gradient-to-r from-green-400 to-yellow-400 hover:from-yellow-500 hover:to-green-500 transform hover:scale-105 transition-all duration-300"
          >
            <div
              className={`w-10 h-10 rounded-full ${
                selectedOption === "get_shortq"
                  ? "bg-gradient-to-b  from-orange-300 to-yellow-300"
                  : "bg-[#999C9D]"
              }`}
            ></div>
            <div className="text-white text-2xl font-medium">
              Short-Answer Type Questions
            </div>
          </div>
          <div
            onClick={() => handleOptionClick("get_mcq")}
            className="flex my-3 items-center w-full max-w-lg cursor-pointer rounded-xl gap-6 px-6 py-4 bg-opacity-60 bg-gradient-to-r from-green-400 to-yellow-400 hover:from-yellow-500 hover:to-green-500 transform hover:scale-105 transition-all duration-300"
          >
            <div
              className={`w-10 h-10 rounded-full ${
                selectedOption === "get_mcq"
                  ? "bg-gradient-to-b  from-orange-300 to-yellow-300"
                  : "bg-[#999C9D]"
              }`}
            ></div>
            <div className="text-white text-2xl font-medium">
              Multiple Choice Questions
            </div>
          </div>
          <div
            onClick={() => handleOptionClick("get_boolq")}
            className="flex my-3 items-center w-full max-w-lg cursor-pointer rounded-xl gap-6 px-6 py-4 bg-opacity-60 bg-gradient-to-r from-green-400 to-yellow-400 hover:from-yellow-500 hover:to-green-500 transform hover:scale-105 transition-all duration-300"
          >
            <div
              className={`w-10 h-10 rounded-full ${
                selectedOption === "get_boolq"
                  ? "bg-gradient-to-b  from-orange-300 to-yellow-300"
                  : "bg-[#999C9D]"
              }`}
            ></div>
            <div className="text-white text-2xl font-medium">
              True/False Questions
            </div>
          </div>
          <div
            onClick={() => handleOptionClick("get_problems")}
            className="flex my-3 items-center w-full max-w-lg cursor-pointer rounded-xl gap-6 px-6 py-4 bg-opacity-60 bg-gradient-to-r from-green-400 to-yellow-400 hover:from-yellow-500 hover:to-green-500 transform hover:scale-105 transition-all duration-300"
          >
            <div
              className={`w-10 h-10 rounded-full ${
                selectedOption === "get_problems"
                  ? "bg-gradient-to-b from-orange-300 to-yellow-300"
                  : "bg-[#999C9D]"
              }`}
            ></div>
            <div className="text-white text-2xl font-medium">All Questions</div>
          </div>
        </div>
        <div className="mx-auto text-center mt-5">
          {selectedOption ? (
            <a href="input">
              <button
                onClick={handleSaveToLocalStorage}
                className="rounded-2xl text-2xl text-white w-fit px-8 font-bold py-3 bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-600 hover:to-yellow-600 active:from-orange-800 active:to-yellow-800 transform hover:scale-110 hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300"
              >
                Fire Up{"  "}🚀
              </button>
            </a>
          ) : (
            <button
              onClick={() => alert("Please select a question type.")}
              className="rounded-2xl text-2xl text-white w-fit px-8 font-bold py-3 bg-gray-500 cursor-not-allowed"
              disabled
            >
              Fire Up{"  "}🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Question_Type;
