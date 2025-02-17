import React, { useState, useEffect } from "react";
import { FaPlay, FaPause, FaClock } from "react-icons/fa";

const TimerComponent = () => {
  const [timeLimit, setTimeLimit] = useState(120); // Default time limit
  const [timeLeft, setTimeLeft] = useState(120); // Current time left
  const [isRunning, setIsRunning] = useState(false); // To track if the timer is running

  // Update timer when isRunning or timeLeft changes
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isRunning, timeLeft]);

  // Format the time
  const quizTimer = () => {
    if (timeLeft < 0) {
      return "0 : 00";
    }
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes} : ${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Handle setting the time limit
  const handleSetTimeLimit = () => {
    const newTimeLimit = parseInt(prompt("Enter time limit in seconds:", timeLimit));
    if (!isNaN(newTimeLimit) && newTimeLimit > 0) {
      setTimeLimit(newTimeLimit);
      setTimeLeft(newTimeLimit);
      setIsRunning(false); // Reset timer state
    } else {
      alert("Please enter a valid positive number!");
    }
  };

  // Handle Start/Pause functionality
  const toggleTimer = () => {
    if (timeLeft <= 0) {
      alert("Set a valid time limit or reset the timer.");
      return;
    }
    setIsRunning((prev) => !prev);
  };

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg w-72 mx-auto shadow-lg">
      <h1 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
        <FaClock className="text-yellow-400" /> Time Left: {quizTimer()}
      </h1>

      <div className="mt-4 text-center flex justify-center items-center gap-2">
        <button
          onClick={toggleTimer}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full flex items-center justify-center"
          title={isRunning ? "Pause Timer" : "Start Timer"}
        >
          {isRunning ? <FaPause /> : <FaPlay />}
        </button>

        <button
          onClick={handleSetTimeLimit}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
          title="Set Timer"
        >
          Set
        </button>
      </div>

    
    </div>
  );
};

export default TimerComponent;
