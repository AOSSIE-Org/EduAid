import React from "react";
import { FiX, FiAward, FiBookOpen } from "react-icons/fi";

const ModeSelector = ({ onSelect, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-md px-4">
            <div className="bg-[#02000F] border border-[#7600F2] p-8 rounded-3xl max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <FiX size={24} />
                </button>

                {/* Title */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">
                        <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">Choose your</span>
                        <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text"> Challenge</span>
                    </h2>
                    <p className="text-gray-400">Select a mode to start your quiz</p>
                </div>

                {/* Options */}
                <div className="grid gap-6">
                    {/* Practice Mode */}
                    <button
                        onClick={() => onSelect("practice")}
                        className="group flex items-center gap-6 p-6 bg-[#202838] bg-opacity-50 hover:bg-opacity-80 border border-gray-700 hover:border-[#00CBE7] rounded-2xl text-left transition-all duration-300"
                    >
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00CBE7] to-[#008080] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <FiBookOpen className="text-white text-3xl" />
                        </div>
                        <div>
                            <div className="text-[#00CBE7] font-bold text-xl mb-1">Practice Mode</div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Take your time with instant feedback after every answer. Perfect for learning!
                            </p>
                        </div>
                    </button>

                    {/* Test Mode */}
                    <button
                        onClick={() => onSelect("test")}
                        className="group flex items-center gap-6 p-6 bg-[#202838] bg-opacity-50 hover:bg-opacity-80 border border-gray-700 hover:border-[#FF005C] rounded-2xl text-left transition-all duration-300"
                    >
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF005C] to-[#7600F2] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <FiAward className="text-white text-3xl" />
                        </div>
                        <div>
                            <div className="text-[#FF005C] font-bold text-xl mb-1">Test Mode</div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Challenge yourself with a timed assessment and get a final score at the end.
                            </p>
                        </div>
                    </button>
                </div>

                {/* Cancel footer */}
                <p className="mt-8 text-center text-gray-500 text-sm">
                    Click outside or use the close button to go back
                </p>
            </div>
        </div>
    );
};

export default ModeSelector;
