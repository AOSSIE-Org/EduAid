import React from "react";
import "../index.css";

const Home = () => {
  return (
    <div className="min-h-screen bg-black text-white/70">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center pt-32 md:pt-28 w-2/3">
          <h1 className="text-7xl font-bold bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
            EduAid
          </h1>
          <p className="pt-5 text-center">
            Powerful and intelligent tool designed to automatically generate
            short quizzes on various topics, allowing users to create engaging
            and interactive assessments with ease.
          </p>
        </div>
        <div className="flex justify-center w-full pt-10 gap-5 items-center z-10 ">
          <div className="bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] p-0.5 rounded-md">
            <a href="/question-type">
            <button className="bg-black px-4 py-2 rounded-md flex gap-2 items-center">
              Get Started <Arrow />{" "}
            </button>
            </a>
          </div>
        </div>

        <div className="w-full flex flex-col items-center mt-5 px-4 p-10">
          <div className="relative">
            <div className="absolute -inset-10 bg-gradient-to-br from-[#FF005C] via-[#7600F2] to-[#00CBE7] p-10 blur-3xl z-0 opacity-70 rounded-2xl animate-glow" />
            <div className="relative z-10">
              <div className="w-full max-w-5xl overflow-hidden rounded-lg md:rounded-xl">
                <img
                  src="https://eb7cw7lpb6.ufs.sh/f/y8KqGYrvxK6gUkIkKc9qT5bAjYi1fe9ntJymC08P4IWwqgOH"
                  alt="Hero image"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="my-10 z-10 ">
          Open-source project , to contribute visit{" "}
          <a className="text-blue-500 underline italic" href="#">
            @github/aossie/eduaid
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;

const Arrow = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="16px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="#e8eaed"
    >
      <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" />
    </svg>
  );
};
