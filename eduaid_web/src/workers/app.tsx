import React, { useState } from 'react';
// These icons come from the lucide-react library shown in your photo
import { AlignLeft, Hash, Type } from 'lucide-react';

export default function App() {
  // 1. Logic to track the text
  const [text, setText] = useState("");

  // 2. Calculation logic
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Type className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Live Word Counter</h1>
        </div>

        {/* 3. The Text Box Area */}
        <div className="relative w-full">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing your content here..."
            className="w-full h-80 p-6 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none resize-none text-lg transition-all"
          />

          {/* 4. The Counter Overlay inside the box */}
          <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 shadow-sm pointer-events-none select-none">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
              <AlignLeft size={16} />
              <span>{wordCount} words</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
              <Hash size={16} />
              <span>{charCount} characters</span>
            </div>
          </div>
        </div>
        
        <p className="mt-4 text-center text-gray-400 text-sm">
          Your text is automatically saved as you type.
        </p>
      </div>
    </div>
  );
}