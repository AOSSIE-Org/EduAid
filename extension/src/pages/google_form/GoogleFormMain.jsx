import React, { useState } from "react";
import ReactDOM from "react-dom";
import "../../index.css";
import GoogleFormInput from "./GoogleFormInput";
import GoogleFormRenderer from "./GoogleFormRenderer";
import logo from "../../assets/aossie_logo.webp";

function GoogleFormMain() {
    const [currentStep, setCurrentStep] = useState("input"); // 'input', 'form', 'success'
    const [formData, setFormData] = useState(null);
    const [submissionData, setSubmissionData] = useState(null);

    const handleFormFetched = (data) => {
        setFormData(data);
        setCurrentStep("form");
    };

    const handleFormSubmit = (data) => {
        setSubmissionData(data);
        setCurrentStep("success");

        // Open the form in a new tab for final submission
        if (data.submission_url) {
            window.open(data.submission_url, '_blank');
        }
    };

    const handleReset = () => {
        setCurrentStep("input");
        setFormData(null);
        setSubmissionData(null);
    };

    const renderContent = () => {
        switch (currentStep) {
            case "input":
                return <GoogleFormInput onFormFetched={handleFormFetched} />;

            case "form":
                return (
                    <GoogleFormRenderer
                        formData={formData}
                        onSubmit={handleFormSubmit}
                        onBack={() => setCurrentStep("input")}
                    />
                );

            case "success":
                return (
                    <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient flex flex-col items-center justify-center px-4">
                        <div className="flex items-end gap-[2px] mb-6">
                            <img src={logo} alt="logo" className="w-16 block" />
                            <div className="text-2xl font-extrabold">
                                <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                                    Edu
                                </span>
                                <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                                    Aid
                                </span>
                            </div>
                        </div>

                        <div className="bg-[#83b6cc40] rounded-xl p-6 max-w-md text-center">
                            <div className="text-green-400 text-6xl mb-4">✓</div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                Form Opened!
                            </h2>
                            <p className="text-gray-300 text-sm mb-4">
                                {submissionData?.message ||
                                    "Your form has been opened in a new tab. Please complete your submission by clicking the submit button on the form."}
                            </p>
                            {submissionData?.note && (
                                <p className="text-gray-400 text-xs mb-4 italic">
                                    {submissionData.note}
                                </p>
                            )}
                            <div className="flex gap-4 justify-center mt-6">
                                <button
                                    onClick={handleReset}
                                    className="bg-black items-center text-sm text-white px-6 py-3 border-gradient"
                                >
                                    Fill Another Form
                                </button>
                                <a href="/src/popup/popup.html">
                                    <button className="bg-black items-center text-sm text-white px-6 py-3 border-gradient">
                                        Go Home
                                    </button>
                                </a>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="popup w-42rem h-35rem bg-[#02000F] flex justify-center items-center">
            {renderContent()}
        </div>
    );
}

ReactDOM.render(<GoogleFormMain />, document.getElementById("root"));
