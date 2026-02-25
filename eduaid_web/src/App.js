import React, { Suspense, lazy } from "react";
import "./App.css";
import { Routes, Route, HashRouter } from "react-router-dom";

const Home = lazy(() => import("./pages/Home"));
const Question_Type = lazy(() => import("./pages/Question_Type"));
const Text_Input = lazy(() => import("./pages/Text_Input"));
const Output = lazy(() => import("./pages/Output"));
const Previous = lazy(() => import("./pages/Previous"));
const NotFound = lazy(() => import("./pages/PageNotFound"));

/**
 * A simple Error Boundary to catch chunk-loading errors for lazy-loaded routes.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex flex-col justify-center items-center bg-[#02000F] text-white">
          <h2 className="text-xl mb-4">Something went wrong loading this page.</h2>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#00CBE7] rounded text-black font-bold"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * The main application component for EduAid.
 * Implements route-based code splitting and error boundaries for performance and stability.
 */
function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <Suspense 
          fallback={
            <div 
              className="w-screen h-screen flex justify-center items-center bg-[#02000F]"
              role="status"
              aria-live="polite"
              aria-label="Loading content..."
            >
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00CBE7]" aria-hidden="true"></div>
              <span className="sr-only">Loading...</span>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/question-type" element={<Question_Type />} />
            <Route path="/input" element={<Text_Input />} />
            <Route path="/output" element={<Output />} />
            <Route path="/history" element={<Previous />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </HashRouter>
  );
}

export default App;