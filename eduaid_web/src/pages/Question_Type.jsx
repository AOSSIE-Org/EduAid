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
    <div className="popup w-screen h-full bg-[#02000F] flex justify-center items-center">
  <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient p-4 sm:p-6">
    <a href="/">
      <div className="flex flex-col sm:flex-row text-center items-center gap-4">
        <img src={logo} alt="logo" className="w-20 my-6 block" />
        <div className="text-3xl sm:text-4xl font-extrabold">
          <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
            Edu
          </span>
          <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
            Aid
          </span>
        </div>
      </div>
    </a>
    <div className="text-3xl sm:text-4xl -mt-18 mb-10 text-white text-center font-extrabold">
      What’s on your Mind?
    </div>
    <div className="mt-2 text-white text-lg sm:text-xl mb-5 text-center font-medium">
      Choose one
    </div>
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 mb-8">
      <div
        onClick={() => handleOptionClick("get_shortq")}
        className="flex my-5 items-center w-full max-w-lg cursor-pointer rounded-xl gap-6 px-4 sm:px-6 py-4 sm:py-6 bg-opacity-50 bg-[#202838]"
      >
        <div
          className={`w-10 h-10 rounded-full ${
            selectedOption === "get_shortq"
              ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
              : "bg-[#999C9D]"
          } `}
        ></div>
        <div className="text-white text-lg sm:text-2xl font-medium">
          Short-Answer Type Questions
        </div>
      </div>
      <div
        onClick={() => handleOptionClick("get_mcq")}
        className="flex my-3 items-center w-full max-w-lg cursor-pointer rounded-xl gap-6 px-4 sm:px-6 py-4 sm:py-6 bg-opacity-50 bg-[#202838]"
      >
        <div
          className={`w-10 h-10 rounded-full ${
            selectedOption === "get_mcq"
              ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
              : "bg-[#999C9D]"
          } `}
        ></div>
        <div className="text-white text-lg sm:text-2xl font-medium">
          Multiple Choice Questions
        </div>
      </div>
    </div>
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 mb-8">
      <div
        onClick={() => handleOptionClick("get_boolq")}
        className="flex my-5 items-center w-full max-w-lg cursor-pointer rounded-xl gap-6 px-4 sm:px-6 py-4 sm:py-6 bg-opacity-50 bg-[#202838]"
      >
        <div
          className={`w-10 h-10 rounded-full ${
            selectedOption === "get_boolq"
              ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
              : "bg-[#999C9D]"
          } `}
        ></div>
        <div className="text-white text-lg sm:text-2xl font-medium">
          True/False Questions
        </div>
      </div>
      <div
        onClick={() => handleOptionClick("get_problems")}
        className="flex my-3 items-center w-full max-w-lg cursor-pointer rounded-xl gap-6 px-4 sm:px-6 py-4 sm:py-6 bg-opacity-50 bg-[#202838]"
      >
        <div
          className={`w-10 h-10 rounded-full ${
            selectedOption === "get_problems"
              ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
              : "bg-[#999C9D]"
          } `}
        ></div>
        <div className="text-white text-lg sm:text-2xl font-medium">All Questions</div>
      </div>
    </div>
    <div className="mx-auto text-center mt-10">
      {selectedOption ? (
        <a href="input">
          <button
            onClick={handleSaveToLocalStorage}
            className="rounded-2xl  text-lg sm:text-2xl text-white w-fit px-6 sm:px-8 font-bold py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7]"
          >
            Fire Up{"  "}🚀
          </button>
        </a>
      ) : (
        <button
          onClick={() => alert("Please select a question type.")}
          className="rounded-2xl text-lg sm:text-2xl text-white w-fit px-6 sm:px-8 font-bold py-3 bg-gray-500 cursor-not-allowed"
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
