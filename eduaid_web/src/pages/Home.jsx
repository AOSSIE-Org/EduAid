import React, { useState, useEffect } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png"
import starsImg from "../assets/stars.png";
import arrow from "../assets/arrow.png";
import gitStar from "../assets/gitStar.png";
import { FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Star, Github } from "lucide-react";
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
    "Doc/Audio Input",
    "In-depth questions gen",
    "Dynamic Google Form Integration",
  ];
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="min-h-screen w-full overflow-auto px-4 py-6 sm:px-8 md:px-16">
        <div className="max-w-5xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 my-4 sm:my-6">
            <div className="w-18 h-18  sm:w-12 sm:h-12 flex items-center justify-center">
              <img src={logo_trans} alt="" />
            </div>
            <span className="text-lg sm:text-xl font-bold font-display text-foreground">
              AOSSIE
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center font-extrabold leading-tight mt-8 sm:mt-12">
            <span className="gradient-text">EduAid</span>
          </h1>

          {/* Subtitle */}
          <div className="text-muted-foreground text-base sm:text-lg md:text-xl text-center mt-4 mb-6">
            <p>A tool that can auto-generate short quizzes</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p>based on user input</p>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-col items-center sm:flex-row sm:flex-wrap sm:justify-center gap-3 sm:gap-4 mt-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="feature-pill w-full sm:w-auto justify-center"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-sm sm:text-base">{feature}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-10">
            <Link to="/question-type" className="w-full sm:w-auto">
              <button className="cta-button w-full sm:w-auto justify-center">
                <span className="flex items-center gap-2 text-sm sm:text-base">
                  Let's get Started
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
              </button>
            </Link>
            <Link to="/history" className="w-full sm:w-auto">
              <button className="cta-button w-full sm:w-auto justify-center">
                <span className="flex items-center gap-2 text-sm sm:text-base">
                  Your previous Work!
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
              </button>
            </Link>
          </div>

          {/* GitHub Stars */}
          <a
            href="https://github.com/AOSSIE-Org/EduAid"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-10"
          >
            <div className="glass hover:scale-105 transition-all duration-300 w-fit mx-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl flex gap-3 sm:gap-4 items-center">
              <img src={gitStar} className="w-5 h-5 sm:w-6 sm:h-6 text-golden-400 fill-golden-400" />
              <span className="text-foreground font-semibold text-lg sm:text-2xl">
                {stars !== null ? stars : error || "..."}
              </span>
              <Github className="w-6 h-6 sm:w-8 sm:h-8 text-foreground hover:text-primary transition-colors" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
