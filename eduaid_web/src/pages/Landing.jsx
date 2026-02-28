import React from "react";
import { Link } from "react-router-dom";
import "../index.css";
import logo from "../assets/aossie_logo_transparent.png";

const features = [
  { icon: "", title: "PDF & Documents", desc: "Upload PDFs, Word docs, or plain text and instantly generate quiz questions from any content." },
  { icon: "", title: "AI-Powered Questions", desc: "Our T5-based models craft MCQs, True/False, and short-answer questions with high accuracy." },
  { icon: "", title: "Interactive Quiz Mode", desc: "Take quizzes one question at a time with instant feedback and a live score tracker." },
  { icon: "", title: "Export & Share", desc: "Download questions as PDF or generate a shareable Google Form with one click." },
  { icon: "", title: "Quiz History", desc: "Revisit any of your recent quizzes — your last sessions are always saved locally." },
  { icon: "", title: "Google Docs Support", desc: "Paste a Google Docs link and generate questions directly from your shared documents." },
];

const steps = [
  { num: "01", label: "Upload Content", desc: "Add a PDF, paste text, or link a Google Doc." },
  { num: "02", label: "Configure Quiz", desc: "Choose difficulty, question count, and quiz mode." },
  { num: "03", label: "Generate & Learn", desc: "Get AI-generated questions instantly and start learning." },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#02000F] text-white overflow-x-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#7600F2] opacity-[0.12] blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#00CBE7] opacity-[0.10] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[350px] h-[350px] rounded-full bg-[#FF005C] opacity-[0.08] blur-[120px]" />
      </div>

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7600F2]/40 bg-[#7600F2]/10 text-[#c084fc] text-xs font-semibold tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] animate-pulse" />
          AI-Powered Quiz Generator
        </div>
        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="EduAid" className="w-14 h-14 drop-shadow-[0_0_18px_rgba(118,0,242,0.6)]" />
          <span className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] bg-clip-text text-transparent">EduAid</span>
        </div>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] max-w-4xl mb-6">
          Turn Any Document Into{" "}
          <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] bg-clip-text text-transparent">Smart Quizzes</span>
        </h1>
        <p className="text-[#a0aec0] text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed">
          Upload a PDF, paste text, or link a Google Doc. EduAid instantly generates MCQs, True/False, and short-answer questions — ready to study, export, or share.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-14">
          <Link to="/upload">
            <button className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-white font-bold text-base sm:text-lg shadow-[0_0_30px_rgba(118,0,242,0.4)] hover:shadow-[0_0_50px_rgba(118,0,242,0.6)] transition-all duration-300 hover:scale-105">
              Start Generating Free 
            </button>
          </Link>
          <Link to="/history">
            <button className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-base sm:text-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              View Past Quizzes
            </button>
          </Link>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-[#718096]">
          {["No account needed", "Export to PDF & Google Forms", "MCQ  True/False  Short Answer", "Interactive quiz mode"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#7600F2] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 px-6 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#7600F2] text-sm font-bold uppercase tracking-widest mb-3">Simple Process</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold">Three steps to smarter studying</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-[#7600F2]/40 transition-all duration-300 group relative">
              <div className="text-5xl font-black text-[#7600F2]/20 group-hover:text-[#7600F2]/40 transition-colors mb-4 select-none">{s.num}</div>
              <h3 className="text-lg font-bold mb-2">{s.label}</h3>
              <p className="text-[#718096] text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#00CBE7] text-sm font-bold uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold">Everything you need to learn faster</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-[#7600F2]/50 hover:bg-[#7600F2]/[0.05] transition-all duration-300">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-base mb-2 group-hover:text-[#c084fc] transition-colors">{f.title}</h3>
              <p className="text-[#718096] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="relative z-10 px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto p-12 rounded-3xl bg-gradient-to-br from-[#7600F2]/20 to-[#00CBE7]/10 border border-[#7600F2]/20 backdrop-blur-sm">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to generate your first quiz?</h2>
          <p className="text-[#a0aec0] mb-8 text-lg">Upload any document and get AI-generated questions in seconds.</p>
          <Link to="/upload">
            <button className="px-10 py-4 rounded-2xl bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-white font-bold text-lg shadow-[0_0_30px_rgba(118,0,242,0.4)] hover:shadow-[0_0_50px_rgba(118,0,242,0.6)] hover:scale-105 transition-all duration-300">
              Get Started Now 
            </button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.05] px-6 py-8 text-center text-[#4a5568] text-sm">
        <p> {new Date().getFullYear()} EduAid  Built with  for learners everywhere</p>
      </footer>
    </div>
  );
};

export default Landing;
