import React, { useState, useEffect } from "react";
import human from "../assets/human.png";
import human2 from "../assets/hum2.png";
import logo from "../assets/aossie_logo.png";
import starsImg from "../assets/stars.png";
import arrow from "../assets/arrow.png";

const Home = () => {
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    
    const userLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(userLoggedIn);
  }, []);

  return (
    <div className="popup w-screen h-screen bg-[#75d8f6b7] flex justify-center items-center">
      <img
        src={human}
        alt="Background Human"
        className="absolute bottom-0 left-0 z-0 opacity-55"
      />
      <img
        src={human2}
        alt="Secondary Human"
        className="absolute top-10 right-0 z-0 opacity-30"
        style={{ width: "400px", height: "auto" }} 
      />
      <div className="w-full h-full bg-[#90e0ef] bg-opacity-50 justify-center items-center">
    
        <div className="absolute top-4 right-6">
          {isLoggedIn ? (
            <a href="/profile">
              <button className="bg-[#03045e] text-white px-6 py-3 rounded-full shadow-md hover:bg-[#0077b6]">
                My Profile
              </button>
            </a>
          ) : (
            <a href="/login">
              <button className="bg-[#03045e] text-white px-6 py-3 rounded-full shadow-md hover:bg-[#0077b6]">
                Login
              </button>
            </a>
          )}
        </div>

        <div className="flex px-3 py-0">
          <img
            src={logo}
            alt="logo"
            className="w-20 bg-white my-6 rounded-full"
          />
        </div>

        <div className="text-8xl text-center font-extrabold">
          <span className="bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-transparent bg-clip-text animate-gradient-text">
            EDU
          </span>
          <span className="bg-gradient-to-r from-[#00b4d8] to-[#0077b6] text-transparent bg-clip-text animate-gradient-text">
            AID
          </span>
        </div>

        <div className="text-[#03045e] text-[1.5rem] text-center my-4">
          <div>A tool that can auto-generate short quizzes</div>
          <div className="flex text-center justify-center gap-4">
            based on user input{" "}
            <img src={starsImg} width={32} height={12} alt="" />
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="my-4">
            <div className="flex items-center rounded-l-2xl w-fit px-6 py-3 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] justify-center gap-4">
              <img src={starsImg} width={32} height={16} alt="" />
              <div className="text-[#03045e] text-xl">Doc/Audio Input</div>
            </div>
          </div>
          <div className="my-4">
            <div className="flex items-center rounded-l-2xl w-fit px-6 py-3 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] justify-center gap-4">
              <img src={starsImg} width={32} height={16} alt="" />
              <div className="text-[#03045e] text-xl">In-depth questions gen</div>
            </div>
          </div>
          <div className="my-4">
            <div className="flex items-center rounded-l-2xl w-fit px-6 py-3 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] justify-center gap-4">
              <img src={starsImg} width={32} height={16} alt="" />
              <div className="text-[#03045e] text-xl">
                Dynamic Google Form Integration
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-12 ">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <a href="question-type">
              <button className="button-style flex justify-center items-center gap-4 px-8 py-4 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-white">
                Let’s get Started{" "}
                <img src={arrow} width={28} height={24} alt="Arrow Icon" />
              </button>
            </a>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <a href="history">
              <button className="button-style flex justify-center items-center gap-4 px-8 py-4 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-white">
                Your previous Work!{" "}
                <img src={arrow} width={28} height={24} alt="Arrow Icon" />
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
