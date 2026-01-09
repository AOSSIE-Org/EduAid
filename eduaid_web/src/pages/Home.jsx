import React, { useState, useEffect } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png"
import gitStar from "../assets/gitStar.png";
import { FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";
import { FileText, Mic, Zap, CheckCircle, CircleCheck } from "lucide-react";

const Home = () => {
  const [stars, setStars] = useState(null);
  const [error, setError] = useState("");

  async function fetchGitHubStars() {
    const response = await fetch("https://api.github.com/repos/AOSSIE-Org/EduAid");
    if (!response.ok) throw new Error("Failed to fetch stars");
    const data = await response.json();
    return data.stargazers_count;
  }

  function isMoreThanOneDayOld(timestamp) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Date.now() - timestamp > oneDay;
  }

  useEffect(() => {
    const storedStars = localStorage.getItem("stars");
    const storedTime = localStorage.getItem("fetchTime");

    if (storedStars && storedTime && !isMoreThanOneDayOld(parseInt(storedTime))) {
      setStars(parseInt(storedStars));
    } else {
      fetchGitHubStars()
        .then((starCount) => {
          setStars(starCount);
          localStorage.setItem("stars", starCount);
          localStorage.setItem("fetchTime", Date.now().toString());
        })
        .catch(() => setError("Failed to fetch stars"));
    }
  }, []);

  const features = [
    {
      icon: <FileText className="w-7 h-7" />,
      title: "Document Input",
      description: "Generate quizzes directly from uploaded documents.",
    },
    {
      icon: <Mic className="w-7 h-7" />,
      title: "Audio Input",
      description: "Turn lectures and audio into smart quiz questions.",
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: "AI-Powered Questions",
      description: "Create in-depth, contextual questions instantly.",
    },
    {
      icon: <CircleCheck className="w-7 h-7" />,
      title: "Google Form Integration",
      description: "Dynamically integrating google forms to generate quiz.",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo_trans} alt="logo" className="w-10" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              EduAid
            </span>
          </div>
          <Link to="/question-type">
            <button className="px-6 py-2 rounded-lg text-white bg-gradient-to-r from-[#FF005C] to-[#7600F2] hover:opacity-90 transition">
              Let's Get Started
            </button>
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-700 font-medium text-sm">
            <CheckCircle className="w-4 h-4" />
            AI Quiz Generator
          </div>

          <h1 className="text-6xl font-extrabold text-gray-900 leading-tight">
            Learn Smarter with{" "}
            <span className="bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              EduAid
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-xl">
            A tool that can auto-generate short quizzes based on user input
          </p>

          <div className="flex gap-4 flex-col sm:flex-row">
            <Link to="/question-type">
              <button className="px-8 py-4 text-white rounded-xl text-lg font-semibold bg-gradient-to-r from-[#FF005C] to-[#7600F2] hover:scale-105 transition">
                Start Now
              </button>
            </Link>
            <Link to="/history">
              <button className="px-8 py-4 rounded-xl text-lg font-semibold border border-gray-300 hover:border-[#7600F2] transition">
                View your History
              </button>
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF005C] to-[#00CBE7] opacity-20 blur-3xl rounded-3xl"></div>
            <img
              src={logo_trans}
              alt="AOSSIE Logo"
              className="relative w-64 opacity-95 lg:translate-x-32 translate-x-0"
            />
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">
              Key{" "}
              <span className="bg-gradient-to-r from-[#FF005C] to-[#00CBE7] text-transparent bg-clip-text">
                Features
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-slate-50 p-8 rounded-2xl border hover:shadow-lg transition"
              >
                <div className="w-14 h-14 mb-6 rounded-xl flex items-center justify-center text-white bg-gradient-to-r from-[#FF005C] to-[#7600F2]">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <a
          href="https://github.com/AOSSIE-Org/EduAid"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-4 px-6 py-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
        >
          <img src={gitStar} alt="star" width={28} />
          <span className="text-2xl font-semibold">
            {stars !== null ? stars : error}
          </span>
          <FaGithub size={28} />
        </a>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-10 text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} EduAid — AOSSIE
        </p>
      </footer>
    </div>
  );
};

export default Home;
