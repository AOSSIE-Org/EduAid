import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png";
import starsImg from "../assets/stars.png";
import arrow from "../assets/arrow.png";
import gitStar from "../assets/gitStar.png";
import { FaGithub } from "react-icons/fa";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const fadeInUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const pulseVariant = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      repeat: Infinity,
      duration: 3,
      ease: "easeInOut",
    },
  },
};

const Home = () => {
  const [stars, setStars] = useState(null);
  const [error, setError] = useState("");

  async function fetchGitHubStars() {
    const response = await fetch(
      "https://api.github.com/repos/AOSSIE-Org/EduAid"
    );
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
          localStorage.setItem("stars", starCount.toString());
          localStorage.setItem("fetchTime", Date.now().toString());
        })
        .catch(() => setError("Failed to fetch stars"));
    }
  }, []);

  const features = [
    {
      title: "Doc/Audio Input",
      icon: starsImg,
      description: "Upload docs or audio files to generate quizzes automatically.",
    },
    {
      title: "In-depth questions gen",
      icon: starsImg,
      description: "Smartly crafted questions that dig deeper into topics.",
    },
    {
      title: "Dynamic Google Form Integration",
      icon: starsImg,
      description: "Seamlessly create Google Forms to collect responses.",
    },
  ];

  return (
    <div className="relative w-screen min-h-screen bg-[#02000F] flex flex-col overflow-hidden px-6 sm:px-16 py-10">
   

<svg
  className="absolute top-0 left-0 w-full h-full opacity-10 z-0"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 100 100"
  preserveAspectRatio="xMidYMid meet"
  fill="none"
>
  {/* Circles scattered with motion */}
  <motion.circle
    cx="15"
    cy="20"
    r="12"
    fill="#FF005C"
    opacity="1"
    animate={{
      cx: [15, 18, 13, 16, 15], // small random horizontal drift
      cy: [20, 22, 19, 21, 20], // small vertical drift
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
      delay: 0,
    }}
  />
  <motion.circle
    cx="80"
    cy="25"
    r="10"
    fill="#00CBE7"
    opacity="0.8"
    animate={{
      cx: [80, 78, 82, 79, 80],
      cy: [25, 27, 23, 26, 25],
    }}
    transition={{
      duration: 7,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
      delay: 1,
    }}
  />
  <motion.circle
    cx="30"
    cy="70"
    r="15"
    fill="#7600F2"
    opacity="0.7"
    animate={{
      cx: [30, 32, 28, 31, 30],
      cy: [70, 68, 72, 69, 70],
    }}
    transition={{
      duration: 9,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
      delay: 2,
    }}
  />
  <motion.circle
    cx="70"
    cy="80"
    r="18"
    fill="#FF005C"
    opacity="0.9"
    animate={{
      cx: [70, 73, 67, 71, 70],
      cy: [80, 83, 77, 81, 80],
    }}
    transition={{
      duration: 6.5,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
      delay: 3,
    }}
  />

  {/* Rotated squares */}
  <motion.rect
    x="5"
    y="75"
    width="14"
    height="14"
    fill="#00CBE7"
    opacity="0.8"
    transform="rotate(40 5 75)"
    animate={{
      x: [5, 7, 3, 6, 5],
      y: [75, 77, 73, 76, 75],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
      delay: 0.5,
    }}
  />
  <motion.rect
    x="65"
    y="10"
    width="12"
    height="12"
    fill="#7600F2"
    opacity="0.5"
    transform="rotate(25 65 10)"
    animate={{
      x: [65, 62, 68, 64, 65],
      y: [10, 13, 7, 11, 10],
    }}
    transition={{
      duration: 7,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
      delay: 1.5,
    }}
  />
  <motion.rect
    x="85"
    y="65"
    width="18"
    height="18"
    fill="#FF005C"
    opacity="0.2"
    transform="rotate(15 85 65)"
    animate={{
      x: [85, 87, 83, 86, 85],
      y: [65, 68, 63, 67, 65],
    }}
    transition={{
      duration: 9,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
      delay: 2.5,
    }}
  />

  {/* Triangles */}
  <motion.polygon
    points="40,15 50,35 30,35"
    fill="#7600F2"
    opacity="0.7"
    animate={{
      points: [
        "40,15 50,35 30,35",
        "42,17 52,37 32,37",
        "38,13 48,33 28,33",
        "40,15 50,35 30,35",
      ],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
      delay: 0,
    }}
  />
  <motion.polygon
    points="55,70 70,90 40,90"
    fill="#00CBE7"
    opacity="0.6"
    animate={{
      points: [
        "55,70 70,90 40,90",
        "57,72 72,92 42,92",
        "53,68 68,88 38,88",
        "55,70 70,90 40,90",
      ],
    }}
    transition={{
      duration: 7,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
      delay: 1,
    }}
  />
  <motion.polygon
    points="75,40 90,60 60,60"
    fill="#FF005C"
    opacity="0.8"
    animate={{
      points: [
        "75,40 90,60 60,60",
        "77,42 92,62 62,62",
        "73,38 88,58 58,58",
        "75,40 90,60 60,60",
      ],
    }}
    transition={{
      duration: 6.5,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
      delay: 2,
    }}
  />
</svg>


      {/* Navbar */}
      <nav className="relative z-10 w-full flex justify-between items-center mb-10">
        <img src={logo_trans} alt="Logo" className="w-16 h-auto" />
        <a
          href="https://github.com/AOSSIE-Org/EduAid"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#45454599] hover:bg-[#5a5a5a99] transition-all"
        >
          <img src={gitStar} width={24} height={12} alt="GitHub Star" />
          <span className="text-white text-lg font-medium">
            {stars !== null ? (
              <div className="flex items-center gap-2">
                {stars} <FaGithub size={24} />
              </div>
            ) : (
              <span>{error}</span>
            )}
          </span>
        </a>
      </nav>

      {/* Hero Section */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Geometric shapes */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#FF005C] opacity-10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-[#00CBE7] opacity-10 rounded-full blur-2xl -z-10"></div>
        <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-[#7600F2] opacity-10 rotate-12 rounded-lg blur-md -z-10"></div>

        {/* Title */}
        <motion.h1
          className="text-7xl md:text-[7rem] font-extrabold leading-tight tracking-tight mb-6"
          variants={fadeInUpVariant}
        >
          <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
            Edu
          </span>
          <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
            Aid
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.div
          className="text-white text-2xl mb-12 max-w-xl"
          variants={fadeInUpVariant}
          transition={{ delay: 0.3 }}
        >
          <p>A tool that can auto-generate short quizzes</p>
          <div className="flex justify-center items-center gap-2 mt-2">
            <p>based on user input</p>
            <img src={starsImg} width={24} height={12} alt="stars" />
          </div>
        </motion.div>

        {/* Features Grid with Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-5xl mb-14"
          variants={containerVariants}
        >
          {features.map(({ title, icon, description }, i) => (
            <motion.div
              key={i}
              className="bg-[#1A1A2E] rounded-3xl p-6 flex flex-col items-center text-center shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105"
              variants={fadeInUpVariant}
              style={{ originY: 0 }}
            >
              <img src={icon} alt={`${title} icon`} width={48} height={24} className="mb-4" />
              <h3 className="text-white text-2xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-300 text-base">{description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
          <motion.a href="question-type" className="w-full sm:w-auto" whileHover={{ scale: 1.05, filter: "brightness(1.1)" }} whileTap={{ scale: 0.95 }}>
            <motion.button
              className="w-full sm:w-auto flex justify-center items-center gap-3 text-white px-8 py-4 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] rounded-2xl font-semibold text-xl focus:outline-none focus:ring-4 focus:ring-[#7600F2]/50"
              variants={pulseVariant}
              animate="animate"
              whileHover={{ scale: 1.1, filter: "brightness(1.2)", boxShadow: "0 0 15px #7600F2" }}
              whileTap={{ scale: 0.95 }}
            >
              Let’s get Started
              <img src={arrow} width={24} height={24} alt="arrow" />
            </motion.button>
          </motion.a>

          <motion.a href="history" className="w-full sm:w-auto" whileHover={{ scale: 1.05, filter: "brightness(1.1)" }} whileTap={{ scale: 0.95 }}>
            <motion.button
              className="w-full sm:w-auto flex justify-center items-center gap-3 text-white px-8 py-4 border-2 border-[#7600F2] rounded-2xl font-semibold text-xl focus:outline-none focus:ring-4 focus:ring-[#7600F2]/50"
              whileHover={{ scale: 1.05, backgroundColor: "#7600F2", boxShadow: "0 0 15px #7600F2" }}
              whileTap={{ scale: 0.95 }}
            >
              Your previous Work!
              <img src={arrow} width={24} height={24} alt="arrow" />
            </motion.button>
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
