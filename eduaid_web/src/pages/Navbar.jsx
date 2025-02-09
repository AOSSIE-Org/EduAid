import { useEffect, useState } from "react";

export default function Navbar() {
  const [stars, setStars] = useState("loading");

  async function fetchGitHubStars() {  //fetches for stars from github and stores them in the state variable
    const response = await fetch(
      "https://api.github.com/repos/AOSSIE-Org/EduAid"
    );
    if (!response.ok) {
      throw new Error("Failed to fetch stars");
    }
    const data = await response.json();
    setStars(data.stargazers_count);
    return;
  }
  
  
  useEffect(() => {
    //calling the fetchGitHubStars() funtion when the component is loaded
    fetchGitHubStars();
  });

  return (
    <div className="flex items-center justify-between w-full text-white bg-background/95 backdrop-blur px-10 py-5 fixed z-50 border-b border-white/10">
      <div className="flex gap-5 items-center w-[300px]">
        <a href="/" className="flex gap-5 items-center">
          <img
            src="https://avatars.githubusercontent.com/u/38881995?s=200&v=4"
            width={40}
            alt=""
          />
          <h1 className="font-black text-xl text-yellow-500 hidden md:flex">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
            EduAid
          </h1>
          </h1>
        </a>
      </div>

      <div className="hidden gap-5 md:flex flex-1 justify-center">
        <a className="hover:scale-105 hover:text-white/70 transition" href="/">
          Home
        </a>
        <a
          className="hover:scale-105 hover:text-white/70 transition"
          href="/history"
        >
          Previous Quiz
        </a>
        <a
          className="hover:scale-105 hover:text-white/70 transition"
          href="https://github.com/AOSSIE-Org/EduAid#eduaid-ai-quiz-generation-"
          target="__blank"
        >
          About
        </a>
        <a
          className="hover:scale-105 hover:text-white/70 transition"
          href="https://github.com/AOSSIE-Org/EduAid"
          target="__blank"
        >
          Github
        </a>
      </div>

      <div className="w-[300px] flex justify-end">
        <div className="bg-black border-white/10 border py-2 px-5 rounded-md hover:scale-105 transition flex gap-1">
          <span className="hidden md:block">Github Stars: </span>
          <span className="font-bold px-2">{stars}</span>⭐
        </div>
      </div>
    </div>
  );
}