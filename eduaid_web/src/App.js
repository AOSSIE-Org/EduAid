import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import QuestionType from "./pages/Question_Type";
import TextInput from "./pages/Text_Input";
import Output from "./pages/Output";
import Previous from "./pages/Previous";
import NotFound from "./pages/PageNotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/question-type" element={<QuestionType />} />
        <Route path="/input" element={<TextInput />} />
        <Route path="/output" element={<Output />} />
        <Route path="/history" element={<Previous />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
