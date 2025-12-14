import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "../index.css";
import starsImg from "../assets/stars.png";
import arrow from "../assets/arrow.png";
import gitStar from "../assets/gitStar.png";
import { FaGithub } from 'react-icons/fa';
import ExtensionShell from "../components/layout/ExtensionShell";
import BrandHeader from "../components/layout/BrandHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

function Popup() {
  const [stars, setStars] = useState(null);
  const [error, setError] = useState("");

  async function fetchGitHubStars() {
    const response = await fetch(
      "https://api.github.com/repos/AOSSIE-Org/EduAid"
    );
    if (!response.ok) {
      throw new Error("Failed to fetch stars");
    }
    const data = await response.json();
    return data.stargazers_count;
  }
  function isMoreThanOneDayOld(timestamp) {
    const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds
    return Date.now() - timestamp > oneDay;
  }

  useEffect(() => {
    const storedStars = localStorage.getItem("stars");
    const storedTime = localStorage.getItem("fetchTime");
    if (
      storedStars &&
      storedTime &&
      !isMoreThanOneDayOld(parseInt(storedTime))
    ) {
      setStars(parseInt(storedStars));
    } else {
      fetchGitHubStars()
        .then((starCount) => {
          setStars(starCount);
          localStorage.setItem("stars", starCount);
          localStorage.setItem("fetchTime", Date.now().toString());
        })
        .catch((err) => {
          setError("Failed to fetch stars");
        });
    }
  }, []);
  return (
    <ExtensionShell>
      <BrandHeader compact />
      <div className="px-4 pb-4 flex-1 flex flex-col">
        <div className="text-4xl font-extrabold text-center mt-2">
          <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
            Edu
          </span>
          <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
            Aid
          </span>
        </div>
        <div className="text-slate-700 text-sm text-center mt-2">
          Auto-generate short quizzes from your notes, docs, or audio.
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-slate-600">Fast. Clean. Shareable.</span>
            <img src={starsImg} width={18} height={18} alt="" />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Card className="pill flex items-center justify-between hover:shadow-md cursor-default">
            <div className="text-slate-900 font-semibold">Doc/Audio Input</div>
            <img src={starsImg} width={20} height={20} alt="" />
          </Card>
          <Card className="pill flex items-center justify-between hover:shadow-md cursor-default">
            <div className="text-slate-900 font-semibold">In-depth question generation</div>
            <img src={starsImg} width={20} height={20} alt="" />
          </Card>
          <Card className="pill flex items-center justify-between hover:shadow-md cursor-default">
            <div className="text-slate-900 font-semibold">Google Form export</div>
            <img src={starsImg} width={20} height={20} alt="" />
          </Card>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <a href="/src/pages/home/home.html" className="block">
            <Button variant="primary" className="w-full">
              Start <img src={arrow} width={18} height={18} alt="" />
            </Button>
          </a>
          <a href="/src/pages/previous/previous.html" className="block">
            <Button variant="outline" className="w-full">
              Previous <img src={arrow} width={18} height={18} alt="" />
            </Button>
          </a>
        </div>

        <a
          href="https://github.com/AOSSIE-Org/EduAid"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto pt-4"
        >
          <div className="glass rounded-2xl px-4 py-3 flex gap-3 items-center hover:bg-slate-50 transition">
            <img src={gitStar} width={22} height={22} alt="" />
            <div className="text-slate-900 font-semibold flex items-center gap-2">
              {stars !== null ? (
                <>
                  <span className="text-lg">{stars}</span>
                  <FaGithub size={22} />
                </>
              ) : (
                <span className="text-slate-600 text-sm">{error || "Loading..."}</span>
              )}
            </div>
            <div className="ml-auto text-slate-500 text-xs">Open GitHub</div>
          </div>
        </a>
      </div>
    </ExtensionShell>
  );
}

ReactDOM.render(<Popup />, document.getElementById("root"));
