import React, { useState } from "react";
import "../../index.css";
import { API_BASE_URL } from "../../config";

function GoogleFormRenderer({ formData, onSubmit, onBack }) {
    const [responses, setResponses] = useState({});
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const handleInputChange = (questionId, value) => {
        setResponses((prev) => ({
            ...prev,
            [questionId]: value,
        }));
        // Clear error when user starts typing
        if (errors[questionId]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[questionId];
                return newErrors;
            });
        }
    };

    const handleCheckboxChange = (questionId, optionValue, isChecked) => {
        setResponses((prev) => {
            const currentValues = prev[questionId] || [];
            if (isChecked) {
                return { ...prev, [questionId]: [...currentValues, optionValue] };
            } else {
                return {
                    ...prev,
                    [questionId]: currentValues.filter((v) => v !== optionValue),
                };
            }
        });

        // Clear error when user changes checkbox
        if (errors[questionId]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[questionId];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        formData.questions.forEach((question) => {
            if (question.required) {
                const response = responses[question.id];
                if (!response || (Array.isArray(response) && response.length === 0)) {
                    newErrors[question.id] = "This question is required";
                }
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        // Convert responses to array format
        const responsesArray = Object.entries(responses).map(
            ([questionId, answer]) => ({
                question_id: questionId,
                answer: answer,
            })
        );

        try {
            const response = await fetch(
                `${API_BASE_URL}/submit_to_google_form`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        form_id: formData.form_id,
                        responses: responsesArray,
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                onSubmit(data);
            } else {
                alert("Error: " + (data.error || "Failed to submit form"));
            }
        } catch (err) {
            console.error("Error submitting form:", err);
            alert("Network error. Please ensure the backend server is running.");
        } finally {
            setSubmitting(false);
        }
    };

    const renderQuestion = (question) => {
        const hasError = errors[question.id];

        switch (question.type) {
            case "text":
            case "paragraph":
                return (
                    <div key={question.id} className="mb-6">
                        <label className="block text-white text-sm mb-2">
                            {question.title}
                            {question.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {question.description && (
                            <p className="text-gray-400 text-xs mb-2">
                                {question.description}
                            </p>
                        )}
                        {question.type === "paragraph" ? (
                            <textarea
                                className={`w-full px-4 py-3 bg-[#202838] text-white rounded-xl outline-none resize-none ${hasError ? "border-2 border-red-500" : ""
                                    }`}
                                rows={4}
                                value={responses[question.id] || ""}
                                onChange={(e) => handleInputChange(question.id, e.target.value)}
                                placeholder="Your answer"
                            />
                        ) : (
                            <input
                                type="text"
                                className={`w-full px-4 py-3 bg-[#202838] text-white rounded-xl outline-none ${hasError ? "border-2 border-red-500" : ""
                                    }`}
                                value={responses[question.id] || ""}
                                onChange={(e) => handleInputChange(question.id, e.target.value)}
                                placeholder="Your answer"
                            />
                        )}
                        {hasError && (
                            <p className="text-red-400 text-xs mt-1">{errors[question.id]}</p>
                        )}
                    </div>
                );

            case "multiple_choice":
                return (
                    <div key={question.id} className="mb-6">
                        <label className="block text-white text-sm mb-2">
                            {question.title}
                            {question.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {question.description && (
                            <p className="text-gray-400 text-xs mb-2">
                                {question.description}
                            </p>
                        )}
                        <div className="space-y-2">
                            {question.options.map((option, idx) => (
                                <label
                                    key={idx}
                                    className="flex items-center px-4 py-2 bg-[#202838] rounded-lg cursor-pointer hover:bg-[#2a3442] transition"
                                >
                                    <input
                                        type="radio"
                                        name={question.id}
                                        value={option}
                                        checked={responses[question.id] === option}
                                        onChange={(e) =>
                                            handleInputChange(question.id, e.target.value)
                                        }
                                        className="mr-3"
                                    />
                                    <span className="text-white text-sm">{option}</span>
                                </label>
                            ))}
                        </div>
                        {hasError && (
                            <p className="text-red-400 text-xs mt-1">{errors[question.id]}</p>
                        )}
                    </div>
                );

            case "checkbox":
                return (
                    <div key={question.id} className="mb-6">
                        <label className="block text-white text-sm mb-2">
                            {question.title}
                            {question.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {question.description && (
                            <p className="text-gray-400 text-xs mb-2">
                                {question.description}
                            </p>
                        )}
                        <div className="space-y-2">
                            {question.options.map((option, idx) => (
                                <label
                                    key={idx}
                                    className="flex items-center px-4 py-2 bg-[#202838] rounded-lg cursor-pointer hover:bg-[#2a3442] transition"
                                >
                                    <input
                                        type="checkbox"
                                        value={option}
                                        checked={(responses[question.id] || []).includes(option)}
                                        onChange={(e) =>
                                            handleCheckboxChange(
                                                question.id,
                                                option,
                                                e.target.checked
                                            )
                                        }
                                        className="mr-3"
                                    />
                                    <span className="text-white text-sm">{option}</span>
                                </label>
                            ))}
                        </div>
                        {hasError && (
                            <p className="text-red-400 text-xs mt-1">{errors[question.id]}</p>
                        )}
                    </div>
                );

            case "dropdown":
                return (
                    <div key={question.id} className="mb-6">
                        <label className="block text-white text-sm mb-2">
                            {question.title}
                            {question.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {question.description && (
                            <p className="text-gray-400 text-xs mb-2">
                                {question.description}
                            </p>
                        )}
                        <select
                            className={`w-full px-4 py-3 bg-[#202838] text-white rounded-xl outline-none ${hasError ? "border-2 border-red-500" : ""
                                }`}
                            value={responses[question.id] || ""}
                            onChange={(e) => handleInputChange(question.id, e.target.value)}
                        >
                            <option value="">Choose</option>
                            {question.options.map((option, idx) => (
                                <option key={idx} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        {hasError && (
                            <p className="text-red-400 text-xs mt-1">{errors[question.id]}</p>
                        )}
                    </div>
                );

            default:
                return (
                    <div key={question.id} className="mb-6">
                        <p className="text-gray-400 text-sm">
                            Unsupported question type: {question.type}
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient overflow-y-auto">
            <div className="px-4 py-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {formData.title}
                    </h2>
                    {formData.description && (
                        <p className="text-gray-300 text-sm">{formData.description}</p>
                    )}
                </div>

                <div className="bg-[#83b6cc20] rounded-xl p-4 mb-6">
                    {formData.questions.map((question) => renderQuestion(question))}
                </div>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={onBack}
                        className="bg-black items-center text-sm text-white px-6 py-3 border-gradient"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={`bg-black items-center text-sm text-white px-6 py-3 border-gradient ${submitting ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                    >
                        {submitting ? "Submitting..." : "Submit"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GoogleFormRenderer;
