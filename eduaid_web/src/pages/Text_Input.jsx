import React, { useState, useRef } from "react";
import "../index.css";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";

const QUESTION_TYPES = [
  { id: "get_mcq", label: "MCQ", icon: "", desc: "Multiple choice questions" },
  { id: "get_boolq", label: "True/False", icon: "", desc: "Boolean questions" },
  { id: "get_shortq", label: "Short Answer", icon: "", desc: "Open-ended answers" },
];

const Text_Input = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState("Easy Difficulty");
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [docUrl, setDocUrl] = useState("");
  const [isToggleOn, setIsToggleOn] = useState(false);
  const [quizMode, setQuizMode] = useState("static");
  const [questionType, setQuestionType] = useState(
    localStorage.getItem("selectedQuestionType") || "get_mcq"
  );
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const handleFileProcess = async (file) => {
    if (!file) return;
    setUploadedFileName(file.name);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const data = await apiClient.postFormData("/upload", formData);
      setText(data.content || data.error || "");
    } catch (err) {
      setText("Error uploading file");
    }
  };

  const handleFileUpload = (e) => handleFileProcess(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileProcess(e.dataTransfer.files[0]);
  };

  const getEndpoint = (diff, qType) => {
    if (diff !== "Easy Difficulty") {
      if (qType === "get_shortq") return "get_shortq_hard";
      if (qType === "get_mcq") return "get_mcq_hard";
      if (qType === "get_boolq") return "get_boolq_hard";
    }
    return qType;
  };

  const handleGenerate = async () => {
    if (!text && !docUrl) return;
    setLoading(true);

    if (docUrl) {
      try {
        const data = await apiClient.post("/get_content", { document_url: docUrl });
        const content = data?.content || data;
        if (!content) {
          setText("Error: Document returned empty content");
          return;
        }
        setDocUrl("");
        setText(content);
      } catch (err) {
        console.error("Doc fetch error:", err);
        setText("Error retrieving Google Doc content");
      } finally {
        setLoading(false);
      }
      return;
    }

    localStorage.setItem("textContent", text);
    localStorage.setItem("difficulty", difficulty);
    localStorage.setItem("numQuestions", numQuestions);
    localStorage.setItem("selectedQuestionType", questionType);

    const endpoint = getEndpoint(difficulty, questionType);
    try {
      const responseData = await apiClient.post(`/${endpoint}`, {
        input_text: text,
        max_questions: numQuestions,
        use_mediawiki: isToggleOn ? 1 : 0,
      });
      localStorage.setItem("qaPairs", JSON.stringify(responseData));

      // Extract and normalize the questions array from the backend response
      // Backend returns different formats depending on question type:
      // - MCQ: { output: [{ question_statement, options, answer, context }] }
      // - BoolQ: { output: ["question string", ...] }
      // - ShortQ: { output: [{ Question, Answer, context }] }
      // - All: { output_mcq, output_boolq, output_shortq }
      let questionsArray = [];
      
      const normalizeQuestion = (q, qType) => {
        // Already normalized
        if (q.question && q.question_type) return q;
        
        // Plain string (True/False)
        if (typeof q === "string") {
          return { question: q, question_type: "Boolean", options: ["True", "False"], answer: "True" };
        }
        
        // MCQ format
        if (q.question_statement) {
          return {
            question: q.question_statement,
            question_type: "MCQ",
            options: q.options || [],
            answer: q.answer,
            context: q.context,
          };
        }
        
        // Short Answer format (capital Q/A)
        if (q.Question || q.Answer) {
          return {
            question: q.Question || q.question,
            question_type: "Short",
            answer: q.Answer || q.answer,
            context: q.context,
          };
        }
        
        // Fallback
        return {
          question: q.question || "",
          question_type: qType || "Short",
          options: q.options || [],
          answer: q.answer || "",
          context: q.context || "",
        };
      };

      if (Array.isArray(responseData.output)) {
        questionsArray = responseData.output.map((q) => normalizeQuestion(q, questionType === "get_boolq" ? "Boolean" : questionType === "get_mcq" ? "MCQ" : "Short"));
      } else if (responseData.output && responseData.output.questions) {
        questionsArray = responseData.output.questions.map((q) => normalizeQuestion(q, "MCQ"));
      } else if (responseData.output_mcq || responseData.output_boolq || responseData.output_shortq) {
        // "All types" mode — combine them
        if (responseData.output_mcq?.questions) {
          questionsArray.push(...responseData.output_mcq.questions.map((q) => normalizeQuestion(q, "MCQ")));
        }
        if (responseData.output_boolq?.Boolean_Questions) {
          responseData.output_boolq.Boolean_Questions.forEach((q) =>
            questionsArray.push(normalizeQuestion(q, "Boolean"))
          );
        }
        if (responseData.output_shortq?.questions) {
          questionsArray.push(...responseData.output_shortq.questions.map((q) => normalizeQuestion(q, "Short")));
        }
      }

      const quizDetails = {
        difficulty, numQuestions,
        date: new Date().toLocaleDateString(),
        qaPair: responseData,
        mode: quizMode,
      };
      let last5 = JSON.parse(localStorage.getItem("last5Quizzes")) || [];
      last5.push(quizDetails);
      if (last5.length > 5) last5.shift();
      localStorage.setItem("last5Quizzes", JSON.stringify(last5));

      navigate("/quiz", { state: { mode: quizMode, questions: questionsArray } });
    } catch (err) {
      console.error("Error generating quiz:", err);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = text.trim().length > 0 || docUrl.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#02000F] text-white pt-24 pb-16 px-4">
      {/* Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#7600F2] opacity-[0.10] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#00CBE7] opacity-[0.08] blur-[120px]" />
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#02000F]/80 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#7600F2] animate-spin mb-4" />
          <p className="text-[#a0aec0] font-semibold">Generating questions</p>
        </div>
      )}

      <div className={`relative z-10 max-w-3xl mx-auto ${loading ? "pointer-events-none opacity-50" : ""}`}>

        {/* Page header */}
        <div className="mb-8">
          <p className="text-[#7600F2] text-sm font-bold uppercase tracking-widest mb-2">Step 2 of 2</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Add Your Content</h1>
          <p className="text-[#718096]">Paste text, upload a file, or link a Google Doc to generate questions from.</p>
        </div>

        {/* Textarea */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#a0aec0] mb-2">Your text</label>
          <div className="relative">
            <textarea
              rows={7}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type your content here"
              className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-[#7600F2]/60 rounded-2xl p-5 text-white placeholder-[#4a5568] outline-none resize-none text-sm sm:text-base transition-colors duration-200"
            />
            <button
              onClick={() => navigator.clipboard.readText().then((t) => setText(t)).catch(() => { /* clipboard access denied or unavailable */ })}
              title="Paste from clipboard"
              className="absolute top-3 right-3 p-2 rounded-lg text-[#4a5568] hover:text-[#a0aec0] hover:bg-white/[0.06] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-[#4a5568] text-sm font-medium">or</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        {/* File Upload */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={`mb-4 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
            dragOver
              ? "border-[#7600F2] bg-[#7600F2]/10"
              : "border-white/[0.10] bg-white/[0.02] hover:border-[#7600F2]/40 hover:bg-[#7600F2]/[0.04]"
          }`}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt,.mp3" />
          <div className="text-3xl mb-3"></div>
          {uploadedFileName ? (
            <p className="text-[#c084fc] font-semibold text-sm">{uploadedFileName}</p>
          ) : (
            <>
              <p className="text-white font-semibold mb-1">Drop a file here or <span className="text-[#c084fc]">browse</span></p>
              <p className="text-[#4a5568] text-xs">Supports PDF, Word, TXT, MP3</p>
            </>
          )}
        </div>

        {/* Google Doc URL */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-[#a0aec0] mb-2">Google Docs URL</label>
          <input
            type="text"
            placeholder="https://docs.google.com/document/d/..."
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-[#7600F2]/60 rounded-2xl px-5 py-3 text-white placeholder-[#4a5568] outline-none text-sm transition-colors"
          />
        </div>

        {/*  SETTINGS  */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] mb-8">
          <h2 className="text-base font-bold mb-5 text-[#a0aec0] uppercase tracking-widest text-xs">Quiz Settings</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Question Type */}
            <div>
              <label className="block text-sm font-semibold text-[#a0aec0] mb-3">Question Type</label>
              <div className="flex flex-col gap-2">
                {QUESTION_TYPES.map((qt) => (
                  <button
                    key={qt.id}
                    onClick={() => setQuestionType(qt.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all ${
                      questionType === qt.id
                        ? "bg-[#7600F2]/20 border-[#7600F2]/50 text-white"
                        : "bg-white/[0.02] border-white/[0.07] text-[#718096] hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span>{qt.icon}</span>
                    <div>
                      <div className="font-semibold">{qt.label}</div>
                      <div className="text-xs opacity-70">{qt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-5">
              {/* Number of Questions */}
              <div>
                <label className="block text-sm font-semibold text-[#a0aec0] mb-3">Number of Questions</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setNumQuestions((n) => Math.max(1, n - 1))} className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white font-bold hover:bg-white/10 transition-all"></button>
                  <span className="text-3xl font-black w-10 text-center">{numQuestions}</span>
                  <button onClick={() => setNumQuestions((n) => Math.min(20, n + 1))} className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white font-bold hover:bg-white/10 transition-all">+</button>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-semibold text-[#a0aec0] mb-3">Difficulty</label>
                <div className="flex gap-2">
                  {["Easy Difficulty", "Hard Difficulty"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${
                        difficulty === d
                          ? d.includes("Easy")
                            ? "bg-green-500/20 border-green-500/50 text-green-300"
                            : "bg-red-500/20 border-red-500/50 text-red-300"
                          : "bg-white/[0.02] border-white/[0.07] text-[#718096] hover:border-white/20"
                      }`}
                    >
                      {d.replace(" Difficulty", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quiz Mode */}
              <div>
                <label className="block text-sm font-semibold text-[#a0aec0] mb-3">Quiz Mode</label>
                <div className="flex gap-2">
                  {[{ v: "static", label: " Static", desc: "See all at once" }, { v: "interactive", label: " Interactive", desc: "One at a time" }].map((m) => (
                    <button
                      key={m.v}
                      onClick={() => setQuizMode(m.v)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-sm font-semibold transition-all text-left ${
                        quizMode === m.v
                          ? "bg-[#7600F2]/20 border-[#7600F2]/50 text-[#c084fc]"
                          : "bg-white/[0.02] border-white/[0.07] text-[#718096] hover:border-white/20"
                      }`}
                    >
                      <div>{m.label}</div>
                      <div className="text-xs opacity-60 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wikipedia Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.07]">
                <div>
                  <div className="text-sm font-semibold text-white">Use Wikipedia</div>
                  <div className="text-xs text-[#4a5568]">Enrich answers with Wikipedia data</div>
                </div>
                <button
                  onClick={() => setIsToggleOn((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 ${isToggleOn ? "bg-[#7600F2]" : "bg-white/10"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${isToggleOn ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex gap-4 justify-end">
          <Link to="/question-type">
            <button className="px-6 py-3 rounded-xl border border-white/[0.10] text-[#a0aec0] font-semibold hover:bg-white/[0.05] hover:text-white transition-all">
               Back
            </button>
          </Link>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`px-10 py-3 rounded-xl font-bold text-base transition-all duration-300 ${
              canGenerate
                ? "bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-white shadow-[0_0_25px_rgba(118,0,242,0.4)] hover:shadow-[0_0_40px_rgba(118,0,242,0.6)] hover:scale-105"
                : "bg-white/10 text-[#4a5568] cursor-not-allowed"
            }`}
          >
            Generate Quiz 
          </button>
        </div>
      </div>
    </div>
  );
};

export default Text_Input;
