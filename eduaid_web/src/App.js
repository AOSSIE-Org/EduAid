import "./App.css";
import { Routes, Route, HashRouter } from "react-router-dom";
import Home from "./pages/Home";
import Question_Type from "./pages/Question_Type";
import Text_Input from "./pages/Text_Input";
import Output from "./pages/Output";
import Previous from "./pages/Previous";
import GoogleDocViewer from "./pages/Google_doc";
import NotFound from "./pages/PageNotFound";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/question-type" element={<Question_Type />} />
        <Route path="/input" element={<Text_Input />} />
        <Route path="/output" element={<Output />} />
        <Route path="/history" element={<Previous />} />
        <Route path="/google-form" element={<GoogleDocViewer />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
