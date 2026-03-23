import React from "react";

/**
 * Reusable Error Boundary component.
 *
 * Catches JavaScript errors in its child component tree and renders
 * a fallback UI instead of crashing the entire application.
 *
 * @example
 * <ErrorBoundary fallback={<EmptyState message="Something went wrong" />}>
 *   <QuizRenderer />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Update state so the next render shows the fallback UI.
   *
   * @param {Error} _error - The error that was thrown.
   * @returns {{ hasError: boolean }} Updated state.
   */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * Log the error with structured information for debugging.
   *
   * @param {Error} error - The error that was thrown.
   * @param {React.ErrorInfo} errorInfo - Component stack trace information.
   */
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
