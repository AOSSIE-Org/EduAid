import React from "react";
import ReactDOM from "react-dom";
import "../../index.css";
import logo from "../../assets/aossie_logo.webp";
import { FaInfoCircle } from "react-icons/fa";

function Landing() {
  return (
    <div className="min-h-screen bg-[#02000F] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[#0B1220] rounded-2xl p-8 shadow-lg">
        {/* Header */}
        <header className="flex items-center gap-4">
          <img src={logo} alt="AOSSIE" className="w-12 h-12" />
          <div className="text-2xl font-extrabold text-white flex items-baseline gap-2">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">Edu</span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">Aid</span>
          </div>
          <div className="ml-auto text-sm text-gray-400">v1.0</div>
        </header>

        {/* Main */}
        <main className="mt-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            Welcome to EduAid: Your AI Quiz Generator
          </h1>

          <p className="mt-4 text-gray-300 text-sm max-w-xl mx-auto">
            Generate quick quizzes from any content. Pick a question type, customise length
            and instantly get ready-to-use questions and answers.
          </p>

          {/* Info i-button */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="relative group inline-block">
              <button
                aria-label="About EduAid"
                className="p-2 rounded-full bg-[#182033] text-white hover:bg-[#243047] transition-colors"
              >
                <FaInfoCircle className="w-5 h-5" />
              </button>

              {/* Tooltip - appears on hover */}
              <div className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity absolute left-1/2 -translate-x-1/2 mt-3 w-64 bg-[#0F1720] text-sm text-gray-200 p-3 rounded-lg shadow-lg z-10">
                A tool that can auto-generate short quizzes on the basis of the content provided.
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="mt-8">
            <a href="/src/pages/home/home.html">
              <button className="px-8 py-3 rounded-2xl text-lg font-bold text-white bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] shadow-md hover:scale-[1.02] transition-transform">
                Start Using EduAid
              </button>
            </a>
          </div>

          <div className="mt-6 text-xs text-gray-400">
            Questions or suggestions? Reach out via email or join our Discord channel.
          </div>
        </main>
      </div>
    </div>
  );
}

ReactDOM.render(<Landing />, document.getElementById("root"));

export default Landing;
