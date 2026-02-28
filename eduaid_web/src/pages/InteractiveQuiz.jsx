import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import logo from "../assets/aossie_logo_transparent.png";

const InteractiveQuiz = ({ questions: questionsProp }) => {
  const location = useLocation();
  const navigate = useNavigate();
  // Accept questions from props (via QuizModeWrapper) or fall back to location.state
  const rawQuestions = questionsProp || (location.state && location.state.questions) || [];
  // Handle both plain array and {output: [...]} wrapper from backend
  const questions = Array.isArray(rawQuestions)
    ? rawQuestions
    : Array.isArray(rawQuestions.output)
      ? rawQuestions.output
      : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#02000F] flex items-center justify-center text-white">
        <div className="text-center p-10 rounded-2xl bg-white/5 border border-white/10 max-w-md">
          <div className="text-5xl mb-4"></div>
          <h2 className="text-2xl font-bold mb-3">No Questions Found</h2>
          <p className="text-[#718096] mb-6">There are no questions available for this quiz.</p>
          <Link to="/upload"><button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-white font-bold">Generate a Quiz </button></Link>
        </div>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-[#02000F] flex items-center justify-center px-4 text-white">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#7600F2] opacity-[0.12] blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full bg-[#00CBE7] opacity-[0.10] blur-[100px]" />
        </div>
        <div className="relative z-10 text-center max-w-lg w-full p-10 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
          <div className="text-7xl mb-6">{pct >= 80 ? "" : pct >= 50 ? "" : ""}</div>
          <h2 className="text-4xl font-extrabold mb-2">Quiz Complete!</h2>
          <p className="text-[#a0aec0] mb-8">Here's how you did:</p>
          <div className="flex items-center justify-center gap-8 mb-8">
            <div>
              <div className="text-5xl font-black bg-gradient-to-r from-[#7600F2] to-[#00CBE7] bg-clip-text text-transparent">{score}/{questions.length}</div>
              <div className="text-[#718096] text-sm mt-1">Correct</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <div className="text-5xl font-black text-white">{pct}%</div>
              <div className="text-[#718096] text-sm mt-1">Score</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-full h-2 mb-10">
            <div className="h-2 rounded-full bg-gradient-to-r from-[#7600F2] to-[#00CBE7] transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => { setCurrentIndex(0); setSelected(null); setSubmitted(false); setScore(0); setFinished(false); }} className="px-6 py-3 rounded-xl bg-[#7600F2]/20 border border-[#7600F2]/30 text-[#c084fc] font-bold hover:bg-[#7600F2]/30 transition-all">Retry Quiz</button>
            <Link to="/upload"><button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-white font-bold hover:scale-105 transition-all">New Quiz </button></Link>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const options = Array.isArray(q.options) && q.options.length > 0
    ? [...q.options]
    : [];
  if (q.answer && !options.includes(q.answer)) options.push(q.answer);
  const correctAnswer = q.answer ?? (q.correctAnswerIndex != null ? options[q.correctAnswerIndex] : undefined);
  const correctIdx = correctAnswer != null ? options.indexOf(correctAnswer) : -1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === correctIdx) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setSelected(null);
    setSubmitted(false);
    if (currentIndex + 1 >= questions.length) setFinished(true);
    else setCurrentIndex((i) => i + 1);
  };

  return (
    <div className="min-h-screen bg-[#02000F] text-white pt-20 pb-12 px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#7600F2] opacity-[0.10] blur-[100px]" />
        <div className="absolute bottom-[0%] right-[-5%] w-[350px] h-[350px] rounded-full bg-[#00CBE7] opacity-[0.08] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="EduAid" className="w-7 h-7" />
            <span className="font-black text-base bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] bg-clip-text text-transparent">EduAid</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[#718096]">Question</span>
            <span className="font-bold text-white">{currentIndex + 1} / {questions.length}</span>
            <div className="px-3 py-1 rounded-full bg-[#7600F2]/20 border border-[#7600F2]/30 text-[#c084fc] font-bold">{score} pts</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/[0.07] rounded-full h-1.5 mb-8">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-[#7600F2] to-[#00CBE7] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Question card */}
        <div className="p-8 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm mb-6">
          <div className="text-[#7600F2] text-xs font-bold uppercase tracking-widest mb-4">Question {currentIndex + 1}</div>
          <h2 className="text-xl sm:text-2xl font-bold leading-relaxed">{q.question || q.question_statement}</h2>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 mb-8">
          {options.map((opt, i) => {
            const isCorrect = i === correctIdx;
            const isSelected = i === selected;
            let cls = "p-4 rounded-xl border text-left text-sm sm:text-base font-medium transition-all duration-200 cursor-pointer ";
            if (!submitted) {
              cls += isSelected
                ? "bg-[#7600F2]/20 border-[#7600F2] text-white"
                : "bg-white/[0.03] border-white/[0.08] text-[#a0aec0] hover:bg-white/[0.07] hover:border-white/20 hover:text-white";
            } else {
              if (isCorrect) cls += "bg-green-500/20 border-green-500 text-green-300";
              else if (isSelected) cls += "bg-red-500/20 border-red-500 text-red-300";
              else cls += "bg-white/[0.02] border-white/[0.05] text-[#4a5568]";
            }
            return (
              <button key={i} className={cls} onClick={() => !submitted && setSelected(i)}>
                <span className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${isSelected && !submitted ? "bg-[#7600F2] border-[#7600F2] text-white" : "border-current"}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                  {submitted && isCorrect && <span className="ml-auto text-green-400"></span>}
                  {submitted && isSelected && !isCorrect && <span className="ml-auto text-red-400"></span>}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback + Actions */}
        {submitted && (
          <div className={`p-4 rounded-xl mb-4 text-sm font-semibold flex items-center gap-3 ${selected === correctIdx ? "bg-green-500/10 border border-green-500/30 text-green-300" : "bg-red-500/10 border border-red-500/30 text-red-300"}`}>
            <span className="text-xl">{selected === correctIdx ? "" : ""}</span>
            {selected === correctIdx ? "Correct! Well done." : `Incorrect. The correct answer is: "${options[correctIdx]}"`}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          {!submitted ? (
            <button onClick={handleSubmit} disabled={selected === null} className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 ${selected === null ? "bg-white/10 text-[#4a5568] cursor-not-allowed" : "bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-white hover:scale-105 shadow-[0_0_20px_rgba(118,0,242,0.4)]"}`}>
              Submit Answer
            </button>
          ) : (
            <button onClick={handleNext} className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-white font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(118,0,242,0.4)]">
              {currentIndex + 1 >= questions.length ? "See Results " : "Next Question "}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveQuiz;
