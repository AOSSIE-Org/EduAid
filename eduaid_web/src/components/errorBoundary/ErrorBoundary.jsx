import React, { Component } from "react";
import "./ErrorBoundary.css";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Optional callback for external monitoring
    if(typeof this.props.onError === "function") {
        this.props.onError(error,errorInfo);
    }

    // This is for debugging and future monitoring integration.
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo?.componentStack);

    this.setState({
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const {
        title = "Something went wrong in this section.",
        message = "An unexpected error occurred. You can try again.",
        showDetails = process.env.NODE_ENV !== "production",
      } = this.props;

      return (
        <div className="error-boundary-container" role="alert" aria-live="assertive">
          <div className="error-boundary-card">
            <h2 className="error-boundary-title">{title}</h2>
            <p className="error-boundary-message">{message}</p>

            {showDetails && this.state.error && (
              <pre className="error-boundary-details">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack
                  ? `\n\n${this.state.errorInfo.componentStack}`
                  : ""}
              </pre>
            )}

            <button
              type="button"
              className="error-boundary-button"
              onClick={this.handleRetry}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
