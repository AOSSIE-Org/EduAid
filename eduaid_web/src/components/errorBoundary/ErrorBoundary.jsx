import React, { Component } from "react";
import "./ErrorBoundary.css";

class ErrorBoundary extends Component {
  static MAX_RETRIES = 3;

  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Optional callback for external monitoring
    if(typeof this.props.onError === "function") {
      try{
        this.props.onError(error,errorInfo);
      } catch(callbackError){
        console.error("ErrorBoundary onError callback failed:", callbackError);
      }
    }

    // This is for debugging and future monitoring integration.
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo?.componentStack);

    this.setState({
      errorInfo,
    });
  }

  handleRetry = () => {
    if (this.state.retryCount >= ErrorBoundary.MAX_RETRIES) return;

    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      const canRetry = this.state.retryCount < ErrorBoundary.MAX_RETRIES;
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

            {canRetry ? (
              <button
                type="button"
                className="error-boundary-button"
                onClick={this.handleRetry}
              >
                Try Again ({ErrorBoundary.MAX_RETRIES - this.state.retryCount} left)
              </button>
            ) : (
              <p className="error-boundary-retry-limit">
                Maximum retry attempts reached. Please refresh the page.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
