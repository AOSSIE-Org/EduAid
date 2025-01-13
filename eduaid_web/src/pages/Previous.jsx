import React from "react";
import logo from "../assets/aossie_logo.png";
import { FaArrowRight, FaTrash, FaChevronLeft } from "react-icons/fa";

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
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-green-50 p-4 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-12 sm:w-16" />
          <div className="text-xl sm:text-2xl font-extrabold">
            <span className="text-green-600">Edu</span>
            <span className="text-yellow-500">Aid</span>
          </div>
        </a>
        <h1 className="text-lg sm:text-xl font-bold text-gray-800">Quiz Dashboard</h1>
      </header>

      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6">
          Your Generated Quizzes
        </h2>

        <div className="bg-yellow-50 rounded-xl p-4 sm:p-6 mb-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {quizzes.length === 0 ? (
            <div className="text-center text-gray-600">
              No quizzes available
            </div>
          ) : (
            <ul className="space-y-4">
              {quizzes.map((quiz, index) => (
                <li
                  key={index}
                  className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500"
                  onClick={() => handleQuizClick(quiz)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-800">
                        {quiz.difficulty} - {quiz.numQuestions} Questions
                      </div>
                      <div className="mt-1 text-sm text-gray-600">{quiz.date}</div>
                    </div>
                    <FaArrowRight className="text-green-500" size={20} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <footer className="bg-green-50 p-4 flex justify-center gap-4">
        <button
          onClick={handleBack}
          className="bg-white text-green-600 border border-green-600 px-4 py-2 rounded-md hover:bg-green-600 hover:text-white transition-colors duration-300 flex items-center gap-2"
        >
          <FaChevronLeft /> Back
        </button>
        <button
          onClick={handleClearQuizzes}
          className="bg-white text-yellow-600 border border-yellow-600 px-4 py-2 rounded-md hover:bg-yellow-600 hover:text-white transition-colors duration-300 flex items-center gap-2"
        >
          <FaTrash /> Clear All
        </button>
      </footer>
    </div>
  );
};

export default Previous;