import React, { useState } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png";
import { div, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
const Question_Type = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const navigate = useNavigate();
  const handleOptionClick = (option) => {
    setSelectedOption(option);
    handleSaveToLocalStorage();
  };

  const handleSaveToLocalStorage = () => {
    if (selectedOption) {
      localStorage.setItem("selectedQuestionType", selectedOption);
      if(selectedOption === "dynamic_form"){
        navigate("/google-form");
        return;
      }else{
        navigate("/input");
      }
    }
  };

  return (
    <div className="popup w-full min-h-screen bg-[#02000F] flex justify-center items-center ">
      <div className="w-full bg-cust bg-opacity-50 bg-custom-gradient shadow-lg p-6 sm:p-10">
        {/* Header */}
        <Link
          to="/"
          className="flex flex-col sm:flex-row items-center gap-4 mb-6"
        >
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
        <div className="text-center">
          <h2 className="text-white text-3xl sm:text-4xl font-extrabold">
            What’s on your Mind?
          </h2>
          <p className="text-white text-lg sm:text-xl font-medium mt-2">
            Choose one
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col items-center mt-8 gap-4 w-full">
          {[
            { id: "get_shortq", label: "Short-Answer Type Questions" },
            { id: "get_mcq", label: "Multiple Choice Questions" },
            { id: "get_boolq", label: "True/False Questions" },
            { id: "dynamic_form", label: "Dynamic Google Form" }, // <-- new button
            { id: "get_problems", label: "All Questions" },
          ].map((option) => (
            <div
              key={option.id}
              onClick={() => {
                    handleOptionClick(option.id);

              }}
              className={`w-full max-w-xl flex items-center gap-6 px-6 py-5 rounded-xl cursor-pointer bg-[#202838] bg-opacity-50 hover:bg-opacity-70 transition-all duration-200 ${
                selectedOption === option.id ? "ring-2 ring-[#00CBE7]" : ""
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                    console.log("Wev")
                    handleOptionClick(option.id);
                }
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
            <div >
              <button
                onClick={handleSaveToLocalStorage}
                className="rounded-2xl text-xl sm:text-2xl text-white px-6 sm:px-8 font-bold py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] hover:brightness-110 transition-all"
              >
                Fire Up 🚀
              </button>
            </div>
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
