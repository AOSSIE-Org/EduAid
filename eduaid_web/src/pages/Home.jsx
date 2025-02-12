import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGithub, FaArrowRight } from "react-icons/fa";
import logo from "../assets/aossie_logo.png";
import starsImg from "../assets/stars.png";
import '../styles/Home.css';

const Home = () => {
  const [stars, setStars] = useState(null);
  const [error, setError] = useState("");

  // Keep the existing GitHub stars functionality
  async function fetchGitHubStars() {
    const response = await fetch("https://api.github.com/repos/AOSSIE-Org/EduAid");
    if (!response.ok) {
      throw new Error("Failed to fetch stars");
    }
    const data = await response.json();
    return data.stargazers_count;
  }

  useEffect(() => {
    fetchGitHubStars()
      .then(setStars)
      .catch(() => setError("Failed to fetch stars"));
  }, []);

  const features = [
    {
      icon: "📄",
      title: "Doc/Audio Input",
      description: "Upload documents or audio files to instantly generate quizzes"
    },
    {
      icon: "🎯",
      title: "In-depth Questions",
      description: "AI-powered comprehensive question generation"
    },
    {
      icon: "🔄",
      title: "Google Forms",
      description: "Seamless integration with Google Forms"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02000F] via-[#1a0b2e] to-[#270082] relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 animate-pulse"></div>
      
      {/* Gradient orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header 
          className="pt-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <img src={logo} alt="AOSSIE Logo" className="w-20 h-20 hover:scale-105 transition-transform" />
        </motion.header>

        {/* Hero Section */}
        <motion.div 
          className="mt-24 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-7xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">Edu</span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">Aid</span>
          </h1>
          <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto">
            A tool that can auto-generate short quizzes based on user input 
            <img src={starsImg} className="inline-block ml-2 w-8" alt="" />
          </p>
        </motion.div>

        {/* Features */}
        <motion.div 
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm border border-white/10"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300"></div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <a href="question-type" className="group">
            <motion.button 
              className="px-8 py-4 bg-gradient-to-r from-[#FF005C] to-[#7600F2] rounded-xl text-white font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </a>
          <a href="history" className="group">
            <motion.button 
              className="px-8 py-4 bg-white/10 rounded-xl text-white font-semibold flex items-center gap-2 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Previous Work
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </a>
        </motion.div>

        {/* GitHub Stats */}
        <motion.div 
          className="mt-20 mb-12 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <a
            href="https://github.com/AOSSIE-Org/EduAid"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <div className="flex items-center gap-4 bg-white/10 px-6 py-3 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
              <span className="text-2xl text-yellow-400">⭐</span>
              <span className="text-xl text-white font-semibold">
                {stars !== null ? stars : error}
              </span>
              <FaGithub className="text-2xl text-white group-hover:rotate-12 transition-transform" />
            </div>
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
