import React, { useState } from "react";
import "../index.css";
import { Link } from "react-router-dom";
import { FiList, FiToggleRight, FiEdit3, FiGrid } from "react-icons/fi";

const QUESTION_TYPES = [
  {
    id: "get_mcq",
    label: "Multiple Choice",
    desc: "Four options per question — classic quiz format",
    Icon: FiList,
    gradient: "from-[#7600F2] to-[#00CBE7]",
  },
  {
    id: "get_boolq",
    label: "True / False",
    desc: "Binary answers, great for quick knowledge checks",
    Icon: FiToggleRight,
    gradient: "from-[#FF005C] to-[#7600F2]",
  },
  {
    id: "get_shortq",
    label: "Short Answer",
    desc: "Open-ended responses that test deeper understanding",
    Icon: FiEdit3,
    gradient: "from-[#00CBE7] to-[#7600F2]",
  },
  {
    id: "get_problems",
    label: "All Types",
    desc: "A mix of every question type for comprehensive practice",
    Icon: FiGrid,
    gradient: "from-[#FF005C] via-[#7600F2] to-[#00CBE7]",
  },
];

const Question_Type = () => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleSaveToLocalStorage = () => {
    if (selectedOption) {
      localStorage.setItem("selectedQuestionType", selectedOption);
    }
  };

  return (
    <div className="min-h-screen bg-[#02000F] text-white">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#7600F2] opacity-[0.10] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#00CBE7] opacity-[0.08] blur-[100px]" />
        <div className="absolute top-[40%] right-[10%] w-[250px] h-[250px] rounded-full bg-[#FF005C] opacity-[0.05] blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-24 pb-12 px-4">
        {/* Header text */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-xs text-white/50 uppercase tracking-widest mb-5">
            Step 1 of 2
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-3">
            What type of quiz?
          </h1>
          <p className="text-white/50 text-base sm:text-lg max-w-md mx-auto">
            Pick the question format that works best for your learning goal.
          </p>
        </div>

        {/* Option cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {QUESTION_TYPES.map((option) => {
            const isSelected = selectedOption === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`group relative text-left px-6 py-5 rounded-2xl border transition-all duration-200 cursor-pointer focus:outline-none ${
                  isSelected
                    ? "border-[#7600F2] bg-[#7600F2]/10 shadow-lg shadow-[#7600F2]/10"
                    : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
                }`}
              >
                {isSelected && (
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-[#7600F2]/60 pointer-events-none" />
                )}

                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gradient-to-br ${option.gradient} ${
                      isSelected ? "opacity-100" : "opacity-60 group-hover:opacity-80"
                    } transition-opacity`}
                  >
                    <option.Icon className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base text-white mb-1">
                      {option.label}
                    </div>
                    <div className="text-white/50 text-sm leading-snug">
                      {option.desc}
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-[#7600F2] bg-[#7600F2]"
                        : "border-white/20"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 w-full max-w-2xl">
          {selectedOption ? (
            <Link to="/input" onClick={handleSaveToLocalStorage} className="block">
              <button className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] hover:brightness-110 transition-all shadow-lg shadow-[#7600F2]/20">
                Continue &rarr;
              </button>
            </Link>
          ) : (
            <button
              disabled
              className="w-full py-4 rounded-2xl font-bold text-lg bg-white/[0.05] text-white/30 border border-white/[0.07] cursor-not-allowed"
            >
              Select a type to continue
            </button>
          )}
        </div>

        <Link to="/upload" className="mt-5 text-white/30 hover:text-white/60 text-sm transition-colors">
          &larr; Back to input
        </Link>
      </div>
    </div>
  );
};

export default Question_Type;
