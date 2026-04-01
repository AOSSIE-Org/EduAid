import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "../../index.css";
import logo from "../../assets/aossie_logo.webp";
import stars from "../../assets/stars.png";
import { FaClipboard } from "react-icons/fa";
import Switch from "react-switch"
import { FaQuestionCircle, FaClipboardList } from "react-icons/fa"; // Icons for the dropdown

const Answer = () => {
  const [context, setContext] = useState("");
  const [questions, setQuestions] = useState([{ type: "boolean", question: "", options: [""] }]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isToggleOn, setIsToggleOn] = useState(1);
  const [mode, setMode] = useState("ask_question"); // Dropdown state
  
  useEffect(() => {
  chrome.storage.local.get(["selectedText"], (result) => {
    if (result.selectedText) {
      console.log("Selected Text: ", result.selectedText);
      setContext(result.selectedText);
      localStorage.setItem("textContent", result.selectedText);
    }
  });
  },[])

  // const toggleSwitch = () => {
  //   window.location.href = "/src/pages/home/home.html";
  //   setIsToggleOn(0);

  // };

  const handleModeChange = (event) => {
    setMode(event.target.value);
    // You can navigate to a different page or perform a specific action based on the mode here
    if (event.target.value === "generate_qna") {
      // window.location.href = "/src/pages/answer/answer.html"; // Redirect for 'Ask Questions' mode
      window.location.href = "/src/pages/home/home.html";

    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { type: "boolean", question: "", options: [""] }]);
  };

  const removeQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index, key, value) => {
    const newQuestions = [...questions];
    newQuestions[index][key] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length < 4) {
      newQuestions[qIndex].options.push("");
    }
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.splice(oIndex, 1);
    setQuestions(newQuestions);
  };

  const handleApiCall = async () => {
    setLoading(true);
  
    const booleanQuestions = questions.filter((q) => q.type === "boolean").map((q) => q.question);
    const mcqQuestions = questions.filter((q) => q.type === "mcq").map((q) => ({ question: q.question, options: q.options }));
    const shortQuestions = questions.filter((q) => q.type === "single").map((q) => q.question);
  
    try {
      const responses = await Promise.all([
        fetch("http://localhost:5000/get_boolean_answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input_text: context, input_question: booleanQuestions }),
        }),
        fetch("http://localhost:5000/get_mcq_answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input_text: context,
            input_question: mcqQuestions.map((q) => q.question),
            input_options: mcqQuestions.map((q) => q.options),
          }),
        }),
        fetch("http://localhost:5000/get_shortq_answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input_text: context, input_question: shortQuestions }),
        }),
      ]);
  
      const [booleanAnswers, mcqAnswers, shortAnswers] = await Promise.all(responses.map((res) => res.json()));
  
      const allAnswers = [
        ...(booleanAnswers?.output ?? []).map((answer, index) => ({ question: booleanQuestions[index], answer })),
        ...(mcqAnswers?.output ?? []).map((answer, index) => ({ question: mcqQuestions[index]?.question, answer })),
        ...(shortAnswers?.output ?? []).map((answer, index) => ({ question: shortQuestions[index], answer })),
      ];
  
      setAnswers(allAnswers);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      chrome.storage.local.remove(["selectedText"], () => {
        console.log("Chrome storage cleared");
      });
    }
  };
  

  return (
    <div className="popup w-36rem h-38rem bg-[#02000F] flex justify-center items-center">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-black">
          <div className="loader border-4 border-t-4 border-white rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient">
      <div className="flex items-end gap-[2px]">
          <img src={logo} alt="logo" className="w-16 my-4 ml-4 block" />
          <div className="text-2xl mb-3 font-extrabold">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
              Edu
            </span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Aid
            </span>
          </div>
          {/* <Switch
            checked={isToggleOn}
            onChange={toggleSwitch}
            offColor="#FF005C"
            onColor="#00CBE7"
            height={32}
            width={64}
            className="ml-32 mb-8"
          /> */}
          {/* Dropdown for Mode Selection */}
          <div className="relative ml-auto mb-3">
            <select
              value={mode}
              onChange={handleModeChange}
              className="bg-[#202838] text-white text-sm font-medium px-4 py-2 rounded-xl appearance-none"
            >
              <option value="generate_qna">
                <FaClipboardList className="inline-block mr-2" />
                Generate Q&A
              </option>
              <option value="ask_question">
                <FaQuestionCircle className="inline-block mr-2" />
                Ask Questions
              </option>
            </select>
          </div>

        </div>
        <div className="text-3xl mt-3 mb-1 text-white ml-4 font-extrabold">
          Ask Questions!
        </div>
        <div className="relative bg-[#83b6cc40] mx-3 rounded-xl p-2 h-20">
          <button className="absolute top-0 left-0 p-2 text-white focus:outline-none">
            <FaClipboard className="h-[20px] w-[20px]" />
          </button>
          <textarea
            className="absolute inset-0 p-8 pt-2 bg-[#83b6cc40] text-lg rounded-xl outline-none resize-none h-full overflow-y-auto text-white caret-white"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
          <style>
            {`
          textarea::-webkit-scrollbar {
            display: none;
          }
        `}
          </style>
        </div>
        <div className="mt-2 mx-3">
          <button onClick={addQuestion} className="bg-[#518E8E] text-sm text-white rounded-xl border border-[#cbd0dc80] px-6 py-1">Add Question</button>
        </div>
        <div className="mt-4 mx-3 h-64 overflow-y-auto" style={{ scrollbarWidth: "thin", msOverflowStyle: "auto" }}>
          {questions.map((q, index) => (
            <div key={index} className="mb-2 p-1 border-dotted border-4 border-[#7600F2] rounded-xl">
              <select
                value={q.type}
                onChange={(e) => updateQuestion(index, "type", e.target.value)}
                className="bg-[#202838] text-white rounded-xl px-5 py-2 mr-2 mt-1 appearance-none"
              >
                <option value="boolean">Boolean</option>
                <option value="mcq">MCQ</option>
                <option value="single">Single Correct</option>
              </select>
              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(index, "question", e.target.value)}
                placeholder="Enter question"
                className="bg-[#202838] text-white rounded-xl px-5 py-2 mr-2 mt-2 w-64"
              />
              {q.type === "mcq" && (
                <div className="mt-2">
                  {q.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex mb-1">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className="bg-[#202838] text-white rounded-xl px-5 py-2 mr-2 w-56"
                      />
                      <button onClick={() => removeOption(index, oIndex)} className="bg-[#3e506380] text-sm text-white rounded-xl border border-[#cbd0dc80] px-2 py-1">Remove</button>
                    </div>
                  ))}
                  {q.options.length < 4 && (
                    <button onClick={() => addOption(index)} className="bg-[#3e506380] text-sm text-white rounded-xl border border-[#cbd0dc80] px-4 py-1 mt-1">Add Option</button>
                  )}
                </div>
              )}
              <button onClick={() => removeQuestion(index)} className="bg-[#3e506380] text-sm text-white rounded-xl border border-[#cbd0dc80] px-4 py-1 mt-2 mb-1">Remove Question</button>
            </div>
          ))}
        </div>
        <div className="flex my-2 justify-center gap-6 items-start">
          <button onClick={handleApiCall} className="bg-black items-center text-sm text-white rounded-xl px-6 py-2 mx-auto border-gradient">Generate Answers</button>
        </div>
        <div className="mt-4 mx-3 h-16 overflow-y-auto" style={{ scrollbarWidth: "thin", msOverflowStyle: "auto" }}>
          {answers.map((answer, index) => (
            <div key={index} className="bg-[#202838] text-white rounded-xl px-5 py-2 mb-2">
              <div className="font-bold">Q: {answer.question}</div>
              <div className="mt-1">A: {answer.answer}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<Answer />, document.getElementById("root"));

export default Answer;
