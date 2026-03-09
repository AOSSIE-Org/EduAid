import React from "react";
import { useNavigate } from "react-router-dom";
import logo_trans from "../assets/aossie_logo_transparent.png"
const Mode_Selection = () => {
  const navigate = useNavigate();

  const handleGenerate = () => {
    localStorage.setItem("quizMode", "generate");
    navigate("/output");
  };

  const handlePlay = () => {
    localStorage.setItem("quizMode", "play");
    navigate("/output");
  };

  const handleModeSelect = (mode) => {
    localStorage.setItem("quizMode", mode);
    navigate("/output");   // ya jis route pe jana hai
  };
  
  return (
    <div className="popup w-screen h-screen bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient flex justify-center items-center px-4">
          <div className="max-w-3xl w-full text-center">
          
            {/* Logo */}
            <img
            src={logo_trans}
            alt="logo"
            className="w-20 sm:w-24 mx-auto mb-6"
            />

          {/* Gradient Heading */}
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
              Choose Your
            </span>{" "}
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Mode
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-300 text-lg mb-10">
            Start playing instantly or generate a structured quiz.
          </p>

          {/* Action Cards */}
          <div className="grid sm:grid-cols-2 gap-6">

          {/* Play Card */}
          <button
            onClick={() => handleModeSelect("play")}
            className="cursor-pointer   border border-gradient transition-all p-6  shadow-lg "
          >
            <h2 className="text-xl font-bold text-white mb-2">
              🎮 Play Now
            </h2>
            <p className="text-gray-400 text-sm">
              Answer questions interactively and reveal answers instantly.
            </p>
          </button>

          {/* Generate Card */}
          <button
            type="button"
            onClick={() => handleModeSelect("generate")}
            className="cursor-pointer  border border-gradient  transition-all p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-xl font-bold text-white mb-2">
              📝 Generate Quiz
            </h2>
            <p className="text-gray-400 text-sm">
              View all questions and answers in structured format.
            </p>
          </button>

        </div>
        </div>
       </div>
    </div>
  );
};

export default Mode_Selection;