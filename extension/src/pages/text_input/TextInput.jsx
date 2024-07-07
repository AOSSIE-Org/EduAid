import React, { useState } from "react";
import ReactDOM from "react-dom";
import "../../index.css";
import logo from "../../assets/aossie_logo.png";
import stars from "../../assets/stars.png";
import cloud from "../../assets/cloud.png";
import arrow from "../../assets/arrow.png";
import { FaClipboard } from "react-icons/fa";

function Second() {
  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState("Easy Difficulty");
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleSaveToLocalStorage = async () => {
    if (text) {
      localStorage.setItem("textContent", text);
      localStorage.setItem("difficulty", difficulty);
      localStorage.setItem("numQuestions", numQuestions);

      setLoading(true);
      await sendToBackend(
        text,
        difficulty,
        localStorage.getItem("selectedQuestionType")
      );
    }
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
  };

  const incrementQuestions = () => {
    setNumQuestions((prev) => prev + 1);
  };

  const decrementQuestions = () => {
    setNumQuestions((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const getEndpoint = (difficulty, questionType) => {
    if (difficulty !== "Easy Difficulty") {
      if (questionType === "get_shortq") {
        return "get_shortq_hard";
      } else if (questionType === "get_mcq") {
        return "get_mcq_hard";
      }
    }
    return questionType;
  };

  const sendToBackend = async (data, difficulty, questionType) => {
    const endpoint = getEndpoint(difficulty, questionType);
    try {
      const formData = JSON.stringify({
        input_text: data,
        max_questions: numQuestions,
      });
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        localStorage.setItem("qaPairs", JSON.stringify(responseData));
        window.location.href = "/src/pages/question/question.html";
      } else {
        console.error("Backend request failed.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup w-screen h-screen bg-[#02000F] flex justify-center items-center">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-black">
          <div className="loader border-4 border-t-4 border-white rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}
      <div
        className={`w-full h-full bg-cust bg-opacity-50 bg-custom-gradient ${
          loading ? "pointer-events-none" : ""
        }`}
      >
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
        <div className="text-right mt-[-8px] mx-1">
          <div className="text-white text-sm font-bold">Enter the Content</div>
          <div className="text-white text-right justify-end flex gap-2 text-sm font-bold">
            to Generate{" "}
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Questionaries
            </span>{" "}
            <img className="h-[20px] w-[20px]" src={stars} />
          </div>
        </div>
        <div className="text-left mx-2 mb-1 mt-1 text-sm text-white">
          Enter Content Here
        </div>

        <div className="relative bg-[#83b6cc40] mx-3 rounded-xl p-2 h-32">
          <button className="absolute top-0 left-0 p-2 text-white focus:outline-none">
            <FaClipboard className="h-[20px] w-[20px]" />
          </button>
          <textarea
            className="absolute inset-0 p-8 pt-2 bg-[#83b6cc40] text-lg rounded-xl outline-none resize-none h-full overflow-y-auto text-white caret-white"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <style>
            {`
          textarea::-webkit-scrollbar {
            display: none;
          }
        `}
          </style>
        </div>
        <div className="text-white text-center my-2 text-sm">or</div>
        <div className="border-[3px] rounded-xl text-center mx-3 px-6 py-2 border-dotted border-[#3E5063] mt-4">
          <img className="mx-auto" height={24} width={24} src={cloud} alt="" />
          <div className="text-center text-white text-sm">Choose a file</div>
          <div className="text-center text-white text-sm">
            PDF, MP3 supported
          </div>
          <button className="bg-[#3e506380] my-2 text-sm rounded-xl text-white border border-[#cbd0dc80] px-6 py-1">
            Browse File
          </button>
        </div>
        <div className="flex justify-center gap-2 p-4">
          <div className="relative items-center">
            <select
              value={difficulty}
              onChange={handleDifficultyChange}
              className="bg-[#202838] text-white rounded-xl px-5 py-2 appearance-none"
            >
              <option>Easy Difficulty</option>
              <option>Medium Difficulty</option>
              <option>Hard Difficulty</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center py-2 px-2 pointer-events-none">
              <svg
                className="w-4 h-4 fill-current text-white"
                viewBox="0 0 20 20"
              >
                <path d="M5.5 8l4.5 4.5L14.5 8H5.5z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center bg-[#202838] text-white rounded-xl px-4 py-2">
            <span className="">
              No. of questions{" "}
              <button
                onClick={decrementQuestions}
                className="px-1 rounded-full bg-[#3C5063] hover:bg-[#2d3c4b]"
              >
                -
              </button>{" "}
              {numQuestions}{" "}
            </span>
            <button
              onClick={incrementQuestions}
              className="px-1 rounded-full bg-[#3C5063] hover:bg-[#2d3c4b]"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex my-2 justify-center gap-6 items-start">
          <div className="">
            <a href="/src/pages/home/home.html">
              <button className="bg-black items-center text-sm text-white px-4 py-2 mx-auto border-gradient">
                Summarize
              </button>
            </a>
          </div>
          <div>
            <button
              onClick={handleSaveToLocalStorage}
              className="rounded-2xl items-center flex justify-center gap-2 text-sm text-white w-fit px-6 font-bold py-2 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7]"
            >
              Next <img src={arrow} width={16} height={12} alt="" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<Second />, document.getElementById("root"));
