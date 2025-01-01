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
    <div className="popup w-screen h-screen bg-[#02000F] flex flex-col justify-center items-center">
      <div className="w-full h-full popup bg-[#75d8f6b7]">
       <a href="/" className=" top-0 left-0 ml-4 mt-4">
         <div className="flex px-3 py-0">
           <img
             src={logo}
             alt="logo"
             className="w-20 bg-white my-6 rounded-full"
           />
         </div>
       </a>
        <div className="text-right mt-[-8px] mx-1">
          <div className="text-white text-xl font-bold">Quiz Dashboard</div>
          <div className="text-white text-right justify-end flex gap-2 text-xl font-bold">
            Your{" "}
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Generated Quizzes
            </span>{" "}
            <img className="h-[20px] w-[20px]" src={stars} alt="stars" />
          </div>
        </div>
        <div className="text-center my-2 text-sm">
          <span className="bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-5xl font-bold text-transparent bg-clip-text">
            Your Quizzes
          </span>{" "}
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
              className="bg-[#3e506380] my-4 text-lg rounded-2xl border border-[#cbd0dc80]  button-style  gap-4 px-8 py-4 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-white"
            >
              Back
            </button>
          </div>
          <div>
            <button
              onClick={handleClearQuizzes}
            className="bg-[#3e506380] my-4 text-lg rounded-2xl border border-[#cbd0dc80]  button-style  gap-4 px-8 py-4 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-white"
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
