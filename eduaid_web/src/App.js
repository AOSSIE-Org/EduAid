import "./App.css";
import { Routes, Route, HashRouter } from "react-router-dom";
import Home from "./pages/Home";
import Question_Type from "./pages/Question_Type";
import Text_Input from "./pages/Text_Input";
import Output from "./pages/Output";
import Previous from "./pages/Previous";
import NotFound from "./pages/PageNotFound";
import ErrorBoundary from "./components/errorBoundary/ErrorBoundary";


function App() {
  const handleBoundaryError = (error, errorInfo) => {
    // Central place to integrate Sentry/LogRocket later
    console.error("App-level boundary captured:", error);
    console.error("App-level stack:", errorInfo?.componentStack);
  };

  return (
    <ErrorBoundary
      title="The app ran into an unexpected error."
      message="Please try again. If the issue continues, refresh the page."
      onError={handleBoundaryError}
    >
      <HashRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary title="Home failed to load.">
                <Home />
              </ErrorBoundary>
            }
          />
          <Route
            path="/question-type"
            element={
              <ErrorBoundary title="Question type page failed to load.">
                <Question_Type />
              </ErrorBoundary>
            }
          />
          <Route
            path="/input"
            element={
              <ErrorBoundary title="Input page failed to load.">
                <Text_Input />
              </ErrorBoundary>
            }
          />
          <Route
            path="/output"
            element={
              <ErrorBoundary title="Output page failed to load.">
                <Output />
              </ErrorBoundary>
            }
          />
          <Route
            path="/history"
            element={
              <ErrorBoundary title="History page failed to load.">
                <Previous />
              </ErrorBoundary>
            }
          />
          <Route
            path="*"
            element={
              <ErrorBoundary title="Page failed to load.">
                <NotFound />
              </ErrorBoundary>
            }
          />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
