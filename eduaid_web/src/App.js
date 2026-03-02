import "./App.css";
import { useEffect, useState } from "react";
import { Routes, Route, HashRouter } from "react-router-dom";
import Home from "./pages/Home";
import Question_Type from "./pages/Question_Type";
import Text_Input from "./pages/Text_Input";
import Output from "./pages/Output";
import Previous from "./pages/Previous";
import NotFound from "./pages/PageNotFound";
import apiClient from "./utils/apiClient";

const initialConnectionState = { status: "unknown", detail: "" };

function ConnectionBanner({ connection }) {
  if (connection.status === "down") {
    return (
      <div className="connection-banner down">
        <span>
          Backend disconnected.{" "}
          {connection.detail || "Please check backend server and API URL."}
        </span>
        <button
          type="button"
          className="connection-banner-retry"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (connection.status === "error") {
    return (
      <div className="connection-banner error">
        Backend responded with an error.{" "}
        {connection.detail || "Please try again shortly."}
      </div>
    );
  }

  return null;
}

function App() {
  const [connection, setConnection] = useState(initialConnectionState);

  useEffect(() => apiClient.subscribeConnectionStatus(setConnection), []);

  return (
    <>
      <ConnectionBanner connection={connection} />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/question-type" element={<Question_Type />} />
          <Route path="/input" element={<Text_Input />} />
          <Route path="/output" element={<Output />} />
          <Route path="/history" element={<Previous />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </>
  );
}

export default App;
