import React from "react";
import "../index.css";
import logo from "../assets/aossie_logo.png";
import { FaArrowRight } from "react-icons/fa";

const Historysidebar = () => {
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

  const truncateText = (text, maxLength) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <div className="w-96 h-full bg-[#02000F] p-4 flex flex-col">
      {/* Sidebar Header */}
      <div className="flex items-center mb-4">
        <img src={logo} alt="logo" className="w-16" />
        
      </div>

      <div className="text-white mb-4">
        <div className="text-xl font-bold">Previous Quizzes</div>
        <div className="text-sm">Your recent generated quizzes</div>
      </div>

      {/* Quiz List */}
      <div className="flex-1 overflow-y-auto">
        {quizzes.length === 0 ? (
          <div className="text-center text-white text-sm">
            No quizzes available
          </div>
        ) : (
          <ul className="space-y-2">
            {quizzes.slice().reverse().map((quiz, index) => (
              <li
                key={index}
                className="bg-[#202838] p-4 rounded-lg text-white cursor-pointer border-dotted border-2 border-[#7600F2] flex flex-col"
                onClick={() => handleQuizClick(quiz)}
              >
                <div className="font-bold flex justify-between items-center">
                  <span>
                    {quiz.difficulty} - {quiz.numQuestions} Questions
                  </span>
                  <FaArrowRight className="text-[#7600F2]" size={20} />
                </div>
                <div
                  className="text-sm text-gray-300 mt-2 truncate break-words"
                  title={quiz.data || "Not provided"}
                >
                  <strong>Topic:</strong>{" "}
                  {truncateText(quiz.data || "Not provided", 100)}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  <strong>Date:</strong> {quiz.date}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="mt-4 flex gap-4">
        <button
          onClick={handleClearQuizzes}
          className="bg-black text-white px-4 py-2 rounded-md"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default Historysidebar;
