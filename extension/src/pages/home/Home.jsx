import React, { useState } from "react";
import ReactDOM from "react-dom";
import "../../index.css";
import logo from "../../assets/aossie_logo.png";

function Home() {
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
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient">
        <div className="flex items-end gap-[2px]">
          <img src={logo} alt="logo" className="w-16 my-4 ml-4 block" />
          <div className="text-2xl mb-3 font-extrabold">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
              Edu
            </span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Aid
            </span>
          </div>
        </div>
        <div className="text-3xl mt-3 text-white ml-4 font-extrabold">
          What’s on your Mind?
        </div>
        <div className="mt-1 text-white text-sm ml-4 font-medium">
          Choose one
        </div>
        <div>
          <div
            onClick={() => handleOptionClick("get_shortq")}
            className="flex my-3 items-center mx-3 cursor-pointer rounded-xl gap-4 px-4 py-4 bg-opacity-50 bg-[#202838]"
          >
            <div
              className={`px-3 py-3 rounded-full ${
                selectedOption === "get_shortq"
                  ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
                  : "bg-[#999C9D]"
              } `}
            ></div>
            <div className="text-white text-lg font-medium">
              Short-Answer Type Questions
            </div>
          </div>
          <div
            onClick={() => handleOptionClick("get_mcq")}
            className="flex my-3 cursor-pointer items-center mx-3 rounded-xl bg-opacity-50 gap-4 px-4 py-4 bg-[#202838]"
          >
            <div
              className={`px-3 py-3 rounded-full ${
                selectedOption === "get_mcq"
                  ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
                  : "bg-[#999C9D]"
              } `}
            ></div>
            <div className="text-white text-lg font-medium">
              Multiple Choice Questions
            </div>
          </div>
          <div
            onClick={() => handleOptionClick("get_boolq")}
            className="flex cursor-pointer my-3 items-center mx-3 rounded-xl bg-opacity-50 gap-4 px-4 py-4 bg-[#202838]"
          >
            <div
              className={`px-3 py-3 rounded-full ${
                selectedOption === "get_boolq"
                  ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
                  : "bg-[#999C9D]"
              } `}
            ></div>
            <div className="text-white text-lg font-medium">
              True/False Questions
            </div>
          </div>
          <div
            onClick={() => handleOptionClick("get_problems")}
            className="flex my-3 cursor-pointer items-center mx-3 rounded-xl bg-opacity-50 gap-4 px-4 py-4 bg-[#202838]"
          >
            <div
              className={`px-3 py-3 rounded-full ${
                selectedOption === "get_problems"
                  ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
                  : "bg-[#999C9D]"
              } `}
            ></div>
            <div className="text-white text-lg font-medium">All Questions</div>
          </div>
        </div>
        <div className="mx-auto text-center mt-6">
          {selectedOption ? (
            <a href="/src/pages/text_input/text_input.html">
              <button
                onClick={handleSaveToLocalStorage}
                className="rounded-2xl text-xl text-white w-fit px-6 font-bold py-2 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7]"
              >
                Fire Up{"  "}🚀
              </button>
            </a>
          ) : (
            <button
              onClick={() => alert("Please select a question type.")}
              className="rounded-2xl text-xl text-white w-fit px-6 font-bold py-2 bg-gray-500 cursor-not-allowed"
              disabled
            >
              Fire Up{"  "}🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<Home />, document.getElementById("root"));
