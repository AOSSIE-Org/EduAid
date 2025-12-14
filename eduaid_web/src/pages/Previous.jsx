import React from "react";
import "../index.css";
import logoPNG from "../assets/aossie_logo_transparent.png";
import stars from "../assets/stars.png";
import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

const Previous = () => {
  const navigate = useNavigate();

  const getQuizzesFromLocalStorage = () => {
    const quizzes = localStorage.getItem("last5Quizzes");
    return quizzes ? JSON.parse(quizzes) : [];
  };

  const [quizzes, setQuizzes] = React.useState(getQuizzesFromLocalStorage());

  const handleQuizClick = (quiz) => {
    localStorage.setItem("qaPairs", JSON.stringify(quiz.qaPair));
    navigate('/output'); 
  };

  const handleClearQuizzes = () => {
    localStorage.removeItem("last5Quizzes");
    setQuizzes([]);
  };

  const handleBack = () => {
    navigate('/'); 
  };

  return (
    <div className="w-screen h-screen bg-light-bg flex flex-col justify-center items-center">
      <div className="w-full h-full bg-custom-gradient p-4 md:p-6 overflow-y-auto">
        {/* Header */}
        <Link to="/" className="flex items-end gap-2">
          <img src={logoPNG} alt="logo" className="w-14 md:w-16" />
          <div className="text-xl md:text-2xl font-extrabold">
            <span className="bg-gradient-to-r from-[#FF6B9D] to-[#9B7EDE] text-transparent bg-clip-text">
              Edu
            </span>
            <span className="bg-gradient-to-r from-[#9B7EDE] to-[#4ECDC4] text-transparent bg-clip-text">
              Aid
            </span>
          </div>
        </Link>

        {/* Titles */}
        <div className="mt-3 text-right">
          <div className="text-gray-800 text-lg md:text-xl font-bold">Quiz Dashboard</div>
          <div className="text-gray-800 flex justify-end gap-2 text-sm md:text-xl font-bold items-center">
            Your{" "}
            <span className="bg-gradient-to-r from-[#9B7EDE] to-[#4ECDC4] text-transparent bg-clip-text">
              Generated Quizzes
            </span>
            <img className="h-4 w-4 md:h-5 md:w-5" src={stars} alt="stars" />
          </div>
        </div>

        {/* Subheading */}
        <div className="text-center my-3 text-sm md:text-xl font-bold">
          <span className="bg-gradient-to-r from-[#9B7EDE] to-[#4ECDC4] text-transparent bg-clip-text">
            Your Quizzes
          </span>
        </div>

        {/* Quiz List */}
        <div className="mx-auto max-w-4xl bg-white rounded-xl p-4 mb-4 max-h-[60vh] overflow-y-auto shadow-md border border-light-border">
          {quizzes.length === 0 ? (
            <div className="text-center text-gray-500 text-sm">No quizzes available</div>
          ) : (
            <ul className="space-y-2">
              {quizzes.map((quiz, index) => (
                <li
                  key={index}
                  className="bg-light-card p-4 rounded-lg text-gray-800 cursor-pointer border-2 border-[#9B7EDE] flex justify-between items-center hover:shadow-lg hover:border-[#4ECDC4] transition-all duration-300"
                  onClick={() => handleQuizClick(quiz)}
                >
                  <div>
                    <div className="font-bold text-sm md:text-base">
                      {quiz.difficulty} - {quiz.numQuestions} Questions
                    </div>
                    <div className="mt-2 text-xs md:text-sm text-gray-600">{quiz.date}</div>
                  </div>
                  <FaArrowRight className="text-[#9B7EDE]" size={18} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={handleBack}
            className="bg-white text-gray-800 px-5 py-2 text-sm md:text-base border-gradient rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            Back
          </button>
          <button
            onClick={handleClearQuizzes}
            className="bg-white text-gray-800 px-5 py-2 text-sm md:text-base border-gradient rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default Previous;
