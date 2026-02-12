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
    <div className="popup w-screen h-screen bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient p-6">
        <Link href="/">
          <div className="flex items-end gap-4">
            <img src="aossie_transparent.png" alt="logo" className="w-24 my-4 block" />
            <div className="text-5xl mb-5 font-extrabold">
              <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                Edu
              </span>
              <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                Aid
              </span>
            </div>
          </div>
        </Link>
        <div className="text-4xl  text-white text-center font-extrabold">
          What’s on your Mind?
        </div>
        <div className="mt-2 text-white text-xl text-center font-medium">
          Choose one
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
              className={`w-full max-w-xl flex items-center gap-6 px-6 py-5 rounded-xl cursor-pointer bg-[#202838] bg-opacity-50 hover:bg-opacity-70 transition-all duration-200 ${
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
        <div className="text-center mt-10">
          {selectedOption ? (
            <Link to="/input">
              <button
                onClick={handleSaveToLocalStorage}
                className="rounded-2xl text-xl sm:text-2xl text-white px-6 sm:px-8 font-bold py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] hover:brightness-110 transition-all"
              >
                Fire Up 🚀
              </button>
            </Link>
          ) : (
            <button
              onClick={() => alert("Please select a question type.")}
              className="rounded-2xl text-xl sm:text-2xl text-white px-6 sm:px-8 font-bold py-3 bg-gray-500 cursor-not-allowed"
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
