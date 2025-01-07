import React, { useState, useEffect } from "react";
import "../index.css"; 
import logo from "../assets/aossie_logo.png";

const Question_Type = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [scale, setScale] = useState(1);
  const [shadow, setShadow] = useState("0px 0px 10px rgba(0, 0, 0, 0.1)");

   
  useEffect(() => {
    const interval = setInterval(() => {
      setScale((prev) => (prev === 1 ? 1.05 : 1)); 
    }, 2000); 

    return () => clearInterval(interval);
  }, []);

  
  const handleHover = () => {
    setShadow("0px 10px 20px rgba(0, 0, 0, 0.2)"); 
  };

  const handleLeave = () => {
    setShadow("0px 0px 10px rgba(0, 0, 0, 0.1)"); 
  };

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
        <a href="/" className="absolute top-6 left-6 flex flex-col items-start gap-2">
          <img
            src={logo}
            alt="logo"
            className="w-24 my-6 block transition-transform transform hover:rotate-6 hover:scale-105" 
          />
          <div className="text-5xl font-extrabold">
            <span
              style={{
                animation: "breathingEffect 3s ease-in-out infinite",
                background: "linear-gradient(to right, #FF005C, #7600F2)",
                WebkitBackgroundClip: "text",
                color: "transparent",
                transform: `scale(${scale})`,
                transition: "transform 1s ease-in-out",
              }}
            >
              Edu
            </span>
            <span
              style={{
                animation: "breathingEffect 3s ease-in-out infinite",
                background: "linear-gradient(to right, #7600F2, #00CBE7)",
                WebkitBackgroundClip: "text",
                color: "transparent",
                transform: `scale(${scale})`,
                transition: "transform 1s ease-in-out",
              }}
            >
              Aid
            </span>
          </div>
        </a>

       
        <div className="flex flex-col items-center justify-center h-full mt-20">
          <div className="text-4xl text-white text-center font-extrabold">
            What’s on your Mind?
          </div>
          <div className="mt-2 text-white text-xl text-center font-medium">
            Choose one
          </div>

          
          <div className="flex flex-col items-center mt-8 w-full max-w-lg">
            {["get_shortq", "get_mcq", "get_boolq", "get_problems"].map((option, index) => (
              <div
                key={index}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={handleHover}
                onMouseLeave={handleLeave}
                className={`flex my-3 items-center w-full cursor-pointer rounded-xl gap-6 px-6 py-6 bg-opacity-50 bg-[#202838] transform transition-all hover:scale-105 hover:shadow-xl ${
                  selectedOption === option
                    ? "bg-gradient-to-r from-[#405EED] to-[#01CBE7]" 
                    : "hover:bg-gradient-to-r hover:from-[#FF005C] hover:to-[#7600F2]" 
                }`}
                style={{ boxShadow: shadow }}
              >
                <div
                  className={`w-10 h-10 rounded-full ${
                    selectedOption === option
                      ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
                      : "bg-[#999C9D]"
                  }`}
                ></div>
                <div className="text-white text-2xl font-medium">
                  {option === "get_shortq"
                    ? "Short-Answer Type Questions"
                    : option === "get_mcq"
                    ? "Multiple Choice Questions"
                    : option === "get_boolq"
                    ? "True/False Questions"
                    : "All Questions"}
                </div>
              </div>
            ))}
          </div>

          
          <div className="mx-auto text-center mt-10">
            {selectedOption ? (
              <a href="input">
                <button
                  onClick={handleSaveToLocalStorage}
                  className="rounded-2xl text-2xl text-white w-fit px-8 font-bold py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] transform transition-all hover:scale-110 hover:shadow-2xl"
                  style={{
                    transition: "transform 0.3s ease, box-shadow 0.3s ease", 
                  }}
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
    </div>
  );
};

export default Question_Type;


