import React from "react";
import "../index.css";
import logo from "../assets/aossie_logo.png";
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
    <div className="popup w-screen h-screen bg-gradient-to-r from-yellow-500 to-green-500 flex flex-col justify-center items-center">
      <div className="w-full h-full gap-[2px]">
        <a href="/">
          <div className="flex items-end gap-[2px]">
            <img src={logo} alt="logo" className="w-16 my-4 ml-4 block" />
            <div className="text-3xl absolute top-6 right-9 mb-3 font-extrabold">
              <span className="text-white text-transparent bg-clip-text">
                EduAid
              </span>
            </div>
          </div>
        </a>
        <div className="mt-[-8px] mx-1">
          <div className="text-white text-left text-2xl mt-[2px] mx-6 font-bold">
            Quiz Dashboard
          </div>
        </div>
        <div className="text-center my-2 text-sm">
          <span className="bg-gradient-to-r text-xl text-white font-serif font-bold text-transparent bg-clip-text">
            Your Quizzes
          </span>{" "}
          <div className=" text-left text-green-800 mx-6 flex gap-2 text-xl font-bold">
            Your Generated Quizzes
            <img className="h-[20px] w-[20px]" src={stars} alt="stars" />
          </div>
        </div>
        <div className="mx-3 my-4 p-2 bg-[#83b6cc40] rounded-xl h-68 overflow-y-auto ">
          {quizzes.length === 0 ? (
            <div className="text-center text-white text-sm">
              No quizzes available
            </div>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {quizzes.map((quiz, index) => (
                <li
                  key={index}
                  className="bg-[#202838] p-4 rounded-lg text-white cursor-pointer border-dotted border-2 border-[#7600F2] flex justify-between items-center"
                  onClick={() => handleQuizClick(quiz)}
                >
                  <div>
                    <div className="font-bold">
                      {quiz.difficulty} - {quiz.numQuestions} Questions
                    </div>
                    <div className="mt-2 text-sm">{quiz.date}</div>
                  </div>
                  <FaArrowRight className="text-[#7600F2]" size={20} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex my-2 justify-center gap-6 items-start">
          <div>
            <button
              onClick={handleBack}
              className="bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-600 hover:to-yellow-600 active:from-orange-800 active:to-yellow-800 transform hover:scale-110 hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 text-xl text-white px-6 py-3 rounded-lg shadow-lg"
            >
              Back
            </button>
          </div>
          <div>
            <button
              onClick={handleClearQuizzes}
              className="bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-600 hover:to-yellow-600 active:from-orange-800 active:to-yellow-800 transform hover:scale-110 hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 text-xl text-white px-6 py-3 rounded-lg shadow-lg"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Previous;
