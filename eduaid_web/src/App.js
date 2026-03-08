import "./App.css";
import { Routes, Route, HashRouter, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Question_Type from "./pages/Question_Type";
import Text_Input from "./pages/Text_Input";
import StaticQuiz from "./pages/StaticQuiz";
import Previous from "./pages/Previous";
import NotFound from "./pages/PageNotFound";
import Upload from "./pages/Upload";
import Header from "./components/Header";
import QuizModeWrapper from "./pages/QuizModeWrapper";

// Show the sticky header on all pages except the landing page (which has its own full-screen hero)
const AppLayout = () => {
  const { pathname } = useLocation();
  const showHeader = pathname !== "/";
  return (
    <>
      {showHeader && <Header />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/question-type" element={<Question_Type />} />
        <Route path="/input" element={<Text_Input />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/output" element={<StaticQuiz />} />
        <Route path="/quiz" element={<QuizModeWrapper />} />
        <Route path="/history" element={<Previous />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  );
}

export default App;
