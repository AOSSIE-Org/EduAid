import React, { useState, useEffect } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";

const Review = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [reviewData, setReviewData] = useState({
        text: "",
        difficulty: "",
        numQuestions: 0,
        questionType: "",
        useWikipedia: false,
        inputSource: "Text"
    });

    useEffect(() => {
        const text = localStorage.getItem("textContent") || "";
        const difficulty = localStorage.getItem("difficulty") || "Easy Difficulty";
        const numQuestions = parseInt(localStorage.getItem("numQuestions")) || 10;
        const questionType = localStorage.getItem("selectedQuestionType") || "";
        const useWikipedia = localStorage.getItem("useWikipedia") === "1";

        let inputSource = "Text";
        if (text.includes("uploaded file") || text.includes("Error uploading")) {
            inputSource = "File Upload";
        } else if (text.includes("Google Doc")) {
            inputSource = "Google Doc URL";
        }

        setReviewData({
            text,
            difficulty,
            numQuestions,
            questionType,
            useWikipedia,
            inputSource
        });

        if (!text || !questionType) {
            navigate("/input");
        }
    }, [navigate]);

    const getQuestionTypeLabel = (type) => {
        const types = {
            get_shortq: "Short-Answer Type Questions",
            get_mcq: "Multiple Choice Questions",
            get_boolq: "True/False Questions",
            get_problems: "All Questions"
        };
        return types[type] || type;
    };

    const getEndpoint = (difficulty, questionType) => {
        if (difficulty !== "Easy Difficulty") {
            if (questionType === "get_shortq") {
                return "get_shortq_hard";
            } else if (questionType === "get_mcq") {
                return "get_mcq_hard";
            }
        }
        return questionType;
    };

    const handleConfirmGenerate = async () => {
        setLoading(true);
        const endpoint = getEndpoint(reviewData.difficulty, reviewData.questionType);

        try {
            const requestData = {
                input_text: reviewData.text,
                max_questions: reviewData.numQuestions,
                use_mediawiki: reviewData.useWikipedia ? 1 : 0,
            };

            const responseData = await apiClient.post(`/${endpoint}`, requestData);
            localStorage.setItem("qaPairs", JSON.stringify(responseData));

            const quizDetails = {
                difficulty: reviewData.difficulty,
                numQuestions: reviewData.numQuestions,
                date: new Date().toLocaleDateString(),
                qaPair: responseData,
            };

            let last5Quizzes = JSON.parse(localStorage.getItem("last5Quizzes")) || [];
            last5Quizzes.push(quizDetails);
            if (last5Quizzes.length > 5) {
                last5Quizzes.shift();
            }
            localStorage.setItem("last5Quizzes", JSON.stringify(last5Quizzes));

            navigate("/output");
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="popup bg-[#02000F] bg-custom-gradient min-h-screen">
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-black">
                    <div className="loader border-4 border-t-4 border-white rounded-full w-16 h-16 animate-spin"></div>
                </div>
            )}

            <div className={`w-full h-full bg-cust bg-opacity-50 ${loading ? "pointer-events-none" : ""}`}>
                <Link to="/" className="block">
                    <div className="flex items-end gap-2 p-4">
                        <img src={logo_trans} alt="logo" className="w-20 sm:w-24" />
                        <div className="text-3xl sm:text-4xl font-extrabold">
                            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">Edu</span>
                            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">Aid</span>
                        </div>
                    </div>
                </Link>

                <div className="text-white text-center mx-4 sm:mx-8 mb-6">
                    <div className="text-2xl sm:text-3xl font-bold">Review Your Configuration</div>
                    <p className="text-lg sm:text-xl mt-2">Please confirm the details before generating questions</p>
                </div>

                <div className="max-w-3xl mx-auto px-4 sm:px-8">
                    <div className="bg-[#83b6cc40] rounded-2xl p-6 space-y-4">
                        <div className="border-b border-gray-600 pb-4">
                            <div className="text-[#E4E4E4] text-sm sm:text-base mb-1">Input Source</div>
                            <div className="text-white text-lg sm:text-xl font-semibold">{reviewData.inputSource}</div>
                        </div>

                        <div className="border-b border-gray-600 pb-4">
                            <div className="text-[#E4E4E4] text-sm sm:text-base mb-1">Question Type</div>
                            <div className="text-white text-lg sm:text-xl font-semibold">
                                {getQuestionTypeLabel(reviewData.questionType)}
                            </div>
                        </div>

                        <div className="border-b border-gray-600 pb-4">
                            <div className="text-[#E4E4E4] text-sm sm:text-base mb-1">Number of Questions</div>
                            <div className="text-white text-lg sm:text-xl font-semibold">{reviewData.numQuestions}</div>
                        </div>

                        <div className="border-b border-gray-600 pb-4">
                            <div className="text-[#E4E4E4] text-sm sm:text-base mb-1">Difficulty Level</div>
                            <div className="text-white text-lg sm:text-xl font-semibold">{reviewData.difficulty}</div>
                        </div>

                        <div className="pb-2">
                            <div className="text-[#E4E4E4] text-sm sm:text-base mb-1">Use Wikipedia</div>
                            <div className="text-white text-lg sm:text-xl font-semibold">
                                {reviewData.useWikipedia ? "Yes" : "No"}
                            </div>
                        </div>

                        {reviewData.text && (
                            <div className="pt-4 border-t border-gray-600">
                                <div className="text-[#E4E4E4] text-sm sm:text-base mb-2">Content Preview</div>
                                <div className="text-white text-sm sm:text-base bg-[#1a1a2e] p-4 rounded-lg max-h-32 overflow-y-auto">
                                    {reviewData.text.substring(0, 200)}
                                    {reviewData.text.length > 200 && "..."}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-6 mt-8 pb-10">
                        <Link to="/input">
                            <button className="bg-black text-white text-lg sm:text-xl px-6 py-3 border-gradient rounded-xl w-full sm:w-auto">
                                Back to Edit
                            </button>
                        </Link>
                        <button
                            onClick={handleConfirmGenerate}
                            disabled={loading}
                            className={`text-white text-lg sm:text-xl px-6 py-3 rounded-xl w-full sm:w-auto ${loading
                                    ? "bg-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] hover:brightness-110"
                                }`}
                        >
                            {loading ? "Generating..." : "Confirm & Generate"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Review;
