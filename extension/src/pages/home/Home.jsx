import React, { useState } from "react";
import ReactDOM from "react-dom";
import "../../index.css";
import ExtensionShell from "../../components/layout/ExtensionShell";
import BrandHeader from "../../components/layout/BrandHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Field";

function Home() {
  const [selectedOption, setSelectedOption] = useState(null);
  const [mode, setMode] = useState("generate_qna"); // Dropdown state

  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };

  const handleSaveToLocalStorage = () => {
    if (selectedOption) {
      localStorage.setItem("selectedQuestionType", selectedOption);
    }
  };

  const handleModeChange = (event) => {
    setMode(event.target.value);
    // You can navigate to a different page or perform a specific action based on the mode here
    if (event.target.value === "ask_question") {
      window.location.href = "/src/pages/answer/answer.html"; // Redirect for 'Ask Questions' mode
    }
  };

  return (
    <ExtensionShell>
      <BrandHeader
        right={
          <div className="w-40">
            <Select value={mode} onChange={handleModeChange}>
              <option value="generate_qna">Generate Q&A</option>
              <option value="ask_question">Ask Questions</option>
            </Select>
          </div>
        }
      />

      <div className="px-4 pb-4 flex-1 flex flex-col">
        <div className="text-2xl text-white font-extrabold">What’s on your mind?</div>
        <div className="mt-1 text-white/70 text-sm">Choose a question style</div>

        <div className="mt-4 space-y-3">
          {[
            { id: "get_shortq", label: "Short-answer questions" },
            { id: "get_mcq", label: "Multiple-choice questions" },
            { id: "get_boolq", label: "True/False questions" },
            { id: "get_problems", label: "All question types" },
          ].map((opt) => (
            <Card
              key={opt.id}
              onClick={() => handleOptionClick(opt.id)}
              className={`cursor-pointer flex items-center gap-3 ${
                selectedOption === opt.id ? "ring-2 ring-[#405EED]/70" : "hover:bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full ${
                  selectedOption === opt.id
                    ? "bg-gradient-to-b from-[#405EED] to-[#01CBE7]"
                    : "bg-white/25"
                }`}
              />
              <div className="text-white font-semibold">{opt.label}</div>
            </Card>
          ))}
        </div>

        <div className="mt-auto pt-4">
          {selectedOption ? (
            <a href="/src/pages/text_input/text_input.html" className="block">
              <Button onClick={handleSaveToLocalStorage} className="w-full text-base">
                Fire up 🚀
              </Button>
            </a>
          ) : (
            <Button
              variant="secondary"
              className="w-full text-base"
              disabled
              onClick={() => alert("Please select a question type.")}
            >
              Fire up 🚀
            </Button>
          )}
        </div>
      </div>
    </ExtensionShell>
  );
}

ReactDOM.render(<Home />, document.getElementById("root"));
