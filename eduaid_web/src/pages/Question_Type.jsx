import React, { useState } from "react";

import { FaArrowAltCircleRight } from "react-icons/fa";
import logo from "../assets/aossie_logo.png";

const QuestionType = () => {
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
    <div className="relative min-h-screen bg-neutral-950">
      {/* Background patterns */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <a href="/">
          <div className="flex items-center gap-2 mb-12">
            <img
              src={logo}
              alt="AOSSIE Logo"
              width={80}
              height={80}
              className="mix-blend-screen rounded-full"
            />
            <h1 className="text-4xl font-extrabold">
              <span className="bg-gradient-to-r from-[#7877C6] to-purple-500 text-transparent bg-clip-text">
                EduAid
              </span>
            </h1>
          </div>
        </a>

        <h2 className="text-4xl font-bold text-white text-center mb-4">
          What's on your Mind?
        </h2>
        <p className="text-xl text-gray-400 text-center mb-8">Choose one</p>

        <div className="space-y-4 mb-8">
          {questionTypes.map((type) => (
            <div
              key={type.id}
              onClick={() => handleOptionClick(type.id)}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                selectedOption === type.id
                  ? "bg-gradient-to-r from-[#7877C6] to-purple-500"
                  : "bg-neutral-900 hover:bg-neutral-800"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 ${
                  selectedOption === type.id
                    ? "bg-white border-white"
                    : "border-gray-400"
                }`}
              />
              <span className="text-white text-lg">{type.label}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          {selectedOption ? (
            <a href="/input" onClick={handleSaveToLocalStorage}>
              <button className="bg-gradient-to-r from-[#7877C6] to-purple-500 text-white font-bold py-3 px-8 rounded-full text-xl inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
                Fire Up <FaArrowAltCircleRight />
              </button>
            </a>
          ) : (
            <button
              className="bg-gray-600 text-white font-bold py-3 px-8 rounded-full text-xl inline-flex items-center gap-2 cursor-not-allowed opacity-50"
              disabled
            >
              Fire Up <FaArrowAltCircleRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionType;
