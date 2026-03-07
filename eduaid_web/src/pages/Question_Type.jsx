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
    <div className="popup grid-bg w-screen min-h-screen flex justify-center items-center">
      <div className="w-full h-full overflow-auto px-4 py-6 sm:px-8 md:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <Link to="/" className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            <img
              src={logo_trans}
              alt="logo"
              className="w-20 sm:w-24 object-contain"
            />
            <div className="text-4xl sm:text-5xl font-extrabold text-center sm:text-left">
              <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                Edu
              </span>
              <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                Aid
              </span>
            </div>
          </Link>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-white text-3xl sm:text-4xl font-extrabold">
              What's on your Mind?
            </h2>
            <p className="text-white text-lg sm:text-xl font-medium mt-2">
              Choose one
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-col items-center mb-8 gap-4 w-full">
            {[
              { id: "get_shortq", label: "Short-Answer Type Questions" },
              { id: "get_mcq", label: "Multiple Choice Questions" },
              { id: "get_boolq", label: "True/False Questions" },
              { id: "get_problems", label: "All Questions" },
            ].map((option) => (
              <div
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                className={`w-full max-w-xl flex items-center gap-6 px-6 py-5 rounded-xl cursor-pointer bg-[#45454533] backdrop-blur-sm border border-[#ffffff20] hover:bg-[#5a5a5a99] transition-all duration-300 ${
                  selectedOption === option.id ? "ring-2 ring-[#00CBE7]" : ""
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleOptionClick(option.id);
                }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex-shrink-0 ${
                    selectedOption === option.id
                      ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
                      : "bg-[#999C9D]"
                  }`}
                ></div>
                <div className="text-white text-xl sm:text-2xl font-medium">
                  {option.label}
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          
        </div>
        <div className="text-center pb-10">
            {selectedOption ? (
              <Link to="/input" className="inline-block">
                <button
                  onClick={handleSaveToLocalStorage}
                  className="w-full sm:w-auto flex justify-center items-center gap-3 text-lg text-white px-6 py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] rounded-lg hover:opacity-90 transition-all duration-300"
                >
                  Fire Up 🚀
                </button>
              </Link>
            ) : (
              <Link to="/input" className="inline-block">
              <button
                onClick={() => alert("Please select a question type.")}
                className="w-full sm:w-auto flex justify-center items-center gap-3 text-lg text-white px-6 py-3 bg-gray-500 cursor-not-allowed rounded-lg"
                disabled
              >
                Fire Up 🚀
              </button>
              </Link>
            )}
          </div>
      </div>
      
    </div>
  );
};

export default Question_Type;
