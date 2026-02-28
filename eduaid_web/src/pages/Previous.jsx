import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const difficultyColor = (d = "") => {
  if (!d) return "text-[#718096]";
  const l = d.toLowerCase();
  if (l.includes("easy")) return "text-green-400";
  if (l.includes("medium")) return "text-yellow-400";
  if (l.includes("hard")) return "text-red-400";
  return "text-[#c084fc]";
};

const modeIcon = (mode) => (mode === "interactive" ? "" : "");

const Previous = () => {
  const navigate = useNavigate();

  const getQuizzes = () => {
    try { return JSON.parse(localStorage.getItem("last5Quizzes")) || []; }
    catch { return []; }
  };

  const [quizzes, setQuizzes] = React.useState(getQuizzes);

  const handleQuizClick = (quiz) => {
    navigate("/quiz", { state: { mode: quiz.mode || "static", questions: quiz.qaPair } });
  };

  const handleClear = () => {
    localStorage.removeItem("last5Quizzes");
    setQuizzes([]);
  };

  return (
    <div className="min-h-screen bg-[#02000F] text-white pt-24 pb-16 px-4">
      {/* Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#7600F2] opacity-[0.10] blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] rounded-full bg-[#00CBE7] opacity-[0.08] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="mb-10">
          <p className="text-[#7600F2] text-sm font-bold uppercase tracking-widest mb-2">Your Activity</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Quiz History</h1>
          <p className="text-[#718096] mt-2">Revisit and re-take your recently generated quizzes.</p>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-20 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <div className="text-5xl mb-4"></div>
            <h3 className="text-xl font-bold mb-2">No quizzes yet</h3>
            <p className="text-[#718096] mb-6">Generate your first quiz to see it here.</p>
            <Link to="/upload">
              <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-white font-bold hover:scale-105 transition-all">
                Generate a Quiz 
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 mb-8">
              {quizzes.map((quiz, i) => (
                <button
                  key={i}
                  onClick={() => handleQuizClick(quiz)}
                  className="group w-full text-left p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-[#7600F2]/40 hover:bg-[#7600F2]/[0.04] transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Mode badge */}
                      <div className="w-11 h-11 rounded-xl bg-[#7600F2]/15 border border-[#7600F2]/25 flex items-center justify-center text-xl flex-shrink-0">
                        {modeIcon(quiz.mode)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-bold ${difficultyColor(quiz.difficulty)}`}>
                            {quiz.difficulty || "Unknown"}
                          </span>
                          <span className="text-white/20"></span>
                          <span className="text-sm text-white font-semibold">
                            {quiz.numQuestions} Questions
                          </span>
                          <span className="text-white/20"></span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#a0aec0] capitalize">
                            {quiz.mode || "static"}
                          </span>
                        </div>
                        <div className="text-xs text-[#4a5568] mt-1">{quiz.date}</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-[#4a5568] group-hover:text-[#7600F2] group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <p className="text-[#4a5568] text-sm">{quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} saved</p>
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-xl border border-red-500/20 text-red-400/70 text-sm font-semibold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-all duration-200"
              >
                Clear History
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Previous;
