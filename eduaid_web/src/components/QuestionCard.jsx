import React from "react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

const QuestionCard = ({ question, onAnswer, selectedAnswer, mode }) => {
    const isSelected = selectedAnswer !== null;
    const options = question.options || ["True", "False"];

    return (
        <div className="w-full max-w-2xl bg-[#202838] bg-opacity-40 border border-[#7600F2] p-8 rounded-3xl backdrop-blur-sm shadow-xl animate-in slide-in-from-right duration-500">
            <div className="mb-6">
                <span className="text-xs font-bold text-[#00CBE7] tracking-widest uppercase">
                    {question.question_type || "Multiple Choice"}
                </span>
                <h2 className="text-white text-xl sm:text-2xl font-semibold mt-2 leading-relaxed">
                    {question.question}
                </h2>
            </div>

            <div className="grid gap-4">
                {options.map((option, index) => {
                    const isCorrect = option === question.answer;
                    const isUserChoice = selectedAnswer === option;

                    let borderClass = "border-gray-700";
                    let bgClass = "bg-black bg-opacity-20";
                    let feedback = null;

                    if (isSelected) {
                        if (mode === "practice") {
                            if (isCorrect) {
                                borderClass = "border-green-500";
                                bgClass = "bg-green-500 bg-opacity-10";
                            } else if (isUserChoice) {
                                borderClass = "border-red-500";
                                bgClass = "bg-red-500 bg-opacity-10";
                            }
                        } else {
                            // Test Mode: Just highlight selection
                            if (isUserChoice) {
                                borderClass = "border-[#7600F2]";
                                bgClass = "bg-[#7600F2] bg-opacity-20";
                            }
                        }
                    }

                    return (
                        <button
                            key={index}
                            disabled={isSelected}
                            onClick={() => onAnswer(option)}
                            className={`group w-full p-4 rounded-xl border ${borderClass} ${bgClass} transition-all duration-300 flex items-center justify-between text-left hover:border-[#00CBE7]`}
                        >
                            <span className="text-gray-200">{option}</span>
                            {isSelected && mode === "practice" && (
                                <>
                                    {isCorrect && <FiCheckCircle className="text-green-500 text-xl" />}
                                    {isUserChoice && !isCorrect && <FiXCircle className="text-red-500 text-xl" />}
                                </>
                            )}
                        </button>
                    );
                })}
            </div>

            {isSelected && mode === "practice" && (
                <div className="mt-8 p-4 rounded-2xl bg-[#02000F] border border-gray-800 animate-in fade-in duration-700">
                    <div className="text-[#00CBE7] text-xs font-bold mb-2 uppercase">Explanation / Correct Answer</div>
                    <p className="text-gray-300 text-sm">
                        The correct answer is <span className="text-white font-bold">{question.answer}</span>.
                    </p>
                </div>
            )}
        </div>
    );
};

export default QuestionCard;
