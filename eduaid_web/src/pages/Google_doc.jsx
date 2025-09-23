import React, { useState } from "react";
import logo_trans from "../assets/aossie_logo_transparent.png";
import "../index.css";
import { Link } from "react-router-dom";

function GoogleDocViewer() {
  const [url, setUrl] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // loader state

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setIframeUrl("");
    setLoading(true); // start loader

    try {
      const trimmedUrl = url.trim();

      if (trimmedUrl.includes("/forms/")) {
        const match = trimmedUrl.match(/\/d\/e\/([a-zA-Z0-9-_]+)\//);
        if (!match) {
          setError("Invalid Google Form URL");
          setLoading(false);
          return;
        }
        const formId = match[1];
        const formUrl = `https://docs.google.com/forms/d/e/${formId}/viewform?embedded=true`;
        setIframeUrl(formUrl);
      } else if (trimmedUrl.includes("/document/")) {
        const match = trimmedUrl.match(/\/d\/([a-zA-Z0-9-_]+)(\/|$)/);
        if (!match) {
          setError("Invalid Google Doc URL");
          setLoading(false);
          return;
        }
        const docId = match[1];
        const docUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;
        setIframeUrl(docUrl);
        console.log(docUrl)
      } else {
        setError("URL must be a Google Doc or Form link");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong, check the URL.");
      setLoading(false);
    }
  };

  return (
    <div className="popup w-full min-h-screen bg-[#02000F] flex justify-center items-center ">
          <div className="w-full min-h-screen bg-cust bg-opacity-50 bg-custom-gradient shadow-lg sm:p-10 top-0">
            <Link
              to="/"
              className="flex flex-col sm:flex-row items-center gap-4 mb-6"
            >
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
    <div className="relative z-10 h-full overflow-auto p-6 sm:p-10 flex flex-col items-center">
        <h2 className="text-white text-4xl font-extrabold mb-6 text-center">
          Dynamic Google Docs / Form Integration
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 w-full max-w-2xl"
        >
          <label className="text-white text-lg text-center">
            Paste Google Doc or Form URL:
          </label>
          <input
            type="url"
            placeholder="https://docs.google.com/document/.."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="px-4 py-2 rounded-lg w-full bg-[#1e293b] text-white outline-none"
            required
          />
          <button
            type="submit"
            className="bg-[#405EED] hover:bg-[#01CBE7] text-white px-6 py-3 rounded-lg font-medium transition duration-200"
          >
            Load
          </button>
        </form>

        {error && <div className="mt-4 text-red-400">{error}</div>}
        {loading && (
          <div className="mt-8 text-white text-lg animate-pulse">
            Loading...
          </div>
        )}
        {iframeUrl && (
          <div className="mt-8 w-full max-w-3xl">
            <iframe
              src={iframeUrl}
              width="100%"
              height="800px"
              className="rounded-lg shadow-lg border-0"
              title="Google Doc/Form"
              onLoad={() => setLoading(false)} // stop loader when iframe loads
            ></iframe>
          </div>
        )}
      </div>
          </div>
        </div>
  );
}

export default GoogleDocViewer;
