import "./App.css";
import { Routes, Route, HashRouter } from "react-router-dom";
import Home from "./pages/Home";
import QuestionType from "./pages/Question_Type";
import TextInput from "./pages/Text_Input";
import Output from "./pages/Output";
import Previous from "./pages/Previous";
import NotFound from "./pages/PageNotFound";
import ErrorBoundary from "./utils/ErrorBoundary";

function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/question-type" element={<QuestionType />} />
          <Route path="/input" element={<TextInput />} />
          <Route path="/output" element={<Output />} />
          <Route path="/history" element={<Previous />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </HashRouter>
  );
}

export default App;
