import React from "react";
import "../index.css";
import logoPNG from "../assets/aossie_logo_transparent.png";
import stars from "../assets/stars.png";
import { FaArrowRight } from "react-icons/fa";

const Previous = () => {
  const getQuizzesFromLocalStorage = () => {
    const quizzes = localStorage.getItem("last5Quizzes");
    return quizzes ? JSON.parse(quizzes) : [];
  };

  const [quizzes, setQuizzes] = React.useState(getQuizzesFromLocalStorage());

  const handleQuizClick = (quiz) => {
    localStorage.setItem("qaPairs", JSON.stringify(quiz.qaPair));
    window.location.href = "/output";
  };

  const handleClearQuizzes = () => {
    localStorage.removeItem("last5Quizzes");
    setQuizzes([]);
  };

  const handleBack = () => {
    window.location.href = "/";
  };

  return (
    <div className="w-screen h-screen bg-[#02000F] flex flex-col justify-center items-center">
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient p-4 md:p-6 overflow-y-auto">
        {/* Header */}
        <a href="/" className="flex items-end gap-2">
          <img src={logoPNG} alt="logo" className="w-14 md:w-16" />
          <div className="text-xl md:text-2xl font-extrabold">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
              Edu
            </span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Aid
            </span>
          </div>
        </a>

        {/* Titles */}
        <div className="mt-3 text-right">
          <div className="text-white text-lg md:text-xl font-bold">Quiz Dashboard</div>
          <div className="text-white flex justify-end gap-2 text-sm md:text-xl font-bold items-center">
            Your{" "}
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Generated Quizzes
            </span>
            <img className="h-4 w-4 md:h-5 md:w-5" src={stars} alt="stars" />
          </div>
        </div>

        {/* Subheading */}
        <div className="text-center my-3 text-sm md:text-xl font-bold">
          <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
            Your Quizzes
          </span>
        </div>

        {/* Quiz List */}
        <div className="mx-auto max-w-4xl bg-[#83b6cc40] rounded-xl p-4 mb-4 max-h-[60vh] overflow-y-auto">
          {quizzes.length === 0 ? (
            <div className="text-center text-white text-sm">No quizzes available</div>
          ) : (
            <ul className="space-y-2">
              {quizzes.map((quiz, index) => (
                <li
                  key={index}
                  className="bg-[#202838] p-4 rounded-lg text-white cursor-pointer border-dotted border-2 border-[#7600F2] flex justify-between items-center"
                  onClick={() => handleQuizClick(quiz)}
                >
                  <div>
                    <div className="font-bold text-sm md:text-base">
                      {quiz.difficulty} - {quiz.numQuestions} Questions
                    </div>
                    <div className="mt-2 text-xs md:text-sm">{quiz.date}</div>
                  </div>
                  <FaArrowRight className="text-[#7600F2]" size={18} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={handleBack}
            className="bg-black text-white px-5 py-2 text-sm md:text-base border-gradient"
          >
            Back
          </button>
          <button
            onClick={handleClearQuizzes}
            className="bg-black text-white px-5 py-2 text-sm md:text-base border-gradient"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default Previous;
