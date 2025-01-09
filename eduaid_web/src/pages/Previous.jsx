import React, { useState, useEffect } from "react";

import { FaArrowRight, FaTrash } from "react-icons/fa";
import logo from "../assets/aossie_logo.png";
import stars from "../assets/stars.png";

const PreviousWork = () => {
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const storedQuizzes = localStorage.getItem("last5Quizzes");
    if (storedQuizzes) {
      setQuizzes(JSON.parse(storedQuizzes));
    }
  }, []);

  const handleQuizClick = (quiz) => {
    localStorage.setItem("qaPairs", JSON.stringify(quiz.qaPair));
    window.location.href = "/output";
  };

  const handleClearQuizzes = () => {
    localStorage.removeItem("last5Quizzes");
    setQuizzes([]);
  };

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

        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Quiz Dashboard</h2>
          <p className="text-xl text-gray-400">
            Your{" "}
            <span className="bg-gradient-to-r from-[#7877C6] to-purple-500 text-transparent bg-clip-text font-semibold">
              Generated Quizzes
            </span>
          </p>
        </div>

        <div className="bg-neutral-900/50 rounded-xl p-6 mb-8">
          {quizzes.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No quizzes available
            </div>
          ) : (
            <ul className="space-y-4">
              {quizzes.map((quiz, index) => (
                <li
                  key={index}
                  onClick={() => handleQuizClick(quiz)}
                  className="bg-neutral-800 rounded-lg p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-700 transition-colors"
                >
                  <div>
                    <h3 className="text-white font-semibold">
                      {quiz.difficulty} - {quiz.numQuestions} Questions
                    </h3>
                    <p className="text-gray-400 text-sm">{quiz.date}</p>
                  </div>
                  <FaArrowRight className="text-[#7877C6]" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <a href="/">
            <button className="bg-neutral-800 text-white px-6 py-2 rounded-full hover:bg-neutral-700 transition-colors">
              Back
            </button>
          </a>
          <button
            onClick={handleClearQuizzes}
            className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FaTrash /> Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviousWork;
