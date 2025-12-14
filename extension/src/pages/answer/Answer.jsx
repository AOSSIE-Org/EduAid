import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "../../index.css";
import stars from "../../assets/stars.png";
import { FaClipboard } from "react-icons/fa";
import ExtensionShell from "../../components/layout/ExtensionShell";
import BrandHeader from "../../components/layout/BrandHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardTitle, CardSubTitle } from "../../components/ui/Card";
import { Label, Select, TextArea, TextInput } from "../../components/ui/Field";

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
    <ExtensionShell>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30">
          <div className="loader"></div>
        </div>
      )}

      <BrandHeader
        compact
        right={
          <div className="w-40">
            <Select value={mode} onChange={handleModeChange}>
              <option value="generate_qna">Generate Q&A</option>
              <option value="ask_question">Ask Questions</option>
            </Select>
          </div>
        }
      />

      <div className={`px-4 pb-4 flex-1 flex flex-col ${loading ? "pointer-events-none" : ""}`}>
        <div className="text-slate-900 font-extrabold text-2xl">Ask questions</div>
        <div className="text-slate-600 text-sm flex items-center gap-2 mt-1">
          Paste context and build your questions
          <img className="h-[18px] w-[18px]" src={stars} alt="stars" />
        </div>

        <div className="mt-4">
          <Label>Context</Label>
          <Card className="mt-2 relative">
            <div className="absolute top-3 left-3 text-slate-600">
              <FaClipboard className="h-[18px] w-[18px]" />
            </div>
            <TextArea
              className="min-h-[90px] pl-10 resize-none scrollbar-hide"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Paste text here..."
            />
          </Card>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-slate-700 text-sm font-semibold">Questions</div>
          <Button variant="secondary" onClick={addQuestion}>
            Add question
          </Button>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto scrollbar-hide space-y-3">
          {questions.map((q, index) => (
            <Card key={index} className="border border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={q.type}
                        onChange={(e) => updateQuestion(index, "type", e.target.value)}
                        className="mt-2"
                      >
                        <option value="boolean">Boolean</option>
                        <option value="mcq">MCQ</option>
                        <option value="single">Single Correct</option>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Question</Label>
                      <TextInput
                        value={q.question}
                        onChange={(e) => updateQuestion(index, "question", e.target.value)}
                        placeholder="Enter question"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {q.type === "mcq" && (
                    <div className="mt-3">
                      <Label>Options (max 4)</Label>
                      <div className="mt-2 space-y-2">
                        {q.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <TextInput
                              value={option}
                              onChange={(e) => updateOption(index, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                            />
                            <Button
                              variant="ghost"
                              className="px-3"
                              onClick={() => removeOption(index, oIndex)}
                              title="Remove option"
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                      {q.options.length < 4 && (
                        <Button variant="secondary" className="mt-2" onClick={() => addOption(index)}>
                          Add option
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  className="px-3"
                  onClick={() => removeQuestion(index)}
                  title="Remove question"
                >
                  ✕
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-4">
          <Button onClick={handleApiCall} variant="outline" className="w-full">
            Generate answers
          </Button>
        </div>

        <div className="mt-4">
          <div className="text-slate-700 text-sm font-semibold">Answers</div>
          <div className="mt-2 max-h-28 overflow-y-auto scrollbar-hide space-y-2">
            {answers.length === 0 ? (
              <Card className="text-slate-500 text-sm">No answers yet.</Card>
            ) : (
              answers.map((answer, index) => (
                <Card key={index} className="border border-slate-200">
                  <CardTitle>Q: {answer.question}</CardTitle>
                  <div className="text-slate-700 text-sm mt-2">A: {answer.answer}</div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </ExtensionShell>
  );
};

ReactDOM.render(<Answer />, document.getElementById("root"));

export default Answer;
