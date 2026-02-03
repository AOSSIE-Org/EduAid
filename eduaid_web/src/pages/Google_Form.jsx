import React, { useState } from "react";
import "../index.css";

function GoogleFormIntegration() {
    const [currentStep, setCurrentStep] = useState("input"); // 'input', 'form', 'success'
    const [formData, setFormData] = useState(null);
    const [submissionData, setSubmissionData] = useState(null);
    const [formUrl, setFormUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [responses, setResponses] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Form Input handlers
    const handleFetchForm = async () => {
        if (!formUrl.trim()) {
            setError("Please enter a Google Form URL");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch("http://localhost:5000/fetch_google_form", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ form_url: formUrl }),
            });

            const data = await response.json();

            if (data.success) {
                setFormData(data);
                setCurrentStep("form");
            } else {
                setError(data.error || "Failed to fetch form");
            }
        } catch (err) {
            console.error("Error fetching form:", err);
            setError("Network error. Please ensure the backend server is running.");
        } finally {
            setLoading(false);
        }
    };

    // Form Renderer handlers
    const handleInputChange = (questionId, value) => {
        setResponses((prev) => ({
            ...prev,
            [questionId]: value,
        }));
        if (formErrors[questionId]) {
            setFormErrors((prev) => {
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
        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        const responsesArray = Object.entries(responses).map(
            ([questionId, answer]) => ({
                question_id: questionId,
                answer: answer,
            })
        );

        try {
            const response = await fetch(
                "http://localhost:5000/submit_to_google_form",
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
                setSubmissionData(data);
                setCurrentStep("success");
                if (data.submission_url) {
                    window.open(data.submission_url, '_blank');
                }
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

    const handleReset = () => {
        setCurrentStep("input");
        setFormData(null);
        setSubmissionData(null);
        setFormUrl("");
        setResponses({});
        setFormErrors({});
    };

    // Render question based on type
    const renderQuestion = (question) => {
        const hasError = formErrors[question.id];

        switch (question.type) {
            case "text":
            case "paragraph":
                return (
                    <div key={question.id} className="mb-6">
                        <label className="block text-white text-sm font-medium mb-2">
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
                                className={`w-full px-4 py-3 bg-[#1a1f2e] text-white rounded-lg outline-none resize-none focus:ring-2 focus:ring-purple-500 ${hasError ? "border-2 border-red-500" : ""
                                    }`}
                                rows={4}
                                value={responses[question.id] || ""}
                                onChange={(e) => handleInputChange(question.id, e.target.value)}
                                placeholder="Your answer"
                            />
                        ) : (
                            <input
                                type="text"
                                className={`w-full px-4 py-3 bg-[#1a1f2e] text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500 ${hasError ? "border-2 border-red-500" : ""
                                    }`}
                                value={responses[question.id] || ""}
                                onChange={(e) => handleInputChange(question.id, e.target.value)}
                                placeholder="Your answer"
                            />
                        )}
                        {hasError && (
                            <p className="text-red-400 text-xs mt-1">{formErrors[question.id]}</p>
                        )}
                    </div>
                );

            case "multiple_choice":
                return (
                    <div key={question.id} className="mb-6">
                        <label className="block text-white text-sm font-medium mb-2">
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
                                    className="flex items-center px-4 py-3 bg-[#1a1f2e] rounded-lg cursor-pointer hover:bg-[#252b3d] transition"
                                >
                                    <input
                                        type="radio"
                                        name={question.id}
                                        value={option}
                                        checked={responses[question.id] === option}
                                        onChange={(e) =>
                                            handleInputChange(question.id, e.target.value)
                                        }
                                        className="mr-3 accent-purple-500"
                                    />
                                    <span className="text-white text-sm">{option}</span>
                                </label>
                            ))}
                        </div>
                        {hasError && (
                            <p className="text-red-400 text-xs mt-1">{formErrors[question.id]}</p>
                        )}
                    </div>
                );

            case "checkbox":
                return (
                    <div key={question.id} className="mb-6">
                        <label className="block text-white text-sm font-medium mb-2">
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
                                    className="flex items-center px-4 py-3 bg-[#1a1f2e] rounded-lg cursor-pointer hover:bg-[#252b3d] transition"
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
                                        className="mr-3 accent-purple-500"
                                    />
                                    <span className="text-white text-sm">{option}</span>
                                </label>
                            ))}
                        </div>
                        {hasError && (
                            <p className="text-red-400 text-xs mt-1">{formErrors[question.id]}</p>
                        )}
                    </div>
                );

            case "dropdown":
                return (
                    <div key={question.id} className="mb-6">
                        <label className="block text-white text-sm font-medium mb-2">
                            {question.title}
                            {question.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {question.description && (
                            <p className="text-gray-400 text-xs mb-2">
                                {question.description}
                            </p>
                        )}
                        <select
                            className={`w-full px-4 py-3 bg-[#1a1f2e] text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500 ${hasError ? "border-2 border-red-500" : ""
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
                            <p className="text-red-400 text-xs mt-1">{formErrors[question.id]}</p>
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

    // Render current step
    const renderContent = () => {
        switch (currentStep) {
            case "input":
                return (
                    <div className="max-w-2xl mx-auto p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold mb-2">
                                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-transparent bg-clip-text">
                                    Google Forms Integration
                                </span>
                            </h1>
                            <p className="text-gray-400 text-sm">
                                Fill out Google Forms directly in EduAid
                            </p>
                        </div>

                        <div className="bg-[#1a1f2e] rounded-xl p-6 shadow-xl">
                            <label className="block text-white text-sm font-medium mb-3">
                                Enter Google Form URL
                            </label>
                            <input
                                type="text"
                                placeholder="https://docs.google.com/forms/d/..."
                                className="w-full px-4 py-3 bg-[#0f1419] text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                                value={formUrl}
                                onChange={(e) => {
                                    setFormUrl(e.target.value);
                                    setError("");
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        handleFetchForm();
                                    }
                                }}
                            />

                            {error && (
                                <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => window.history.back()}
                                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleFetchForm}
                                    disabled={loading}
                                    className={`px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg font-medium transition ${loading ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"
                                        }`}
                                >
                                    {loading ? "Fetching..." : "Fetch Form"}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case "form":
                return (
                    <div className="max-w-3xl mx-auto p-8">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {formData.title}
                            </h1>
                            {formData.description && (
                                <p className="text-gray-400 text-sm">{formData.description}</p>
                            )}
                        </div>

                        <div className="bg-[#1a1f2e] rounded-xl p-6 shadow-xl mb-6">
                            {formData.questions.map((question) => renderQuestion(question))}
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setCurrentStep("input")}
                                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={`px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg font-medium transition ${submitting ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"
                                    }`}
                            >
                                {submitting ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>
                );

            case "success":
                return (
                    <div className="max-w-2xl mx-auto p-8">
                        <div className="bg-[#1a1f2e] rounded-xl p-8 shadow-xl text-center">
                            <div className="text-green-400 text-7xl mb-6">✓</div>
                            <h2 className="text-3xl font-bold text-white mb-4">
                                Form Opened!
                            </h2>
                            <p className="text-gray-300 mb-4">
                                {submissionData?.message ||
                                    "Your form has been opened in a new tab. Please complete your submission by clicking the submit button on the form."}
                            </p>
                            {submissionData?.note && (
                                <p className="text-gray-400 text-sm mb-6 italic">
                                    {submissionData.note}
                                </p>
                            )}
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handleReset}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition"
                                >
                                    Fill Another Form
                                </button>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                                >
                                    Go Home
                                </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#1a1f2e] to-[#0a0e1a] py-8">
            {renderContent()}
        </div>
    );
}

export default GoogleFormIntegration;
