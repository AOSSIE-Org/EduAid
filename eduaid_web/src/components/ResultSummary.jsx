import React from "react";
import { FiAward, FiRotateCcw, FiHome } from "react-icons/fi";
import { Link } from "react-router-dom";

const ResultSummary = ({ questions, userAnswers, onRestart }) => {
    const score = questions.reduce((acc, q, idx) => {
        return acc + (userAnswers[idx] === q.answer ? 1 : 0);
    }, 0);

    const percentage = Math.round((score / questions.length) * 100);

    return (
        <div className="w-full max-w-2xl bg-[#202838] bg-opacity-60 border border-[#7600F2] p-10 rounded-3xl backdrop-blur-md shadow-2xl text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-gradient-to-br from-[#FF005C] to-[#7600F2] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#7600F2]/20">
                <FiAward className="text-white text-5xl" />
            </div>

            <h1 className="text-white text-4xl font-extrabold mb-2">Quiz Complete!</h1>
            <p className="text-gray-400 text-lg mb-8">Here is how you performed</p>

            <div className="grid grid-cols-2 gap-4 mb-10 text-left">
                <div className="bg-black bg-opacity-30 p-6 rounded-2xl border border-gray-800">
                    <div className="text-[#00CBE7] text-sm font-bold uppercase mb-1">Score</div>
                    <div className="text-white text-3xl font-bold">{score} / {questions.length}</div>
                </div>
                <div className="bg-black bg-opacity-30 p-6 rounded-2xl border border-gray-800">
                    <div className="text-[#FF005C] text-sm font-bold uppercase mb-1">Accuracy</div>
                    <div className="text-white text-3xl font-bold">{percentage}%</div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={onRestart}
                    className="flex items-center gap-2 px-8 py-3 bg-[#7600F2] hover:bg-[#5A2AD9] text-white font-bold rounded-xl transition-all hover:scale-105"
                >
                    <FiRotateCcw /> Try Again
                </button>
                <Link to="/output">
                    <button className="flex items-center gap-2 px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all hover:scale-105 w-full sm:w-auto justify-center">
                        <FiHome /> Back to Review
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default ResultSummary;
