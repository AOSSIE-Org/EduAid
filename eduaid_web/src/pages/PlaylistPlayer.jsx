import React, { useState, useEffect } from "react";
import "../index.css";
import logoPNG from "../assets/aossie_logo_transparent.png";
import { Link, useParams, useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const PlaylistPlayer = () => {
    const { playlistId } = useParams();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState(null);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchPlaylist();
    }, [playlistId]);

    const fetchPlaylist = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/playlists/${playlistId}`);

            if (response.success) {
                setPlaylist(response.data);

                if (response.data.quizzes.length === 0) {
                    setError("This playlist is empty");
                }
            }
        } catch (err) {
            console.error("Failed to fetch playlist:", err);
            setError("Failed to load playlist");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentQuizIndex < playlist.quizzes.length - 1) {
            setCurrentQuizIndex(currentQuizIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuizIndex > 0) {
            setCurrentQuizIndex(currentQuizIndex - 1);
        }
    };

    const handleFinish = () => {
        navigate("/playlists");
    };

    if (loading) {
        return (
            <div className="w-screen h-screen bg-[#02000F] flex justify-center items-center">
                <div className="text-white text-xl">Loading playlist...</div>
            </div>
        );
    }

    if (error || !playlist) {
        return (
            <div className="w-screen h-screen bg-[#02000F] flex flex-col justify-center items-center">
                <div className="text-white text-xl mb-4">{error || "Playlist not found"}</div>
                <Link to="/playlists">
                    <button className="bg-[#7C3AED] text-white px-6 py-2 rounded-lg">
                        Back to Playlists
                    </button>
                </Link>
            </div>
        );
    }

    const currentQuiz = playlist.quizzes[currentQuizIndex];
    const qaPairs = currentQuiz.quiz_data.output || [];

    return (
        <div className="popup w-full h-full bg-[#02000F] flex justify-center items-center">
            <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <Link to="/playlists">
                        <div className="flex items-end gap-[2px] px-4 sm:px-6">
                            <img src={logoPNG} alt="logo" className="w-12 sm:w-16 my-4 block" />
                            <div className="text-xl sm:text-2xl mb-3 font-extrabold">
                                <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                                    Edu
                                </span>
                                <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                                    Aid
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Playlist Info */}
                    <div className="px-4 sm:px-6 mb-4">
                        <div className="text-white text-lg sm:text-xl font-bold">
                            {playlist.name}
                        </div>
                        <div className="text-gray-400 text-sm">
                            Quiz {currentQuizIndex + 1} of {playlist.quizzes.length}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-4 sm:px-6 mb-4">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] h-2 rounded-full transition-all duration-300"
                                style={{
                                    width: `${((currentQuizIndex + 1) / playlist.quizzes.length) * 100}%`,
                                }}
                            ></div>
                        </div>
                    </div>

                    {/* Questions Container */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide px-2 sm:px-4">
                        {qaPairs.map((qaPair, index) => (
                            <div
                                key={index}
                                className="px-3 sm:px-4 bg-[#d9d9d90d] border-black border my-2 sm:my-3 mx-1 sm:mx-2 rounded-xl py-3 sm:py-4"
                            >
                                <div className="text-[#E4E4E4] text-xs sm:text-sm mb-2">
                                    Question {index + 1}
                                </div>

                                <div className="text-[#FFF4F4] text-sm sm:text-base my-1 sm:my-2 leading-relaxed">
                                    {qaPair.question || qaPair.question_statement || qaPair}
                                </div>

                                {qaPair.answer && (
                                    <>
                                        <div className="text-[#E4E4E4] text-xs sm:text-sm mt-3 sm:mt-4">
                                            Answer
                                        </div>
                                        <div className="text-[#FFF4F4] text-sm sm:text-base leading-relaxed">
                                            {qaPair.answer}
                                        </div>
                                    </>
                                )}

                                {qaPair.options && qaPair.options.length > 0 && (
                                    <div className="text-[#FFF4F4] text-sm sm:text-base mt-2 sm:mt-3">
                                        {qaPair.options.map((option, idx) => (
                                            <div key={idx} className="mb-1 sm:mb-2">
                                                <span className="text-[#E4E4E4] text-xs sm:text-sm">
                                                    Option {idx + 1}:
                                                </span>{" "}
                                                <span className="text-[#FFF4F4] text-sm sm:text-base">
                                                    {option}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center px-4 sm:px-6 py-4">
                        <button
                            onClick={handlePrevious}
                            disabled={currentQuizIndex === 0}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${currentQuizIndex === 0
                                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                    : "bg-[#518E8E] hover:bg-[#3a6b6b] text-white"
                                }`}
                        >
                            <FiChevronLeft /> Previous
                        </button>

                        {currentQuizIndex === playlist.quizzes.length - 1 ? (
                            <button
                                onClick={handleFinish}
                                className="bg-[#7C3AED] hover:bg-[#5A2AD9] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                            >
                                Finish
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 bg-[#518E8E] hover:bg-[#3a6b6b] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                            >
                                Next <FiChevronRight />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaylistPlayer;
