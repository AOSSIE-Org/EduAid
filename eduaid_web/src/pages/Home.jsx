import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // For redirection
import { useAuth } from "../context/AuthContext";
import "../index.css";
import logo from "../assets/aossie_logo.png";
import starsImg from "../assets/stars.png";
import arrow from "../assets/arrow.png";
import gitStar from "../assets/gitStar.png";
import { FaGithub } from "react-icons/fa";

const Home = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [stars, setStars] = useState(null);
  const [error, setError] = useState("");

  // Redirect to sign-in page if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/signup");
    }
  }, [currentUser, navigate]);

  async function fetchGitHubStars() {
    try {
      const response = await fetch(
        "https://api.github.com/repos/AOSSIE-Org/EduAid"
      );
      if (!response.ok) throw new Error("Failed to fetch stars");
      const data = await response.json();
      return data.stargazers_count;
    } catch (error) {
      setError("Failed to fetch stars");
    }
  }

  useEffect(() => {
    const storedStars = localStorage.getItem("stars");
    const storedTime = localStorage.getItem("fetchTime");

    if (
      storedStars &&
      storedTime &&
      Date.now() - parseInt(storedTime) < 86400000
    ) {
      setStars(parseInt(storedStars));
    } else {
      fetchGitHubStars().then((starCount) => {
        setStars(starCount);
        localStorage.setItem("stars", starCount);
        localStorage.setItem("fetchTime", Date.now().toString());
      });
    }
  }, []);

  return (
    <div className="popup w-screen h-screen bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient">
        <div>
          <img src={logo} alt="logo" className="w-24 my-6 mx-6 block" />
          <div className="text-7xl text-center font-extrabold">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
              Edu
            </span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Aid
            </span>
          </div>

          {/* Display Username */}
          <div className="text-2xl font-bold pt-14 text-white text-center">
            Hello, {currentUser?.displayName || currentUser?.email} 👋
          </div>

          {/* Features Section */}
          <div className="text-white text-[1.5rem] text-center my-4">
            <div>A tool that can auto-generate short quizzes</div>
            <div className="flex text-center justify-center gap-4">
              based on user input{" "}
              <img src={starsImg} width={32} height={12} alt="" />
            </div>
          </div>

          {/* Buttons Section */}
          <div className="flex justify-center gap-6">
            <a href="question-type">
              <button className="items-center text-lg flex justify-center gap-4 text-white px-6 py-3 mx-auto mt-6 border-gradient hover:wave-effect rounded-md">
                Let’s get Started{" "}
                <img src={arrow} width={28} height={24} alt="" />
              </button>
            </a>
            <a href="history">
              <button className="items-center text-lg flex justify-center gap-4 text-white px-6 py-3 mx-auto mt-6 border-gradient hover:wave-effect rounded-md">
                Your previous Work!{" "}
                <img src={arrow} width={28} height={24} alt="" />
              </button>
            </a>
          </div>

          {/* GitHub Stars Section */}
          <a
            href="https://github.com/AOSSIE-Org/EduAid"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <div className="bg-[#45454599] mt-10 w-fit mx-auto px-4 py-3 rounded-xl flex gap-4 items-center group-hover:bg-[#5a5a5a99] transition-colors duration-300">
              <img src={gitStar} width={28} height={12} alt="" />
              <div className="text-white font-semibold">
                {stars !== null ? (
                  <span className="flex text-2xl">
                    {stars} <FaGithub size={36} className="ml-6" />
                  </span>
                ) : (
                  <span>{error}</span>
                )}
              </div>
            </div>
          </a>

          {/* Logout Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => {
                logout();
                navigate("/signin");
              }}
              className="text-lg text-white px-6 py-3 bg-red-600 hover:bg-red-700 rounded-md"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
