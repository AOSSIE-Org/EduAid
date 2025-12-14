import React, { useState } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png"
import { Link } from "react-router-dom";

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
    <div className="popup w-full min-h-screen bg-light-bg flex justify-center items-center ">
      <div className="w-full bg-custom-gradient shadow-lg p-6 sm:p-10 rounded-2xl">
        {/* Header */}
        <Link to="/" className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <img
            src={logo_trans}
            alt="logo"
            className="w-20 sm:w-24 object-contain"
          />
          <div className="text-4xl sm:text-5xl font-extrabold text-center sm:text-left">
            <span className="bg-gradient-to-r from-[#FF6B9D] to-[#9B7EDE] text-transparent bg-clip-text">
              Edu
            </span>
            <span className="bg-gradient-to-r from-[#9B7EDE] to-[#4ECDC4] text-transparent bg-clip-text">
              Aid
            </span>
          </div>
        </Link>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-gray-800 text-3xl sm:text-4xl font-extrabold">
            What's on your Mind?
          </h2>
          <p className="text-gray-600 text-lg sm:text-xl font-medium mt-2">
            Choose one
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col items-center mt-8 gap-4 w-full">
          {[
            { id: "get_shortq", label: "Short-Answer Type Questions" },
            { id: "get_mcq", label: "Multiple Choice Questions" },
            { id: "get_boolq", label: "True/False Questions" },
            { id: "get_problems", label: "All Questions" },
          ].map((option) => (
            <div
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              className={`w-full max-w-xl flex items-center gap-6 px-6 py-5 rounded-xl cursor-pointer bg-white hover:bg-gray-50 border-2 transition-all duration-200 shadow-md hover:shadow-lg ${
                selectedOption === option.id 
                  ? "ring-2 ring-[#4ECDC4] border-[#4ECDC4] shadow-lg" 
                  : "border-light-border"
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleOptionClick(option.id);
              }}
            >
              <div
                className={`w-10 h-10 rounded-full flex-shrink-0 transition-all ${
                  selectedOption === option.id
                    ? "bg-gradient-to-b from-[#9B7EDE] to-[#4ECDC4] shadow-md"
                    : "bg-gray-300"
                }`}
              ></div>
              <div className="text-gray-800 text-xl sm:text-2xl font-medium">
                {option.label}
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="text-center mt-10">
          {selectedOption ? (
            <Link to="/input">
              <button
                onClick={handleSaveToLocalStorage}
                className="rounded-2xl text-xl sm:text-2xl text-white px-6 sm:px-8 font-bold py-3 bg-gradient-to-r from-[#FF6B9D] via-[#9B7EDE] to-[#4ECDC4] hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Fire Up 🚀
              </button>
            </Link>
          ) : (
            <button
              onClick={() => alert("Please select a question type.")}
              className="rounded-2xl text-xl sm:text-2xl text-gray-400 px-6 sm:px-8 font-bold py-3 bg-gray-200 cursor-not-allowed"
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
