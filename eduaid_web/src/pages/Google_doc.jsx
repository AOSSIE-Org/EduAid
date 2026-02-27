import React, { useState } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png";
import { Link } from "react-router-dom";

const GoogleDocViewer = () => {
    const [url, setUrl] = useState("");
    const [iframeUrl, setIframeUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleUrlSubmit = () => {
        if (!url.trim()) {
            setError("Please enter a Google Doc or Form URL");
            return;
        }

        setLoading(true);
        setError("");
        setIframeUrl("");

        // Simple validation and transformation
        let embedUrl = url;
        try {
            if (url.includes("docs.google.com")) {
                // If it's a form, ensure it's in viewform mode for users
                if (url.includes("/forms/") && !url.includes("embedded=true")) {
                    // Forms are usually fine as is, but let's make sure it's viewform
                    // If the user pastes an edit link, we might want to warn or try to switch to viewform
                    // For now, let's just pass it through or add embedded=true if needed
                    // embedUrl = url; 
                }
                // If it's a doc, maybe add /preview
                if (url.includes("/document/") && !url.includes("/preview")) {
                    // embedUrl = url.replace(/\/edit.*$/, "/preview");
                }

                // For general embedding saftey
                setIframeUrl(embedUrl);
            } else {
                setError("Invalid URL. Please use a valid Google Docs or Forms URL.");
                setLoading(false);
            }
        } catch (err) {
            setError("Error parsing URL");
            setLoading(false);
        }
    };

    const handleIframeLoad = () => {
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#02000F] text-white flex flex-col p-6">
            {/* Header */}
            <Link to="/" className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <img
                    src={logo_trans}
                    alt="logo"
                    className="w-20 sm:w-24 object-contain"
                />
                <div className="text-4xl sm:text-5xl font-extrabold text-center sm:text-left">
                    <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                        Edu
                    </span>
                    <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                        Aid
                    </span>
                </div>
            </Link>

            <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold mb-4">Google Doc/Form Viewer</h1>
                    <div className="flex gap-4 justify-center">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste Google Form or Doc URL here..."
                            className="w-full max-w-xl px-4 py-3 bg-[#1a1f2e] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#00CBE7]"
                        />
                        <button
                            onClick={handleUrlSubmit}
                            className="px-6 py-3 bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-white rounded-lg font-bold hover:opacity-90 transition"
                        >
                            Load
                        </button>
                    </div>
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>

                {/* Iframe Container */}
                <div className="w-full h-[85vh] bg-white rounded-xl overflow-hidden relative shadow-2xl border border-gray-700">
                    {iframeUrl ? (
                        <>
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1f2e] z-10">
                                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00CBE7]"></div>
                                </div>
                            )}
                            <iframe
                                src={iframeUrl}
                                title="Google Doc Viewer"
                                className="w-full h-full border-0"
                                onLoad={handleIframeLoad}
                                onError={() => { setLoading(false); setError("Failed to load content."); }}
                                allow="autoplay"
                            />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#1a1f2e]">
                            <img src={logo_trans} alt="Logo" className="w-24 opacity-20 mb-4" />
                            <p className="text-xl">Enter a URL above to load the content</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-center">
                    <Link to="/question-type">
                        <button className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition shadow-lg">
                            ← Back to Selection
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default GoogleDocViewer;
