import React, { useState } from "react";
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

  const questionTypes = [
    { id: "get_shortq", label: "Short-Answer Type Questions" },
    { id: "get_mcq", label: "Multiple Choice Questions" },
    { id: "get_boolq", label: "True/False Questions" },
    { id: "get_problems", label: "All Questions" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-green-50 p-4 flex items-center">
        <a href="/" className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-12 sm:w-16" />
          <div className="text-xl sm:text-2xl font-extrabold">
            <span className="text-green-600">Edu</span>
            <span className="text-yellow-500">Aid</span>
          </div>
        </a>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl sm:text-4xl text-gray-800 font-bold mb-4 text-center">
          What's on your Mind?
        </h1>
        <p className="text-xl text-gray-600 mb-8 text-center">
          Choose one
        </p>

        <div className="w-full max-w-md space-y-4">
          {questionTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleOptionClick(type.id)}
              className={`w-full p-4 rounded-lg text-left transition-colors duration-200 ${
                selectedOption === type.id
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full border-2 ${
                  selectedOption === type.id
                    ? "border-white bg-white"
                    : "border-gray-400"
                } mr-4`}></div>
                <span className="text-lg font-medium">{type.label}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8">
          {selectedOption ? (
            <a href="input">
              <button
                onClick={handleSaveToLocalStorage}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-lg transition duration-300 text-lg"
              >
                Fire Up 🚀
              </button>
            </a>
          ) : (
            <button
              onClick={() => alert("Please select a question type.")}
              className="bg-gray-300 text-gray-500 font-bold py-3 px-8 rounded-lg cursor-not-allowed text-lg"
              disabled
            >
              Fire Up 🚀
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Question_Type;