import React, { useState } from "react";
import "../../index.css";
import logo from "../../assets/aossie_logo.webp";
import stars from "../../assets/stars.png";
import { API_BASE_URL } from "../../config";

function GoogleFormInput({ onFormFetched }) {
    const [formUrl, setFormUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFetchForm = async () => {
        if (!formUrl.trim()) {
            setError("Please enter a Google Form URL");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/fetch_google_form`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ form_url: formUrl }),
            });

            const data = await response.json();

            if (data.success) {
                onFormFetched(data);
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

    return (
        <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient">
            <div className="flex items-end gap-[2px]">
                <img src={logo} alt="logo" className="w-16 my-4 ml-4 block" />
                <div className="text-2xl mb-3 font-extrabold">
                    <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                        Edu
                    </span>
                    <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                        Aid
                    </span>
                </div>
            </div>

            <div className="text-right mt-[-8px] mx-1">
                <div className="text-white text-sm font-bold">Google Forms Integration</div>
                <div className="text-white text-right justify-end flex gap-2 text-sm font-bold">
                    Fill out forms{" "}
                    <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                        directly in EduAid
                    </span>{" "}
                    <img className="h-[20px] w-[20px]" src={stars} alt="stars" />
                </div>
            </div>

            <div className="px-4 py-6">
                <div className="text-left mb-2 text-sm text-white">
                    Enter Google Form URL
                </div>
                <div className="relative bg-[#83b6cc40] rounded-xl p-3">
                    <input
                        type="text"
                        placeholder="https://docs.google.com/forms/d/..."
                        className="w-full px-4 py-3 bg-transparent text-lg rounded-xl outline-none text-white caret-white placeholder-gray-400/60"
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
                </div>

                {error && (
                    <div className="mt-3 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <div className="mt-6 flex justify-center gap-4">
                    <a href="/src/popup/popup.html">
                        <button className="bg-black items-center text-sm text-white px-6 py-3 border-gradient">
                            Back
                        </button>
                    </a>
                    <button
                        onClick={handleFetchForm}
                        disabled={loading}
                        className={`bg-black items-center text-sm text-white px-6 py-3 border-gradient flex ${loading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                    >
                        {loading ? (
                            <>
                                <div className="loader-small border-2 border-t-2 border-white rounded-full w-4 h-4 animate-spin mr-2"></div>
                                Fetching...
                            </>
                        ) : (
                            "Fetch Form"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GoogleFormInput;
